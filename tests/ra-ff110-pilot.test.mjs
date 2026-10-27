import test from 'node:test';
import assert from 'node:assert/strict';
import {FF110_PRODUCT_ID, ff110PilotOnly, assertFf110PilotProduct, ff110PilotDeliveryAllowed, assertFf110PromotionPlan} from '../cloudflare/diamonds/ff110-pilot.mjs';
import {getProduct} from '../cloudflare/diamonds/catalog.mjs';
import {purchaseConfiguration} from '../cloudflare/diamonds/purchases.mjs';
import {raProvider} from '../cloudflare/diamonds/recargas-america.mjs';
import {deliveryEnabled} from '../cloudflare/services/delivery.mjs';
import {gameCatalog,gameDelivery} from '../cloudflare/services/games.mjs';
import {resolvedRaEnvironment} from '../cloudflare/providers/ra-associations.mjs';


const enabled={RA_FF110_PILOT_ONLY:'true'};
const disabled={RA_FF110_PILOT_ONLY:'false'};
const product=getProduct(FF110_PRODUCT_ID);
const order={product_id:FF110_PRODUCT_ID,diamonds:110};
const plan={provider:'recargas-america',currency:'USD',region:'US',packs:[{diamonds:110,quantity:1,baseDiamonds:100,bonusDiamonds:10}]};

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
 for(const region of ['BR',undefined])assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,region}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,{...order,diamonds:220},plan),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,{...order,product_id:'zx-diamonds-220'},plan),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,currency:'MXN'}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],bonusDiamonds:0}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],baseDiamonds:110}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[{...plan.packs[0],quantity:2}]}),false);
 assert.equal(ff110PilotDeliveryAllowed(enabled,order,{...plan,packs:[]}),false);
 assert.equal(ff110PilotDeliveryAllowed(disabled,{...order,product_id:'zx-diamonds-220'},plan),true);
});

test('pilot leaves Sixofire delivery enabled but blocks unrelated RA service purchases',async()=>{
 const env={RA_FF110_PILOT_ONLY:'true',RA_DELIVERY_ENABLED:'true',RA_CONTRACT_VERIFIED:'true',SIXOFIRE_DELIVERY_ENABLED:'true'};
 assert.equal(deliveryEnabled(env,'recargas-america'),false);
 assert.equal(deliveryEnabled(env,'sixofire'),true);
 const noNetwork=()=>{throw Error('unexpected supplier request');};
 // Missing private reader is an explicit catalogue error, not an empty inventory.
 await assert.rejects(gameCatalog(env,noNetwork),/RA_ADMIN_READ_DISABLED/);
 await assert.rejects(gameDelivery(env,'ra-game-1','12345678',null,noNetwork),/PRODUCT_NOT_AVAILABLE/);
});
test('pilot prevents automatic SKU association without a confirmed mapping',async()=>{
 const env={RA_FF110_PILOT_ONLY:'true',RA_AUTO_ASSOCIATE_US:'true'};
 const out=await resolvedRaEnvironment(env,()=>{throw Error('unexpected catalog fetch');});
 assert.equal(out,env);
});

test('promotions cannot bypass the FF110 pilot through an RA diamond bundle',()=>{
 assert.throws(()=>assertFf110PromotionPlan(enabled,{kind:'diamonds',quantity:110},null),/PROMOTION_RA_PILOT_BLOCKED/);
 assert.throws(()=>assertFf110PromotionPlan(enabled,{kind:'diamonds',quantity:110},'recargas-america'),/PROMOTION_RA_PILOT_BLOCKED/);
 assert.doesNotThrow(()=>assertFf110PromotionPlan(enabled,{kind:'diamonds',quantity:110},'sixofire'));
 assert.doesNotThrow(()=>assertFf110PromotionPlan(enabled,{kind:'booyah-normal'},null));
 assert.doesNotThrow(()=>assertFf110PromotionPlan(disabled,{kind:'diamonds',quantity:110},null));
});

test('real payment and legacy Oracle-bypassing supplier requests stay blocked until new transport is wired',async()=>{
 const env={RA_FF110_PILOT_ONLY:'true',RA_DELIVERY_ENABLED:'true',RA_READ_ENABLED:'true',
  RA_CONTRACT_VERIFIED:'true',DIAMOND_PRODUCTION_ENABLED:'true'};
 assert.equal(purchaseConfiguration(env).enabled,false);
 assert.ok(purchaseConfiguration(env).reasons.includes('RA_FF110_PURCHASE_TRANSPORT_PENDING'));
 const supplier=raProvider(env,{playerId:'123456789',packs:[{sku:'1',diamonds:110}]},()=>{
  throw Error('LEGACY_PROVIDER_NETWORK_MUST_NOT_BE_USED');
 });
 assert.equal(supplier.enabled,false);
 assert.deepEqual(await supplier.submit({sku:'1',playerId:'123456789',idempotencyKey:'idempotent-1'}),{status:'NOT_ACCEPTED'});
 assert.deepEqual(await supplier.lookup({sku:'1',playerId:'123456789',reference:'P-1'}),{status:'UNKNOWN'});
});
