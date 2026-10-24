import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exactPlan,decimalUnits} from '../cloudflare/diamonds/catalog.mjs';
import {smartQuote,smartMapping,smartRecipeRoute} from '../cloudflare/editor/smart-recipes.mjs';
import {editorRoute,validateEdit} from '../cloudflare/editor/catalog.mjs';
import {database} from './helpers/d1.mjs';
const founder={id:'owner',status:'active',isFounder:true};
const combo={id:'smart:diamonds:12345678-1234-1234-1234-123456789abc',name:'Combo prueba',description:'',character:'',image:'',priceCents:5000,active:true,visible:true,available:true,diamonds:220,regions:['US'],minMarginBps:1000};
const entry={productId:1,sku:'verified-110',name:'Free Fire US 100 + 10% diamonds',baseDiamonds:100,bonusDiamonds:10,regions:['US'],playerField:'player_id',bonusEvidence:'Explicit verified catalog bonus'};
const item={id:1,sku:entry.sku,name:entry.name,type:'recharge',price:'0.123456',requiredFields:['player_id']};
const map={110:entry},policy={feesVerified:true,feePerOperationUSD:'0.000001',feeBps:100,usdMxn:'16.99'};
const reply=(data,status=200)=>({data,status});
function call(db,path,body,user=founder){const r=new Request('https://test'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});return editorRoute(r,{DB:db},new URL(r.url),user,reply);}
function pack(key,diamonds,units,stock){return {key,diamonds,units:BigInt(units),...(stock===undefined?{}:{stock})};}
test('exact decimals, fees rounded upward per operation and FX use integer arithmetic',()=>{
 assert.equal(decimalUnits('0.100001'),100001n);assert.throws(()=>decimalUnits('0.1000001'));assert.throws(()=>decimalUnits('NaN'));
 const q=smartQuote(combo,[item],map,'US',policy);assert.equal(q.totalMicros,'249384');assert.equal(q.costMXNCents,424);assert.equal(q.marginCents,4576);
});
test('cost wins over operation count; count breaks equal-cost ties; fee changes optimum',()=>{
 const packs=[pack('a',2,1),pack('b',6,4)];assert.equal(exactPlan(packs,6).operationCount,3);
 packs[1].units=3n;assert.equal(exactPlan(packs,6).operationCount,1);
 packs[0].units=3n;packs[1].units=6n;assert.equal(exactPlan(packs,6).operationCount,1);
});
test('limits select higher cost feasible solution, budget and finite inventory are enforced',()=>{
 const p=[pack('a',2,1),pack('b',6,4)];assert.equal(exactPlan(p,6,{maxOperations:1}).totalUnits,4n);
 assert.throws(()=>exactPlan(p,6,{maxOperations:1,budgetUnits:3n}),/NO_EXACT/);
 assert.equal(exactPlan([pack('a',2,1,2),pack('b',6,4)],6).totalUnits,4n);
 assert.throws(()=>exactPlan([pack('a',2,1,2)],6),/NO_EXACT/);
});
test('stable deterministic ties do not depend on provider ordering',()=>{
 const p=[pack('a',2,1),pack('b',2,1)];assert.deepEqual(exactPlan(p,6),exactPlan(p.reverse(),6));
});
test('large exact quantity is not excluded by the previous 100930 ceiling',()=>{
 const q=exactPlan([pack('a',110,10),pack('b',6160,500)],1100000);assert.equal(q.packs.reduce((n,p)=>n+p.quantity*p.diamonds,0),1100000);
});
test('optimizer matches exhaustive oracle for bounded stock, budgets, operation limits and ties',()=>{
 for(let amount=1;amount<=35;amount++)for(let maxOperations=1;maxOperations<=7;maxOperations++){
  const p=[pack('a',3,4,3),pack('b',5,3,4),pack('c',7,6,3)];let best=null;
  for(let a=0;a<=3;a++)for(let b=0;b<=4;b++)for(let c=0;c<=3;c++){const ops=a+b+c,cost=BigInt(a*4+b*3+c*6);if(a*3+b*5+c*7===amount&&ops<=maxOperations&&cost<=25n&&(!best||cost<best.cost||cost===best.cost&&ops<best.ops))best={cost,ops};}
  if(!best)assert.throws(()=>exactPlan(p,amount,{maxOperations,budgetUnits:25n}),/NO_EXACT/);else{const q=exactPlan(p,amount,{maxOperations,budgetUnits:25n});assert.equal(q.totalUnits,best.cost);assert.equal(q.operationCount,best.ops);}
 }
});
test('regions, discontinuation, unverified bonuses and impossible totals fail closed',()=>{
 assert.equal(smartQuote(combo,[item],map,'BR',policy).status,'incompatible');
 assert.equal(smartQuote(combo,[],map,'US',policy).status,'incompatible');
 assert.equal(smartQuote(combo,[{...item,available:false}],map,'US',policy).status,'incompatible');
 assert.equal(smartQuote(combo,[item],{110:{...entry,bonusEvidence:''}},'US',policy).status,'incompatible');
 assert.equal(smartQuote({...combo,diamonds:111},[item],map,'US',policy).status,'no_exact_combination');
 assert.equal(smartQuote(combo,[item],{},'US',policy).status,'pending_association');
 assert.equal(smartQuote(combo,[item],map,'US',{}).reason,'FEES_UNVERIFIED');
});
test('new quote reflects price, fees, inventory, budget and margin; old quote remains immutable',()=>{
 const old=smartQuote(combo,[item],map,'US',policy);const before=JSON.stringify(old);
 const next=smartQuote(combo,[{...item,price:'1.00'}],map,'US',policy);assert.notEqual(next.totalMicros,old.totalMicros);assert.equal(JSON.stringify(old),before);
 assert.equal(smartQuote(combo,[item],map,'US',{...policy,maxOperations:1}).status,'no_exact_combination');
 assert.equal(smartQuote(combo,[item],map,'US',{...policy,stockByProduct:{1:1}}).status,'no_exact_combination');
 assert.equal(smartQuote(combo,[item],map,'US',{...policy,budgetUSD:'0.1'}).status,'no_exact_combination');
 assert.equal(smartQuote({...combo,priceCents:1},[item],map,'US',policy).marginAlert,true);
});
test('Editor creates, publishes, edits and unpublishes combos with revision protection',async()=>{
 const db=database();assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:0,product:combo},null)).status,403);
 assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:0,product:combo})).status,200);
 assert.deepEqual((await call(db,'/api/store-editor/catalog')).data.products,{});
 await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});
 assert.equal((await call(db,'/api/store-editor/catalog')).data.products[combo.id].diamonds,220);
 assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:1,product:combo})).status,409);
 await call(db,'/api/admin/store-editor/draft',{revision:2,product:{...combo,diamonds:330,visible:false,active:false}});
 await call(db,'/api/admin/store-editor/publish',{revision:3,confirm:true});
 assert.equal((await call(db,'/api/store-editor/catalog')).data.products[combo.id].active,false);
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM zx_store_editor_history').get().n,2);
 assert.equal(validateEdit({...combo,regions:[]}),null);assert.equal(validateEdit({...combo,diamonds:1.1}),null);
});
test('external mappings retain precedence over isolated D1 saved mappings',async()=>{
 const db=database();db.sql.exec('CREATE TABLE zx_ra_pack_associations(total INTEGER,entry_json TEXT)');db.sql.prepare('INSERT INTO zx_ra_pack_associations VALUES(?,?)').run(110,JSON.stringify({...entry,productId:2}));
 assert.equal((await smartMapping({DB:db,RA_DIAMOND_PACKS:JSON.stringify(map)}))[110].productId,1);
 assert.equal((await smartMapping({DB:db}))[110].productId,2);
});
test('fresh private administrative quotes are founder-only, read-only and never call purchases',async()=>{
 const db=database();await call(db,'/api/admin/store-editor/draft',{revision:0,product:combo});await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});let reads=0;
 const env={DB:db,RA_DIAMOND_PACKS:JSON.stringify(map),RA_SMART_RECIPE_POLICY:JSON.stringify(policy),RA_CATALOG_READ_ENABLED:'true',RA_CATALOG_READ_CONTRACT_VERIFIED:'true',RA_CATALOG_READ_TOKEN:'a'.repeat(64),RA_READ_SERVICE:{fetch:async(url,options)=>{assert.equal(options.method,'GET');assert.equal(new URL(url).pathname,'/admin/ra/catalog');reads++;return Response.json({ok:true,resource:'catalog',purchasesEnabled:false,productCount:1,invalidProducts:0,data:[item]});}}};
 const r=new Request('https://test/api/admin/store-editor/smart-recipes');assert.equal((await smartRecipeRoute(r,env,null,reply)).status,403);
 for(let n=0;n<2;n++){const q=await smartRecipeRoute(r,env,founder,reply);assert.equal(q.data.purchasesEnabled,false);assert.equal(q.data.products[0].quotes[0].status,'ready');}
 assert.equal(reads,2);assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE '%order%' OR name LIKE '%wallet%'").get().n,0);
});
test('smart combos cannot create or charge real orders, even when existing delivery flags are enabled',async()=>{
 const {getProduct}=await import('../cloudflare/diamonds/catalog.mjs');const {createOrder}=await import('../cloudflare/diamonds/engine.mjs');const {readFileSync}=await import('node:fs');const db=database();db.sql.exec(readFileSync(new URL('../cloudflare/diamonds/schema.sql',import.meta.url),'utf8'));
 assert.equal(getProduct(combo.id),undefined);await assert.rejects(createOrder(db,{userId:'owner',requestKey:'smart_test_12345678',productId:combo.id,playerId:'123456789'}));assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM zx_diamond_orders').get().n,0);
});
test('public diamond catalog includes visible combos with price but no costs or verified supplier references',async()=>{
 const {diamondRoute}=await import('../cloudflare/diamonds/routes.mjs');const db=database();await call(db,'/api/admin/store-editor/draft',{revision:0,product:combo});await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});
 const r=new Request('https://test/api/diamonds/catalog');let result=await diamondRoute(r,{DB:db},new URL(r.url),null,reply);let p=result.data.products.find(p=>p.id===combo.id);assert.equal(p.salePriceMXN,50);assert.equal(p.paymentsEnabled,false);assert.equal(p.packs,undefined);assert.equal(p.totalMicros,undefined);
 await call(db,'/api/admin/store-editor/draft',{revision:2,product:{...combo,visible:false}});await call(db,'/api/admin/store-editor/publish',{revision:3,confirm:true});result=await diamondRoute(r,{DB:db},new URL(r.url),null,reply);assert.equal(result.data.products.find(p=>p.id===combo.id),undefined);
});
test('publishing or disabling a combo does not change existing six base packages or historical snapshots',async()=>{
 const {catalog}=await import('../cloudflare/diamonds/catalog.mjs');const before=JSON.stringify(catalog);const {createOrder}=await import('../cloudflare/diamonds/engine.mjs');const {readFileSync}=await import('node:fs');const db=database();db.sql.exec(readFileSync(new URL('../cloudflare/diamonds/schema.sql',import.meta.url),'utf8'));
 const args={userId:'owner',requestKey:'history_smart_123456',productId:'zx-diamonds-110',playerId:'123456789'},old=await createOrder(db,args);
 await call(db,'/api/admin/store-editor/draft',{revision:0,product:combo});await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});
 await call(db,'/api/admin/store-editor/draft',{revision:2,product:{...combo,active:false}});await call(db,'/api/admin/store-editor/publish',{revision:3,confirm:true});
 assert.equal((await createOrder(db,args)).snapshot_json,old.snapshot_json);assert.equal(JSON.stringify(catalog),before);
});
test('regions are never mixed even when only their union could form an exact quantity',()=>{
 const other={...entry,productId:2,sku:'verified-341',name:'Free Fire BR 310 + 10% diamonds',baseDiamonds:310,bonusDiamonds:31,regions:['BR']};const second={...item,id:2,sku:other.sku,name:other.name};const p={...combo,diamonds:451,regions:['US','BR']};
 for(const region of p.regions)assert.equal(smartQuote(p,[item,second],{110:entry,341:other},region,policy).status,'no_exact_combination');
});
