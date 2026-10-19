import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {database} from './helpers/d1.mjs';
import {Journal} from '../oracle/ra-purchase/store.mjs';
import {createGateway} from '../oracle/ra-purchase/gateway.mjs';
import bridge from '../cloudflare/ra-purchase/worker.mjs';
import {sign,canonical} from '../cloudflare/ra-purchase/protocol.mjs';
import {purchaseRoute,continuePaidDiamonds} from '../cloudflare/diamonds/purchases.mjs';
import {fundingRoute} from '../cloudflare/payments/funding-routes.mjs';
import {walletSchema,postMovement,walletState} from '../cloudflare/wallet/ledger.mjs';
const owner={id:'fixture-owner',status:'active',isFounder:true};
const product={id:999001,sku:'FIXTURE-ONLY-100',name:'Fixture FF 100 + 10',type:'recharge',price:'1',required_fields:['player_id']}; // NOT a real RA SKU
const item={...product,requiredFields:product.required_fields};delete item.required_fields;
const payload={operationId:'11111111-1111-4111-8111-111111111111:0',playerId:'1136210821',region:'US',productId:product.id,catalogSku:product.sku,name:product.name,maxPriceUsd:'1',field:'player_id'};
const reply=(body,status=200)=>Response.json(body,{status});
async function setup(t,{buy='success'}={}){
 const dir=mkdtempSync(join(tmpdir(),'zx-ra-test-')),journalPath=join(dir,'journal.sqlite');let journal=new Journal(journalPath);t.after(()=>{journal.close();rmSync(dir,{recursive:true,force:true});});
 const metrics={buys:0,lookups:0,preferences:0},state={buy,payment:null,down:false};
 const config={enabled:true,proxySecret:'b'.repeat(64),product:{verified:true,productId:product.id,sku:product.sku,name:product.name,field:'player_id',baseDiamonds:100,bonusDiamonds:10,region:'US',bonusEvidence:'TEST FIXTURE ONLY',maxPriceUsd:2}};
 const upstream=async(path,method,body)=>{
 if(path==='/products/catalog')return {success:true,data:[product]};
 if(path==='/wallet')return {success:true,data:{balance:100,currency:'USD'}};
 if(path==='/catalog/validate')return {success:true,data:{supported:true,status:true}};
 if(path==='/buy/catalog'){metrics.buys++;assert.equal(method,'POST');assert.deepEqual(body,{product_id:product.id,quantity:1,player_id:payload.playerId});if(state.buy==='timeout')throw Error('fixture timeout');if(state.buy==='partial')return {success:true,data:{status:'COMPLETED'}};return {success:true,data:{order_id:'FIX-ORDER',item:product.name,amount_charged:1,status:state.buy==='processing'?'PROCESSING':'COMPLETED',...state.buyPatch}};}
 if(path==='/catalog/orders/FIX-ORDER'){metrics.lookups++;return {success:true,data:{order_id:'FIX-ORDER',product:product.name,status:'COMPLETED',...state.lookupPatch}};}
 assert.fail('unexpected Oracle upstream');
 };
 let gateway=createGateway({config,store:journal,upstream});
 const bridgeEnv={RA_FF110_BRIDGE_ENABLED:'true',RA_PURCHASE_SERVICE_TOKEN:'c'.repeat(64),RA_PURCHASE_PROXY_SECRET:config.proxySecret,RA_PURCHASE_GATEWAY:{fetch:(url,options)=>{if(state.down)throw Error('fixture Oracle down');assert.ok(url.startsWith('http://127.0.0.1:8791/'));return gateway(new Request(url,options));}}};
 const DB=database();DB.sql.exec("CREATE TABLE zx_users(id TEXT PRIMARY KEY,status TEXT); INSERT INTO zx_users VALUES('fixture-owner','active')");await walletSchema(DB);
 const env={DB,RA_FF110_PILOT_ONLY:'true',RA_FF110_PURCHASE_ENABLED:'true',RA_FF110_CONTRACT_VERIFIED:'true',RA_FF110_PRODUCT_VERIFIED:'true',RA_DELIVERY_ENABLED:'false',RA_CONTRACT_VERIFIED:'false',DIAMOND_PRODUCTION_ENABLED:'false',RA_READ_ENABLED:'false',RA_ADMIN_READ_ENABLED:'true',RA_ADMIN_READ_TRANSPORT:'service-binding',RA_ADMIN_READ_CONTRACT_VERIFIED:'true',RA_READ_ADMIN_TOKEN:'a'.repeat(64),RA_PURCHASE_SERVICE_TOKEN:'c'.repeat(64),RA_PURCHASE_SERVICE:{fetch:(url,options)=>bridge.fetch(new Request(url,options),bridgeEnv)},RA_READ_SERVICE:{fetch:async url=>{const resource=url.endsWith('/wallet')?'wallet':'catalog';return Response.json({ok:true,resource,purchasesEnabled:false,...(resource==='catalog'?{productCount:1,invalidProducts:0}:{}),data:resource==='wallet'?{balance:'100',currency:'USD'}:[item]});}},RA_DIAMOND_PACKS:JSON.stringify({'110':{productId:product.id,sku:product.sku,name:product.name,baseDiamonds:100,bonusDiamonds:10,regions:['US'],playerField:'player_id',bonusEvidence:'TEST ONLY'}}),FF_INFO_API_KEY:'fixture',MP_PRODUCTION_READ_ENABLED:'true',MP_ACCESS_TOKEN:'fixture',MP_COLLECTOR_ID_PRODUCTION:'456',MP_WEBHOOK_SECRET_PRODUCTION:'fixture-secret',MP_WALLET_PILOT_ENABLED:'true',MP_PRODUCT_QUOTES_V3:'true',MP_FEE_POLICY_VERIFIED:'true',MP_FEE_POLICY_VERSION:'fixture',MP_FEE_RATE_BPS:'349',MP_FEE_FIXED_CENTS:'400',MP_FEE_TAX_BPS:'1600'};
 const fetcher=async(url,options={})=>{
 assert.ok(!url.includes('recargasamerica'),'Store must never contact public RA');
 if(url.includes('freefirecommunity'))return reply({basicInfo:{accountId:payload.playerId,nickname:'Fixture',region:'US'}});
 if(url.endsWith('/users/me'))return reply({id:456,site_id:'MLM'});
 if(url.endsWith('/checkout/preferences')){metrics.preferences++;const b=JSON.parse(options.body);state.payment={id:999,external_reference:b.external_reference,transaction_amount:b.items[0].unit_price,currency_id:'MXN',collector_id:456,live_mode:true,status:'approved'};return reply({id:'fixture-pref',collector_id:456,init_point:'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=fixture'});}
 if(url.endsWith('/v1/payments/999'))return reply(state.payment);
 assert.fail('unexpected external URL');
 };
 async function route(path,body,key=crypto.randomUUID()) {const req=new Request('https://fixture/api/diamonds/purchase'+path,{method:body?'POST':'GET',headers:{'Idempotency-Key':key},...(body?{body:JSON.stringify(body)}:{})});const r=await purchaseRoute(req,env,new URL(req.url),owner,reply,fetcher);return {status:r.status,...await r.json()};}
 async function checkout(method){const b={productId:'zx-diamonds-110',playerId:payload.playerId,playerConfirmed:true,method};const q=await route('/quote',b);assert.equal(q.ok,true);const key=crypto.randomUUID();const body={...b,quoteId:q.quote.id,maxAmountCents:q.amountCents};return {key,body,result:await route(method==='wallet'?'/wallet':'/checkout',body,key)};}
 async function hook(valid=true){const url=new URL('https://fixture/api/payments/mercadopago/funding/webhook?data.id=999'),ts=String(Math.floor(Date.now()/1000)),sig=createHmac('sha256','fixture-secret').update('id:999;request-id:fixture;ts:'+ts+';').digest('hex');const req=new Request(url,{method:'POST',headers:{'x-request-id':'fixture','x-signature':'ts='+ts+',v1='+(valid?sig:'0'.repeat(64))},body:JSON.stringify({type:'payment',data:{id:999},paid:true})});return fundingRoute(req,env,url,null,reply,fetcher);}
 async function credit(){await postMovement(DB,{userId:owner.id,kind:'credit',amountCents:10000,currency:'MXN',source:'fixture',reference:'1',requestKey:'fixture-credit',actor:'fixture'});}
 return {env,state,metrics,route,checkout,hook,credit,config,bridgeEnv,get gateway(){return gateway;},restart(){journal.close();journal=new Journal(journalPath);gateway=createGateway({config,store:journal,upstream});}};
}
test('wallet V3 -> original checkout -> private worker -> signed Oracle gateway -> receipt, debit and delivery once',async t=>{
 const h=await setup(t);await h.credit();const {result,key,body}=await h.checkout('wallet');assert.equal(result.ok,true);assert.equal(result.delivery.state,'COMPLETED');assert.equal(h.metrics.buys,1);
 assert.equal((await walletState(h.env.DB,owner.id)).availableCents,8200);await h.route('/wallet',body,key);assert.equal(h.metrics.buys,1);assert.equal((await walletState(h.env.DB,owner.id)).availableCents,8200);
 const receipt=await h.route('/orders/'+result.orderId+'/receipt');assert.equal(receipt.ok,true);
});
for(const method of ['card','spei','all'])test('MP '+method+' signed webhook verifies payment server-side; rejected/duplicate cannot buy twice',async t=>{
 const h=await setup(t),{result}=await h.checkout(method);assert.equal(result.ok,true);assert.equal(h.metrics.buys,0);assert.equal(h.metrics.preferences,1);assert.ok(h.state.payment.transaction_amount>18);
 assert.equal((await h.hook(false)).status,401);assert.equal(h.metrics.buys,0);
 h.state.payment.status='rejected';assert.equal((await h.hook()).status,200);assert.equal(h.metrics.buys,0);
 h.state.payment.status='approved';assert.equal((await h.hook()).status,200);assert.equal(h.metrics.buys,1);
 assert.equal((await h.hook()).status,200);assert.equal(h.metrics.buys,1);assert.equal((await h.route('/orders/'+result.orderId+'/receipt')).ok,true);
});
for(const buy of ['timeout','partial'])test(buy+' after submit stays in review, no blind retry after gateway restart',async t=>{
 const h=await setup(t,{buy});await h.credit();const {result}=await h.checkout('wallet');assert.equal(result.delivery.state,'REQUIRES_REVIEW');h.restart();
 await h.route('/resume',{orderId:result.orderId});await continuePaidDiamonds(h.env);assert.equal(h.metrics.buys,1);assert.equal(h.metrics.lookups,0);assert.equal((await h.route('/orders/'+result.orderId+'/receipt')).ok,false);
});
test('known provider reference reconciles via lookup only on cron',async t=>{
 const h=await setup(t,{buy:'processing'});await h.credit();const {result}=await h.checkout('wallet');assert.equal(result.delivery.state,'REQUIRES_REVIEW');h.restart();await continuePaidDiamonds(h.env);assert.equal(h.metrics.buys,1);assert.equal(h.metrics.lookups,1);assert.equal((await h.route('/orders/'+result.orderId+'/receipt')).ok,true);
});
test('Oracle unavailable before payment blocks wallet debit and MP preference',async t=>{
 const h=await setup(t);await h.credit();h.state.down=true;for(const method of ['wallet','card']){const {result}=await h.checkout(method);assert.equal(result.ok,false);}assert.equal(h.metrics.buys,0);assert.equal(h.metrics.preferences,0);assert.equal((await walletState(h.env.DB,owner.id)).availableCents,10000);
});
async function signed(h,p,action='submit',nonce=crypto.randomUUID(),time=String(Date.now())){const path='/v1/ff110/'+action,body=JSON.stringify(p);return new Request('http://127.0.0.1:8791'+path,{method:'POST',body,headers:{'x-zerox-time':time,'x-zerox-nonce':nonce,'x-zerox-signature':await sign(h.config.proxySecret,canonical(path,time,nonce,body))}});}
test('Oracle journal survives restart; duplicate operation cached, changed UID conflicts, replay rejected',async t=>{
 const h=await setup(t);const req=await signed(h,payload),copy=req.clone();assert.equal((await h.gateway(req)).status,200);assert.equal((await h.gateway(copy)).status,429);h.restart();
 assert.equal((await h.gateway(await signed(h,payload))).status,200);assert.equal(h.metrics.buys,1);
 assert.equal((await h.gateway(await signed(h,{...payload,playerId:'998877665'}))).status,409);assert.equal(h.metrics.buys,1);
});
test('service auth, timestamp, product scope, unknown lookup and rate limit fail closed',async t=>{
 const h=await setup(t);assert.equal((await bridge.fetch(new Request('https://fixture/v1/ff110/submit',{method:'POST',body:JSON.stringify(payload)}),h.bridgeEnv)).status,401);
 assert.equal((await h.gateway(await signed(h,payload,'submit',crypto.randomUUID(),String(Date.now()-60000)))).status,401);
 assert.equal((await h.gateway(await signed(h,{...payload,productId:1}))).status,400);
 assert.equal((await h.gateway(await signed(h,{...payload,reference:'OTHER'},'lookup'))).status,409);
 for(let i=0;i<28;i++)assert.equal((await h.gateway(await signed(h,payload,'validate'))).status,200);
 assert.equal((await h.gateway(await signed(h,payload,'validate'))).status,429);assert.equal(h.metrics.buys,0);
});
test('concurrent duplicate submits cause one upstream buy; forged signature never reaches RA',async t=>{
 const h=await setup(t);const [a,b]=await Promise.all([signed(h,payload),signed(h,payload)]);await Promise.all([h.gateway(a),h.gateway(b)]);assert.equal(h.metrics.buys,1);
 const forged=await signed(h,{...payload,operationId:'22222222-2222-4222-8222-222222222222:0'});forged.headers.set('x-zerox-signature','0'.repeat(64));assert.equal((await h.gateway(forged)).status,401);assert.equal(h.metrics.buys,1);
});
test('wrong payment amount, foreign region/product and disabled private transport cannot deliver',async t=>{
 const h=await setup(t);await h.checkout('card');h.state.payment.transaction_amount=1;assert.equal((await h.hook()).status,503);assert.equal(h.metrics.buys,0);
 const other=await h.route('/quote',{productId:'zx-diamonds-341',playerId:payload.playerId,playerConfirmed:true,method:'card'});assert.equal(other.ok,false);
 assert.equal((await h.gateway(await signed(h,{...payload,region:'BR'}))).status,400);
 h.env.RA_FF110_PURCHASE_ENABLED='false';assert.equal((await h.route('/status')).enabled,false);assert.equal(h.metrics.buys,0);
});
test('one supplier reference cannot prove delivery of two different operations',async t=>{
 const h=await setup(t);const first=await h.gateway(await signed(h,payload));assert.equal((await first.json()).status,'SUCCESS');
 const second=await h.gateway(await signed(h,{...payload,operationId:'22222222-2222-4222-8222-222222222222:0'}));assert.equal((await second.json()).status,'UNKNOWN');
});

for(const patch of [{needs_review:'true'},{needs_review:true},{quantity:2},{player_id:'998877665'},{region:'BR'},{status:'REJECTED'}]){
 for(const phase of ['submit','lookup'])test(phase+' contradictory confirmation '+JSON.stringify(patch)+' never issues receipt or resubmits',async t=>{
  const h=await setup(t,{buy:phase==='lookup'?'processing':'success'});await h.credit();
  h.state.lookupPatch=patch;if(phase==='submit')h.state.buyPatch=patch;
  const {result}=await h.checkout('wallet');h.restart();
  await continuePaidDiamonds(h.env);await h.route('/resume',{orderId:result.orderId});
  assert.equal(h.metrics.buys,1);assert.equal((await h.route('/orders/'+result.orderId+'/receipt')).ok,false);
 });
}
