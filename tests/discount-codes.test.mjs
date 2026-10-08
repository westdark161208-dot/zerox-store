import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {couponRoute,retailDiscount,readCoupon,discountAmount} from '../cloudflare/coupons.mjs';
const owner={id:'owner',status:'active',isFounder:true},buyer={id:'buyer',status:'active'},reply=(b,s=200)=>Response.json(b,{status:s});
const call=(env,body,user=owner,key=crypto.randomUUID(),path='/api/admin/coupons')=>{const url=new URL('https://fixture'+path);return couponRoute(new Request(url,{method:body?'POST':'GET',headers:{'Idempotency-Key':key},...(body?{body:JSON.stringify(body)}:{})}),env,url,user,reply);};
test('founder creates one generated code per request, rejects invalid percentages and expiry',async()=>{
 const e={DB:database()},key=crypto.randomUUID(),body={percent:15,expiresAt:new Date(Date.now()+86400000).toISOString()};
 assert.equal((await call(e,body,buyer)).status,403);assert.equal((await call(e,null,buyer)).status,403);
 for(const patch of [{percent:0},{percent:100},{percent:1.5},{expiresAt:'invalid'},{expiresAt:'2020-01-01'}])assert.equal((await call(e,{...body,...patch})).status,400);
 const a=await(await call(e,body,owner,key)).json(),b=await(await call(e,body,owner,key)).json();assert.match(a.coupon.code,/^ZX-[A-F0-9]{12}$/);assert.equal(a.coupon.code,b.coupon.code);assert.equal((await call(e,{...body,percent:20},owner,key)).status,400);
 const pricing=await retailDiscount(e.DB,1999,a.coupon.code);assert.equal(pricing.discountCents,299);assert.equal(pricing.amountCents,1700);
 await assert.rejects(retailDiscount(e.DB,1999,a.coupon.code,'sf'),/RETAIL_ONLY/);
 await assert.rejects(readCoupon(e.DB,a.coupon.code,Date.parse(body.expiresAt)),/EXPIRED/);
 await call(e,{action:'disable',code:a.coupon.code});await assert.rejects(readCoupon(e.DB,a.coupon.code),/INVALID/);
});
test('server ignores invented discounts and rejects unknown codes without lowering amounts',async()=>{
 const e={DB:database()};assert.deepEqual(await retailDiscount(e.DB,3500,''),{subtotalCents:3500,discountCents:0,amountCents:3500,coupon:null});
 await assert.rejects(retailDiscount(e.DB,3500,'ZEROX5'),/INVALID/);assert.equal(discountAmount(1,99),0);assert.throws(()=>discountAmount(-1,10));assert.throws(()=>discountAmount(3500,100));
});
