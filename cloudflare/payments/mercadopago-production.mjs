// Production inspection only. No checkout, transfer, refund or ledger write.
// Existing MP_ACCESS_TOKEN was confirmed as production; never use the TEST secret.
export function productionToken(env){return env.MP_ACCESS_TOKEN_PRODUCTION||env.MP_ACCESS_TOKEN||'';}
export function paymentCents(value){
 const text=String(value);
 if(!/^\d{1,10}(\.\d{1,2})?$/.test(text))return null;
 const [whole,fraction='']=text.split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return Number.isSafeInteger(cents)?cents:null;
}
export function productionEvidence(payment,intent){
 return payment.live_mode===true && /^\d{1,30}$/.test(String(payment.id)) &&
  String(payment.external_reference)===intent.id && payment.currency_id==='MXN' &&
  paymentCents(payment.transaction_amount)===intent.amount_cents &&
  String(payment.collector_id)===String(intent.collector_id);
}
export async function productionPayment(env,id,fetcher=fetch){
 if(env.MP_PRODUCTION_READ_ENABLED!=='true')throw Error('MP_PRODUCTION_READ_DISABLED');
 if(!productionToken(env)||!env.MP_COLLECTOR_ID_PRODUCTION)throw Error('MP_PRODUCTION_CONFIG_MISSING');
 if(!/^\d{1,30}$/.test(String(id)))throw Error('INVALID_PAYMENT_ID');
 const response=await fetcher('https://api.mercadopago.com/v1/payments/'+id,{method:'GET',redirect:'error',
  headers:{Authorization:'Bearer '+productionToken(env),Accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('MP_PRODUCTION_UNAVAILABLE');
 const payment=await response.json();
 if(payment.live_mode!==true||String(payment.id)!==String(id)||String(payment.collector_id)!==String(env.MP_COLLECTOR_ID_PRODUCTION)||payment.currency_id!=='MXN'||paymentCents(payment.transaction_amount)===null)throw Error('MP_PRODUCTION_EVIDENCE_REJECTED');
 return payment;
}
// Connection evidence only; matching account does not prove a live payment.
export async function productionAccount(env,fetcher=fetch){
 if(env.MP_PRODUCTION_READ_ENABLED!=='true')throw Error('MP_PRODUCTION_READ_DISABLED');
 if(!productionToken(env)||!env.MP_COLLECTOR_ID_PRODUCTION)throw Error('MP_PRODUCTION_CONFIG_MISSING');
 let response;
 try{response=await fetcher('https://api.mercadopago.com/users/me',{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+productionToken(env),Accept:'application/json'},signal:AbortSignal.timeout(12000)});}
 catch(e){throw Error(e.name==='TimeoutError'||e.name==='AbortError'?'MP_PRODUCTION_TIMEOUT':'MP_PRODUCTION_CONNECTION_FAILED');}
 if(response.status===401)throw Error('MP_PRODUCTION_CREDENTIAL_REJECTED');
 if(response.status===403)throw Error('MP_PRODUCTION_ACCESS_REJECTED');
 if(response.status===429)throw Error('MP_PRODUCTION_RATE_LIMITED');
 if(!response.ok)throw Error('MP_PRODUCTION_UNAVAILABLE');
 let account;try{account=await response.json();}catch{throw Error('MP_PRODUCTION_UNAVAILABLE');}
 if(!account||typeof account!=='object')throw Error('MP_PRODUCTION_UNAVAILABLE');
 if(!/^\d{1,30}$/.test(String(account.id))||String(account.id)!==String(env.MP_COLLECTOR_ID_PRODUCTION)||account.site_id!=='MLM')throw Error('MP_PRODUCTION_ACCOUNT_MISMATCH');
 return {receiverMatched:true,site:'MLM'};
}
export async function productionReadRoute(request,env,url,user,json,fetcher=fetch){
 const reply=(body,status=200)=>{const r=json(body,status);r.headers?.set('Cache-Control','no-store');return r;};
 if(!user||user.status!=='active'||user.isFounder!==true)return reply({ok:false,error:'FORBIDDEN'},403);
 if(request.method!=='GET')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 const root='/api/admin/payments/mercadopago';
 if(url.pathname===root+'/status')return reply({ok:true,readEnabled:env.MP_PRODUCTION_READ_ENABLED==='true',tokenConfigured:!!productionToken(env),collectorConfigured:!!env.MP_COLLECTOR_ID_PRODUCTION,webhookConfigured:!!env.MP_WEBHOOK_SECRET_PRODUCTION,checkoutEnabled:env.MP_WALLET_PILOT_ENABLED==='true'&&env.MP_PRODUCTION_READ_ENABLED==='true'&&!!productionToken(env)&&!!env.MP_COLLECTOR_ID_PRODUCTION&&!!env.MP_WEBHOOK_SECRET_PRODUCTION,walletFundingEnabled:false});
 if(url.pathname===root+'/account'){
  try{return reply({ok:true,account:await productionAccount(env,fetcher),paymentVerified:false,walletCredited:false,deliveryEnabled:false});}
  catch(e){const safe=['MP_PRODUCTION_READ_DISABLED','MP_PRODUCTION_CONFIG_MISSING','MP_PRODUCTION_ACCOUNT_MISMATCH','MP_PRODUCTION_CREDENTIAL_REJECTED','MP_PRODUCTION_ACCESS_REJECTED','MP_PRODUCTION_RATE_LIMITED','MP_PRODUCTION_TIMEOUT','MP_PRODUCTION_CONNECTION_FAILED'].includes(e.message)?e.message:'MP_PRODUCTION_UNAVAILABLE';return reply({ok:false,error:safe},503);}
 }
 const match=url.pathname.match(/^\/api\/admin\/payments\/mercadopago\/payments\/(\d{1,30})$/);
 if(!match)return reply({ok:false,error:'NOT_FOUND'},404);
 try{
  const p=await productionPayment(env,match[1],fetcher);
  return reply({ok:true,payment:{id:String(p.id),status:p.status,currency:'MXN',amountCents:paymentCents(p.transaction_amount),refundedCents:paymentCents(p.transaction_amount_refunded??0),externalReference:String(p.external_reference||''),liveMode:true},walletCredited:false,deliveryEnabled:false});
 }catch(e){
  const safe=['MP_PRODUCTION_READ_DISABLED','MP_PRODUCTION_CONFIG_MISSING','MP_PRODUCTION_EVIDENCE_REJECTED'].includes(e.message)?e.message:'MP_PRODUCTION_UNAVAILABLE';
  return reply({ok:false,error:safe},503);
 }
}
