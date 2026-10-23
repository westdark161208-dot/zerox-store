import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {providerRoute} from '../cloudflare/providers/routes.mjs';
import {directDiamondPack,associationRecipes} from '../cloudflare/providers/ra-association-catalog.mjs';
import {purchaseConfiguration} from '../cloudflare/diamonds/purchases.mjs';
const endpoint='https://fixture/api/admin/providers/recargas-america/associations';
const founder={id:'founder',isFounder:true,status:'active'};
const product={id:5,sku:'ADS005',name:'Recarga Free Fire US 100 Diamantes +10% Bono',type:'recharge',price:'0.80',requiredFields:['manual_id']};
const form={total:110,productId:5,sku:product.sku,name:product.name,revision:0,regions:['US'],confirmed:true,bonusEvidence:'Fixture: proveedor confirma US y 100 + 10 diamantes'};
function fixture(items){
 const calls=[];const products=items||[product,...Array.from({length:212},(_,i)=>({id:100+i,sku:'FIXTURE-'+i,name:'Otro juego '+i,type:'pin',price:'1',requiredFields:[]}))];
 const env={DB:database(),RA_CATALOG_READ_ENABLED:'true',RA_CATALOG_READ_CONTRACT_VERIFIED:'true',RA_CATALOG_READ_TOKEN:'c'.repeat(64),RA_DELIVERY_ENABLED:'true',RA_CONTRACT_VERIFIED:'true',DIAMOND_PRODUCTION_ENABLED:'true',PUBLIC_COMMERCE_ENABLED:'true',RA_READ_SERVICE:{async fetch(url,options){calls.push({url,options});assert.equal(url,'https://ra-service.internal/admin/ra/catalog');assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer '+'c'.repeat(64));return Response.json({ok:true,resource:'catalog',purchasesEnabled:false,productCount:products.length,invalidProducts:0,data:products});}}};
 return {env,calls,products};
}
async function route(env,method='GET',body=form,user=founder,suffix=''){
 const request=new Request(endpoint+suffix,{method,...(method==='POST'?{body:JSON.stringify(body)}:{})});
 const r=await providerRoute(request,env,new URL(request.url),user,(b,s=200)=>Response.json(b,{status:s}));
 assert.equal(r.headers.get('cache-control'),'no-store');return {status:r.status,body:await r.json()};
}
test('213 private products: association GET filters FF, no writes, even with legacy private guards',async()=>{
 const {env,calls}=fixture();env.RA_ADMIN_READ_ENABLED='true';env.RA_ADMIN_READ_TRANSPORT='service-binding';
 const r=await route(env);assert.equal(r.status,200);assert.equal(r.body.catalogCount,213);assert.equal(r.body.catalog.length,1);assert.equal(r.body.currency,'USD');assert.equal(r.body.catalog[0].totalDiamonds,110);assert.equal(r.body.associations[0].status,'pending');assert.equal(calls.length,1);
 assert.equal((await env.DB.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").first()).n,0);
});
test('save/recover exact references and minimum-call derived recipes without commercial changes',async()=>{
 const {env,calls}=fixture(),before=purchaseConfiguration(env);
 const saved=await route(env,'POST');assert.equal(saved.status,200);assert.equal(saved.body.revision,1);
 const read=await route(env);assert.equal(read.body.associations[0].status,'configured');
 const recipe=read.body.products.find(p=>p.diamonds===220).recipes[0];assert.equal(recipe.operationCount,2);assert.equal(recipe.packs[0].quantity,2);assert.equal(recipe.packs[0].productId,5);assert.equal(recipe.packs[0].baseDiamonds,100);assert.equal(recipe.packs[0].bonusDiamonds,10);
 assert.equal((await route(env,'POST')).status,409);assert.deepEqual(purchaseConfiguration(env),before);assert.equal(env.RA_FF110_PURCHASE_ENABLED,undefined);
 const tables=(await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name).sort();assert.deepEqual(tables,['zx_ra_pack_association_history','zx_ra_pack_associations']);assert.ok(calls.every(c=>c.options.method==='GET'));
});
test('exact 520+52 and percent bonus accepted; other games, PIN, memberships and wrong quantities excluded',()=>{
 const pack={base:520,bonus:52,total:572};
 for(const name of ['Recarga Free Fire 520 + 52 Diamantes','Recarga Free Fire 520 Diamantes +10% Bono'])assert.equal(directDiamondPack({...product,name},pack),true);
 for(const patch of [{name:'Recarga Mobile Legends 520 Diamantes +10% Bono'},{name:'Free Fire Pase 520 Diamantes +10% Bono'},{name:'Free Fire PIN 520 Diamantes +10% Bono'},{type:'pin',name:'Free Fire 520 +52 Diamantes'},{name:'Free Fire 520 +50 Diamantes'},{name:'Free Fire 520 Diamantes'},{name:'Free Fire 520 +20% Diamantes'},{name:'Free Fire 520 +52 Diamantes',requiredFields:['manual_id','zone_id']}])assert.equal(directDiamondPack({...product,...patch},pack),false);
});
for(const [label,patch,status] of [['wrong region',{regions:['BR']},400],['repeated region',{regions:['US','US']},400],['wrong sku',{sku:'STALE'},409],['stale name',{name:'Old name'},409],['no confirmation',{confirmed:false},400],['missing sku',{sku:undefined},400],['wrong total',{total:572},400],['wrong id',{productId:6},400]])test('invalid association: '+label,async()=>{
 const {env}=fixture();assert.equal((await route(env,'POST',{...form,...patch})).status,status);assert.equal((await env.DB.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").first()).n,0);
});
test('changed or missing product marks saved association incompatible and removes recipe',async()=>{
 const {env,products}=fixture();await route(env,'POST');products[0]={...product,sku:'CHANGED'};const r=await route(env);assert.equal(r.body.associations[0].status,'incompatible');assert.equal(r.body.products.find(p=>p.diamonds===110).recipes.length,0);
});
test('duplicate IDs or SKUs fail the private catalog before association writes',async()=>{
 for(const extra of [{...product,id:6},{...product,sku:'DIFFERENT'}]){const {env}=fixture([product,extra]);assert.equal((await route(env)).status,503);assert.equal((await route(env,'POST')).status,503);assert.equal((await env.DB.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").first()).n,0);}
});
test('founder-only, GET/POST allowlist and no query bypass',async()=>{
 const {env,calls}=fixture();for(const user of [null,{id:'admin',role:'admin',status:'active'},{...founder,isFounder:'true'},{...founder,status:'blocked'}])for(const method of ['GET','POST'])assert.ok([401,403].includes((await route(env,method,form,user)).status));
 assert.equal((await route(env,'DELETE')).status,405);assert.equal((await route(env,'GET',form,founder,'?resource=buy')).status,400);assert.equal(calls.length,0);
});
test('timeout, unavailable binding, malformed response and private authorization fail without public fallback',async()=>{
 for(const fetcher of [async()=>{throw new DOMException('private','TimeoutError')},async()=>new Response('private',{status:401}),async()=>new Response('private',{status:503}),async()=>Response.json({ok:true,data:[]})]){
  const {env}=fixture();env.RA_READ_SERVICE.fetch=fetcher;
  for(const method of ['GET','POST']){const r=await route(env,method);assert.equal(r.status,503);assert.equal(r.body.error,'RA_ADMIN_READ_UNAVAILABLE');assert.doesNotMatch(JSON.stringify(r),/Bearer|private/);}
 }
 const {env}=fixture();delete env.RA_READ_SERVICE;assert.equal((await route(env)).status,503);
});
test('recipe preview minimizes operations, requires exact totals and never mixes regions',()=>{
 const assoc=[{total:110,status:'configured',entry:{productId:5,sku:'A',baseDiamonds:100,bonusDiamonds:10,regions:['US']}},{total:220,status:'configured',entry:{productId:6,sku:'B',baseDiamonds:200,bonusDiamonds:20,regions:['US']}},{total:330,status:'configured',entry:{productId:7,sku:'C',baseDiamonds:300,bonusDiamonds:30,regions:['BR']}}];
 const r=associationRecipes([{id:'a',diamonds:330},{id:'b',diamonds:111}],assoc);
 assert.equal(r[0].recipes.find(r=>r.region==='US').operationCount,2);assert.equal(r[0].recipes.find(r=>r.region==='BR').operationCount,1);assert.equal(r[1].recipes.length,0);
});
test('published visibility is respected; catalogue, editor prices and wallet are never mutated',async()=>{
 const {env}=fixture();const edits={'zx-diamonds-110':{active:false,priceCents:999},'zx-diamonds-220':{active:true,priceCents:1800,name:'Public name'}};
 env.DB.sql.exec('CREATE TABLE zx_store_editor(id INTEGER PRIMARY KEY,published TEXT)');await env.DB.prepare('INSERT INTO zx_store_editor VALUES(1,?)').bind(JSON.stringify(edits)).run();
 const r=await route(env);assert.ok(!r.body.products.some(p=>p.id==='zx-diamonds-110'));assert.equal(r.body.products.find(p=>p.id==='zx-diamonds-220').name,'Public name');
 await route(env,'POST');assert.deepEqual(JSON.parse((await env.DB.prepare('SELECT published FROM zx_store_editor WHERE id=1').first()).published),edits);
});
test('a previously saved duplicate reference cannot be reused for another base',async()=>{
 const {env}=fixture();await route(env,'POST');await env.DB.prepare('UPDATE zx_ra_pack_associations SET total=572 WHERE total=110').run();
 const r=await route(env,'POST');assert.equal(r.status,409);assert.equal(r.body.error,'RA_DUPLICATE_ASSOCIATION');
});
test('catalog without region requires owner evidence; no implicit US association is saved',async()=>{
 const {env}=fixture([{...product,name:'Recarga Free Fire 100 Diamantes +10% Bono'}]);env.RA_AUTO_ASSOCIATE_US='true';
 const r=await route(env);assert.equal(r.body.catalog[0].regionConfirmationRequired,true);assert.deepEqual(r.body.catalog[0].regions,[]);assert.equal(r.body.associations[0].status,'pending');
});
test('association load/save never invokes ambient public fetch or a purchase binding',async()=>{
 const old=globalThis.fetch;let network=0;globalThis.fetch=async()=>{network++;throw Error('public network prohibited')};
 try{const {env}=fixture();env.RA_PURCHASE_SERVICE={fetch(){throw Error('purchase prohibited')}};env.RECARGAS_AMERICA_API_KEY='not-a-real-key';
 assert.equal((await route(env)).status,200);assert.equal((await route(env,'POST')).status,200);delete env.RA_READ_SERVICE;
 assert.equal((await route(env)).status,503);assert.equal(network,0);
 }finally{globalThis.fetch=old;}
});
