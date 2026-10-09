import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import worker from '../cloudflare/worker.js';
import {serviceRoute} from '../cloudflare/services/purchases.mjs';
import {matchesServiceName} from '../cloudflare/services/delivery.mjs';
import {walletSchema,postMovement,walletState} from '../cloudflare/wallet/ledger.mjs';
import {walletAdminRoute} from '../cloudflare/wallet/admin.mjs';
const reply=(b,s=200)=>new Response(JSON.stringify(b),{status:s});
const user={id:'buyer',status:'active',isFounder:false};
const buy={productId:'ff-booyah-76828',quantity:1,maxAmountCents:4132,playerId:'1136210821',playerConfirmed:true,contactPhone:'+529511234567',method:'wallet'};
const call=(env,path,body,fetcher,key=crypto.randomUUID(),account=user)=>serviceRoute(new Request('https://test'+path,{method:body?'POST':'GET',headers:{'Idempotency-Key':key},body:body?JSON.stringify(body):undefined}),env,new URL('https://test'+path),account,reply,fetcher);
async function setup(){const DB=database();DB.sql.exec("CREATE TABLE zx_users(id TEXT PRIMARY KEY,status TEXT);INSERT INTO zx_users VALUES('buyer','active')");await walletSchema(DB);await postMovement(DB,{userId:'buyer',kind:'credit',amountCents:4132,currency:'MXN',source:'test',reference:'seed',requestKey:'seed',actor:'test'});return {DB,PUBLIC_COMMERCE_ENABLED:'true',SIXOFIRE_DELIVERY_ENABLED:'true',SIXOFIRE_API_KEY:'fixture',FF_INFO_API_KEY:'fixture'};}
function upstream({ambiguous=false,unavailable=false}={}){let buys=0;const item={id:'1042',name:'Pase Booyah de Free Fire',itemType:'GIFT',available:true,isActive:true,priceUsd:1,availableRegions:['US']};return {count:()=>buys,fetcher:async(url,opts={})=>{
 let b;
 if(url.includes('freefirecommunity'))b={basicInfo:{accountId:buy.playerId,nickname:'Player',region:'US'}};
 else if(url.endsWith('/shop/items')){if(unavailable)throw Error('connection failed');b={status:true,data:{items:ambiguous?[item,{...item,id:'1043'}]:[item]}};}
 else if(url.includes('/shop/orders?page'))b={status:true,data:{items:[]}};
 else if(url.endsWith('/shop/order')){buys++;assert.equal(JSON.parse(opts.body).uid,buy.playerId);b={code:201,status:true,data:{id:12345,status:'COMPLETED',totalPriceUsd:1,gameAccount:{uid:buy.playerId,region:'US'},items:[{name:item.name,itemType:'GIFT',quantity:1,status:'COMPLETED'}]}};}
 else throw Error('Unexpected request '+url);
 return new Response(JSON.stringify(b));
 }};}
