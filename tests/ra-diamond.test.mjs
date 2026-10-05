import test from 'node:test';
import assert from 'node:assert/strict';
import {raMapping,validateRaPlan,raProvider,raPreflight} from '../cloudflare/diamonds/recargas-america.mjs';
import {serviceCatalog,readLevelUp} from '../cloudflare/providers/sixofire-services.mjs';
const mapping={'572':{productId:1,sku:'FF520',name:'Free Fire 520 + bonus',baseDiamonds:520,bonusDiamonds:52,regions:['US'],bonusEvidence:'supplier-confirmed contract fixture'}};
const env={RA_READ_ENABLED:'true',RA_DELIVERY_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'fixture',RA_DIAMOND_PACKS:JSON.stringify(mapping)};
const item={id:1,sku:'FF520',name:'Free Fire 520 + bonus',type:'recharge',price:'5',requiredFields:['player_id']},recipe=[{diamonds:572,quantity:2}];
const plan={provider:'recargas-america',version:1,region:'US',playerId:'1136210821',currency:'USD',packs:validateRaPlan([item],recipe,mapping,'US')};
const response=(data,status=200)=>Response.json(data,{status});
const fetcher=async(url)=>url.endsWith('/wallet')?response({success:true,data:{balance:10,currency:'USD'}}):url.endsWith('/products/catalog')?response({success:true,data:[{...item,required_fields:item.requiredFields}]}):response({success:true,data:{supported:false}});
test('520 + 52 = 572: exact supplier identity, explicit bonus evidence and regions required',()=>{
 assert.equal(raMapping(env)['572'].baseDiamonds,520);assert.equal(plan.packs[0].diamonds,572);
 for(const p of [{bonusDiamonds:0},{baseDiamonds:572},{bonusEvidence:''},{productId:'1'},{regions:[]}])assert.throws(()=>raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify({'572':{...mapping['572'],...p}})}));
 for(const p of [{type:'pin'},{sku:'wrong'},{name:'wrong'},{requiredFields:['player_id','zone_id']}])assert.throws(()=>validateRaPlan([{...item,...p}],recipe,mapping,'US'));
 assert.throws(()=>validateRaPlan([item],recipe,mapping,'BR'));
});
test('preflight requires funds for every unit and verified USD contract; unsupported validation is not UID rejection',async()=>{
 assert.equal((await raPreflight(env,recipe,'US',plan.playerId,fetcher)).packs[0].quantity,2);
 await assert.rejects(raPreflight(env,recipe,'US',plan.playerId,async url=>url.endsWith('/wallet')?response({success:true,data:{balance:9,currency:'USD'}}):fetcher(url)),/INSUFFICIENT_FUNDS/);
 await assert.rejects(raPreflight(env,recipe,'US',plan.playerId,async url=>url.endsWith('/wallet')?response({success:true,data:{balance:999,currency:'MXN'}}):fetcher(url)),/CURRENCY/);
});
test('each recharge POST is quantity one; 409/502/timeout remain unknown, no leaked upstream receipt',async()=>{
 for(const mode of [200,409,502,'timeout']){
  let calls=0;const adapter=raProvider(env,plan,async(url,options)=>{if(!url.endsWith('/buy/catalog'))return fetcher(url);calls++;assert.deepEqual(JSON.parse(options.body),{product_id:1,quantity:1,player_id:plan.playerId});assert.equal(options.headers['Idempotency-Key'],'operation-1');assert.equal(options.redirect,'manual');if(mode==='timeout')throw Error('secret');return response({success:mode===200,data:{order_id:'RAAPI-1',status:'COMPLETED',amount_charged:5,item:item.name,delivery:[],api_key:'SECRET'},code:'DUPLICATE_REQUEST'},mode);});
  const result=await adapter.submit({sku:'1',playerId:plan.playerId,idempotencyKey:'operation-1'});assert.equal(result.status,mode===200?'SUCCESS':'UNKNOWN');assert.equal(calls,1);assert(!JSON.stringify(result).includes('SECRET'));
 }
});
test('lookup cannot follow URLs or count another reference/product/review as delivered',async()=>{
 let calls=0;const adapter=raProvider(env,plan,async()=>{calls++;return response({success:true,data:{order_id:'RAAPI-1',product:item.name,status:'COMPLETED',needs_review:true}});});
 assert.equal((await adapter.lookup({reference:'https://other.test',sku:'1',playerId:plan.playerId})).status,'UNKNOWN');assert.equal(calls,0);
 assert.equal((await adapter.lookup({reference:'RAAPI-1',sku:'1',playerId:plan.playerId})).status,'PROCESSING');
 assert.equal((await adapter.lookup({reference:'RAAPI-2',sku:'1',playerId:plan.playerId})).status,'UNKNOWN');
});
test('Sixofire services exclude diamond PIN/direct products; discovery never enables purchases',()=>{
 const rows=serviceCatalog([{id:1,name:'Fragmento',itemType:'GIFT',available:true,isActive:true},{id:2,name:'Diamantes fragmento',itemType:'DIAMONDS_DIRECT'},{id:3,name:'Aumento Nivel 6',itemType:'LEVEL_UP_PACKAGE'}],'{"1":"fragment","3":"level-up"}');
 assert.equal(rows.length,2);assert(rows.every(p=>p.configured&&p.purchasesEnabled===false));assert.throws(()=>serviceCatalog([],'{"1":"diamonds"}'));
});
test('level-up uses documented UID-only route and rejects identity mismatches',async()=>{
 const fixture={status:true,code:200,data:{uid:'1136210821',levelUpAvailable:true,availableItemIds:['4790'],packages:[{itemId:'4790',name:'Nivel 6'}],region:'US'}};
 assert.equal((await readLevelUp({SIXOFIRE_API_KEY:'fixture'},'1136210821',async(url,opts)=>{assert.equal(url,'https://api.sixofire.net/account/levelup/packages?uid=1136210821');assert.equal(opts.method,'GET');return response(fixture);})).packages[0].itemId,'4790');
 await assert.rejects(readLevelUp({SIXOFIRE_API_KEY:'fixture'},'1136210821',async()=>response({...fixture,data:{...fixture.data,uid:'999999999'}})),/FORMAT/);
});

test('manual_id is sent only from an explicit immutable mapping matching the live required field',async()=>{
 const map={'572':{...mapping['572'],playerField:'manual_id'}},manual={...item,requiredFields:['manual_id']};
 assert.throws(()=>validateRaPlan([manual],recipe,mapping,'US'),/MISMATCH/);
 assert.throws(()=>raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify({'572':{...map['572'],playerField:'untrusted'}})}),/INVALID/);
 const p={...plan,packs:validateRaPlan([manual],recipe,map,'US')};let posts=0;
 const adapter=raProvider(env,p,async(url,opts)=>{if(url.endsWith('/products/catalog'))return response({success:true,data:[{...manual,required_fields:['manual_id']}]});if(!url.endsWith('/buy/catalog'))return fetcher(url);posts++;assert.deepEqual(JSON.parse(opts.body),{product_id:1,quantity:1,manual_id:p.playerId});return response({success:true,data:{order_id:'RAAPI-M',status:'COMPLETED',amount_charged:5,item:item.name}});});
 assert.equal((await adapter.submit({sku:'1',playerId:p.playerId,idempotencyKey:'operation-manual'})).status,'SUCCESS');assert.equal(posts,1);
});
