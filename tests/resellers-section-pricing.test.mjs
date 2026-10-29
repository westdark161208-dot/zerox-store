import test from 'node:test';
import assert from 'node:assert/strict';
import {applySectionPricing,discountedCents} from '../cloudflare/resellers-pro/pricing.mjs';
test('section policy applies to future products, ignores historical seven-tier prices and canonicalizes diamonds',()=>{
 const overrides={__sectionDiscounts:{'Diamantes Ilimitados':10},a:{prices:[1,2,3,4,5,6,7]}};
 const products=applySectionPricing([{id:'a',category:'Diamantes',prices:[10000]},{id:'b',category:'diamantes ilimitados',prices:[20000]}],overrides);
 assert.deepEqual(products.map(p=>p.prices[0]),[9000,18000]);
 assert(products.every(p=>p.category==='Diamantes Ilimitados'));
 for(const discount of [NaN,100,-1,.001])assert.throws(()=>discountedCents(100,discount));
});
