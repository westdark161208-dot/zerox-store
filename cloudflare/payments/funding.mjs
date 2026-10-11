// Internal funding intents; only server-fetched payment evidence may enter reconciliation.
import {productionEvidence,paymentCents} from './mercadopago-production.mjs';
export async function fundingSchema(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_funding_intents (
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
  currency TEXT NOT NULL CHECK(currency='MXN'),collector_id TEXT NOT NULL,
  request_key TEXT NOT NULL,payment_id TEXT UNIQUE,state TEXT NOT NULL DEFAULT 'pending',
  observed_status TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,request_key))`).run();
 // Additive snapshot: historical intents retain their original amount and rules.
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_funding_charges_v3 (
  intent_id TEXT PRIMARY KEY,charge_cents INTEGER NOT NULL CHECK(charge_cents>0),
  credit_cents INTEGER NOT NULL CHECK(credit_cents>0 AND credit_cents<=charge_cents),
  quote_id TEXT NOT NULL UNIQUE,quote_json TEXT NOT NULL
 )`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS zx_funding_charges_v3_immutable
  BEFORE UPDATE ON zx_funding_charges_v3 BEGIN SELECT RAISE(ABORT,'IMMUTABLE_FUNDING_CHARGE'); END`).run();
}
export async function createFundingIntent(db,input){
 const {id,userId,amountCents,collectorId,requestKey}=input;
 if(![id,userId,collectorId,requestKey].every(v=>typeof v==='string'&&v.length>0&&v.length<=160)||!Number.isSafeInteger(amountCents)||amountCents<=0||amountCents>10000000)throw Error('FUNDING_INVALID');
 if(input.quote){
  // A quote must already be accepted for this intent by the server orchestrator.
  const accepted=await db.prepare('SELECT quote_json FROM zx_payment_quotes_v3 WHERE id=? AND user_id=? AND order_id=?').bind(input.quote.id,userId,id).first();
  if(!accepted)throw Error('FUNDING_QUOTE_REQUIRED');
  const q=JSON.parse(accepted.quote_json);
  if(q.baseCents!==amountCents||q.currency!=='MXN'||!['all','card','spei'].includes(q.method)||q.totalCents!==input.quote.totalCents)throw Error('FUNDING_QUOTE_REQUIRED');
  const existing=await db.prepare('SELECT * FROM zx_funding_intents WHERE user_id=? AND request_key=?').bind(userId,requestKey).first();
  if(existing){
   const charge=await db.prepare('SELECT * FROM zx_funding_charges_v3 WHERE intent_id=?').bind(existing.id).first();
   if(existing.id!==id||existing.amount_cents!==amountCents||existing.collector_id!==collectorId||charge?.quote_id!==q.id)throw Error('FUNDING_CONFLICT');
   return {...existing,charge_cents:charge.charge_cents};
  }
  await db.batch([
   db.prepare(`INSERT INTO zx_funding_intents(id,user_id,amount_cents,currency,collector_id,request_key)
    SELECT ?,?,?,'MXN',?,? WHERE EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='active') ON CONFLICT DO NOTHING`)
    .bind(id,userId,amountCents,collectorId,requestKey,userId),
   db.prepare(`INSERT INTO zx_funding_charges_v3(intent_id,charge_cents,credit_cents,quote_id,quote_json)
    SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_funding_intents WHERE id=? AND user_id=? AND request_key=? AND amount_cents=? AND collector_id=?) ON CONFLICT DO NOTHING`)
    .bind(id,q.totalCents,amountCents,q.id,accepted.quote_json,id,userId,requestKey,amountCents,collectorId)
  ]);
  const row=await db.prepare(`SELECT i.*,c.charge_cents,c.quote_id FROM zx_funding_intents i JOIN zx_funding_charges_v3 c ON c.intent_id=i.id WHERE i.user_id=? AND i.request_key=?`).bind(userId,requestKey).first();
  if(!row||row.id!==id||row.quote_id!==q.id||row.amount_cents!==amountCents||row.collector_id!==collectorId)throw Error('FUNDING_CONFLICT');
  return row;
 }
 await db.prepare(`INSERT INTO zx_funding_intents(id,user_id,amount_cents,currency,collector_id,request_key)
  SELECT ?,?,?,'MXN',?,? WHERE EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='active') ON CONFLICT DO NOTHING`)
  .bind(id,userId,amountCents,collectorId,requestKey,userId).run();
 const row=await db.prepare('SELECT * FROM zx_funding_intents WHERE user_id=? AND request_key=?').bind(userId,requestKey).first();
 if(!row||row.id!==id||row.amount_cents!==amountCents||row.collector_id!==collectorId)throw Error('FUNDING_CONFLICT');
 const quoted=await db.prepare('SELECT intent_id FROM zx_funding_charges_v3 WHERE intent_id=?').bind(row.id).first();
 if(quoted)throw Error('FUNDING_CONFLICT');
 return row;
}
export async function reconcileFunding(db,payment){
 // Caller must retrieve this evidence from processor API; never accept browser JSON.
 const intent=await db.prepare('SELECT * FROM zx_funding_intents WHERE id=?').bind(String(payment.external_reference||'')).first();
 const charge=intent?await db.prepare('SELECT charge_cents FROM zx_funding_charges_v3 WHERE intent_id=?').bind(intent.id).first():null;
 if(!intent||!productionEvidence(payment,{...intent,amount_cents:charge?.charge_cents??intent.amount_cents}))throw Error('FUNDING_EVIDENCE_REJECTED');
 const refunds=paymentCents(payment.transaction_amount_refunded??0);
 const states=['approved','pending','in_process','rejected','cancelled','refunded','charged_back','authorized','in_mediation'];
 if(refunds===null||!states.includes(payment.status))throw Error('FUNDING_EVIDENCE_REJECTED');
 const review=['refunded','charged_back','in_mediation'].includes(payment.status)||refunds>0;
 const state=review?'review_required':payment.status==='approved'?'verified':payment.status==='rejected'?'failed':payment.status==='cancelled'?'cancelled':'pending';
 const id=String(payment.id);
 try{
  await db.prepare(`UPDATE zx_funding_intents SET payment_id=?,observed_status=?,
   state=CASE WHEN state='review_required' THEN state WHEN state IN ('verified','confirmed') AND ?!='review_required' THEN state ELSE ? END,
   updated_at=CURRENT_TIMESTAMP WHERE id=? AND (payment_id IS NULL OR payment_id=?)`)
   .bind(id,payment.status,state,state,intent.id,id).run();
 }catch{throw Error('FUNDING_PAYMENT_CONFLICT');}
 const row=await db.prepare('SELECT * FROM zx_funding_intents WHERE id=?').bind(intent.id).first();
 if(row.payment_id!==id)throw Error('FUNDING_PAYMENT_CONFLICT');
 return {id:row.id,state:row.state,paymentId:id,credited:false};
}
