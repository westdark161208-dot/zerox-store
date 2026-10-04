import {publishedProduct} from '../editor/catalog.mjs';
// Isolated test ledger. Never calls the delivery engine or updates real orders.
import {getProduct} from '../diamonds/catalog.mjs';
const SITE='https://zerox-store.pages.dev';
const HOOK='https://zerox-sixofire-api.westdark161208.workers.dev/api/payments/mercadopago/test/webhook';
export async function mp(env,path,options={}){
 if(!env.MP_ACCESS_TOKEN_TEST)throw Error('MP_TEST_TOKEN_MISSING');
 const r=await fetch('https://api.mercadopago.com'+path,{...options,redirect:'manual',headers:{Authorization:'Bearer '+env.MP_ACCESS_TOKEN_TEST,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('MP_HTTP_'+r.status);
 return r.json();
}
export function validatePayment(p,order){
 return p.live_mode===false && String(p.external_reference)===order.id && p.currency_id==='MXN' && Number.isFinite(p.transaction_amount) && Math.round(p.transaction_amount*100)===order.amount_cents && String(p.collector_id)===String(order.collector_id);
}
export async function validSignature(request,url,secret){
 if(!secret)return false;
 const parts=Object.fromEntries((request.headers.get('x-signature')||'').split(',').map(v=>v.trim().split('=')));
 const id=url.searchParams.get('data.id'),rid=request.headers.get('x-request-id');
 if(!id||!rid||!/^\d+$/.test(parts.ts||'')||! /^[a-f0-9]{64}$/i.test(parts.v1||''))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,Uint8Array.from(parts.v1.match(/../g),h=>parseInt(h,16)),new TextEncoder().encode(`id:${id.toLowerCase()};request-id:${rid};ts:${parts.ts};`));
}
export function checkoutMethods(method){
 if(!["all","card","oxxo","spei"].includes(method))throw Error("INVALID_PAYMENT_METHOD");
 return method==="oxxo"?{default_payment_method_id:"oxxo"}:method==="spei"?{default_payment_method_id:"clabe"}:method==="card"?{excluded_payment_types:[{id:"account_money"},{id:"ticket"},{id:"bank_transfer"},{id:"atm"}]}:{};
}
async function schema(db){
 await db.prepare("CREATE TABLE IF NOT EXISTS zx_mp_test_methods (order_id TEXT PRIMARY KEY,method TEXT NOT NULL)").run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_mp_test_orders (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,product_id TEXT NOT NULL,amount_cents INTEGER NOT NULL,collector_id TEXT,preference_id TEXT,checkout_url TEXT,state TEXT NOT NULL DEFAULT 'creating',payment_id TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}
async function reconcile(env,p){
 const order=await env.DB.prepare('SELECT * FROM zx_mp_test_orders WHERE id=?').bind(String(p.external_reference||'')).first();
 if(!order||!validatePayment(p,order)||(order.payment_id&&order.payment_id!==String(p.id)))return false;
 const states=['approved','pending','in_process','rejected','cancelled','refunded','charged_back','authorized','in_mediation'];
 if(!states.includes(p.status))return false;
 await env.DB.prepare("UPDATE zx_mp_test_orders SET state=?,payment_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND (payment_id IS NULL OR payment_id=?)").bind(p.status,String(p.id),order.id,String(p.id)).run();
 return true;
}
export async function mpTestRoute(request,env,url,user,json){
 try{
  if(url.pathname=== '/api/payments/mercadopago/test/webhook'){
   if(request.method!=='POST')return json({ok:false},405);
   if(!await validSignature(request,url,env.MP_WEBHOOK_SECRET_TEST))return json({ok:false,error:'INVALID_SIGNATURE'},401);
   const id=url.searchParams.get('data.id');
   if(!/^\d{1,30}$/.test(id))return json({ok:false},400);
   const b=await request.json();
   if(b.type!=='payment')return json({ok:true,ignored:true});
   if(String(b.data?.id)!==id)return json({ok:false},400);
   await schema(env.DB);
   await reconcile(env,await mp(env,'/v1/payments/'+id));
   return json({ok:true});
  }
  if(!user?.isFounder||user.status!=='active')return json({ok:false,error:'FOUNDER_REQUIRED'},403);
  if(url.pathname.endsWith('/status')&&request.method==='GET')return json({ok:true,testOnly:true,tokenConfigured:!!env.MP_ACCESS_TOKEN_TEST,webhookConfigured:!!env.MP_WEBHOOK_SECRET_TEST,deliveryEnabled:false});
  await schema(env.DB);
  if(url.pathname.endsWith('/checkout')&&request.method==='POST'){
   const b=await request.json(),product=await publishedProduct(env.DB,getProduct(b.productId)),id=request.headers.get('Idempotency-Key');
   if(!product||! /^[a-f0-9-]{36}$/.test(id||''))return json({ok:false,error:'INVALID_REQUEST'},400);
   const method=b.method||'all';checkoutMethods(method);
   const existing=await env.DB.prepare('SELECT * FROM zx_mp_test_orders WHERE id=? AND user_id=?').bind(id,user.id).first();
   if(existing){
    const chosen=await env.DB.prepare("SELECT method FROM zx_mp_test_methods WHERE order_id=?").bind(id).first();
    if(existing.product_id!==product.id||(chosen?.method||"all")!==method)return json({ok:false,error:'KEY_CONFLICT'},409);
    return existing.checkout_url?json({ok:true,id,checkoutUrl:existing.checkout_url}):json({ok:false,error:'ATTEMPT_INCOMPLETE_CREATE_NEW'},409);
   }
   // Verify test seller independently of token prefix. Fail closed for real accounts.
   const seller=await mp(env,'/users/me');
   if(!Array.isArray(seller.tags)||!seller.tags.includes('test_user'))return json({ok:false,error:'TEST_SELLER_REQUIRED'},409);
   await env.DB.prepare('INSERT INTO zx_mp_test_orders(id,user_id,product_id,amount_cents,collector_id) VALUES(?,?,?,?,?)').bind(id,user.id,product.id,product.salePriceCents,String(seller.id)).run();
   await env.DB.prepare('INSERT INTO zx_mp_test_methods(order_id,method) VALUES(?,?)').bind(id,method).run();
   const back=SITE+'/payment-test.html?attempt='+id;
   const pref=await mp(env,'/checkout/preferences',{method:'POST',body:JSON.stringify({items:[{id:product.id,title:'PRUEBA SIN ENTREGA — '+product.diamonds+' diamantes',quantity:1,currency_id:'MXN',unit_price:product.salePriceCents/100}],external_reference:id,payment_methods:checkoutMethods(method),back_urls:{success:back,pending:back,failure:back},notification_url:HOOK,expires:true,expiration_date_to:new Date(Date.now()+3600000).toISOString()})});
   const checkout=new URL(pref.init_point);
   if(checkout.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(checkout.hostname)||String(pref.collector_id)!==String(seller.id))throw Error('INVALID_CHECKOUT_RESPONSE');
   await env.DB.prepare("UPDATE zx_mp_test_orders SET preference_id=?,checkout_url=?,state='pending' WHERE id=?").bind(String(pref.id),checkout.href,id).run();
   return json({ok:true,id,checkoutUrl:checkout.href});
  }
  const match=url.pathname.match(/\/orders\/([a-f0-9-]{36})$/);
  if(match&&request.method==='GET'){
   const order=await env.DB.prepare('SELECT * FROM zx_mp_test_orders WHERE id=? AND user_id=?').bind(match[1],user.id).first();
   if(!order)return json({ok:false,error:'NOT_FOUND'},404);
   // The browser return status is never evidence of payment.
   const result=await mp(env,'/v1/payments/search?external_reference='+encodeURIComponent(order.id)+'&sort=date_created&criteria=desc');
   for(const p of result.results||[])if(await reconcile(env,p))break;
   const saved=await env.DB.prepare('SELECT state,payment_id FROM zx_mp_test_orders WHERE id=?').bind(order.id).first();
   return json({ok:true,id:order.id,state:saved.state,paymentId:saved.payment_id,testOnly:true,deliveryEnabled:false});
  }
  return json({ok:false,error:'NOT_FOUND'},404);
 }catch(e){
  const code=/^(MP_HTTP_\d{3}|MP_TEST_TOKEN_MISSING|INVALID_CHECKOUT_RESPONSE|INVALID_PAYMENT_METHOD)$/.test(e.message)?e.message:'MP_TEST_UNAVAILABLE';
  return json({ok:false,error:code},503);
 }
}
