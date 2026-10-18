import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {readRecargasAmerica,validateRecargasAccount} from '../cloudflare/providers/recargas-america.mjs';
import {readRaAdminService} from '../cloudflare/providers/ra-admin-service.mjs';
import {founderBalancesRoute} from '../cloudflare/providers/founder-balances.mjs';
import {marketRoute,refreshMarket} from '../cloudflare/providers/market.mjs';
import {deliveryEnabled,lookupDelivery,submitDelivery} from '../cloudflare/services/delivery.mjs';
import {raProvider} from '../cloudflare/diamonds/recargas-america.mjs';
const founder={isFounder:true,status:'active'},reply=(body,status=200)=>({body,status});
const env=()=>({RA_ADMIN_READ_ENABLED:'true',RA_ADMIN_READ_TRANSPORT:'service-binding',RA_ADMIN_READ_CONTRACT_VERIFIED:'true',RA_READ_ADMIN_TOKEN:'a'.repeat(64)});
const product={id:1,sku:'sample-1',name:'Age of Empires Mobile - 1999 Apex Coins',type:'recharge',price:'2.50',requiredFields:['player_id']};
const catalog=items=>Response.json({ok:true,resource:'catalog',purchasesEnabled:false,productCount:items.length,invalidProducts:0,data:items});
test('legacy reads use private binding even with legacy reads disabled, no direct fallback',async()=>{
 const e={...env(),RA_READ_ENABLED:'false',RA_READ_SERVICE:{fetch:async()=>catalog([product])}};
 const direct=()=>assert.fail('direct RA call');assert.equal((await readRecargasAmerica(e,'catalog',direct))[0].name,product.name);
 delete e.RA_READ_SERVICE;await assert.rejects(readRecargasAmerica(e,'catalog',direct),/RA_ADMIN_READ_UNAVAILABLE/);
 e.RA_ADMIN_READ_ENABLED='false';await assert.rejects(readRecargasAmerica(e,'catalog',direct),/RA_ADMIN_READ_DISABLED/);
});
test('combined founder balance never bypasses financial conflict guard',async()=>{
 for(const flag of ['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED']){
 const e={...env(),[flag]:'true',RA_READ_SERVICE:{fetch:()=>assert.fail('blocked upstream')}};
 const r=await founderBalancesRoute(new Request('https://test/balances'),e,founder,reply);
 assert.equal(r.body.balances.ra.available,false);
 }
});
test('duplicate identities and truncated or blank labels are rejected; names are not rewritten',async()=>{
 for(const items of [[product,{...product,sku:'other'}],[product,{...product,id:2}],[{...product,name:' '}],[{...product,sku:'x'.repeat(121)}]]){
 await assert.rejects(readRaAdminService({...env(),RA_READ_SERVICE:{fetch:async()=>catalog(items)}},'catalog'),/UNAVAILABLE/);
 }
 const data=await readRaAdminService({...env(),RA_READ_SERVICE:{fetch:async()=>catalog([product])}},'catalog');assert.deepEqual(data,[product]);
});
test('private mode blocks RA validation, submit and lookup despite legacy financial flags',async()=>{
 const e={...env(),RA_READ_ENABLED:'true',RA_DELIVERY_ENABLED:'true',RA_CONTRACT_VERIFIED:'true',SIXOFIRE_DELIVERY_ENABLED:'true'};
 const direct=()=>assert.fail('financial or direct request');
 assert.equal(deliveryEnabled(e,'recargas-america'),false);assert.equal(deliveryEnabled(e,'sixofire'),true);
 await assert.rejects(validateRecargasAccount(e,1,'123456789',direct),/PRIVATE_READ_ONLY/);
 const plan={provider:'recargas-america',packs:[],playerId:'123456789'};
 await assert.rejects(submitDelivery(e,plan,'123456789','ref',direct),/DELIVERY_DISABLED/);
 await assert.rejects(lookupDelivery(e,plan,'123456789','ref',direct),/PRIVATE_READ_ONLY/);
 const provider=raProvider(e,plan,direct);assert.equal(provider.enabled,false);
 await assert.rejects(provider.submit({}),/PRIVATE_READ_ONLY/);await assert.rejects(provider.lookup({}),/PRIVATE_READ_ONLY/);
});
test('private mode preserves market gift-message and history without RA calls',async()=>{
 const e={...env(),DB:database()},root='https://test/api/admin/providers/market';
 for(const path of ['', '/gift-message']){const req=new Request(root+path);const result=await marketRoute(req,e,new URL(req.url),founder,reply);assert.equal(result.status,200);}
 const req=new Request(root+'/mapping',{method:'POST',body:JSON.stringify({provider:'recargas-america'})});assert.equal((await marketRoute(req,e,new URL(req.url),founder,reply)).status,403);
});
test('market refresh in private mode attempts only Sixofire and never the private financial bridge',async()=>{
 const e={...env(),DB:database(),SIXOFIRE_READ_ENABLED:'true',SIXOFIRE_API_KEY:'fixture',RA_READ_SERVICE:{fetch:()=>assert.fail('RA market read')}};
 const r=await refreshMarket(e,async url=>{assert.ok(!String(url).includes('recargasamerica'));throw Error('fixture unavailable');});
 assert.equal(r.errors.some(e=>e.provider==='recargas-america'),false);assert.deepEqual(r.inventory,[]);
});
