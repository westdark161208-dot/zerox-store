import {catalogue} from './catalog.mjs';
import {approved,fail,jsonBody,uuid,clean} from './accounts.mjs';
// Non-automated fulfilment shares the existing Resellers order queue and ledger.
// Provider purchase endpoints, main-store stock and promotion eligibility stay in their original flows.
export async function orderRoute(request,env,url,user,json,legacy,state){
 if(url.pathname!=='/api/resellers/portal/orders'||request.method!=='POST')return null;
 if(!await approved(env,user))fail('RESELLER_APPROVAL_REQUIRED',403);
 const b=await jsonBody(request);if(!uuid(b.requestId))fail('INVALID_REQUEST_ID');
 const prior=await env.DB.prepare('SELECT * FROM zx_r_orders WHERE user_id=? AND request_key=?').bind(user.id,b.requestId).first();
 if(prior){if(prior.product_id!==b.productId||prior.quantity!==b.quantity)fail('REQUEST_CONFLICT',409);return json({ok:true,order:prior,repeated:true})}
 const s=await state(env,user),p=(await catalogue(env,legacy)).products.find(p=>p.id===b.productId&&p.active);
 if(!p||p.checkout!=='manual')fail('USE_PRODUCT_CHECKOUT',409);
 if(!Number.isInteger(b.tier)||b.tier<1||b.tier>s.tier||!Number.isInteger(b.quantity)||b.quantity<p.min||b.quantity>p.max||b.manualDeliveryAccepted!==true)fail('INVALID_ORDER');
 const reference=clean(b.customerReference,3,160);if(/https?:|password|contrase[ñn]a/i.test(reference))fail('NO_PRIVATE_CREDENTIALS');
 const total=p.prices[b.tier-1]*b.quantity;if(!Number.isSafeInteger(total)||total<=0)fail('PRICE_UNAVAILABLE',409);
 const id=crypto.randomUUID(),ledger=crypto.randomUUID();
 try{const results=await env.DB.batch([
 env.DB.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,?,?,'purchase',? WHERE (SELECT COALESCE(SUM(amount),0) FROM zx_r_ledger WHERE user_id=?)>=? AND EXISTS(SELECT 1 FROM zx_r_accounts WHERE user_id=? AND status='approved')").bind(ledger,user.id,-total,'order:'+user.id+':'+b.requestId,user.id,total,user.id),
 env.DB.prepare("INSERT INTO zx_r_orders(id,user_id,request_key,product_id,product_name,tier,quantity,total,uid,region,nickname,plan) SELECT ?,?,?,?,?,?,?,?,?,?,'Entrega manual','[]' WHERE EXISTS(SELECT 1 FROM zx_r_ledger WHERE id=?)").bind(id,user.id,b.requestId,p.id,p.name,b.tier,b.quantity,total,reference,'manual',ledger)
 ]);if(!results[0].meta.changes)fail('INSUFFICIENT_BALANCE_OR_DISABLED',409)}catch(e){if(/unique/i.test(String(e))){const prior=await env.DB.prepare('SELECT * FROM zx_r_orders WHERE user_id=? AND request_key=?').bind(user.id,b.requestId).first();if(prior&&prior.product_id===b.productId&&prior.quantity===b.quantity)return json({ok:true,order:prior,repeated:true});fail('REQUEST_CONFLICT',409)}throw e}
 return json({ok:true,order:await env.DB.prepare('SELECT * FROM zx_r_orders WHERE id=?').bind(id).first()},201);
}
