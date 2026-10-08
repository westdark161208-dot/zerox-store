import {test} from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
import {database} from './helpers/d1.mjs';import {fundingSchema,createFundingIntent,reconcileFunding} from '../cloudflare/payments/funding.mjs';
import {walletSchema,walletState} from '../cloudflare/wallet/ledger.mjs';import {settleFunding} from '../cloudflare/payments/settlement.mjs';import {fundingRoute} from '../cloudflare/payments/funding-routes.mjs';
const owner={id:'user',status:'active',isFounder:true},id='12345678-1234-1234-1234-123456789abc';
const evidence={id:999,live_mode:true,collector_id:123,external_reference:id,currency_id:'MXN',transaction_amount:20,status:'approved'};
async function setup(){const DB=database();DB.sql.exec("CREATE TABLE zx_users(id TEXT,status TEXT);INSERT INTO zx_users VALUES('user','active');");await fundingSchema(DB);await walletSchema(DB);await createFundingIntent(DB,{id,userId:'user',amountCents:2000,collectorId:'123',requestKey:id});return DB;}
const enabled=DB=>({DB,MP_WALLET_PILOT_ENABLED:'true',MP_PRODUCTION_READ_ENABLED:'true',MP_ACCESS_TOKEN_PRODUCTION:'fixture-token',MP_COLLECTOR_ID_PRODUCTION:'123',MP_WEBHOOK_SECRET_PRODUCTION:'fixture-secret'});
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status});
function hook(){const url=new URL('https://test/api/payments/mercadopago/funding/webhook?data.id=999');const sig=createHmac('sha256','fixture-secret').update('id:999;request-id:request;ts:1704908010;').digest('hex');return new Request(url,{method:'POST',headers:{'x-request-id':'request','x-signature':'ts=1704908010,v1='+sig},body:JSON.stringify({type:'payment',data:{id:999}})});}
test('settlement concurrent retries credit once and confirm with immutable movement',async()=>{
 const db=await setup();await reconcileFunding(db,evidence);const results=await Promise.all([settleFunding(db,id),settleFunding(db,id)]);assert.equal(results[0].movementId,results[1].movementId);assert.equal((await walletState(db,'user')).availableCents,2000);assert.equal(db.sql.prepare('SELECT state FROM zx_funding_intents').get().state,'confirmed');
 await reconcileFunding(db,{...evidence,status:'pending'});assert.equal(db.sql.prepare('SELECT state FROM zx_funding_intents').get().state,'confirmed');
});
test('pending, review and inactive account cannot be credited',async()=>{
 for(const variant of ['pending','refund','inactive']){const db=await setup();await reconcileFunding(db,{...evidence,...(variant==='pending'?{status:'pending'}:variant==='refund'?{transaction_amount_refunded:1}:{})});if(variant==='inactive')db.sql.exec("UPDATE zx_users SET status='disabled'");await assert.rejects(settleFunding(db,id));assert.equal((await walletState(db,'user')).availableCents,0);}
});
test('ledger insert and intent state update roll back together on D1 batch error',async()=>{
 const db=await setup();await reconcileFunding(db,evidence);db.sql.exec("CREATE TRIGGER reject_confirmation BEFORE UPDATE ON zx_funding_intents WHEN NEW.state='confirmed' BEGIN SELECT RAISE(ABORT,'fixture_failure'); END");
 await assert.rejects(settleFunding(db,id),/fixture_failure/);assert.equal((await walletState(db,'user')).availableCents,0);assert.equal(db.sql.prepare('SELECT state FROM zx_funding_intents').get().state,'verified');
 db.sql.exec('DROP TRIGGER reject_confirmation');await settleFunding(db,id);assert.equal((await walletState(db,'user')).availableCents,2000);
});
test('disabled pilot and invalid signature perform no database or processor calls',async()=>{
 const db={prepare(){throw Error('must not read');}},fetcher=()=>{throw Error('must not fetch');};
 let request=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',body:'{}'});
 assert.equal((await fundingRoute(request,{DB:db},new URL(request.url),owner,reply,fetcher)).status,503);
 assert.equal((await fundingRoute(request,enabled(db),new URL(request.url),null,reply,fetcher)).status,403);
 request=new Request('https://test/api/payments/mercadopago/funding/webhook?data.id=999',{method:'POST',body:'{}'});
 assert.equal((await fundingRoute(request,enabled(db),new URL(request.url),null,reply,fetcher)).status,401);
});
test('checkout is claimed before external call; same request reuses one preference and rejects changed amount',async()=>{
 const db=await setup();let calls=0;
 const fetcher=async(url,options)=>{calls++;assert.equal(options.method,'POST');const body=JSON.parse(options.body);assert.equal(body.external_reference,id);assert.equal(body.items[0].unit_price,20);return {ok:true,json:async()=>({id:'pref',collector_id:123,init_point:'https://www.mercadopago.com.mx/checkout/test'})};};
 const call=amount=>{const request=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:amount})});return fundingRoute(request,enabled(db),new URL(request.url),owner,reply,fetcher);};
 assert.equal((await call(2000)).status,200);assert.equal((await call(2000)).status,200);assert.equal(calls,1);assert.equal((await call(2100)).status,409);
});
test('ambiguous preference timeout is not retried automatically',async()=>{
 const db=await setup();let calls=0;const fetcher=async()=>{calls++;throw Error('timeout');};
 const call=()=>{const request=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:2000})});return fundingRoute(request,enabled(db),new URL(request.url),owner,reply,fetcher);};
 assert.equal((await call()).status,503);assert.equal((await call()).status,409);assert.equal(calls,1);assert.equal(db.sql.prepare('SELECT state FROM zx_funding_checkouts').get().state,'needs_review');
});
test('signed webhook retrieves authoritative evidence and repeated approval credits once',async()=>{
 const db=await setup();let status='pending';const fetcher=async(url,options)=>{assert.equal(url,'https://api.mercadopago.com/v1/payments/999');assert.equal(options.method,'GET');return {ok:true,json:async()=>({...evidence,status})};};
 const call=()=>{const request=hook();return fundingRoute(request,enabled(db),new URL(request.url),null,reply,fetcher);};
 assert.equal((await call()).status,200);assert.equal((await walletState(db,'user')).availableCents,0);status='approved';assert.equal((await call()).status,200);assert.equal((await call()).status,200);assert.equal((await walletState(db,'user')).availableCents,2000);
});
test('browser return is private read-only and cannot credit from URL status',async()=>{
 const db=await setup();const request=new Request('https://test/api/payments/mercadopago/funding/intents/'+id+'?status=approved');
 const r=await fundingRoute(request,enabled(db),new URL(request.url),owner,reply,()=>{throw Error('must not fetch');});assert.equal(r.status,200);assert.equal((await r.json()).state,'pending');assert.equal((await walletState(db,'user')).availableCents,0);assert.equal(r.headers.get('Cache-Control'),'no-store');
 const other=await fundingRoute(request,enabled(db),new URL(request.url),{...owner,id:'other'},reply);assert.equal(other.status,404);
});

