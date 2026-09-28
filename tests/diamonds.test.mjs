import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {catalog,createPlanner,costOf,providerPacks} from '../cloudflare/diamonds/catalog.mjs';
import {createOrder,confirmPayment,runOrder} from '../cloudflare/diamonds/engine.mjs';
function database(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../cloudflare/diamonds/schema.sql',import.meta.url),'utf8'));
 const wrap=(text,args=[])=>({bind(...values){return wrap(text,values)},async first(){return sql.prepare(text).get(...args)||null},async all(){return {results:sql.prepare(text).all(...args)}},async run(){const r=sql.prepare(text).run(...args);return {meta:{changes:Number(r.changes)}}}});
 return {prepare:wrap,async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}},sql};
}
async function order(db,amount=30800){return createOrder(db,{userId:'owner',requestKey:'request_key_123456789',productId:`zx-diamonds-${amount}`,playerId:'123456789'})}
async function pay(db,o){return confirmPayment(db,o.id,{}, {async verify(){return {status:'CONFIRMED',orderId:o.id,amountCents:o.sale_price_cents,currency:'MXN',reference:'payment-1'}}})}
const skuMap=Object.fromEntries(providerPacks.map(p=>[p.diamonds,`TEST_ONLY_${p.diamonds}`]));
test('50 exact recipes, integer prices, positive gross margin; independently check optimality',()=>{
 assert.equal(catalog.length,50);assert.equal(new Set(catalog.map(p=>p.id)).size,50);
 // Independent forward relaxation, rather than trusting the planner result.
 const best=Array(100893).fill(Infinity);best[0]=0;
 for(let n=0;n<best.length;n++)for(const p of providerPacks)if(n+p.diamonds<best.length)best[n+p.diamonds]=Math.min(best[n+p.diamonds],best[n]+p.costCents);
 for(const p of catalog){assert.equal(p.recipe.reduce((s,r)=>s+r.diamonds*r.quantity,0),p.diamonds);assert.equal(costOf(p.recipe),best[p.diamonds]);assert.ok(p.salePriceCents>costOf(p.recipe));}
 assert.equal(costOf(createPlanner()(682)),7968);
 assert.equal(catalog.at(-1).recipe.reduce((s,p)=>s+p.quantity,0),18);
 assert.equal(catalog.at(-1).salePriceCents,1096000);
});
test('order retries create one immutable snapshot and one operation set',async()=>{
 const db=database(),a=await order(db),b=await order(db);assert.equal(a.id,b.id);
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM zx_diamond_operations').first()).n,5);
 await assert.rejects(createOrder(db,{userId:'owner',requestKey:'request_key_123456789',productId:'zx-diamonds-110',playerId:'123456789'}),/IDEMPOTENCY_CONFLICT/);
});
test('no delivery without payment or with disabled provider; reject wrong payment amount',async()=>{
 const db=database(),o=await order(db);let calls=0;
 const provider={enabled:true,name:'test',async submit(){calls++;return {status:'SUCCESS'}}};
 await runOrder(db,o.id,{provider,skuMap});assert.equal(calls,0);
 await assert.rejects(confirmPayment(db,o.id,{}, {async verify(){return {status:'CONFIRMED',orderId:o.id,amountCents:1,currency:'MXN',reference:'bad'}}}),/PAYMENT_NOT_CONFIRMED/);
 await pay(db,o);assert.deepEqual(await runOrder(db,o.id),{disabled:true});assert.equal(calls,0);
});
test('lost response after four successes remains partial; lookup resolves without duplicate send',async()=>{
 const db=database(),o=await order(db);await pay(db,o);let calls=0,lookups=0;
 const provider={enabled:true,name:'test',async submit(){calls++;if(calls===5)throw Error('TIMEOUT');return {status:'SUCCESS',reference:'ref-'+calls}},async lookup(){lookups++;return {status:'SUCCESS',reference:'recovered'}}};
 const a=await runOrder(db,o.id,{provider,skuMap,maxOperations:10});assert.equal(a.state,'PARTIALLY_COMPLETED');assert.equal(a.delivered,24640);
 const b=await runOrder(db,o.id,{provider,skuMap,maxOperations:10});assert.equal(b.state,'COMPLETED');assert.equal(b.delivered,30800);assert.equal(calls,5);assert.equal(lookups,1);
 await runOrder(db,o.id,{provider,skuMap});assert.equal(calls,5);
});
test('unknown status never resubmits, and a concurrent runner cannot submit',async()=>{
 const db=database(),o=await order(db);await pay(db,o);let calls=0;
 const provider={enabled:true,name:'test',async submit(){calls++;assert.deepEqual(await runOrder(db,o.id,{provider,skuMap}),{claimed:false});throw Error('TIMEOUT')},async lookup(){return {status:'UNKNOWN'}}};
 await runOrder(db,o.id,{provider,skuMap});await runOrder(db,o.id,{provider,skuMap});assert.equal(calls,1);
});
test('only authoritative NOT_ACCEPTED permits retry, same idempotency key, bounded attempts',async()=>{
 const db=database(),o=await order(db,110);await pay(db,o);const keys=[];
 const provider={enabled:true,name:'test',async submit(p){keys.push(p.idempotencyKey);return {status:'NOT_ACCEPTED'}},async lookup(){return {status:'UNKNOWN'}}};
 for(let i=0;i<5;i++)await runOrder(db,o.id,{provider,skuMap,maxAttempts:2});assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
});
