import {publishedProduct} from '../editor/catalog.mjs';
import {getProduct} from './catalog.mjs';
import {makeSnapshot} from './catalog.mjs';
import {disabledProvider} from './provider.mjs';
const now=()=>new Date().toISOString();
const uuid=()=>crypto.randomUUID();
export async function createOrder(db,{userId,requestKey,productId,playerId,fulfillmentPlan=null}){
 if(!userId||!/^[A-Za-z0-9_-]{16,100}$/.test(requestKey))throw Error('INVALID_REQUEST_KEY');
 const existing=await db.prepare('SELECT * FROM zx_diamond_orders WHERE user_id=? AND request_key=?').bind(userId,requestKey).first();
 if(existing){if(existing.product_id!==productId||existing.player_id!==playerId)throw Error('IDEMPOTENCY_CONFLICT');return existing;}
 const product=await publishedProduct(db,getProduct(productId));if(!product)throw Error('PRODUCT_UNAVAILABLE');
 const snapshot={...makeSnapshot(productId,playerId),salePriceCents:product.salePriceCents,...(fulfillmentPlan?{fulfillmentPlan,providerCostCents:0,providerCostEstimated:false}: {})},id=uuid(),at=now();
 // All operations derive from a trusted catalogue, never from a browser recipe.
 const statements=[db.prepare(`INSERT OR IGNORE INTO zx_diamond_orders(id,user_id,request_key,product_id,player_id,diamonds,sale_price_cents,provider_cost_cents,snapshot_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id,userId,requestKey,productId,playerId,snapshot.diamonds,snapshot.salePriceCents,snapshot.providerCostCents,JSON.stringify(snapshot),at,at)];
 let seq=0;for(const p of snapshot.recipe)for(let n=0;n<p.quantity;n++){
  const sequence=seq++;
  statements.push(db.prepare(`INSERT INTO zx_diamond_operations(id,order_id,sequence,diamonds,player_id,provider_cost_cents,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_diamond_orders WHERE id=?)`).bind(`${id}:${sequence}`,id,sequence,p.diamonds,playerId,fulfillmentPlan?0:p.costCents,at,at,id));
 }
 await db.batch(statements);
 const order=await db.prepare('SELECT * FROM zx_diamond_orders WHERE user_id=? AND request_key=?').bind(userId,requestKey).first();
 if(order.product_id!==productId||order.player_id!==playerId)throw Error('IDEMPOTENCY_CONFLICT');
 return order;
}
// Internal only. A future payment integration must verify evidence with its own server API.
// There is deliberately no public route accepting "paid:true" or a payment reference.
export async function confirmPayment(db,orderId,evidence,paymentVerifier){
 const order=await db.prepare('SELECT * FROM zx_diamond_orders WHERE id=?').bind(orderId).first();
 if(!order)throw Error('ORDER_NOT_FOUND');
 const verified=await paymentVerifier.verify(evidence);
 if(verified?.status!=='CONFIRMED'||verified.orderId!==orderId||verified.amountCents!==order.sale_price_cents||verified.currency!=='MXN'||!verified.reference)throw Error('PAYMENT_NOT_CONFIRMED');
 await db.prepare("UPDATE zx_diamond_orders SET state='PAID',payment_reference=?,paid_at=?,updated_at=? WHERE id=? AND state='PENDING_PAYMENT' AND paid_at IS NULL").bind(verified.reference,now(),now(),orderId).run();
}
export async function refreshOrder(db,id){
 const {results}=await db.prepare('SELECT state,diamonds FROM zx_diamond_operations WHERE order_id=?').bind(id).all();
 const delivered=results.filter(p=>p.state==='SUCCESS').reduce((n,p)=>n+p.diamonds,0);
 const state=results.length&&results.every(p=>p.state==='SUCCESS')?'COMPLETED':delivered?'PARTIALLY_COMPLETED':results.some(p=>p.state==='PROCESSING')?'REQUIRES_REVIEW':results.some(p=>p.state==='FAILED')?'FAILED':'PROCESSING';
 await db.prepare('UPDATE zx_diamond_orders SET state=?,delivered=?,updated_at=? WHERE id=? AND paid_at IS NOT NULL').bind(state,delivered,now(),id).run();
 return {state,delivered};
}
export async function runOrder(db,orderId,{provider=disabledProvider,skuMap={},maxAttempts=3,maxOperations=1,leaseMs=120000}={}){
 if(!provider.enabled)return {disabled:true};
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||!Number.isInteger(maxOperations)||maxOperations<1||maxOperations>100||leaseMs<1000)throw Error('INVALID_EXECUTION_LIMIT');
 const lock=uuid(),at=Date.now();
 const claim=await db.prepare("UPDATE zx_diamond_orders SET lock_token=?,lock_until=? WHERE id=? AND paid_at IS NOT NULL AND state IN ('PAID','PROCESSING','PARTIALLY_COMPLETED','REQUIRES_REVIEW') AND lock_until<?").bind(lock,at+leaseMs,orderId,at).run();
 if(!claim.meta.changes)return {claimed:false};
 try{
  const {results:ops}=await db.prepare('SELECT * FROM zx_diamond_operations WHERE order_id=? ORDER BY sequence').bind(orderId).all();
  let sent=0;
  for(const op of ops){
   if(op.state==='SUCCESS')continue;
   if(op.state==='FAILED')break;
   // Do not start more work if our lease was taken over. PROCESSING is lookup-only.
   const owned=await db.prepare('SELECT id FROM zx_diamond_orders WHERE id=? AND lock_token=? AND lock_until>?').bind(orderId,lock,Date.now()).first();if(!owned)break;
   let result;
   if(op.state==='PROCESSING'){
    if(op.provider_name!==provider.name)break;
    try{result=await provider.lookup({reference:op.provider_reference,idempotencyKey:op.id,playerId:op.player_id,sku:op.provider_sku});}catch{result={status:'UNKNOWN'};}
   }else{
    if(sent>=maxOperations)break;
    const sku=op.provider_sku||skuMap[op.diamonds];if(!sku)break;
    if(op.provider_name&&op.provider_name!==provider.name)break;
    if(op.attempts>=maxAttempts)break;
    const change=await db.prepare("UPDATE zx_diamond_operations SET state='PROCESSING',attempts=attempts+1,provider_name=?,provider_sku=?,updated_at=? WHERE id=? AND state IN ('PENDING','RETRY_PENDING')").bind(provider.name,sku,now(),op.id).run();
    if(!change.meta.changes)break;
    sent++;
    try{result=await provider.submit({sku,playerId:op.player_id,idempotencyKey:op.id});}catch{result={status:'UNKNOWN'};}
   }
   const current=await db.prepare('SELECT attempts FROM zx_diamond_operations WHERE id=?').bind(op.id).first();
   const state=result?.status==='SUCCESS'?'SUCCESS':result?.status==='NOT_ACCEPTED'?(current.attempts<maxAttempts?'RETRY_PENDING':'FAILED'):'PROCESSING';
   // Adapter receipt is a small redacted audit value; never serialize an arbitrary HTTP response.
   const receipt=JSON.stringify({status:result?.status||'UNKNOWN',reference:String(result?.reference||'').slice(0,256),receipt:String(result?.receipt||'').slice(0,4096)});
   await db.batch([
    db.prepare("UPDATE zx_diamond_operations SET state=?,provider_reference=COALESCE(?,provider_reference),receipt_json=?,actual_cost_cents=COALESCE(?,actual_cost_cents),updated_at=? WHERE id=? AND state='PROCESSING'").bind(state,result?.reference?String(result.reference).slice(0,256):null,receipt,Number.isSafeInteger(result?.actualCostCents)&&result.actualCostCents>=0?result.actualCostCents:null,now(),op.id),
    db.prepare('INSERT INTO zx_diamond_events VALUES(?,?,?,?,?)').bind(uuid(),op.id,'PROVIDER_RESULT',receipt,now())
   ]);
   if(state!=='SUCCESS')break;
  }
  return await refreshOrder(db,orderId);
 }finally{await db.prepare('UPDATE zx_diamond_orders SET lock_token=NULL,lock_until=0 WHERE id=? AND lock_token=?').bind(orderId,lock).run();}
}
