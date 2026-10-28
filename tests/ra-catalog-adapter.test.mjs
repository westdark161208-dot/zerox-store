import test from 'node:test';
import assert from 'node:assert/strict';
import {Journal} from '../oracle/ra-purchase/store.mjs';
import {createCatalogAdapter} from '../oracle/ra-catalog/adapter.mjs';
const plan={productId:1,sku:'FF100',name:'Free Fire 100',type:'recharge',quantity:1,maxPriceUsd:1.15,fields:{player_id:'1234567'}};
const ok=data=>({httpStatus:200,body:{success:true,data}});
function fixture(buy){const store=new Journal(':memory:');let purchases=0;const api=createCatalogAdapter({store,upstream:async(path,method,body)=>{
 if(path==='/products/catalog')return ok([{id:1,sku:plan.sku,name:plan.name,type:'recharge',price:1.15,required_fields:['player_id']}]);
 if(path==='/catalog/validate')return ok({supported:false});
 if(path==='/wallet')return ok({currency:'USD',balance:10});
 if(path==='/buy/catalog'){purchases++;assert.deepEqual(body,{product_id:1,quantity:1,player_id:'1234567'});return buy();}
 if(path.startsWith('/catalog/orders/'))return ok({order_id:'RA-1',product:plan.name,status:'COMPLETED',needs_review:false,delivery:[]});
 throw Error('UNEXPECTED');}});return {api,store,get purchases(){return purchases;}};}
test('RA concurrent replay buys once and polls asynchronous completion',async()=>{const f=fixture(()=>ok({order_id:'RA-1',item:plan.name,amount_charged:1.15,status:'PROCESSING_PROVIDER'}));try{const id=crypto.randomUUID();await Promise.all([f.api.submit(id,plan),f.api.submit(id,plan)]);assert.equal(f.purchases,1);assert.equal((await f.api.lookup(id,plan)).state,'COMPLETED');assert.equal((await f.api.submit(id,plan)).state,'COMPLETED');assert.equal(f.purchases,1);await assert.rejects(f.api.submit(id,{...plan,fields:{player_id:'7654321'}}),/CONFLICT/);}finally{f.store.close();}});
test('RA 502 preserves order reference; timeout never automatically resubmits',async()=>{for(const buy of [()=>({httpStatus:502,body:{success:false,data:{order_id:'RA-1',needs_review:true}}}),()=>{throw Error('TIMEOUT');}]){const f=fixture(buy);try{const id=crypto.randomUUID(),r=await f.api.submit(id,plan);assert.equal(r.state,'REQUIRES_REVIEW');await f.api.submit(id,plan);assert.equal(f.purchases,1);if(r.reference)assert.equal(r.reference,'RA-1');}finally{f.store.close();}}});
test('RA recharge quantities above one rejected before provider call',async()=>{const f=fixture(()=>{throw Error();});try{await assert.rejects(f.api.submit(crypto.randomUUID(),{...plan,quantity:2}),/INVALID_PLAN/);assert.equal(f.purchases,0);}finally{f.store.close();}});
import {normalize} from '../oracle/ra-catalog/adapter.mjs';
test('completion requires correct identity, price, state and type-specific delivery',()=>{const data={order_id:'RA-1',item:plan.name,amount_charged:1.15,status:'COMPLETED',delivery:[]};assert.equal(normalize(ok(data),plan,'submit').state,'COMPLETED');for(const edit of [{item:'Other'},{amount_charged:2},{needs_review:true},{status:'PARTIAL'},{status:'REFUNDED'},{delivery:[{key:'wrong'}]}])assert.equal(normalize(ok({...data,...edit}),plan,'submit').state,'REQUIRES_REVIEW');const pin={...plan,type:'pin'};assert.equal(normalize(ok(data),pin,'submit').state,'REQUIRES_REVIEW');assert.deepEqual(normalize(ok({...data,delivery:[{key:'CODE',serial:'SERIAL',internal:'PRIVATE'}]}),pin,'submit').delivery,[{key:'CODE',serial:'SERIAL'}]);});
