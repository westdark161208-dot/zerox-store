import test from 'node:test';import assert from 'node:assert/strict';import {database} from './helpers/d1.mjs';
import {associationRoute,resolvedRaEnvironment,matchesDiamondPack} from '../cloudflare/providers/ra-associations.mjs';
import {readinessRoute} from '../cloudflare/providers/readiness.mjs';
const url=new URL('https://fixture/api/admin/providers/recargas-america/associations'),owner={id:'creator',isFounder:true,status:'active'},reply=(body,status=200)=>({body,status}),env=()=>({DB:database(),RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'SECRET',FF_INFO_API_KEY:'SECRET'});
const product={id:7,sku:'ADS007',name:'Recarga Free Fire - 520 Diamantes +10% Bono',type:'recharge',price:'3.38',requiredFields:['manual_id']};
const body={total:572,productId:7,revision:0,regions:['US'],bonusEvidence:'Supplier terms confirm 520+52 in US for ADS007',confirmed:true};
const request=(method='GET',data=body)=>new Request(url,{method,...(method==='POST'?{body:JSON.stringify(data)}:{})});
function fetcher(item=product){return async(endpoint,opts)=>{assert(endpoint==='https://panel.recargasamerica.com/api/v1/products/catalog');assert.equal(opts.method,'GET');assert.equal(opts.redirect,'manual');return Response.json({success:true,data:[{...item,required_fields:item.requiredFields}]});};}
test('creator associates live exact SKU and manual_id; saved mapping resolves without financial flags or orders',async()=>{
 const e=env(),read=await associationRoute(request(),e,url,owner,reply,fetcher());assert.equal(read.body.catalog.length,1);assert.equal(read.body.associations.find(p=>p.total===572).entry,null);
 const saved=await associationRoute(request('POST'),e,url,owner,reply,fetcher());assert.equal(saved.status,200);assert.equal(saved.body.entry.playerField,'manual_id');assert.equal(saved.body.purchasesEnabled,false);
 const resolved=await resolvedRaEnvironment(e),map=JSON.parse(resolved.RA_DIAMOND_PACKS);assert.equal(map['572'].productId,7);assert.equal(map['572'].bonusDiamonds,52);assert.equal(resolved.DIAMOND_PRODUCTION_ENABLED,undefined);assert.equal(resolved.RA_DELIVERY_ENABLED,undefined);
 for(const table of ['zx_product_payments','zx_diamond_orders','zx_wallet_ledger'])assert.equal(await e.DB.prepare('SELECT name FROM sqlite_master WHERE name=?').bind(table).first(),null);
 assert.equal((await e.DB.prepare('SELECT COUNT(*) AS n FROM zx_ra_pack_association_history').first()).n,1);assert(!JSON.stringify(saved).includes('SECRET'));
 // Readiness uses the persisted association, verifies real region, and still reports financial gates.
 const target=new URL('https://fixture/api/admin/providers/recargas-america/readiness');const r=await readinessRoute(new Request(target,{method:'POST',body:JSON.stringify({productId:'zx-diamonds-572',uid:'612418245'})}),e,target,owner,reply,async(endpoint,opts)=>{if(endpoint.includes('freefirecommunity'))return Response.json({basicInfo:{accountId:'612418245',nickname:'Fixture',region:'US'}});if(endpoint.endsWith('/wallet'))return Response.json({success:true,data:{balance:10,currency:'USD'}});if(endpoint.endsWith('/catalog/validate'))return Response.json({success:true,data:{supported:false}});return fetcher()(endpoint,opts);});
 assert.equal(r.status,200);assert.equal(r.body.totalMicros,3380000);assert.equal(r.body.ready,false);assert(!r.body.reasons.includes('RA_MAPPING_MISSING'));
});
test('PIN, services, wrong amount, missing bonus and extra required fields cannot be associated',async()=>{
 for(const patch of [{type:'pin'},{name:'Tarjeta Semanal de Free Fire'},{name:'Recarga 100 Diamantes +10% Bono'},{name:'Recarga 520 Diamantes'},{requiredFields:['manual_id','zone_id']}]){const e=env();assert.equal((await associationRoute(request('POST'),e,url,owner,reply,fetcher({...product,...patch}))).body.error,'RA_DIAMOND_PRODUCT_REQUIRED');assert.equal(await e.DB.prepare("SELECT name FROM sqlite_master WHERE name='zx_ra_pack_associations'").first(),null);}
 assert(matchesDiamondPack({...product,name:'Recarga Free Fire 1.060 Diamantes +10% Bono'},1060));
 for(const patch of [{confirmed:false},{regions:[]},{regions:['https://evil.test']},{bonusEvidence:''},{total:520}])assert.equal((await associationRoute(request('POST',{...body,...patch}),env(),url,owner,reply,fetcher())).status,400);
});
test('stale/concurrent changes cannot overwrite the latest mapping and each revision is audited once',async()=>{
 const e=env();const result=await Promise.all([associationRoute(request('POST'),e,url,owner,reply,fetcher()),associationRoute(request('POST'),e,url,owner,reply,fetcher())]);assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);
 assert.equal((await e.DB.prepare('SELECT COUNT(*) AS n FROM zx_ra_pack_association_history').first()).n,1);
 const changed=await associationRoute(request('POST',{...body,revision:1,regions:['US','SAC']}),e,url,owner,reply,fetcher());assert.equal(changed.body.revision,2);
 assert.equal((await associationRoute(request('POST'),e,url,owner,reply,fetcher())).status,409);
 assert.deepEqual(JSON.parse((await e.DB.prepare('SELECT entry_json FROM zx_ra_pack_associations').first()).entry_json).regions,['US','SAC']);
});
test('failed audit transaction rolls back association; Cloudflare mappings remain authoritative; unauthorized calls do nothing',async()=>{
 const e=env();await associationRoute(request('POST'),e,url,owner,reply,fetcher());e.DB.sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON zx_ra_pack_association_history BEGIN SELECT RAISE(ABORT,'fixture'); END");assert.equal((await associationRoute(request('POST',{...body,revision:1,regions:['BR']}),e,url,owner,reply,fetcher())).status,503);assert.equal((await e.DB.prepare('SELECT revision FROM zx_ra_pack_associations').first()).revision,1);
 const external={...e,RA_DIAMOND_PACKS:JSON.stringify({'572':{productId:99,sku:'OLD',name:'Verified old',baseDiamonds:520,bonusDiamonds:52,regions:['BR'],bonusEvidence:'External contract verified'}})};
 assert.equal((await resolvedRaEnvironment(external)).RA_DIAMOND_PACKS,external.RA_DIAMOND_PACKS);assert.equal((await associationRoute(request('POST'),external,url,owner,reply,fetcher())).body.error,'RA_MAPPING_MANAGED_EXTERNALLY');
 for(const user of [null,{id:'other',status:'active'},{...owner,status:'disabled'}])assert.equal((await associationRoute(request('POST'),{DB:{prepare(){throw Error('must not read')}}},url,user,reply,()=>{throw Error('must not fetch')})).status,403);
});

