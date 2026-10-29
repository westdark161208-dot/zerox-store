// Internal orchestration, not an HTTP endpoint. quote must be resolved by the
// server from a published product/mapping; never pass a client price or plan.
import {digest} from '../ra-purchase/protocol.mjs';
export async function automaticSchema(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_r_auto_orders (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,product_id TEXT NOT NULL,total INTEGER NOT NULL CHECK(total>0),
 plan TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'RESERVED',reference TEXT,
 delivery TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,request_key))`).run();
 await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS zx_r_auto_ref ON zx_r_auto_orders(reference) WHERE reference IS NOT NULL').run();
}
export async function reserveAutomatic(db,user,requestKey,quote){
 if(!user?.id||user.status!=='active'||!quote||!Number.isSafeInteger(quote.totalCents)||quote.totalCents<1||!Number.isInteger(quote.tier)||quote.tier<1||quote.tier>7||!quote.productId||quote.plan?.quantity!==1||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(requestKey||''))throw Error('INVALID_ORDER');
 const hash=await digest(JSON.stringify([quote.productId,quote.tier,quote.totalCents,quote.plan]));
 const existing=await db.prepare('SELECT * FROM zx_r_auto_orders WHERE user_id=? AND request_key=?').bind(user.id,requestKey).first();
 if(existing){if(existing.request_hash!==hash)throw Error('REQUEST_CONFLICT');return existing;}
 const id=crypto.randomUUID(),ledger=crypto.randomUUID();
 try{
 const result=await db.batch([
 db.prepare(`INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference)
 SELECT ?,?,?,'purchase',? WHERE
 EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='active') AND
 (?=1 OR EXISTS(SELECT 1 FROM zx_r_accounts a LEFT JOIN zx_r_members m ON m.user_id=a.user_id
 WHERE a.user_id=? AND a.status='approved' AND COALESCE(a.manual_tier,MAX(1,COALESCE(m.tier,1)))>=?)) AND
 (SELECT COALESCE(SUM(amount),0) FROM zx_r_ledger WHERE user_id=?)>=?`).bind(ledger,user.id,-quote.totalCents,'auto:'+user.id+':'+requestKey,user.id,user.isFounder===true?1:0,user.id,quote.tier,user.id,quote.totalCents),
 db.prepare(`INSERT INTO zx_r_auto_orders(id,user_id,request_key,request_hash,product_id,total,plan)
 SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_r_ledger WHERE id=?)`).bind(id,user.id,requestKey,hash,quote.productId,quote.totalCents,JSON.stringify(quote.plan),ledger)
 ]);
 if(!result[0].meta.changes)throw Error('BALANCE_OR_ACCESS_CHANGED');
 }catch(e){
 const prior=await db.prepare('SELECT * FROM zx_r_auto_orders WHERE user_id=? AND request_key=?').bind(user.id,requestKey).first();
 if(prior){if(prior.request_hash!==hash)throw Error('REQUEST_CONFLICT');return prior;}
 throw e;
 }
 return db.prepare('SELECT * FROM zx_r_auto_orders WHERE id=?').bind(id).first();
}
export async function applyAutomaticResult(db,id,result){
 if(!['COMPLETED','PROCESSING','REQUIRES_REVIEW','NOT_SUBMITTED'].includes(result?.state))result={state:'REQUIRES_REVIEW'};
 if(result.reference!=null&&!/^[A-Za-z0-9_-]{1,120}$/.test(result.reference))result={state:'REQUIRES_REVIEW'};
 if(result.state==='COMPLETED'&&(!result.reference||!Array.isArray(result.delivery)))result={state:'REQUIRES_REVIEW'};
 // Only a definite pre-submission failure may release funds automatically.
 // Unknown outcomes, provider refunds and partial deliveries require reconciliation.
 if(result.state==='NOT_SUBMITTED'){
  await db.batch([
   db.prepare(`INSERT OR IGNORE INTO zx_r_ledger(id,user_id,amount,kind,reference)
   SELECT ?,user_id,total,'refund','auto-refund:'||id FROM zx_r_auto_orders
   WHERE id=? AND state='DISPATCHING' AND reference IS NULL`).bind(crypto.randomUUID(),id),
   db.prepare(`UPDATE zx_r_auto_orders SET state='REFUNDED' WHERE id=? AND state='DISPATCHING'
   AND reference IS NULL AND EXISTS(SELECT 1 FROM zx_r_ledger WHERE reference='auto-refund:'||?)`).bind(id,id)
  ]);
 }else{
  await db.prepare(`UPDATE zx_r_auto_orders SET state=?,reference=COALESCE(reference,?),delivery=?
  WHERE id=? AND state IN ('DISPATCHING','PROCESSING','REQUIRES_REVIEW')
  AND (reference IS NULL OR ? IS NULL OR reference=?)`).bind(result.state,result.reference||null,JSON.stringify(result.state==='COMPLETED'?result.delivery:[]),id,result.reference||null,result.reference||null).run();
 }
 return db.prepare('SELECT * FROM zx_r_auto_orders WHERE id=?').bind(id).first();
}
export async function dispatchAutomatic(db,id,transport){
 const claim=await db.prepare("UPDATE zx_r_auto_orders SET state='DISPATCHING' WHERE id=? AND state='RESERVED'").bind(id).run();
 const row=await db.prepare('SELECT * FROM zx_r_auto_orders WHERE id=?').bind(id).first();
 if(!row)throw Error('ORDER_NOT_FOUND');
 if(!claim.meta.changes)return row;
 let result;
 try{result=await transport.submit(id,JSON.parse(row.plan));}catch{result={state:'REQUIRES_REVIEW'};}
 return applyAutomaticResult(db,id,result);
}
export async function reconcileAutomatic(db,id,transport){
 const row=await db.prepare('SELECT * FROM zx_r_auto_orders WHERE id=?').bind(id).first();
 if(!row)throw Error('ORDER_NOT_FOUND');
 if(!['DISPATCHING','PROCESSING','REQUIRES_REVIEW'].includes(row.state))return row;
 // Lookup only: this can recover a lost response using Oracle's durable journal.
 // Missing operations must NOT be interpreted as permission to resubmit/refund.
 try{return await applyAutomaticResult(db,id,await transport.lookup(id,JSON.parse(row.plan)));}catch{return row;}
}
