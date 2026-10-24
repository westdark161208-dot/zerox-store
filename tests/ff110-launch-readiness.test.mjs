// Offline evidence replay: these identities are not a live catalog fetch or purchase.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRaPlan} from '../cloudflare/diamonds/recargas-america.mjs';
import {purchaseConfiguration} from '../cloudflare/diamonds/purchases.mjs';
const name='Recarga Free Fire - 100 Diamantes + 10% Bono';
const item={id:5,sku:'ADS005',name,type:'recharge',price:'0.67',requiredFields:['player_id']};
const map={110:{productId:5,sku:'ADS005',name,baseDiamonds:100,bonusDiamonds:10,regions:['US'],playerField:'player_id',bonusEvidence:'Historical authenticated catalog; offline replay only'}};
test('documented ADS005 contract accepts exact mapping; pin, wrong field, region and identity fail',()=>{
 const plan=()=>validateRaPlan([item],[{diamonds:110,quantity:1}],map,'US');
 assert.equal(plan()[0].productId,5);assert.equal(plan()[0].catalogSku,'ADS005');
 for(const patch of [{type:'pin'},{id:11},{sku:'ADS011'},{requiredFields:['manual_id']},{name:name+' changed'}])assert.throws(()=>validateRaPlan([{...item,...patch}],[{diamonds:110,quantity:1}],map,'US'));
 assert.throws(()=>validateRaPlan([item],[{diamonds:110,quantity:1}],map,'BR'));
});
test('complete isolated wallet readiness does not require Mercado Pago; legacy flag conflicts close transport',()=>{
 const env={RA_FF110_PILOT_ONLY:'true',RA_FF110_PURCHASE_ENABLED:'true',RA_FF110_CONTRACT_VERIFIED:'true',RA_FF110_PRODUCT_VERIFIED:'true',RA_ADMIN_READ_ENABLED:'true',RA_ADMIN_READ_TRANSPORT:'service-binding',RA_ADMIN_READ_CONTRACT_VERIFIED:'true',RA_READ_ADMIN_TOKEN:'a'.repeat(64),RA_PURCHASE_SERVICE_TOKEN:'b'.repeat(64),RA_READ_SERVICE:{fetch(){}},RA_PURCHASE_SERVICE:{fetch(){}},RA_DELIVERY_ENABLED:'false',RA_CONTRACT_VERIFIED:'false',DIAMOND_PRODUCTION_ENABLED:'false',FF_INFO_API_KEY:'fixture-only',RA_DIAMOND_PACKS:JSON.stringify(map)};
 assert.deepEqual(purchaseConfiguration(env).reasons,['PRODUCTION_PAYMENT_CONFIG_MISSING']);
 for(const key of ['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED'])assert.ok(purchaseConfiguration({...env,[key]:'true'}).reasons.includes('RA_FF110_PURCHASE_TRANSPORT_PENDING'));
 for(const key of ['RA_READ_SERVICE','RA_PURCHASE_SERVICE','RA_READ_ADMIN_TOKEN','RA_PURCHASE_SERVICE_TOKEN'])assert.ok(purchaseConfiguration({...env,[key]:undefined}).reasons.includes('RA_FF110_PURCHASE_TRANSPORT_PENDING'));
});
test('committed release manifests are not an enabled FF110 private release',()=>{
 const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
 const production=read('cloudflare/wrangler.jsonc'),review=read('cloudflare/preprod/wrangler.jsonc'),bridge=read('cloudflare/ra-purchase/wrangler.jsonc');
 assert.equal(production.services?.some(s=>s.binding==='RA_PURCHASE_SERVICE')||false,false);
 assert.equal(review.services.some(s=>s.binding==='RA_PURCHASE_SERVICE'),false);
 assert.equal(bridge.vars.RA_FF110_BRIDGE_ENABLED,'false');assert.equal(bridge.workers_dev,false);assert.equal(bridge.preview_urls,false);
});