test('missing association reports verified player region without authorizing or executing a purchase',async()=>{
 const e=env(),target=new URL('https://fixture/api/admin/providers/recargas-america/readiness');
 const r=await readinessRoute(new Request(target,{method:'POST',body:JSON.stringify({productId:'zx-diamonds-110',uid:'612418245'})}),e,target,owner,reply,async(endpoint,opts)=>{if(endpoint.includes('freefirecommunity'))return Response.json({basicInfo:{accountId:'612418245',nickname:'Fixture',region:'US'}});if(endpoint.endsWith('/wallet'))return Response.json({success:true,data:{balance:10,currency:'USD'}});return fetcher()(endpoint,opts);});
 assert.equal(r.body.error,'RA_MAPPING_MISSING');assert.equal(r.body.region,'US');assert.equal(await e.DB.prepare("SELECT name FROM sqlite_master WHERE name='zx_diamond_orders'").first(),null);
});

test('owner-confirmed US automatic association uses unique live exact recharge references only',async()=>{
 const {automaticUsMapping}=await import('../cloudflare/providers/ra-associations.mjs');
 const e={...env(),RA_AUTO_ASSOCIATE_US:'true'},item={...product,id:5,sku:'ADS005',name:'Recarga Free Fire - 100 Diamantes +10% Bono'};
 assert.deepEqual(automaticUsMapping(env(),[item]),{});
 const resolved=await resolvedRaEnvironment(e,fetcher(item)),map=JSON.parse(resolved.RA_DIAMOND_PACKS);
 assert.equal(map['110'].productId,5);assert.deepEqual(map['110'].regions,['US']);assert.equal(map['110'].bonusDiamonds,10);
 for(const items of [[{...item,type:'pin'}],[{...item,name:'Free Fire 100 Diamantes'}],[item,{...item,id:55,sku:'ALT'}],[item,item]])assert.deepEqual(automaticUsMapping(e,items),{});
 const d=await associationRoute(request(),e,url,owner,reply,fetcher(item));assert.equal(d.body.associations[0].entry.productId,5);
 await associationRoute(request('POST',{...body,regions:['BR']}),e,url,owner,reply,fetcher());
 const overridden=JSON.parse((await resolvedRaEnvironment(e,fetcher())).RA_DIAMOND_PACKS);assert.deepEqual(overridden['572'].regions,['BR']);
 const unavailable=await resolvedRaEnvironment({...env(),RA_AUTO_ASSOCIATE_US:'true'},async()=>{throw Error('offline')});assert.equal(unavailable.RA_DIAMOND_PACKS,undefined);
});
