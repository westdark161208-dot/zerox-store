import test from 'node:test';import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {compareOffers,normalizeOffers,selectSupplier,variantMatches,marketRoute,refreshMarket} from '../cloudflare/providers/market.mjs';
const at=new Date().toISOString(),ra={provider:'recargas-america',productId:'4',name:'Pase Booyah Premium de Free fire',sku:'ADS004',priceMicros:2121000,currency:'USD',fulfillment:'uid',available:true,regions:['US']},six={...ra,provider:'sixofire',productId:'55',priceMicros:2000000};
const fees={'recargas-america':{percent:0,fixedMicros:0},sixofire:{percent:0,fixedMicros:200000}};
test('cheapest total includes configured fees; base-only comparisons do not authorize routing',()=>{
 const pending=compareOffers([ra,six]);assert.equal(pending.baseLeader,'sixofire');assert.equal(pending.selectedProvider,null);assert.equal(pending.comparisonComplete,false);
 const total=compareOffers([ra,six],fees,20);assert.equal(total.selectedProvider,'recargas-america');assert.equal(total.offers[0].costMxnCents,4242);
 assert.equal(selectSupplier({...total,queriedAt:at},'US').provider,'recargas-america');
 for(const patch of [{queriedAt:'invalid'},{queriedAt:new Date(Date.now()-121000).toISOString()},{queriedAt:new Date(Date.now()+100000).toISOString()},{comparisonComplete:false}])assert.throws(()=>selectSupplier({...total,queriedAt:at,...patch},'US'));
 assert.throws(()=>selectSupplier({...total,queriedAt:at},'BR'),/REGION/);
});
test('PINs, wrong currencies and unavailable quotes cannot become suppliers',()=>{
 for(const patch of [{fulfillment:'pin'},{available:false},{currency:'MXN'}])assert.equal(compareOffers([{...ra,...patch}],fees).selectedProvider,null);
 const pin=normalizeOffers('recargas-america',[{id:14,sku:'ADS014',name:'Pin Free Fire 1060 +10%',type:'pin',price:6.588,requiredFields:[]}])[0];assert.equal(pin.fulfillment,'pin');
});
test('normal/premium and membership variants cannot be mixed by creator association',()=>{
 assert.equal(variantMatches('booyah-premium',ra),true);assert.equal(variantMatches('booyah-normal',ra),false);
 assert.equal(variantMatches('weekly-basic',{name:'Tarjeta Semanal Básica de Free Fire'}),true);assert.equal(variantMatches('weekly',{name:'Tarjeta Semanal Básica de Free Fire'}),false);
 assert.equal(variantMatches('monthly',{name:'Tarjeta Semanal de Free Fire'}),false);
 assert.equal(variantMatches('level-up-6',{name:'Paquete Aumento Nivel 6',itemType:'LEVEL_UP_PACKAGE'}),true);
 assert.equal(variantMatches('level-up-10',{name:'Paquete Aumento Nivel 6',itemType:'LEVEL_UP_PACKAGE'}),false);
});
const reply=(body,status=200)=>({body,status}),owner={isFounder:true,status:'active'},root='https://fixture/api/admin/providers/market';
const route=(env,path,method='GET',body=null,user=owner,fetcher)=>{const url=new URL(root+path);return marketRoute(new Request(url,{method,body:body?JSON.stringify(body):null}),env,url,user,reply,fetcher);};
test('market is private, rejects PIN mapping and never sends financial POSTs',async()=>{
 let calls=0;const fetcher=async(url,opts)=>{calls++;assert.equal(opts.method,'GET');return Response.json({success:true,data:[{id:14,sku:'ADS014',name:'Pin',type:'pin',price:6,required_fields:[]}]});};
 const env={DB:database(),RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'fixture'};
 for(const user of [null,{status:'active'},{isFounder:true,status:'disabled'}])assert.equal((await route(env,'/refresh','POST',null,user,fetcher)).status,403);
 assert.equal(calls,0);assert.equal((await route(env,'/mapping','POST',{productKey:'booyah-premium',provider:'recargas-america',productId:'14',regions:['US']},owner,fetcher)).body.error,'UID_PRODUCT_REQUIRED');
 assert.equal(await env.DB.prepare("SELECT name FROM sqlite_master WHERE name='zx_market_settings'").first(),null);
});
test('live private quotes persist observed history; partial provider failure never authorizes supplier selection',async()=>{
 const env={DB:database(),RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'fixture',SIXOFIRE_API_KEY:'fixture'};
 const fetcher=async(url,opts)=>{assert.equal(opts.method,'GET');if(url.includes('sixofire'))throw Error('SECRET');return Response.json({success:true,data:[{id:4,sku:'ADS004',name:ra.name,type:'recharge',price:2.121,required_fields:['player_id']}]});};
 const result=await refreshMarket(env,fetcher);assert.equal(result.groups.length,1);assert.equal(result.groups[0].comparisonComplete,false);assert.equal(result.groups[0].selectedProvider,null);assert(!JSON.stringify(result).includes('SECRET'));
 await refreshMarket(env,fetcher);const history=await route(env,'');assert.equal(history.body.history.length,2);assert.equal(history.body.data.currency,'USD');
});
