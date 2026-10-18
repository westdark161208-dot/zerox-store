import test from 'node:test';
import assert from 'node:assert/strict';
import {providerRoute} from '../cloudflare/providers/routes.mjs';
import {page} from '../cloudflare/staging/panel.mjs';
const root='/api/admin/providers/recargas-america/';
const reply=(b,s=200)=>Response.json(b,{status:s});
const founder={isFounder:true,status:'active'};
function env(){return {RA_ADMIN_READ_ENABLED:'true',RA_ADMIN_READ_TRANSPORT:'service-binding',RA_ADMIN_READ_CONTRACT_VERIFIED:'true',RA_READ_ADMIN_TOKEN:'a'.repeat(64),RA_READ_SERVICE:{fetch:async()=>Response.json({ok:true,resource:'wallet',purchasesEnabled:false,data:{currency:'USD',balance:'1.25'}})}};}
const call=(path,user,e=env(),method='GET')=>{const r=new Request('https://test.invalid'+path,{method});return providerRoute(r,e,new URL(r.url),user,reply);};
test('original admin route rejects anonymous and non-founder',async()=>{assert.equal((await call(root+'wallet',null)).status,401);assert.equal((await call(root+'catalog',{status:'active'})).status,403);});
test('original admin wallet uses private adapter and no-store',async()=>{const r=await call(root+'wallet',founder);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const b=await r.json();assert.equal(b.data.currency,'USD');assert.equal(b.purchasesEnabled,false);});
test('private phase blocks all legacy RA and mixed market operations without provider calls',async()=>{const e=env();e.RA_READ_SERVICE.fetch=()=>{throw Error('must not call');};for(const p of ['associations','readiness','validate'])assert.equal((await call(root+p,founder,e)).status,403);assert.equal((await call('/api/admin/providers/market/catalog',founder,e)).status,403);assert.equal((await call(root+'wallet',founder,e,'POST')).status,405);assert.equal((await call(root+'wallet?debug=true',founder,e)).status,400);});
test('mixed RA purchase flags fail closed instead of advertising purchases disabled',async()=>{
 const e=env();let calls=0;e.RA_READ_SERVICE.fetch=async()=>{calls++;throw Error('unreachable');};
 for(const flag of ['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED']){
  const unsafe={...e,[flag]:'true'};
  for(const route of ['status','wallet','catalog']){
   const r=await call(root+route,founder,unsafe);
   assert.equal(r.status,503);
   assert.equal((await r.json()).error,'RA_PRIVATE_READ_PRODUCTION_GUARD');
  }
 }
 assert.equal(calls,0);
});
test('preview reuses original control IDs without production scripts',()=>{const p=page(true);for(const id of ['provider-balance-result','ra-catalog-check','ra-catalog','sixofire-check'])assert.ok(p.includes('id="'+id+'"'));assert.doesNotMatch(p,/src="(?:control|providers-panel)|workers\.dev|localStorage/);assert.match(p,/<button id="sixofire-check"[^>]*disabled/);});