test('checkout redirects are rejected and cannot forward the production token',async()=>{
 const db=await setup();let calls=0;
 const request=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:2000})});
 const result=await fundingRoute(request,enabled(db),new URL(request.url),owner,reply,async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://untrusted.test'}});});
 assert.equal(result.status,503);assert.equal(calls,1);assert.equal((await walletState(db,'user')).availableCents,0);
});

test('method preferences are server-controlled and existing checkout remains unique',async()=>{
 for(const [method,expected] of [['spei','clabe'],['card',null]]){
  const db=await setup();let calls=0;const request=()=>new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:2000,method})});
  const fetcher=async(u,o)=>{calls++;const body=JSON.parse(o.body);if(expected)assert.equal(body.payment_methods.default_payment_method_id,expected);else assert(body.payment_methods.excluded_payment_types.some(p=>p.id==='account_money'));return Response.json({id:'pref',collector_id:123,init_point:'https://www.mercadopago.com.mx/checkout/test'});};
  assert.equal((await fundingRoute(request(),enabled(db),new URL(request().url),owner,reply,fetcher)).status,200);assert.equal((await fundingRoute(request(),enabled(db),new URL(request().url),owner,reply,fetcher)).status,200);assert.equal(calls,1);
 }
 const db=await setup(),request=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:2000,method:'malicious'})});assert.equal((await fundingRoute(request,enabled(db),new URL(request.url),owner,reply,()=>{throw Error('must not call')})).status,400);
});

test('inline store funding returns to a fixed store URL and preserves default Pay return',async()=>{
 for(const returnTo of ['store','https://untrusted.test']){const db=await setup();let seen=false;const req=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amountCents:2000,returnTo})});
 const r=await fundingRoute(req,enabled(db),new URL(req.url),owner,reply,async(url,opts)=>{const b=JSON.parse(opts.body);seen=true;for(const v of Object.values(b.back_urls)){assert.equal(new URL(v).origin,'https://zerox-store.pages.dev');assert.equal(new URL(v).pathname,returnTo==='store'?'/':'/wallet-payment.html');}return {ok:true,json:async()=>({id:'pref',collector_id:123,init_point:'https://www.mercadopago.com.mx/checkout/test'})};});assert.equal(r.status,200);assert(seen);}
});

test('new funding minimum is 20 MXN; reseller 200 threshold does not cap funding',async()=>{
 for(const amount of [1000,1999,2000,20001,600000]){const db=await setup();let calls=0;const key=crypto.randomUUID(),req=new Request('https://test/api/payments/mercadopago/funding/checkout',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify({amountCents:amount})});const result=await fundingRoute(req,enabled(db),new URL(req.url),owner,reply,async()=>{calls++;return Response.json({id:'pref',collector_id:123,init_point:'https://www.mercadopago.com.mx/checkout/test'});});assert.equal(result.status,amount<2000?400:200);assert.equal(calls,amount<2000?0:1);}
});
