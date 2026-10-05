import test from 'node:test';import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';import {readinessRoute} from '../cloudflare/providers/readiness.mjs';
const url=new URL('https://fixture/api/admin/providers/recargas-america/readiness'),owner={isFounder:true,status:'active'},reply=(body,status=200)=>({body,status});
const mapping={'110':{productId:1,sku:'ADS',name:'100+10',baseDiamonds:100,bonusDiamonds:10,regions:['US'],bonusEvidence:'fixture',playerField:'manual_id'}};
const env=()=>({DB:database(),RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'fixture',FF_INFO_API_KEY:'fixture',RA_DIAMOND_PACKS:JSON.stringify(mapping)});
const req=()=>new Request(url,{method:'POST',body:JSON.stringify({uid:'1136210821',productId:'zx-diamonds-110',price:0,paid:true})});
function upstream(balance=10){return async(endpoint,options)=>{
 assert(!endpoint.includes('/buy/')&&!endpoint.includes('mercadopago'));
 if(endpoint.includes('freefirecommunity'))return Response.json({basicInfo:{accountId:'1136210821',nickname:'Fixture',region:'US'}});
 if(endpoint.endsWith('/products/catalog')){assert.equal(options.method,'GET');return Response.json({success:true,data:[{id:1,sku:'ADS',name:'100+10',price:1,type:'recharge',required_fields:['manual_id']}]});}
 if(endpoint.endsWith('/wallet')){assert.equal(options.method,'GET');return Response.json({success:true,data:{balance,currency:'USD'}});}
 assert(endpoint.endsWith('/catalog/validate'));assert.equal(options.method,'POST');return Response.json({success:true,data:{supported:true,status:true,account_name:'Fixture'}});
};}
test('creator diagnostics work while delivery is paused and cannot charge, create orders or debit',async()=>{
 const e=env(),r=await readinessRoute(req(),e,url,owner,reply,upstream());assert.equal(r.status,200);assert.equal(r.body.ready,false);assert.equal(r.body.canAfford,true);assert.equal(r.body.purchasesPerformed,0);assert.equal(r.body.amountCents,1800);assert.equal(r.body.packs[0].playerField,'manual_id');assert(r.body.reasons.includes('DELIVERY_DISABLED'));
 for(const table of ['zx_diamond_orders','zx_product_payments','zx_wallet_ledger'])assert.equal(await e.DB.prepare("SELECT name FROM sqlite_master WHERE name=?").bind(table).first(),null);
 const low=await readinessRoute(req(),env(),url,owner,reply,upstream(0));assert(low.body.reasons.includes('RA_INSUFFICIENT_FUNDS'));assert.equal(low.body.totalMicros,1000000);
});
test('diagnostics reject unauthorized users before database/upstream and verify actual region',async()=>{
 for(const user of [null,{status:'active'},{isFounder:true,status:'disabled'}]){const r=await readinessRoute(req(),{DB:{prepare(){throw Error('must not read')}}},url,user,reply,()=>{throw Error('must not fetch')});assert.equal(r.status,403);}
 const e=env(),base=upstream();const r=await readinessRoute(req(),e,url,owner,reply,async(endpoint,opts)=>endpoint.includes('freefirecommunity')?Response.json({basicInfo:{accountId:'1136210821',nickname:'Fixture',region:'BR'}}):base(endpoint,opts));assert.equal(r.body.error,'RA_REGION_UNAVAILABLE');
});
