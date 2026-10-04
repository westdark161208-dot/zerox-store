import {fundingSchema,createFundingIntent,reconcileFunding} from './funding.mjs';
import {walletSchema} from '../wallet/ledger.mjs';
import {settleFunding} from './settlement.mjs';
import {productionPayment,productionToken} from './mercadopago-production.mjs';
import {validSignature} from './mercadopago-test.mjs';
const ROOT='/api/payments/mercadopago/funding';
const SITE='https://zerox-store.pages.dev';
const HOOK='https://zerox-sixofire-api.westdark161208.workers.dev'+ROOT+'/webhook';
function enabled(env){return env.MP_WALLET_PILOT_ENABLED==='true'&&env.MP_PRODUCTION_READ_ENABLED==='true'&&!!productionToken(env)&&!!env.MP_COLLECTOR_ID_PRODUCTION&&!!env.MP_WEBHOOK_SECRET_PRODUCTION;}
async function schemas(db){
 await fundingSchema(db);await walletSchema(db);
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_funding_checkouts (
  intent_id TEXT PRIMARY KEY,checkout_url TEXT,preference_id TEXT,state TEXT NOT NULL DEFAULT 'creating',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}
export async function processFundingPayment(env,payment){
 const result=await reconcileFunding(env.DB,payment);
 if(['verified','confirmed'].includes(result.state))return {...result,...await settleFunding(env.DB,result.id)};
 return result;
}
export async function fundingRoute(request,env,url,user,json,fetcher=fetch){
 const reply=(body,status=200)=>{const r=json(body,status);r.headers?.set('Cache-Control','no-store');return r;};
 const webhook=url.pathname===ROOT+'/webhook';
 if(!webhook&&(!user||user.status!=='active'||user.isFounder!==true))return reply({ok:false,error:'FOUNDER_REQUIRED'},403);
 if(!enabled(env))return reply({ok:false,error:'FUNDING_PILOT_DISABLED'},503);
 try{
  if(webhook){
   if(request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   if(!await validSignature(request,url,env.MP_WEBHOOK_SECRET_PRODUCTION))return reply({ok:false,error:'INVALID_SIGNATURE'},401);
   const id=url.searchParams.get('data.id');
   if(!/^\d{1,30}$/.test(id))return reply({ok:false,error:'INVALID_PAYMENT_ID'},400);
   const body=await request.json();
   if(body.type!=='payment')return reply({ok:true,ignored:true});
   if(String(body.data?.id)!==id)return reply({ok:false,error:'PAYMENT_ID_MISMATCH'},400);
   // Fresh authoritative evidence; browser body is never financial evidence.
   const payment=await productionPayment(env,id,fetcher);
   await schemas(env.DB);
   const intent=await env.DB.prepare('SELECT id FROM zx_funding_intents WHERE id=?').bind(String(payment.external_reference||'')).first();
   if(!intent)return reply({ok:true,ignored:true});
   await processFundingPayment(env,payment);return reply({ok:true});
  }
  if(url.pathname===ROOT+'/checkout'&&request.method==='POST'){
   const body=await request.json(),key=request.headers.get('Idempotency-Key');
   if(!/^[a-f0-9-]{36}$/.test(key||'')||!Number.isSafeInteger(body.amountCents)||body.amountCents<1000||body.amountCents>20000)return reply({ok:false,error:'INVALID_FUNDING_REQUEST'},400);
   await schemas(env.DB);
   const intent=await createFundingIntent(env.DB,{id:key,userId:user.id,amountCents:body.amountCents,collectorId:String(env.MP_COLLECTOR_ID_PRODUCTION),requestKey:key});
   if(intent.state!=='pending')return reply({ok:false,error:'FUNDING_ATTEMPT_ALREADY_PROCESSED'},409);
   // Claim once before remote call. Ambiguous failures are not automatically retried.
   const claim=await env.DB.prepare('INSERT INTO zx_funding_checkouts(intent_id) VALUES(?) ON CONFLICT DO NOTHING').bind(intent.id).run();
   if(!claim.meta.changes){
    const old=await env.DB.prepare('SELECT checkout_url,state FROM zx_funding_checkouts WHERE intent_id=?').bind(intent.id).first();
    return old.checkout_url?reply({ok:true,id:intent.id,checkoutUrl:old.checkout_url}):reply({ok:false,error:'CHECKOUT_RECONCILIATION_REQUIRED'},409);
   }
   const back=SITE+'/wallet-payment.html?attempt='+intent.id;
   let pref;
   try{
    const response=await fetcher('https://api.mercadopago.com/checkout/preferences',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+productionToken(env),'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({
     items:[{id:intent.id,title:'Saldo Zero’X · prueba controlada',quantity:1,currency_id:'MXN',unit_price:intent.amount_cents/100}],external_reference:intent.id,
     back_urls:{success:back,pending:back,failure:back},notification_url:HOOK,expires:true,expiration_date_to:new Date(Date.now()+3600000).toISOString()
    })});
    if(!response.ok)throw Error('CHECKOUT_FAILED');pref=await response.json();
    const checkout=new URL(pref.init_point);
    if(checkout.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(checkout.hostname)||checkout.username||checkout.password||String(pref.collector_id)!==intent.collector_id||!pref.id)throw Error('CHECKOUT_FAILED');
    await env.DB.prepare("UPDATE zx_funding_checkouts SET state='ready',checkout_url=?,preference_id=? WHERE intent_id=?").bind(checkout.href,String(pref.id),intent.id).run();
    return reply({ok:true,id:intent.id,checkoutUrl:checkout.href});
   }catch{
    await env.DB.prepare("UPDATE zx_funding_checkouts SET state='needs_review' WHERE intent_id=?").bind(intent.id).run();
    return reply({ok:false,error:'CHECKOUT_RECONCILIATION_REQUIRED'},503);
   }
  }
  const match=url.pathname.match(/^\/api\/payments\/mercadopago\/funding\/intents\/([a-f0-9-]{36})$/);
  if(match&&request.method==='GET'){
   await schemas(env.DB);
   const row=await env.DB.prepare('SELECT id,state,amount_cents,payment_id FROM zx_funding_intents WHERE id=? AND user_id=?').bind(match[1],user.id).first();
   if(!row)return reply({ok:false,error:'NOT_FOUND'},404);
   // Read-only browser return: only signed webhook processing may change funding state.
   const saved=await env.DB.prepare('SELECT state FROM zx_funding_intents WHERE id=?').bind(row.id).first();
   const checkout=await env.DB.prepare('SELECT checkout_url FROM zx_funding_checkouts WHERE intent_id=?').bind(row.id).first();
   return reply({ok:true,id:row.id,state:saved.state,amountCents:row.amount_cents,currency:'MXN',checkoutUrl:saved.state==='pending'?checkout?.checkout_url||null:null,deliveryEnabled:false});
  }
  return reply({ok:false,error:'NOT_FOUND'},404);
 }catch(e){
  const safe=['FUNDING_CONFLICT','FUNDING_EVIDENCE_REJECTED','FUNDING_PAYMENT_CONFLICT','FUNDING_NOT_VERIFIED','FUNDING_SETTLEMENT_REJECTED'].includes(e.message)?e.message:'FUNDING_UNAVAILABLE';
  return reply({ok:false,error:safe},safe==='FUNDING_CONFLICT'?409:503);
 }
}
