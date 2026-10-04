import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {purchaseRoute,purchaseConfiguration,reconcileProductPayment,spendOrderWallet} from '../cloudflare/diamonds/purchases.mjs';
import {validateDirectItems,directProvider} from '../cloudflare/diamonds/sixofire-direct.mjs';
import {walletSchema,postMovement,walletState} from '../cloudflare/wallet/ledger.mjs';
const founder={id:'owner',status:'active',isFounder:true},reply=(body,status=200)=>({body,status});
const config={DIAMOND_PRODUCTION_ENABLED:'true',SIXOFIRE_DELIVERY_ENABLED:'true',SIXOFIRE_FUNDS_VERIFIED:'true',SIXOFIRE_CONTRACT_VERIFIED:'true',SIXOFIRE_API_KEY:'fixture',SIXOFIRE_DIRECT_SKUS:'{"110":"123"}',FF_INFO_API_KEY:'fixture',MP_PRODUCTION_READ_ENABLED:'true',MP_ACCESS_TOKEN:'fixture',MP_COLLECTOR_ID_PRODUCTION:'456',MP_WEBHOOK_SECRET_PRODUCTION:'fixture'};
const item={id:123,name:"110 direct",available:true,isActive:true,itemType:'DIAMONDS_DIRECT',diamondQuantity:110,availableRegions:['US']},recipe=[{diamonds:110,quantity:1}];
const response=(b,status=200)=>new Response(JSON.stringify(b),{status});
const root='https://fixture/api/diamonds/purchase';
const route=(env,path,user=founder,body=null,key=crypto.randomUUID(),fetcher)=>{const url=new URL(root+path),r=new Request(url,{method:body?'POST':'GET',headers:{'Idempotency-Key':key},body:body?JSON.stringify(body):null});return purchaseRoute(r,env,url,user,reply,fetcher);};
async function setup(){const DB=database();DB.sql.exec("CREATE TABLE zx_users(id TEXT PRIMARY KEY,status TEXT); INSERT INTO zx_users VALUES('owner','active'),('other','active')");await walletSchema(DB);return {...config,DB};}
function upstream({submitted={n:0},lost=false}={}){return async(url,options={})=>{
 if(url.includes('freefirecommunity'))return response({basicInfo:{accountId:1136210821,nickname:'Fixture',region:'US'}});
 if(url.endsWith('/account/shop/items'))return response({status:true,code:200,data:[item]});
 if(url.includes('/account/shop/orders?'))return response({status:true,code:200,data:{items:[]}});
 if(url.endsWith('/users/me'))return response({id:456,site_id:'MLM'});
 if(url.endsWith('/checkout/preferences')){submitted.n++;return response({id:'pref',collector_id:456,init_point:'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=fixture'});}
 if(url.endsWith('/account/shop/order')){submitted.n++;if(lost)throw Error('TIMEOUT');assert.deepEqual(JSON.parse(options.body),{uid:'1136210821',product_id:'123'});return response({status:true,code:200,data:{id:789,status:'COMPLETED',gameAccount:{uid:'1136210821',region:'US'},items:[{name:'110 direct',itemType:'DIAMONDS_DIRECT',quantity:1,status:'COMPLETED'}]}});}
 throw Error('UNEXPECTED_UPSTREAM '+url);
};}
const body={productId:'zx-diamonds-110',playerId:'1136210821',playerConfirmed:true,method:'card'};
test('missing live prerequisites and non-founder reject before DB, debit or upstream; never trust browser paid',async()=>{
 assert.equal(purchaseConfiguration(config).enabled,true);assert.equal(purchaseConfiguration({...config,SIXOFIRE_CONTRACT_VERIFIED:''}).enabled,false);
 const noDB={...config,DIAMOND_PRODUCTION_ENABLED:''};assert.equal((await route(noDB,'/wallet',founder,{...body,paid:true})).status,503);
 assert.equal((await route(config,'/checkout',{...founder,isFounder:false},body)).status,403);
 assert.equal((await route(config,'/status',null)).status,401);
 assert.equal((await route(noDB,'/status')).body.enabled,false);
});
test('direct preflight refuses PIN, inferred bonuses, wrong region, duplicate SKU and missing mapping',()=>{
 assert.equal(validateDirectItems([item],recipe,{'110':'123'},'US')[0].sku,'123');
 for(const changed of [{itemType:'DIAMONDS_PIN'},{diamondQuantity:100,diamondBonus:10},{availableRegions:['BR']},{available:false}])assert.throws(()=>validateDirectItems([{...item,...changed}],recipe,{'110':'123'},'US'));
 assert.throws(()=>validateDirectItems([item,item],recipe,{'110':'123'},'US'));
 assert.throws(()=>validateDirectItems([item],recipe,{},'US'));
});
test('wallet purchase debits once, delivers exact UID once, tracking is private and remains readable while paused',async()=>{
 const env=await setup();await postMovement(env.DB,{userId:'owner',kind:'credit',amountCents:10000,currency:'MXN',source:'fixture',reference:'1',requestKey:'credit',actor:'fixture'});
 const submitted={n:0},fetcher=upstream({submitted}),key=crypto.randomUUID();
 const a=await route(env,'/wallet',founder,body,key,fetcher);assert.equal(a.body.ok,true);assert.equal(a.body.delivery.state,'COMPLETED');assert.equal(submitted.n,1);
 const b=await route(env,'/wallet',founder,body,key,fetcher);assert.equal(b.body.orderId,a.body.orderId);assert.equal(submitted.n,1);
 assert.equal((await walletState(env.DB,'owner')).availableCents,8200);
 const paused={...env,DIAMOND_PRODUCTION_ENABLED:''};assert.equal((await route(paused,'/orders/'+a.body.orderId)).body.order.delivered,110);
 assert.equal((await route(paused,'/orders/'+a.body.orderId,{...founder,id:'other'})).status,404);
 await assert.rejects(spendOrderWallet(env.DB,await env.DB.prepare('SELECT * FROM zx_diamond_orders').first(),{...founder,id:'other'}),/OWNER/);
});
test('insufficient wallet never submits; lost supplier response preserves one debit and never resends',async()=>{
 const env=await setup(),submitted={n:0},fetcher=upstream({submitted,lost:true});
 assert.equal((await route(env,'/wallet',founder,body,crypto.randomUUID(),fetcher)).body.error,'WALLET_MOVEMENT_REJECTED');assert.equal(submitted.n,0);
 await postMovement(env.DB,{userId:'owner',kind:'credit',amountCents:10000,currency:'MXN',source:'fixture',reference:'1',requestKey:'credit',actor:'fixture'});
 const key=crypto.randomUUID(),a=await route(env,'/wallet',founder,body,key,fetcher);assert.equal(a.body.delivery.state,'REQUIRES_REVIEW');assert.equal(submitted.n,1);
 await route(env,'/wallet',founder,body,key,fetcher);assert.equal(submitted.n,1);assert.equal((await walletState(env.DB,'owner')).availableCents,8200);
});
test('server-priced production checkout reconciles only matching live evidence; duplicate webhook no second delivery',async()=>{
 const env=await setup(),submitted={n:0},fetcher=upstream({submitted});
 const a=await route(env,'/checkout',founder,{...body,price:0,amountCents:1,paid:true},crypto.randomUUID(),fetcher);assert.equal(a.body.ok,true);assert.equal(submitted.n,1);
 const p={id:555,external_reference:a.body.orderId,transaction_amount:18,currency_id:'MXN',collector_id:456,live_mode:true,status:'approved'};
 for(const patch of [{live_mode:false},{transaction_amount:1},{collector_id:777},{currency_id:'USD'}])await assert.rejects(reconcileProductPayment(env,{...p,...patch},fetcher),/EVIDENCE/);
 assert.equal(submitted.n,1);const paid=await reconcileProductPayment(env,p,fetcher);assert.equal(paid.delivery.state,'COMPLETED');assert.equal(submitted.n,2);
 await reconcileProductPayment(env,p,fetcher);assert.equal(submitted.n,2);assert.equal((await walletState(env.DB,'owner')).availableCents,0);
 await reconcileProductPayment(env,{...p,status:'refunded',transaction_amount_refunded:18},fetcher);assert.equal((await env.DB.prepare('SELECT state FROM zx_product_payments').first()).state,'review_required');
});
test('supplier lookup cannot count another UID or another order as completed',async()=>{
 const provider=directProvider(config,[{...recipe[0],sku:'123',providerItemName:'110 direct'}],'US',async()=>response({code:200,status:true,data:{id:789,status:'COMPLETED',gameAccount:{uid:'999999999'}}}));
 assert.equal((await provider.lookup({reference:'789',playerId:'1136210821'})).status,'UNKNOWN');assert.equal((await provider.lookup({reference:'788',playerId:'1136210821'})).status,'UNKNOWN');
});
test('recovery after wallet debit state-write failure only repairs existing debit and never recharges',async()=>{
 const env=await setup(),fetcher=upstream();await postMovement(env.DB,{userId:'owner',kind:'credit',amountCents:10000,currency:'MXN',source:'fixture',reference:'1',requestKey:'credit',actor:'fixture'});
 const batch=env.DB.batch.bind(env.DB);let fail=true;env.DB.batch=async statements=>{if(fail&&env.DB.sql.prepare("SELECT COUNT(*) n FROM zx_wallet_ledger WHERE kind='purchase'").get().n){fail=false;throw Error('DB_WRITE_FAILED');}return batch(statements);};
 const a=await route(env,'/wallet',founder,body,crypto.randomUUID(),fetcher);assert.equal(a.body.error,'WALLET_RECONCILIATION_REQUIRED');assert.ok(a.body.orderId);
 await route(env,'/resume',founder,{orderId:a.body.orderId},crypto.randomUUID(),fetcher);assert.equal((await walletState(env.DB,'owner')).availableCents,8200);assert.equal((await env.DB.prepare('SELECT state FROM zx_diamond_orders').first()).state,'COMPLETED');
});
test('accepted supplier order resumes with expected UID via lookup and no repeated POST',async()=>{
 const env=await setup();await postMovement(env.DB,{userId:'owner',kind:'credit',amountCents:10000,currency:'MXN',source:'fixture',reference:'1',requestKey:'credit',actor:'fixture'});let sends=0,reads=0;const base=upstream();
 const fetcher=async(url,options)=>{if(url.endsWith('/account/shop/order')){sends++;return response({status:true,code:200,data:{id:789,status:'PROCESSING',gameAccount:{uid:'1136210821',region:'US'},items:[{name:'110 direct',itemType:'DIAMONDS_DIRECT',quantity:1,status:'COMPLETED'}]}});}if(url.endsWith('/account/shop/orders/789')){reads++;return response({status:true,code:200,data:{id:789,status:'COMPLETED',gameAccount:{uid:'1136210821',region:'US'},items:[{name:'110 direct',itemType:'DIAMONDS_DIRECT',quantity:1,status:'COMPLETED'}]}});}return base(url,options);};
 const a=await route(env,'/wallet',founder,body,crypto.randomUUID(),fetcher);assert.equal(a.body.delivery.state,'REQUIRES_REVIEW');
 const b=await route(env,'/resume',founder,{orderId:a.body.orderId},crypto.randomUUID(),fetcher);assert.equal(b.body.delivery.state,'COMPLETED');assert.equal(sends,1);assert.equal(reads,1);
});
test('COMPLETED alone cannot prove delivery: verify single direct item, catalog name, quantity and player region',async()=>{
 const good={id:789,status:'COMPLETED',gameAccount:{uid:'1136210821',region:'US'},items:[{name:'110 direct',itemType:'DIAMONDS_DIRECT',quantity:1,status:'COMPLETED'}]};
 for(const patch of [{items:[]},{items:[{...good.items[0],itemType:'DIAMONDS_PIN'}]},{items:[{...good.items[0],name:'341 direct'}]},{items:[{...good.items[0],quantity:2}]},{gameAccount:{uid:'1136210821',region:'BR'}}]){
  const provider=directProvider(config,[{...recipe[0],sku:'123',providerItemName:'110 direct'}],'US',async()=>response({code:200,status:true,data:{...good,...patch}}));
  assert.notEqual((await provider.lookup({reference:'789',playerId:'1136210821',sku:'123'})).status,'SUCCESS');
 }
});
