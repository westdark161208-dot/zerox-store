import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {calculateQuote,quoteSchema,createQuote,acceptQuote} from '../cloudflare/payments/quotes-v3.mjs';
import {fundingSchema,createFundingIntent,reconcileFunding} from '../cloudflare/payments/funding.mjs';
import {walletSchema} from '../cloudflare/wallet/ledger.mjs';
import {settleFunding} from '../cloudflare/payments/settlement.mjs';
import {fundingRoute} from '../cloudflare/payments/funding-routes.mjs';
const policy={version:'fixture-349-400-no-tax',verified:true,rateBasisPoints:349,fixedCents:400,taxBasisPoints:0};
test('V3 wallet preserves Editor base; MP reference recovers base with one fee per order',()=>{
 assert.equal(calculateQuote(1800,'wallet').totalCents,1800);
 assert.equal(calculateQuote(1800,'wallet').feeCents,0);
 const q=calculateQuote(1800,'all',policy);
 assert.equal(q.totalCents,2280);assert.equal(q.feeCents,480);assert.equal(q.taxCents,0);
 for(const method of ['all','card','spei'])assert.equal(calculateQuote(1800,method,policy).totalCents,2280);
 assert.ok(calculateQuote(3600,'card',policy).totalCents<q.totalCents*2);
});
test('V3 rounding covers net with integer arithmetic and sums displayed components',()=>{
 for(const tax of [0,1600])for(const base of [1,99,1800,2000,3500,2450,65000,1000000]){
  const q=calculateQuote(base,'card',{...policy,taxBasisPoints:tax});
  assert.equal(q.baseCents+q.feeCents+q.taxCents,q.totalCents);
  const net=g=>BigInt(g)*100000000n-(BigInt(g)*349n+4000000n)*BigInt(10000+tax);
  assert.ok(net(q.totalCents)>=BigInt(base)*100000000n);
  assert.ok(net(q.totalCents-1)<BigInt(base)*100000000n);
 }
});
test('V3 refuses missing policy verification, unspecified taxes and unsupported methods',()=>{
 for(const p of [undefined,{...policy,verified:false},{...policy,taxBasisPoints:undefined},{...policy,rateBasisPoints:9999,taxBasisPoints:1600}])assert.throws(()=>calculateQuote(2000,'card',p));
 for(const base of [0,-1,1.5,NaN,Infinity,100000001])assert.throws(()=>calculateQuote(base,'wallet'));
 for(const method of ['oxxo','binance','ra','sf','manual'])assert.throws(()=>calculateQuote(2000,method,policy));
});
async function setup(){const db=database();await quoteSchema(db);const args={userId:'a',context:'product:pass:qty=1:coupon=none:catalog=v2',baseCents:3500,method:'card',policy,now:1000};const quote=await createQuote(db,args);return {db,quote,args,accept:{id:quote.id,userId:'a',context:args.context,method:'card',maxAmountCents:quote.totalCents,orderId:'order-a',now:2000}};}
test('V3 binds quotes to account, method, catalog selection and explicitly accepted total',async()=>{
 const {db,accept}=await setup();
 for(const change of [{userId:'b'},{method:'wallet'},{context:'product:pass:qty=2'},{maxAmountCents:3500}])await assert.rejects(acceptQuote(db,{...accept,...change}));
 assert.equal((await acceptQuote(db,accept)).baseCents,3500);
});
test('V3 quote expiration requires fresh consent, while a claimed order retries safely',async()=>{
 const {db,quote,accept}=await setup();
 await assert.rejects(acceptQuote(db,{...accept,now:quote.expiresAt}),/EXPIRED/);
 await acceptQuote(db,accept);
 assert.equal((await acceptQuote(db,{...accept,now:quote.expiresAt+1000})).id,quote.id);
 await assert.rejects(acceptQuote(db,{...accept,orderId:'other'}),/ALREADY_USED/);
});
test('V3 competing orders cannot consume the same quote',async()=>{
 const {db,accept}=await setup();
 const results=await Promise.allSettled([acceptQuote(db,accept),acceptQuote(db,{...accept,orderId:'order-b'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});
test('V3 topup quote separates requested credit from the amount charged',()=>{
 const q=calculateQuote(2000,'card',policy);
 assert.equal(q.baseCents,2000);assert.equal(q.totalCents,2487);
 assert.equal(calculateQuote(q.baseCents,'wallet').totalCents,2000);
});
test('V3 settlement verifies gross payment and credits only net once, preserving legacy intents',async()=>{
 const db=database();db.sql.exec("CREATE TABLE zx_users(id TEXT,status TEXT);INSERT INTO zx_users VALUES('a','active');");
 await quoteSchema(db);await fundingSchema(db);await walletSchema(db);
 const quote=await createQuote(db,{userId:'a',context:'funding:2000',baseCents:2000,method:'card',policy});
 await acceptQuote(db,{id:quote.id,userId:'a',context:'funding:2000',method:'card',maxAmountCents:2487,orderId:'funding-new'});
 const input={id:'funding-new',userId:'a',amountCents:2000,collectorId:'123',requestKey:'funding-new',quote};
 assert.equal((await createFundingIntent(db,input)).charge_cents,2487);
 await createFundingIntent(db,input);
 await assert.rejects(createFundingIntent(db,{...input,quote:undefined}),/CONFLICT/);
 const payment={id:901,live_mode:true,collector_id:123,external_reference:'funding-new',currency_id:'MXN',transaction_amount:24.87,status:'approved'};
 await assert.rejects(reconcileFunding(db,{...payment,transaction_amount:20}),/EVIDENCE_REJECTED/);
 await reconcileFunding(db,payment);await settleFunding(db,'funding-new');
 await reconcileFunding(db,payment);await settleFunding(db,'funding-new');
 assert.equal(db.sql.prepare('SELECT SUM(amount_cents) total FROM zx_wallet_ledger').get().total,2000);
 await createFundingIntent(db,{id:'old',userId:'a',amountCents:2000,collectorId:'123',requestKey:'old'});
 await reconcileFunding(db,{...payment,id:902,external_reference:'old',transaction_amount:20});await settleFunding(db,'old');
 assert.equal(db.sql.prepare('SELECT SUM(amount_cents) total FROM zx_wallet_ledger').get().total,4000);
});
test('V3 HTTP checkout charges the accepted gross and refuses a changed method before contacting MP',async()=>{
 const db=database();db.sql.exec("CREATE TABLE zx_users(id TEXT,status TEXT);INSERT INTO zx_users VALUES('a','active');");
 const env={DB:db,MP_WALLET_PILOT_ENABLED:'true',MP_PRODUCTION_READ_ENABLED:'true',MP_ACCESS_TOKEN_PRODUCTION:'fixture',MP_COLLECTOR_ID_PRODUCTION:'123',MP_WEBHOOK_SECRET_PRODUCTION:'fixture',MP_FUNDING_QUOTES_V3:'true',MP_FEE_POLICY_VERIFIED:'true',MP_FEE_POLICY_VERSION:'fixture',MP_FEE_RATE_BPS:'349',MP_FEE_FIXED_CENTS:'400',MP_FEE_TAX_BPS:'0'};
 let calls=0;const fetcher=async(url,options)=>{calls++;const pref=JSON.parse(options.body);assert.equal(pref.items[0].unit_price,24.87);return {ok:true,json:async()=>({id:'preference',collector_id:123,init_point:'https://www.mercadopago.com.mx/checkout/test'})};};
 const call=async(path,body,key)=>{const url=new URL('https://store.test/api/payments/mercadopago/funding/'+path);return fundingRoute(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:JSON.stringify(body)}),env,url,{id:'a',status:'active',isFounder:true},(b,s=200)=>new Response(JSON.stringify(b),{status:s}),fetcher);};
 const response=await call('quote',{amountCents:2000,method:'card'});assert.equal(response.status,200);const {quote}=await response.json();
 const key=crypto.randomUUID(),body={amountCents:2000,method:'card',quoteId:quote.id,maxAmountCents:2487};
 assert.equal((await call('checkout',{...body,method:'spei'},key)).status,409);assert.equal(calls,0);
 assert.equal((await call('checkout',body,key)).status,200);
 assert.equal((await call('checkout',body,key)).status,200);assert.equal(calls,1);
 assert.equal(db.sql.prepare('SELECT amount_cents FROM zx_funding_intents').get().amount_cents,2000);
});
