import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import '../retail-pricing.js';
const {priceCents}=globalThis.ZXRetailPricing;
test('published totals cover processing reference and VAT with cent rounding, never per fragment',()=>{
 assert.equal(priceCents(3500),4132);
 assert.equal(priceCents(1800),2360);
 assert.equal(priceCents(7000),7779);
 assert.equal(priceCents(0),0);
 for(const base of [1,350,3500,4000,7000,65000,100000000]){
  const total=priceCents(base),net=total-(total*.0349+400)*1.16;
  assert.ok(net>=base-1e-7);assert.ok(net-base<1);
 }
 assert.ok(priceCents(350*7)<priceCents(350)*7);
 for(const n of [-1,1.5,NaN,Infinity,100000001])assert.throws(()=>priceCents(n));
});
test('cart and checkout price a whole quantity once without mutating editable base prices',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const selection=app.slice(app.indexOf('function selectedProduct('),app.indexOf('function productSelection('));
 const products=[{id:'pass',price:35},{id:'box',price:3.5,minQuantity:7,maxQuantity:100}];
 const c=vm.createContext({PRODUCTS:products,ZXRetailPricing:globalThis.ZXRetailPricing});vm.runInContext(selection,c);
 assert.equal(c.selectedProduct('pass').price,41.32);
 assert.equal(c.selectedProduct('pass').price,41.32);
 assert.equal(c.selectedProduct('box::7').price,priceCents(2450)/100);
 assert.equal(c.selectedProduct('box::6'),null);
 assert.equal(products[0].price,35);assert.equal(products[1].price,3.5);
});
