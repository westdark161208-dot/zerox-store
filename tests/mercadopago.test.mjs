import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,webcrypto} from 'node:crypto';
import {validatePayment,validSignature,mpTestRoute} from '../cloudflare/payments/mercadopago-test.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const order={id:'test-order',amount_cents:1800,collector_id:'123'};
const payment={live_mode:false,external_reference:'test-order',transaction_amount:18,currency_id:'MXN',collector_id:123};
test('test evidence rejects real payments, wrong price, currency, seller or reference',()=>{
 assert.equal(validatePayment(payment,order),true);
 for(const patch of [{live_mode:true},{transaction_amount:17},{currency_id:'USD'},{collector_id:999},{external_reference:'another'}])assert.equal(validatePayment({...payment,...patch},order),false);
});
test('webhook signature binds payment id and request id',async()=>{
 const url=new URL('https://test/?data.id=123');
 const sig=createHmac('sha256','secret').update('id:123;request-id:request;ts:1704908010;').digest('hex');
 const req=new Request(url,{headers:{'x-request-id':'request','x-signature':'ts=1704908010,v1='+sig}});
 assert.equal(await validSignature(req,url,'secret'),true);
 assert.equal(await validSignature(req,new URL('https://test/?data.id=124'),'secret'),false);
 assert.equal(await validSignature(req,url,'other'),false);
 assert.equal(await validSignature(req,url,''),false);
});
test('non-founder cannot create a checkout or read configuration',async()=>{
 const url=new URL('https://test/api/payments/mercadopago/test/checkout');
 const r=await mpTestRoute(new Request(url,{method:'POST'}),{},url,{isFounder:false},(body,status)=>({body,status}));
 assert.equal(r.status,403);
});

test('test checkout method preferences are bounded and never supplied as raw client options',async()=>{
 const {checkoutMethods}=await import('../cloudflare/payments/mercadopago-test.mjs');
 assert.deepEqual(checkoutMethods('all'),{});
 assert.equal(checkoutMethods('oxxo').default_payment_method_id,'oxxo');
 assert.equal(checkoutMethods('spei').default_payment_method_id,'clabe');
 assert(checkoutMethods('card').excluded_payment_types.some(i=>i.id==='bank_transfer'));
 assert.throws(()=>checkoutMethods('untrusted'),/INVALID_PAYMENT_METHOD/);
});
