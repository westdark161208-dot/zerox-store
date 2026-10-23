import test from 'node:test';
import assert from 'node:assert/strict';
import {providerRoute} from '../cloudflare/providers/routes.mjs';
import {readRaCatalogService,readRaFounderService} from '../cloudflare/providers/ra-admin-service.mjs';
import {raPrivateMode} from '../cloudflare/providers/ra-private-policy.mjs';
import {purchaseConfiguration} from '../cloudflare/diamonds/purchases.mjs';
const root='/api/admin/providers/recargas-america/';
const founder={isFounder:true,status:'active'};
const token='d'.repeat(64);
function setup(){
 const calls=[];
 const env={RA_CATALOG_READ_ENABLED:'true',RA_CATALOG_READ_CONTRACT_VERIFIED:'true',RA_CATALOG_READ_TOKEN:token,RA_READ_ADMIN_TOKEN:'a'.repeat(64),RA_DELIVERY_ENABLED:'true',RA_CONTRACT_VERIFIED:'true',DIAMOND_PRODUCTION_ENABLED:'true',RA_READ_ENABLED:'true',PUBLIC_COMMERCE_ENABLED:'true',SIXOFIRE_DELIVERY_ENABLED:'true',RA_READ_SERVICE:{async fetch(url,opts){calls.push({url,opts});const resource=url.endsWith('/wallet')?'wallet':'catalog';return Response.json({ok:true,resource,purchasesEnabled:false,...(resource==='catalog'?{productCount:213,invalidProducts:0}:{}),data:resource==='wallet'?{currency:'USD',balance:'1.25'}:Array.from({length:213},(_,i)=>({id:i+1,sku:'TEST-'+i,name:'Fixture '+i,type:'recharge',price:'1',requiredFields:['player_id']}))});}}};
 return {env,calls};
}
async function route(env,path,user=founder,method='GET'){const r=new Request('https://fixture'+path,{method});return providerRoute(r,env,new URL(r.url),user,(b,s=200)=>Response.json(b,{status:s}));}
test('independent founder wallet and 213 catalog use only new Bearer and GET while commerce flags stay enabled',async()=>{
 const {env,calls}=setup(),before=purchaseConfiguration(env);
 for(const resource of ['wallet','catalog']){const r=await route(env,root+resource);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const b=await r.json();assert.equal(b.resource,resource);if(resource==='catalog')assert.equal(b.productCount,213);}
 assert.equal(raPrivateMode(env),false);assert.deepEqual(purchaseConfiguration(env),before);
 assert.equal(calls.length,2);for(const c of calls){assert.equal(c.opts.method,'GET');assert.equal(c.opts.headers.Authorization,'Bearer '+token);assert.equal(c.opts.redirect,'manual');assert.match(c.url,/\/admin\/ra\/(wallet|catalog)$/);}
 const balance=await route(env,'/api/admin/providers/founder-balances');const b=await balance.json();assert.equal(b.balances.ra.currency,'USD');assert.equal(b.walletCredited,false);
});
test('founder authorization, GET-only, query rejection and status never call upstream',async()=>{
 const {env,calls}=setup();
 for(const resource of ['wallet','catalog']){
  assert.equal((await route(env,root+resource,null)).status,401);
  assert.equal((await route(env,root+resource,{status:'active',role:'admin'})).status,403);
  assert.equal((await route(env,root+resource,{isFounder:true,status:'blocked'})).status,401);
  assert.equal((await route(env,root+resource,founder,'POST')).status,405);
  assert.equal((await route(env,root+resource+'?debug=1')).status,400);
 }
 const s=await (await route(env,root+'status')).json();assert.equal(s.readEnabled,true);assert.equal(s.scope,'administrative-read');assert.equal(calls.length,0);
});
for(const [name,patch] of [['disabled',{RA_CATALOG_READ_ENABLED:'false'}],['missing token',{RA_CATALOG_READ_TOKEN:undefined}],['invalid token',{RA_CATALOG_READ_TOKEN:'short'}],['unverified',{RA_CATALOG_READ_CONTRACT_VERIFIED:'false'}],['missing binding',{RA_READ_SERVICE:null}],...['RA_READ_ADMIN_TOKEN','RA_PROXY_SECRET','RECARGAS_AMERICA_API_KEY','RA_PURCHASE_SERVICE_TOKEN','RA_PURCHASE_PROXY_SECRET'].map(k=>['token collision '+k,{[k]:token}])])test('independent reader fails closed: '+name,async()=>{
 const {env,calls}=setup();Object.assign(env,patch);await assert.rejects(readRaFounderService(env,'wallet'));assert.equal(calls.length,0);assert.equal((await (await route(env,root+'status')).json()).readEnabled,false);
});
for(const [name,response] of [['wrong currency',{ok:true,resource:'wallet',purchasesEnabled:false,data:{currency:'MXN',balance:1}}],['negative balance',{ok:true,resource:'wallet',purchasesEnabled:false,data:{currency:'USD',balance:-1}}],['buy enabled',{ok:true,resource:'wallet',purchasesEnabled:true,data:{currency:'USD',balance:1}}],['count mismatch',{ok:true,resource:'catalog',purchasesEnabled:false,productCount:213,invalidProducts:0,data:[]}],['wrong resource',{ok:true,resource:'other',purchasesEnabled:false,data:[]}]] )test('invalid independent response: '+name,async()=>{
 const {env}=setup();env.RA_READ_SERVICE.fetch=async()=>Response.json(response);await assert.rejects(readRaCatalogService(env,response.resource==='catalog'?'catalog':'wallet'));
});
test('upstream authentication failure and exceptions are sanitized; unknown action cannot reach service',async()=>{
 const {env,calls}=setup();await assert.rejects(readRaCatalogService(env,'buy'));assert.equal(calls.length,0);
 for(const fetcher of [async()=>new Response('sensitive',{status:401}),async()=>{throw Error('sensitive');},async()=>new Response('bad json')]){env.RA_READ_SERVICE.fetch=fetcher;const r=await route(env,root+'wallet');assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/sensitive|bad json/);}
});
