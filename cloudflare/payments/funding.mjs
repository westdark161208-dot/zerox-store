// Internal funding intents; no HTTP creation, checkout, webhook or balance write yet.
import {productionEvidence,paymentCents} from './mercadopago-production.mjs';
export async function fundingSchema(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_funding_intents (
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
  currency TEXT NOT NULL CHECK(currency='MXN'),collector_id TEXT NOT NULL,
  request_key TEXT NOT NULL,payment_id TEXT UNIQUE,state TEXT NOT NULL DEFAULT 'pending',
  observed_status TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,request_key))`).run();
}
export async function createFundingIntent(db,input){
 const {id,userId,amountCents,collectorId,requestKey}=input;
 if(![id,userId,collectorId,requestKey].every(v=>typeof v==='string'&&v.length>0&&v.length<=160)||!Number.isSafeInteger(amountCents)||amountCents<=0||amountCents>10000000)throw Error('FUNDING_INVALID');
 await db.prepare(`INSERT INTO zx_funding_intents(id,user_id,amount_cents,currency,collector_id,request_key)
  SELECT ?,?,?,'MXN',?,? WHERE EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='active') ON CONFLICT DO NOTHING`)
  .bind(id,userId,amountCents,collectorId,requestKey,userId).run();
 const row=await db.prepare('SELECT * FROM zx_funding_intents WHERE user_id=? AND request_key=?').bind(userId,requestKey).first();
 if(!row||row.id!==id||row.amount_cents!==amountCents||row.collector_id!==collectorId)throw Error('FUNDING_CONFLICT');
 return row;
}
export async function reconcileFunding(db,payment){
 // Caller must retrieve this evidence from processor API; never accept browser JSON.
 const intent=await db.prepare('SELECT * FROM zx_funding_intents WHERE id=?').bind(String(payment.external_reference||'')).first();
 if(!intent||!productionEvidence(payment,intent))throw Error('FUNDING_EVIDENCE_REJECTED');
 const refunds=paymentCents(payment.transaction_amount_refunded??0);
 const states=['approved','pending','in_process','rejected','cancelled','refunded','charged_back','authorized','in_mediation'];
 if(refunds===null||!states.includes(payment.status))throw Error('FUNDING_EVIDENCE_REJECTED');
 const review=['refunded','charged_back','in_mediation'].includes(payment.status)||refunds>0;
 const state=review?'review_required':payment.status==='approved'?'verified':payment.status==='rejected'?'failed':payment.status==='cancelled'?'cancelled':'pending';
 const id=String(payment.id);
 try{
  await db.prepare(`UPDATE zx_funding_intents SET payment_id=?,observed_status=?,
   state=CASE WHEN state='review_required' THEN state WHEN state='verified' AND ?!='review_required' THEN state ELSE ? END,
   updated_at=CURRENT_TIMESTAMP WHERE id=? AND (payment_id IS NULL OR payment_id=?)`)
   .bind(id,payment.status,state,state,intent.id,id).run();
 }catch{throw Error('FUNDING_PAYMENT_CONFLICT');}
 const row=await db.prepare('SELECT * FROM zx_funding_intents WHERE id=?').bind(intent.id).first();
 if(row.payment_id!==id)throw Error('FUNDING_PAYMENT_CONFLICT');
 return {id:row.id,state:row.state,paymentId:id,credited:false};
}