test('exact published 41.32 MXN web balance buys Booyah once without MP or RA configuration',async()=>{
 const env=await setup(),up=upstream(),key=crypto.randomUUID();
 const status=await(await call(env,'/api/services/purchase/status')).json();assert.equal(status.walletEnabled,true);assert.equal(status.enabled,false);
 const result=await call(env,'/api/services/purchase/checkout',buy,up.fetcher,key),data=await result.json();assert.equal(result.status,200,JSON.stringify(data));
 await call(env,'/api/services/purchase/checkout',buy,up.fetcher,key);assert.equal(up.count(),1);assert.equal((await walletState(env.DB,user.id)).availableCents,0);
 const receipt=await(await call(env,'/api/services/purchase/orders/'+data.orderId+'/receipt')).json();assert.equal(receipt.receipt.amountCents,4132);assert.doesNotMatch(JSON.stringify(receipt),/sixofire|1042/);
});
test('matching the game suffix never substitutes Premium, quantity bundles or another variant',()=>{
 for(const name of ['Pase Booyah','Pase Booyah de Free Fire','Free Fire Booyah Pass'])assert.equal(matchesServiceName('booyah-normal',name),true);
 for(const name of ['Pase Booyah Premium de Free Fire','3 pases Booyah','Pase Booyah + 50 niveles','Booyah Pass trial'])assert.equal(matchesServiceName('booyah-normal',name),false);
});
test('ambiguous or unavailable delivery cannot debit wallet; connection failures are not missing products',async()=>{
 for(const opts of [{ambiguous:true},{unavailable:true}]){
 const env=await setup(),up=upstream(opts),data=await(await call(env,'/api/services/purchase/checkout',buy,up.fetcher)).json();
 assert.equal(data.error,opts.unavailable?'DELIVERY_CONNECTION_FAILED':'PRODUCT_DELIVERY_MAPPING_REQUIRED');assert.equal(data.deliveryIssues,undefined);assert.equal(up.count(),0);assert.equal((await walletState(env.DB,user.id)).availableCents,4132);
 const founder=await(await call(env,'/api/services/purchase/checkout',buy,up.fetcher,crypto.randomUUID(),{...user,isFounder:true})).json();assert.ok(founder.deliveryIssues.some(i=>i.reason===(opts.unavailable?'DELIVERY_CONNECTION_FAILED':'AMBIGUOUS_PRODUCT')));
 }
});
test('registration validates country, derives purchase region, persists geography and groups real accounts',async()=>{
 const env={DB:database()},post=body=>worker.fetch(new Request('https://test/api/auth/register',{method:'POST',body:JSON.stringify(body)}),env),body={username:'countrytest',email:'country@example.invalid',password:'test-fixture-pass',country:'MX',state:'Oaxaca',purchaseRegion:'south'};
 for(const country of [undefined,'ZZ','__proto__','constructor']){const r=await post({...body,country});assert.equal(r.status,400);assert.equal((await r.json()).error,'INVALID_LOCATION');}
 assert.equal(env.DB.sql.prepare('SELECT COUNT(*) n FROM zx_users').get().n,0);
 const r=await post(body),data=await r.json();assert.equal(r.status,201,JSON.stringify(data));assert.equal(data.user.purchaseRegion,'north');
 const location=env.DB.sql.prepare('SELECT country,state FROM zx_customer_location WHERE user_id=?').get(data.user.id);assert.deepEqual({...location},{country:'MX',state:'Oaxaca'});
 const url=new URL('https://test/api/admin/customers?region=north'),list=await walletAdminRoute(new Request(url),env,url,{id:'founder',isFounder:true,status:'active'},reply),result=await list.json();assert.equal(result.users.length,1);assert.deepEqual(result.countries,[{country:'MX',count:1,region:'north'}]);
 const update=await worker.fetch(new Request('https://test/api/auth/location',{method:'POST',headers:{Authorization:'Bearer '+data.session.token},body:JSON.stringify({country:'CO',state:'Bogotá'})}),env);assert.equal(update.status,200);
 const refreshed=await(await walletAdminRoute(new Request(url),env,url,{id:'founder',isFounder:true,status:'active'},reply)).json();assert.equal(refreshed.users.length,0);assert.deepEqual(refreshed.countries,[{country:'CO',count:1,region:'south'}]);
});
test('an unfunded service retry stays unpaid, then one funded retry debits and delivers once',async()=>{
 const env=await setup(),up=upstream(),key=crypto.randomUUID();
 await postMovement(env.DB,{userId:user.id,kind:'purchase',orderId:'fixture-lower',amountCents:1,currency:'MXN',source:'test',reference:'lower',requestKey:'lower',actor:'test'});
 for(let i=0;i<2;i++){const r=await call(env,'/api/services/purchase/checkout',buy,up.fetcher,key);assert.equal(r.status,409);assert.equal((await r.json()).error,'WALLET_MOVEMENT_REJECTED');}
 assert.equal(up.count(),0);assert.equal((await walletState(env.DB,user.id)).availableCents,4131);
 await postMovement(env.DB,{userId:user.id,kind:'credit',amountCents:1,currency:'MXN',source:'test',reference:'restore',requestKey:'restore',actor:'test'});
 for(let i=0;i<2;i++)assert.equal((await call(env,'/api/services/purchase/checkout',buy,up.fetcher,key)).status,200);
 assert.equal(up.count(),1);assert.equal((await walletState(env.DB,user.id)).availableCents,0);
});
