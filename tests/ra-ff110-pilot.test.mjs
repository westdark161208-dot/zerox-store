import test from 'node:test';
import assert from 'node:assert/strict';
import {FF110_PRODUCT_ID, ff110PilotOnly, assertFf110PilotProduct, ff110PilotDeliveryAllowed} from '../cloudflare/diamonds/ff110-pilot.mjs';
import {getProduct} from '../cloudflare/diamonds/catalog.mjs';

const enabled={RA_FF110_PILOT_ONLY:'true'};
const disabled={RA_FF110_PILOT_ONLY:'false'};
const product=getProduct(FF110_PRODUCT_ID);
const order={product_id:FF110_PRODUCT_ID,diamonds:110};
const plan={provider:'recargas-america',currency:'USD',packs:[{diamonds:110,quantity:1,baseDiamonds:100,bonusDiamonds:10}]};

test('catalog identifies the authorized 110 diamond product exactly',()=>{
 assert.equal(product?.diamonds,110);
 assert.equal(product?.salePriceCents,1800);
 assert.equal(ff110PilotOnly(enabled),true);
 assert.equal(ff110PilotOnly({}),false);
});
test('only the real 110 product may enter new checkout during pilot',()=>{
 assert.doesNotThrow(()=>assertFf110PilotProduct(enabled,product));
 for(const bad of [null,{...product,id:'zx-diamonds-220'},{...product,diamonds:220},getProduct('zx-diamonds-341')]){
  assert.throws(()=>assertFf110PilotProduct(enabled,bad),/RA_FF110_PILOT_SCOPE/);
 }
 assert.doesNotThrow(()=>assertFf110PilotProduct(disabled,getProduct('zx-diamonds-341')));
});
test('existing unpaid/paid nonpilot orders cannot submit RA deliveries during pilot',()=>{
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,plan),true);
 assert.equal(ff110PilotDeliveryAllowed(enabled,{...order,diamonds:220},plan),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,{...order,product_id:'zx-diamonds-220'},plan),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,currency:'MXN'}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],bonusDiamonds:0}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],baseDiamonds:110}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],quantity:2}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[]}),false);
 assert.equal(ff110PilotDeliveryAllowed(disabled,{...order,product_id:'zx-diamonds-220'},plan),true);
});
