import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {productPricing} from '../cloudflare/payments/product-pricing-v3.mjs';
test('member discount takes the largest matching rule and isolates accounts',async()=>{
 const DB=database();
 DB.sql.exec('CREATE TABLE zx_member_perks(user_id TEXT PRIMARY KEY,rules TEXT)');
 await DB.prepare('INSERT INTO zx_member_perks VALUES(?,?)').bind('one',JSON.stringify([{scope:'freefire',percent:10},{scope:'product',key:'sku',percent:20}])).run();
 const member={userId:'one',id:'sku',game:'freefire'};
 const quote=await productPricing({DB},10000,'','wallet',member);
 assert.equal(quote.discountCents,Math.floor(quote.subtotalCents*.2));
 assert.equal((await productPricing({DB},10000,'','wallet',{...member,userId:'two'})).discountCents,0);
});
