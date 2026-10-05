import {resolvedRaEnvironment} from '../providers/ra-associations.mjs';
import {getProduct} from './catalog.mjs';
import {publishedProduct} from '../editor/catalog.mjs';
import {diamondSchema} from './schema.mjs';
import {createOrder,runOrder} from './engine.mjs';
import {raAmountPreflight,raProvider,raMapping} from './recargas-america.mjs';
import {productionToken,productionAccount,productionEvidence} from '../payments/mercadopago-production.mjs';
import {checkoutMethods} from '../payments/mercadopago-test.mjs';
import {walletSchema,postMovement} from '../wallet/ledger.mjs';
import {safeProviderError} from '../providers/sixofire-read.mjs';
const ROOT='/api/diamonds/purchase';
export function purchaseConfiguration(env){
 const reasons=[];for(const [key,reason] of [['DIAMOND_PRODUCTION_ENABLED','PRODUCT_PAYMENTS_DISABLED'],['RA_READ_ENABLED','RA_READ_DISABLED'],['RA_DELIVERY_ENABLED','DELIVERY_DISABLED'],['RA_CONTRACT_VERIFIED','PROVIDER_CONTRACT_UNVERIFIED']])if(env[key]!=='true')reasons.push(reason);
 if(!env.FF_INFO_API_KEY)reasons.push('PLAYER_VERIFIER_MISSING');
 if(!env.RECARGAS_AMERICA_API_KEY)reasons.push('PROVIDER_KEY_MISSING');else if(String(env.RECARGAS_AMERICA_API_KEY).startsWith('ra_test_'))reasons.push('PROVIDER_TEST_KEY');
 try{if(!Object.keys(raMapping(env)).length)reasons.push('RA_MAPPING_MISSING');}catch{reasons.push('RA_MAPPING_INVALID');}
 if(env.MP_PRODUCTION_READ_ENABLED!=='true'||!productionToken(env)||!env.MP_COLLECTOR_ID_PRODUCTION||!env.MP_WEBHOOK_SECRET_PRODUCTION)reasons.push('PRODUCTION_PAYMENT_CONFIG_MISSING');return {enabled:!reasons.length,reasons};
}
async function schemas(db){await diamondSchema(db);await walletSchema(db);await db.prepare(`CREATE TABLE IF NOT EXISTS zx_product_payments (order_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,method TEXT NOT NULL,region TEXT NOT NULL,collector_id TEXT NOT NULL,amount_cents INTEGER NOT NULL,checkout_url TEXT,preference_id TEXT,payment_id TEXT UNIQUE,state TEXT NOT NULL DEFAULT 'creating',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();}
export async function verifiedPlayer(env,uid,fetcher){if(!env.FF_INFO_API_KEY)throw Error('PLAYER_VERIFIER_MISSING');const r=await fetcher('https://developers.freefirecommunity.com/api/v1/info?'+new URLSearchParams({uid,region:'br'}),{method:'GET',redirect:'manual',headers:{'x-api-key':env.FF_INFO_API_KEY},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('PLAYER_VERIFICATION_FAILED');const b=(await r.json()).basicInfo;if(String(b?.accountId)!==uid||!b?.nickname||!/^[A-Z]{2,5}$/.test(String(b.region)))throw Error('PLAYER_VERIFICATION_FAILED');return String(b.region);}
export async function spendOrderWallet(db,order,user){
 if(order.user_id!==user.id||user.status!=='active')throw Error('WALLET_OWNER_MISMATCH');
 const old=await db.prepare('SELECT method FROM zx_product_payments WHERE order_id=?').bind(order.id).first();if(old?.method!=='wallet')throw Error('PAYMENT_METHOD_CONFLICT');
 const movement=await postMovement(db,{userId:user.id,kind:'purchase',amountCents:order.sale_price_cents,currency:'MXN',source:'diamond-wallet',reference:order.id,requestKey:'diamond:'+order.id,orderId:order.id,actor:'wallet-purchase'});
 // Idempotent recovery after a crash between debit and state update.
 await db.batch([db.prepare("UPDATE zx_diamond_orders SET state='PAID',payment_reference=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND paid_at IS NULL AND state='PENDING_PAYMENT'").bind('wallet:'+movement.id,order.id),db.prepare("UPDATE zx_product_payments SET state='paid' WHERE order_id=? AND method='wallet'").bind(order.id)]);return movement;
}
export async function reconcileProductPayment(env,p,fetcher=fetch){
 const table=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_product_payments'").first();if(!table)return {ignored:true};
 const row=await env.DB.prepare('SELECT * FROM zx_product_payments WHERE order_id=?').bind(String(p.external_reference||'')).first();if(!row)return {ignored:true};
 if(row.method==='wallet'||!productionEvidence(p,{...row,id:row.order_id})||(row.payment_id&&row.payment_id!==String(p.id)))throw Error('PRODUCT_PAYMENT_EVIDENCE_REJECTED');
 if(p.status==='refunded'||p.status==='charged_back'||Number(p.transaction_amount_refunded||0)>0){await env.DB.prepare("UPDATE zx_product_payments SET state='review_required' WHERE order_id=?").bind(row.order_id).run();return {reviewRequired:true};}
 if(p.status!=='approved'||row.state==='review_required')return {pending:true};
 await env.DB.batch([env.DB.prepare("UPDATE zx_product_payments SET state='paid',payment_id=? WHERE order_id=? AND state IN ('creating','needs_review','ready','paid') AND (payment_id IS NULL OR payment_id=?)").bind(String(p.id),row.order_id,String(p.id)),env.DB.prepare("UPDATE zx_diamond_orders SET state='PAID',payment_reference=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND paid_at IS NULL AND state='PENDING_PAYMENT' AND EXISTS(SELECT 1 FROM zx_product_payments WHERE order_id=? AND state='paid' AND payment_id=?)").bind('mercadopago:'+p.id,row.order_id,row.order_id,String(p.id))]);
 env=await resolvedRaEnvironment(env);
 if(!purchaseConfiguration(env).enabled)return {paid:true,deliveryPending:true};
 return {paid:true,...await fulfill(env,row.order_id,fetcher)};
}
async function fulfill(env,id,fetcher){const order=await env.DB.prepare('SELECT * FROM zx_diamond_orders WHERE id=?').bind(id).first(),payment=await env.DB.prepare('SELECT region,state FROM zx_product_payments WHERE order_id=?').bind(id).first();if(!order?.paid_at||payment?.state!=='paid')return {deliveryPending:true};
 const plan=JSON.parse(order.snapshot_json).fulfillmentPlan;
 // Old Sixofire orders stay in review; never reroute an already-paid order to another supplier.
 if(plan?.provider!=='recargas-america')return {deliveryPending:true,reviewRequired:true};
 if(plan.playerId!==order.player_id||plan.region!==payment.region)throw Error('RA_PLAN_MISMATCH');const provider=raProvider(env,plan,fetcher);
 // Bound work per request. Lost responses remain PROCESSING; no automatic resubmission.
 const result=await runOrder(env.DB,id,{provider,skuMap:Object.fromEntries(plan.packs.map(p=>[p.diamonds,p.sku])),maxOperations:4,maxAttempts:1});return {delivery:result};
}
export async function purchaseRoute(request,env,url,user,json,fetcher=fetch){
 const reply=(body,status=200)=>{const r=json(body,status);r.headers?.set('Cache-Control','no-store');return r;};
 if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 env=await resolvedRaEnvironment(env);
 const config=purchaseConfiguration(env);
 if(url.pathname===ROOT+'/status'&&request.method==='GET')return reply({ok:true,pilot:true,enabled:user.isFounder===true&&config.enabled,walletEnabled:user.isFounder===true&&config.enabled,reasons:user.isFounder===true?config.reasons:['FOUNDER_PILOT_ONLY']});
 if(user.isFounder!==true)return reply({ok:false,error:'FOUNDER_PILOT_ONLY'},403);
 try{
  const match=url.pathname.match(/^\/api\/diamonds\/purchase\/orders\/([a-f0-9-]{36})$/);
  if(match&&request.method==='GET'){
   const table=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_product_payments'").first();if(!table)return reply({ok:false,error:'NOT_FOUND'},404);
   const row=await env.DB.prepare("SELECT o.id,o.state,o.diamonds,o.delivered,o.sale_price_cents,p.checkout_url,p.state AS paymentState,CASE WHEN p.method='wallet' AND EXISTS(SELECT 1 FROM zx_wallet_ledger l WHERE l.user_id=o.user_id AND l.source='diamond-wallet' AND l.reference=o.id AND l.order_id=o.id AND l.amount_cents=-o.sale_price_cents) THEN 1 ELSE 0 END AS recoveryAvailable FROM zx_diamond_orders o JOIN zx_product_payments p ON p.order_id=o.id WHERE o.id=? AND o.user_id=?").bind(match[1],user.id).first();return row?reply({ok:true,order:row}):reply({ok:false,error:'NOT_FOUND'},404);
  }
  if(!config.enabled)return reply({ok:false,error:'PRODUCT_DELIVERY_NOT_READY',reasons:config.reasons},503);
  if(![ROOT+'/checkout',ROOT+'/wallet',ROOT+'/resume'].includes(url.pathname)||request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const body=await request.json();
  if(url.pathname===ROOT+'/resume'){
   if(!/^[a-f0-9-]{36}$/.test(body.orderId||''))return reply({ok:false,error:'INVALID_REQUEST'},400);
   const own=await env.DB.prepare('SELECT * FROM zx_diamond_orders WHERE id=? AND user_id=?').bind(body.orderId,user.id).first();if(!own)return reply({ok:false,error:'NOT_FOUND'},404);
   if(!own.paid_at){const debit=await env.DB.prepare("SELECT id FROM zx_wallet_ledger WHERE user_id=? AND source='diamond-wallet' AND reference=? AND kind='purchase' AND order_id=? AND amount_cents=?").bind(user.id,own.id,own.id,-own.sale_price_cents).first();if(debit)await spendOrderWallet(env.DB,own,user);}
   return reply({ok:true,...await fulfill(env,own.id,fetcher)});
  }
  const key=request.headers.get('Idempotency-Key'),uid=String(body.playerId||''),method=url.pathname.endsWith('/wallet')?'wallet':body.method||'all';
  if(!/^[a-f0-9-]{36}$/.test(key||'')||!/^\d{5,15}$/.test(uid)||body.playerConfirmed!==true||!['wallet','card','oxxo','spei','all'].includes(method))return reply({ok:false,error:'INVALID_REQUEST'},400);
  const product=await publishedProduct(env.DB,getProduct(body.productId));if(!product||product.salePriceCents>20000)return reply({ok:false,error:'PRODUCT_OUTSIDE_PILOT'},400);
  const region=await verifiedPlayer(env,uid,fetcher);const plan=await raAmountPreflight(env,product.diamonds,region,uid,fetcher);if(method!=='wallet')await productionAccount(env,fetcher);
  await schemas(env.DB);const order=await createOrder(env.DB,{userId:user.id,requestKey:key,productId:product.id,playerId:uid,fulfillmentPlan:plan});
  if(JSON.parse(order.snapshot_json).fulfillmentPlan?.provider!=='recargas-america')return reply({ok:false,error:'LEGACY_ORDER_REVIEW_REQUIRED',orderId:order.id},409);
  const old=await env.DB.prepare('SELECT * FROM zx_product_payments WHERE order_id=?').bind(order.id).first();
  if(old&&old.method!==method)return reply({ok:false,error:'PAYMENT_METHOD_CONFLICT'},409);
  if(method==='wallet'){
   await env.DB.prepare("INSERT INTO zx_product_payments(order_id,user_id,method,region,collector_id,amount_cents) VALUES(?,?,'wallet',?,?,?) ON CONFLICT DO NOTHING").bind(order.id,user.id,region,String(env.MP_COLLECTOR_ID_PRODUCTION),order.sale_price_cents).run();
   try{await spendOrderWallet(env.DB,order,user);}catch(error){if(error.message==='WALLET_MOVEMENT_REJECTED'||error.message==='WALLET_IDEMPOTENCY_CONFLICT')throw error;return reply({ok:false,error:'WALLET_RECONCILIATION_REQUIRED',orderId:order.id},503);}
   try{return reply({ok:true,orderId:order.id,...await fulfill(env,order.id,fetcher)});}catch{return reply({ok:true,orderId:order.id,deliveryPending:true,reviewRequired:true});}
  }
  if(old)return old.checkout_url?reply({ok:true,orderId:order.id,checkoutUrl:old.checkout_url}):reply({ok:false,error:'CHECKOUT_RECONCILIATION_REQUIRED',orderId:order.id},409);
  const claim=await env.DB.prepare('INSERT INTO zx_product_payments(order_id,user_id,method,region,collector_id,amount_cents) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(order.id,user.id,method,region,String(env.MP_COLLECTOR_ID_PRODUCTION),order.sale_price_cents).run();if(!claim.meta.changes)return reply({ok:false,error:'CHECKOUT_RECONCILIATION_REQUIRED',orderId:order.id},409);
  const back='https://zerox-store.pages.dev/product-payment.html?order='+order.id;
  try{
   const response=await fetcher('https://api.mercadopago.com/checkout/preferences',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+productionToken(env),'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({items:[{id:order.product_id,title:product.name||order.diamonds+' diamantes',quantity:1,currency_id:'MXN',unit_price:order.sale_price_cents/100}],external_reference:order.id,payment_methods:checkoutMethods(method),notification_url:'https://zerox-sixofire-api.westdark161208.workers.dev/api/payments/mercadopago/funding/webhook',back_urls:{success:back,pending:back,failure:back},expires:true,expiration_date_to:new Date(Date.now()+3600000).toISOString()})});if(!response.ok)throw Error('failed');const pref=await response.json(),link=new URL(pref.init_point);if(link.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(link.hostname)||link.username||link.password||String(pref.collector_id)!==String(env.MP_COLLECTOR_ID_PRODUCTION)||!pref.id)throw Error('failed');
   await env.DB.prepare("UPDATE zx_product_payments SET state='ready',checkout_url=?,preference_id=? WHERE order_id=?").bind(link.href,String(pref.id),order.id).run();return reply({ok:true,orderId:order.id,checkoutUrl:link.href});
  }catch{await env.DB.prepare("UPDATE zx_product_payments SET state='needs_review' WHERE order_id=?").bind(order.id).run();return reply({ok:false,error:'CHECKOUT_RECONCILIATION_REQUIRED',orderId:order.id},503);}
 }catch(error){const explicit=['PROVIDER_MAPPING_INVALID','PROVIDER_MAPPING_MISSING','PROVIDER_DIAMOND_AMOUNT_MISMATCH','PROVIDER_DIRECT_PRODUCT_REQUIRED','PROVIDER_PRODUCT_UNAVAILABLE','PROVIDER_REGION_UNAVAILABLE','PROVIDER_ORDER_ACCESS_UNVERIFIED','PLAYER_VERIFIER_MISSING','PLAYER_VERIFICATION_FAILED','WALLET_MOVEMENT_REJECTED','WALLET_IDEMPOTENCY_CONFLICT','PAYMENT_METHOD_CONFLICT','IDEMPOTENCY_CONFLICT'];return reply({ok:false,error:explicit.includes(error.message)||/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|INVALID_QUERY|HTTP_\d{3}|MAPPING_INVALID|MAPPING_MISSING|REGION_UNVERIFIED|REGION_UNAVAILABLE|PRODUCT_UNAVAILABLE|PRODUCT_MISMATCH|CURRENCY_UNVERIFIED|INSUFFICIENT_FUNDS|PLAYER_REJECTED|PLAN_MISMATCH|AMOUNT_INVALID|PRICE_INVALID|EXACT_RECIPE_UNAVAILABLE)$/.test(error.message)?error.message:safeProviderError(error)},503);}
}
