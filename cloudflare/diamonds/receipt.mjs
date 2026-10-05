// A customer receipt is derived only from persisted, fully confirmed delivery.
export async function orderReceipt(db,id,userId){
 const table=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_product_payments'").first();if(!table)return null;
 const order=await db.prepare('SELECT o.*,p.method,p.state AS paymentState FROM zx_diamond_orders o JOIN zx_product_payments p ON p.order_id=o.id WHERE o.id=? AND o.user_id=?').bind(id,userId).first();if(!order)return null;
 if(order.state!=='COMPLETED'||order.delivered!==order.diamonds||!order.paid_at||order.paymentState!=='paid')return {pending:true};
 const {results:ops}=await db.prepare('SELECT state,diamonds,player_id,provider_name,provider_reference,updated_at FROM zx_diamond_operations WHERE order_id=? ORDER BY sequence').bind(id).all();
 if(!ops.length||ops.some(o=>o.state!=='SUCCESS'||o.player_id!==order.player_id||!o.provider_reference)||ops.reduce((n,o)=>n+o.diamonds,0)!==order.diamonds)return {pending:true};
 const snapshot=JSON.parse(order.snapshot_json),plan=snapshot.fulfillmentPlan;
 return {number:'ZX-'+order.id,orderId:order.id,product:order.diamonds+' diamantes Free Fire',playerId:order.player_id,region:plan?.region||null,diamonds:order.delivered,confirmedAt:ops.map(o=>o.updated_at).sort().at(-1),method:order.method,amountCents:order.sale_price_cents,currency:'MXN',...(order.method==='ra-funds'?{supplierQuotedCostMicros:plan?.totalMicros,supplierCurrency:plan?.currency}:{}),references:ops.map(o=>({provider:o.provider_name,reference:o.provider_reference,diamonds:o.diamonds})),notice:'Comprobante de recarga de Zero’X Store. No es una factura fiscal.'};
}
