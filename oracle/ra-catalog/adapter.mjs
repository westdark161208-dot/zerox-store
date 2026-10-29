// RA catalogue contract adapter. Not wired to production until the private
// transport and reseller ledger reservation/reconciliation are configured.
// upstream returns {httpStatus, body}, INCLUDING JSON bodies on non-2xx errors.
import {digest} from '../../cloudflare/ra-purchase/protocol.mjs';
const ref = x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(x);
const text = x => typeof x === 'string' && x.length > 0 && x.length <= 240 && !/[\x00-\x1f]/.test(x);
const fields = ['player_id','zone_id','server_id'];
const pending = new Set(['QUEUED','PROCESSING','PROCESSING_PROVIDER','PROCESSING_API']);
const terminal = new Set(['COMPLETED','PARTIAL','NEEDS_REVIEW','REFUNDED']);
export function requirePlan(p) {
 if (!p || !Number.isSafeInteger(p.productId) || p.productId < 1 || !text(p.sku) || !text(p.name) || !['recharge','game','pin','streaming'].includes(p.type) || p.quantity !== 1 || !Number.isFinite(p.maxPriceUsd) || p.maxPriceUsd <= 0 || !p.fields || Object.getPrototypeOf(p.fields) !== Object.prototype || Object.keys(p.fields).some(k => !fields.includes(k) || !text(p.fields[k]))) throw Error('INVALID_PLAN');
}
function delivery(d,type) {
 if (!Array.isArray(d) || d.length > 1) return null;
 if (type==='pin') return d.length===1 && text(d[0]?.key) && (d[0].serial==null || text(d[0].serial)) ? [{key:d[0].key,...(d[0].serial==null?{}:{serial:d[0].serial})}] : null;
 if (type==='streaming') return d.length===1 && text(d[0]?.username) && text(d[0]?.password) ? [{username:d[0].username,password:d[0].password}] : null;
 return d.length===0 ? [] : null;
}
export function normalize(reply,plan,action,reference) {
 const b=reply?.body,d=b?.data;
 const r=ref(d?.order_id)?d.order_id:undefined;
 const review=()=>({state:'REQUIRES_REVIEW',...(r?{reference:r}:{})});
 if (!d || reference && r!==reference || !r) return review();
 if (b.success!==true || reply.httpStatus<200 || reply.httpStatus>=300 || d.needs_review===true) return review();
 if (Object.hasOwn(d,'needs_review') && typeof d.needs_review!=='boolean') return review();
 if ((action==='submit'?d.item:d.product)!==plan.name || Object.hasOwn(d,'quantity') && d.quantity!==1) return review();
 if (action==='submit' && (!Number.isFinite(Number(d.amount_charged)) || Number(d.amount_charged)<=0 || Number(d.amount_charged)>plan.maxPriceUsd)) return review();
 if (pending.has(d.status)) return {state:'PROCESSING',reference:r};
 if (!terminal.has(d.status) || d.status!=='COMPLETED') return review();
 const items=delivery(d.delivery,plan.type);
 return items===null?review():{state:'COMPLETED',reference:r,delivery:items};
}
export function createCatalogAdapter({store,upstream}) {
 async function preflight(plan) {
  requirePlan(plan);
  const r=await upstream('/products/catalog','GET');
  if (r.httpStatus!==200 || r.body?.success!==true || !Array.isArray(r.body.data)) throw Error('CATALOG_UNAVAILABLE');
  const matches=r.body.data.filter(p=>p.id===plan.productId),p=matches[0];
  if(matches.length!==1 || p.sku!==plan.sku || p.name!==plan.name || p.type!==plan.type || !Number.isFinite(Number(p.price)) || Number(p.price)<=0 || Number(p.price)>plan.maxPriceUsd) throw Error('PRODUCT_CHANGED');
  if(!Array.isArray(p.required_fields) || new Set(p.required_fields).size!==p.required_fields.length || p.required_fields.some(k=>!fields.includes(k)) || p.required_fields.some(k=>!plan.fields[k]) || Object.keys(plan.fields).some(k=>!p.required_fields.includes(k))) throw Error('INVALID_FIELDS');
  // field_options shape needs explicit verification before accepting such products.
  if(p.field_options && Object.keys(p.field_options).length) throw Error('FIELD_OPTIONS_REVIEW_REQUIRED');
  let validation={supported:false};
  if(plan.fields.player_id){
   const v=await upstream('/catalog/validate','POST',{product_id:plan.productId,service_user_id:plan.fields.player_id,...(plan.fields.zone_id?{zone_id:plan.fields.zone_id}:{})});
   if(v.httpStatus!==200 || v.body?.success!==true || typeof v.body.data?.supported!=='boolean') throw Error('VALIDATION_UNAVAILABLE');
   const d=v.body.data;
   if(d.supported && d.status!==true) throw Error('INVALID_PLAYER');
   validation={supported:d.supported,...(d.supported?{valid:true,...(text(d.account_name)?{accountName:d.account_name}:{})}:{})};
  }
  const w=await upstream('/wallet','GET');
  if(w.httpStatus!==200 || w.body?.success!==true || w.body.data?.currency!=='USD' || !Number.isFinite(Number(w.body.data.balance)) || Number(w.body.data.balance)<Number(p.price)) throw Error('PROVIDER_FUNDS_UNAVAILABLE');
  return {priceUsd:Number(p.price),validation};
 }
 async function submit(operationId,plan){
  requirePlan(plan);
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(operationId)) throw Error('INVALID_OPERATION');
  const hash=await digest(JSON.stringify([plan.productId,plan.sku,plan.name,plan.type,plan.quantity,plan.maxPriceUsd,fields.map(k=>[k,plan.fields[k]||''])]));
  const claim=store.claim(operationId,hash);
  if(claim.hash!==hash) throw Error('REQUEST_CONFLICT');
  if(!claim.created) return claim.result;
  let sent=false,result;
  try{
   await preflight(plan);
   sent=true;
   const r=await upstream('/buy/catalog','POST',{product_id:plan.productId,quantity:1,...plan.fields});
   result=normalize(r,plan,'submit');
  }catch{result={state:sent?'REQUIRES_REVIEW':'NOT_SUBMITTED'};}
  // If persistence fails, the durable UNKNOWN claim still prevents resubmission.
  store.save(operationId,result);return result;
 }
 async function lookup(operationId,plan){
  requirePlan(plan);
  const hash=await digest(JSON.stringify([plan.productId,plan.sku,plan.name,plan.type,plan.quantity,plan.maxPriceUsd,fields.map(k=>[k,plan.fields[k]||''])]));
  const old=store.get(operationId);
  if(!old || old.hash!==hash) throw Error('REQUEST_CONFLICT');
  if(old.result.state==='COMPLETED' || !ref(old.reference)) return old.result;
  let result;
  try{result=normalize(await upstream('/catalog/orders/'+old.reference,'GET'),plan,'lookup',old.reference);}catch{return old.result;}
  // Never replace our reference with an unrelated provider response.
  if(result.reference && result.reference!==old.reference) return {state:'REQUIRES_REVIEW',reference:old.reference};
  result.reference=old.reference;store.save(operationId,result);return result;
 }
 return {preflight,submit,lookup};
}
