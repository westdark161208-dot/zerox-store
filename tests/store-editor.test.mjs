import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {editorRoute,publishedProduct,validateEdit} from '../cloudflare/editor/catalog.mjs';
const founder={id:'owner',status:'active',isFounder:true};
const product={id:'zx-diamonds-110',name:'Paquete Subaru',character:'Subaru',priceCents:1900,description:'Texto',image:'assets/diamonds/collection-v2/110.webp',active:true};
function call(db,path,body,user=founder){const request=new Request('https://test'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});return editorRoute(request,{DB:db},new URL(request.url),user,(data,status=200)=>({data,status}));}
test('drafts private; unauthorized edits rejected; publish applies authoritative cents and audit',async()=>{const db=database();assert.equal((await call(db,'/api/admin/store-editor',null,null)).status,403);assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:0,product},null)).status,403);assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:0,product})).status,200);assert.deepEqual((await call(db,'/api/store-editor/catalog',null,null)).data.products,{});assert.equal((await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true})).status,200);assert.equal((await publishedProduct(db,{id:product.id,salePriceCents:1800})).salePriceCents,1900);assert.equal(db.sql.prepare('SELECT actor FROM zx_store_editor_history').get().actor,'owner');});
test('stale revisions cannot overwrite a saved draft or publish stale prices',async()=>{const db=database();await call(db,'/api/admin/store-editor/draft',{revision:0,product});assert.equal((await call(db,'/api/admin/store-editor/draft',{revision:0,product:{...product,priceCents:1}})).status,409);assert.equal((await call(db,'/api/admin/store-editor/publish',{revision:0,confirm:true})).status,409);});
test('invalid product, external images and noninteger cents rejected; disabled product cannot checkout',async()=>{assert.equal(validateEdit({...product,image:'javascript:alert(1)'}),null);assert.equal(validateEdit({...product,id:'unknown'}),null);assert.equal(validateEdit({...product,priceCents:1.5}),null);const db=database();await call(db,'/api/admin/store-editor/draft',{revision:0,product:{...product,active:false}});await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});assert.equal(await publishedProduct(db,{id:product.id}),null);});
test('new orders use published prices, existing order retries retain their original snapshot',async()=>{
 const {readFileSync}=await import('node:fs');const {createOrder}=await import('../cloudflare/diamonds/engine.mjs');const db=database();db.sql.exec(readFileSync(new URL('../cloudflare/diamonds/schema.sql',import.meta.url),'utf8'));
 const order={userId:'owner',requestKey:'editor_order_12345678',productId:product.id,playerId:'123456789'};
 const old=await createOrder(db,order);assert.equal(old.sale_price_cents,1800);
 await call(db,'/api/admin/store-editor/draft',{revision:0,product});await call(db,'/api/admin/store-editor/publish',{revision:1,confirm:true});
 assert.equal((await createOrder(db,order)).sale_price_cents,1800);assert.equal((await createOrder(db,{...order,requestKey:'editor_order_87654321'})).sale_price_cents,1900);
});
