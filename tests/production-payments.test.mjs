import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {paymentCents,productionEvidence,productionPayment,productionReadRoute} from '../cloudflare/payments/mercadopago-production.mjs';
import {fundingSchema,createFundingIntent,reconcileFunding} from '../cloudflare/payments/funding.mjs';
const input={id:'intent-1',userId:'user',amountCents:1850,collectorId:'123',requestKey:'request-1'};
const payment={id:999,live_mode:true,collector_id:123,external_reference:'intent-1',currency_id:'MXN',transaction_amount:18.5,status:'approved'};
async function setup(){const db=database();db.sql.exec("CREATE TABLE zx_users(id TEXT,status TEXT);INSERT INTO zx_users VALUES('user','active');");await fundingSchema(db);await createFundingIntent(db,input);return db;}
test('production evidence accepts exact cents only and rejects test mode, wrong seller, amount and reference',()=>{
 assert.equal(paymentCents('18.50'),1850);assert.equal(paymentCents(18.501),null);assert.equal(paymentCents(NaN),null);assert.equal(paymentCents(-1),null);
 const intent={id:input.id,amount_cents:1850,collector_id:'123'};assert.equal(productionEvidence(payment,intent),true);
 for(const patch of [{live_mode:false},{collector_id:124},{currency_id:'USD'},{external_reference:'other'},{transaction_amount:18.501}])assert.equal(productionEvidence({...payment,...patch},intent),false);
});
test('production lookup disabled/missing config makes no request; enabled uses GET and checks receiver',async()=>{
 let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.mercadopago.com/v1/payments/999');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');return {ok:true,json:async()=>payment};};
 await assert.rejects(productionPayment({},'999',fetcher),/READ_DISABLED/);
 await assert.rejects(productionPayment({MP_PRODUCTION_READ_ENABLED:'true'},'999',fetcher),/CONFIG_MISSING/);assert.equal(calls,0);
 const env={MP_PRODUCTION_READ_ENABLED:'true',MP_ACCESS_TOKEN_PRODUCTION:'fixture',MP_COLLECTOR_ID_PRODUCTION:'123'};
 assert.equal((await productionPayment(env,'999',fetcher)).live_mode,true);
 await assert.rejects(productionPayment({...env,MP_COLLECTOR_ID_PRODUCTION:'456'},'999',fetcher),/EVIDENCE_REJECTED/);
});
test('read route rejects guests, normal users and writes; status exposes booleans only, no-store',async()=>{
 const call=async(user,method='GET')=>{const request=new Request('https://test/api/admin/payments/mercadopago/status',{method});return productionReadRoute(request,{MP_ACCESS_TOKEN_PRODUCTION:'private-token'},new URL(request.url),user,(body,status=200)=>new Response(JSON.stringify(body),{status}));};
 const owner={status:'active',isFounder:true};assert.equal((await call(null)).status,403);assert.equal((await call({status:'active',isFounder:false})).status,403);assert.equal((await call(owner,'POST')).status,405);
 const r=await call(owner);assert.equal(r.headers.get('Cache-Control'),'no-store');const text=await r.text();assert.ok(!text.includes('private-token'));assert.equal(JSON.parse(text).walletFundingEnabled,false);
});
test('intents are idempotent and reject changed amounts and inactive owners',async()=>{
 const db=await setup();assert.equal((await createFundingIntent(db,input)).id,'intent-1');
 await assert.rejects(createFundingIntent(db,{...input,amountCents:1900}),/CONFLICT/);
 await assert.rejects(createFundingIntent(db,{...input,id:'intent-2',userId:'missing'}),/CONFLICT/);
});
test('duplicate approved evidence verifies one intent without creating or crediting any ledger',async()=>{
 const db=await setup();const rows=await Promise.all([reconcileFunding(db,payment),reconcileFunding(db,payment)]);
 assert.ok(rows.every(r=>r.state==='verified'&&r.credited===false));assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM zx_funding_intents').get().n,1);
 assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='zx_wallet_ledger'").get().n,0);
 await assert.rejects(reconcileFunding(db,{...payment,id:1000}),/PAYMENT_CONFLICT/);
});
test('pending/failed never verify; refund review persists across out-of-order approved notification',async()=>{
 const db=await setup();assert.equal((await reconcileFunding(db,{...payment,status:'pending'})).state,'pending');
 assert.equal((await reconcileFunding(db,{...payment,status:'rejected'})).state,'failed');
 assert.equal((await reconcileFunding(db,payment)).state,'verified');
 assert.equal((await reconcileFunding(db,{...payment,transaction_amount_refunded:1})).state,'review_required');
 assert.equal((await reconcileFunding(db,payment)).state,'review_required');
 await assert.rejects(reconcileFunding(db,{...payment,transaction_amount:17}),/EVIDENCE_REJECTED/);
});
