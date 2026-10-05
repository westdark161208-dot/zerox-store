import {createPlanner} from './catalog.mjs';
import {readRecargasAmerica,validateRecargasAccount} from '../providers/recargas-america.mjs';
const BASE='https://panel.recargasamerica.com/api/v1';
const safeRef=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v);
// Store totals include the merchant's 10% bonus. Never infer supplier delivery from a name.
export function raMapping(env){
 let map;try{map=JSON.parse(env.RA_DIAMOND_PACKS||'{}');}catch{throw Error('RA_MAPPING_INVALID');}
 if(!map||Array.isArray(map)||typeof map!=='object')throw Error('RA_MAPPING_INVALID');
 for(const [total,p] of Object.entries(map)){
  if(!/^[1-9]\d{0,5}$/.test(total)||!p||!Number.isSafeInteger(p.productId)||p.productId<1||typeof p.sku!=='string'||!p.sku||typeof p.name!=='string'||!p.name.trim()||!Number.isSafeInteger(p.baseDiamonds)||p.baseDiamonds<1||!Number.isSafeInteger(p.bonusDiamonds)||p.bonusDiamonds<0||p.baseDiamonds+p.bonusDiamonds!==Number(total)||p.baseDiamonds/10!==p.bonusDiamonds||!Array.isArray(p.regions)||!p.regions.length||p.regions.some(r=>!/^[A-Z]{2,5}$/.test(r))||!['player_id','manual_id'].includes(p.playerField||'player_id')||typeof p.bonusEvidence!=='string'||!p.bonusEvidence.trim())throw Error('RA_MAPPING_INVALID');
 }
 return map;
}
export function validateRaPlan(items,recipe,map,region){
 if(!/^[A-Z]{2,5}$/.test(region||''))throw Error('RA_REGION_UNVERIFIED');
 return recipe.map(pack=>{
  const entry=map[pack.diamonds];if(!entry)throw Error('RA_MAPPING_MISSING');
  const matches=items.filter(p=>p.id===entry.productId);if(matches.length!==1)throw Error('RA_PRODUCT_UNAVAILABLE');const item=matches[0];
  if(item.sku!==entry.sku||item.name!==entry.name||item.type!=='recharge'||item.requiredFields.length!==1||item.requiredFields[0]!==(entry.playerField||'player_id')||!Number.isFinite(Number(item.price))||Number(item.price)<=0)throw Error('RA_PRODUCT_MISMATCH');
  if(!entry.regions.includes(region))throw Error('RA_REGION_UNAVAILABLE');
  return {...pack,...entry,playerField:entry.playerField||'player_id',sku:String(entry.productId),catalogSku:entry.sku,providerItemName:item.name,price:item.price};
 });
}
export async function raPreflight(env,recipe,region,uid,fetcher=fetch){
 const items=await readRecargasAmerica(env,'catalog',fetcher),wallet=await readRecargasAmerica(env,'wallet',fetcher);
 // The supplied v1 contract quotes product prices in USD. Never convert a different wallet implicitly.
 if(wallet.currency!=='USD')throw Error('RA_CURRENCY_UNVERIFIED');
 const packs=validateRaPlan(items,recipe,raMapping(env),region);
 if(packs.reduce((n,p)=>n+Number(p.price)*p.quantity,0)>Number(wallet.balance))throw Error('RA_INSUFFICIENT_FUNDS');
 for(const p of packs){const result=await validateRecargasAccount(env,p.productId,uid,fetcher);if(result.supported&&result.status!==true)throw Error('RA_PLAYER_REJECTED');}
 return {provider:'recargas-america',version:1,region,playerId:uid,currency:wallet.currency,packs};
}
// Fresh supplier quotes choose the cheapest exact recipe, then fewer provider calls.
export function quoteRaAmount(items,map,amount,region){
 if(!Number.isSafeInteger(amount)||amount<1||amount>100930)throw Error('RA_AMOUNT_INVALID');
 if(!Object.keys(map).length)throw Error('RA_MAPPING_MISSING');
 const candidates=Object.entries(map).filter(([,p])=>p.regions.includes(region)).map(([total])=>{
  const pack=validateRaPlan(items,[{diamonds:Number(total),quantity:1}],map,region)[0];
  const micros=Math.ceil(Number(pack.price)*1e6);
  if(!Number.isSafeInteger(micros)||micros<1||micros>1000000000)throw Error('RA_PRICE_INVALID');
  return {...pack,costCents:micros};
 });
 if(!candidates.length)throw Error('RA_REGION_UNAVAILABLE');
 let packs;try{packs=createPlanner(candidates,amount)(amount);}catch{throw Error('RA_EXACT_RECIPE_UNAVAILABLE');}
 const totalMicros=packs.reduce((n,p)=>n+p.costCents*p.quantity,0);
 if(!Number.isSafeInteger(totalMicros))throw Error('RA_PRICE_INVALID');
 return {packs:packs.map(({costCents,...p})=>p),totalMicros,operationCount:packs.reduce((n,p)=>n+p.quantity,0)};
}
export async function raLiveQuote(env,amount,region,uid,fetcher=fetch){
 const [items,wallet]=await Promise.all([readRecargasAmerica(env,'catalog',fetcher),readRecargasAmerica(env,'wallet',fetcher)]);
 if(wallet.currency!=='USD')throw Error('RA_CURRENCY_UNVERIFIED');
 const quote=quoteRaAmount(items,raMapping(env),amount,region),balanceMicros=Math.floor(Number(wallet.balance)*1e6);
 if(!Number.isSafeInteger(balanceMicros))throw Error('RA_CURRENCY_UNVERIFIED');
 return {plan:{provider:'recargas-america',version:1,region,playerId:uid,currency:'USD',quotedAt:new Date().toISOString(),...quote},wallet,canAfford:balanceMicros>=quote.totalMicros};
}
export async function raAmountPreflight(env,amount,region,uid,fetcher=fetch){
 const quote=await raLiveQuote(env,amount,region,uid,fetcher);
 if(!quote.canAfford)throw Error('RA_INSUFFICIENT_FUNDS');
 for(const p of quote.plan.packs){const result=await validateRecargasAccount(env,p.productId,uid,fetcher);if(result.supported&&result.status!==true)throw Error('RA_PLAYER_REJECTED');}
 return quote.plan;
}
// Immutable checkout plan protects already-paid orders from later SKU/region/configuration changes.
async function recheck(env,plan,pack,uid,fetcher){
 const items=await readRecargasAmerica(env,'catalog',fetcher),wallet=await readRecargasAmerica(env,'wallet',fetcher),matches=items.filter(p=>p.id===pack.productId);
 const item=matches[0];if(matches.length!==1||item.sku!==pack.catalogSku||item.name!==pack.providerItemName||item.type!=='recharge'||item.requiredFields.length!==1||!['player_id','manual_id'].includes(pack.playerField||'player_id')||item.requiredFields[0]!==(pack.playerField||'player_id')||Number(item.price)>Number(pack.price)||Number(item.price)<=0)throw Error('RA_PRODUCT_MISMATCH');
 if(wallet.currency!==plan.currency||wallet.currency!=='USD'||Number(wallet.balance)<Number(item.price))throw Error('RA_INSUFFICIENT_FUNDS');
 const result=await validateRecargasAccount(env,pack.productId,uid,fetcher);if(result.supported&&result.status!==true)throw Error('RA_PLAYER_REJECTED');return item;
}
function result(body,pack,reference,submitted=false){
 const d=body?.data;if(body?.success!==true||!safeRef(d?.order_id)||reference&&d.order_id!==reference)return {status:'UNKNOWN'};
 const ref=d.order_id,identity=submitted?d.item===pack.providerItemName&&Number(d.amount_charged)>0&&Number(d.amount_charged)<=Number(pack.price):d.product===pack.providerItemName;
 if(!identity)return {status:'UNKNOWN',reference:ref};
 return {status:d.status==='COMPLETED'&&d.needs_review!==true?'SUCCESS':'PROCESSING',reference:ref,receipt:JSON.stringify({provider:'recargas-america',state:String(d.status||'').slice(0,50)})};
}
export function raProvider(env,plan,fetcher=fetch){const allowed=new Map(plan.packs.map(p=>[p.sku,p]));return {
 name:'recargas-america',enabled:env.RA_DELIVERY_ENABLED==='true',supportsIdempotency:false,
 async submit({sku,playerId,idempotencyKey}){
  const pack=allowed.get(sku);if(!pack||playerId!==plan.playerId||!/^\d{5,15}$/.test(playerId)||!idempotencyKey)return {status:'NOT_ACCEPTED'};
  const item=await recheck(env,plan,pack,playerId,fetcher);
  let response,body;try{response=await fetcher(BASE+'/buy/catalog',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+env.RECARGAS_AMERICA_API_KEY,Accept:'application/json','Content-Type':'application/json','Idempotency-Key':idempotencyKey},signal:AbortSignal.timeout(12000),body:JSON.stringify({product_id:pack.productId,quantity:1,[pack.playerField||'player_id']:playerId})});body=await response.json();}catch{return {status:'UNKNOWN'};}
  // A 409 DUPLICATE_REQUEST is not a replayed receipt. 502 PROVIDER_ERROR is review, not failure.
  if(!response.ok)return {status:'UNKNOWN'};return result(body,{...pack,price:item.price},null,true);
 },
 async lookup({reference,playerId,sku}){
  const pack=allowed.get(sku);if(!pack||!safeRef(reference)||playerId!==plan.playerId)return {status:'UNKNOWN'};
  try{const response=await fetcher(BASE+'/catalog/orders/'+reference,{method:'GET',redirect:'manual',headers:{Authorization:'Bearer '+env.RECARGAS_AMERICA_API_KEY,Accept:'application/json'},signal:AbortSignal.timeout(10000)});if(!response.ok)return {status:'UNKNOWN'};return result(await response.json(),pack,reference);}catch{return {status:'UNKNOWN'};}
 }
};}
