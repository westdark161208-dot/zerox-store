// Atomic credit plus intent confirmation; schema initialized by gated orchestrator only.
export async function settleFunding(db,intentId){
 const intent=await db.prepare('SELECT * FROM zx_funding_intents WHERE id=?').bind(intentId).first();
 if(!intent||!intent.payment_id||!['verified','confirmed'].includes(intent.state))throw Error('FUNDING_NOT_VERIFIED');
 const source='mercadopago-production',key='funding:'+intentId;
 const id=crypto.randomUUID();
 await db.batch([
  db.prepare(`INSERT INTO zx_wallet_ledger
   (id,user_id,kind,amount_cents,currency,previous_balance,resulting_balance,source,reference,request_key,actor)
   SELECT ?,i.user_id,'credit',i.amount_cents,'MXN',balance,balance+i.amount_cents,?,?,?,'payment-reconciliation'
   FROM zx_funding_intents i,
    (SELECT COALESCE(SUM(amount_cents),0) balance FROM zx_wallet_ledger WHERE user_id=?)
   WHERE i.id=? AND i.state='verified' AND i.payment_id=?
    AND EXISTS(SELECT 1 FROM zx_users WHERE id=i.user_id AND status='active')
    AND balance+i.amount_cents<=9007199254740991 ON CONFLICT DO NOTHING`)
   .bind(id,source,intent.payment_id,key,intent.user_id,intentId,intent.payment_id),
  db.prepare(`UPDATE zx_funding_intents SET state='confirmed',updated_at=CURRENT_TIMESTAMP
   WHERE id=? AND state='verified' AND payment_id=? AND EXISTS(
    SELECT 1 FROM zx_wallet_ledger l WHERE l.user_id=zx_funding_intents.user_id
     AND l.source=? AND l.reference=zx_funding_intents.payment_id
     AND l.request_key=? AND l.kind='credit' AND l.amount_cents=zx_funding_intents.amount_cents)`)
   .bind(intentId,intent.payment_id,source,key)
 ]);
 const row=await db.prepare(`SELECT i.state,l.id AS movement_id FROM zx_funding_intents i
  JOIN zx_wallet_ledger l ON l.user_id=i.user_id AND l.source=? AND l.reference=i.payment_id
   AND l.request_key=? AND l.amount_cents=i.amount_cents WHERE i.id=?`).bind(source,key,intentId).first();
 if(!row||row.state!=='confirmed')throw Error('FUNDING_SETTLEMENT_REJECTED');
 return {credited:true,movementId:row.movement_id};
}
