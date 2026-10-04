import {readSixofire,catalogItems} from '../providers/sixofire-read.mjs';
// Direct-to-UID products only. PINs and inferred bonuses cannot fulfill store diamond packs.
export function skuConfiguration(env){let map;try{map=JSON.parse(env.SIXOFIRE_DIRECT_SKUS||'{}');}catch{throw Error('PROVIDER_MAPPING_INVALID');}if(!map||Array.isArray(map)||typeof map!=='object')throw Error('PROVIDER_MAPPING_INVALID');for(const [amount,sku] of Object.entries(map))if(!/^[1-9]\d{0,5}$/.test(amount)||typeof sku!=='string'||!/^\d{1,18}$/.test(sku))throw Error('PROVIDER_MAPPING_INVALID');return map;}
export function validateDirectItems(items,recipe,map,region){
 if(!/^[A-Z]{2,5}$/.test(region||''))throw Error('PLAYER_REGION_UNVERIFIED');
 return recipe.map(pack=>{
  const sku=map[pack.diamonds];if(!sku)throw Error('PROVIDER_MAPPING_MISSING');
  const matches=items.filter(i=>String(i.id)===sku);if(matches.length!==1)throw Error('PROVIDER_PRODUCT_UNAVAILABLE');const item=matches[0];
  if(item.available!==true||item.isActive!==true||item.itemType!=='DIAMONDS_DIRECT')throw Error('PROVIDER_DIRECT_PRODUCT_REQUIRED');
  if(Number(item.diamondQuantity)!==pack.diamonds)throw Error('PROVIDER_DIAMOND_AMOUNT_MISMATCH');
  if(!Array.isArray(item.availableRegions)||!item.availableRegions.includes(region))throw Error('PROVIDER_REGION_UNAVAILABLE');
  if(typeof item.name!=="string"||!item.name.trim())throw Error("PROVIDER_RESPONSE_FORMAT");
  return {...pack,sku,providerItemName:item.name};
 });
}
export async function directPreflight(env,recipe,region,fetcher=fetch){
 const map=skuConfiguration(env),items=catalogItems(await readSixofire(env,'/account/shop/items',fetcher)),plan=validateDirectItems(items,recipe,map,region);
 // Positive catalogue read is insufficient. Shop order access is checked independently.
 const orders=await readSixofire(env,'/account/shop/orders?page=1&limit=1',fetcher);if(orders.status!==true||Number(orders.code)!==200||!orders.data||typeof orders.data!=='object')throw Error('PROVIDER_ORDER_ACCESS_UNVERIFIED');
 return plan;
}
function orderResult(raw,uid,pack,region){const data=raw?.data;if(raw?.status!==true||Number(raw.code)!==200||!/^\d{1,18}$/.test(String(data?.id||'')))return {status:'UNKNOWN'};const reference=String(data.id),state=String(data.status||'');if(String(data.gameAccount?.uid)!==uid)return {status:'UNKNOWN',reference};const lines=data.items,exact=pack&&data.gameAccount?.region===region&&Array.isArray(lines)&&lines.length===1&&lines[0].itemType==='DIAMONDS_DIRECT'&&lines[0].name===pack.providerItemName&&Number(lines[0].quantity)===1&&lines[0].status==='COMPLETED';return {status:state==='COMPLETED'&&exact?'SUCCESS':'PROCESSING',reference,receipt:JSON.stringify({state})};}
export function directProvider(env,plan,region,fetcher=fetch){const allowed=new Map(plan.map(p=>[p.sku,p]));return {
 enabled:env.SIXOFIRE_DELIVERY_ENABLED==='true',name:'sixofire-direct',supportsIdempotency:false,
 async submit({sku,playerId}){
  const pack=allowed.get(sku);if(!pack||!/^\d{5,15}$/.test(playerId))return {status:'NOT_ACCEPTED'};
  // Recheck exact product immediately before the financial supplier request.
  await directPreflight(env,[pack],region,fetcher);
  let response,raw;try{response=await fetcher('https://api.sixofire.net/account/shop/order',{method:'POST',redirect:'manual',headers:{'X-API-Key':env.SIXOFIRE_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({uid:playerId,product_id:sku})});raw=await response.json();}catch{return {status:'UNKNOWN'};}
  // Never retry an ambiguous or accepted order. Insufficient supplier funds definitively deny this call.
  if([400,401,402,403].includes(response.status)&&raw?.status===false&&['INSUFFICIENT_FUNDS','PERMISSION_DENIED','SUBSCRIPTION_REQUIRED','SUBSCRIPTION_INACTIVE','SUBSCRIPTION_REQUESTS_EXHAUSTED','INVALID_API_KEY','INVALID_PRODUCT','PRODUCT_NOT_AVAILABLE'].includes(raw.error||raw.errorCode))return {status:'NOT_ACCEPTED',receipt:String(raw.error||raw.errorCode)};
  if(!response.ok)return {status:'UNKNOWN'};return orderResult(raw,playerId,pack,region);
 },
 async lookup({reference,playerId,sku}){if(!/^[1-9]\d{0,17}$/.test(reference||''))return {status:'UNKNOWN'};const raw=await readSixofire(env,'/account/shop/orders/'+reference,fetcher);if(String(raw?.data?.id)!==reference)return {status:'UNKNOWN'};return orderResult(raw,playerId,allowed.get(sku),region);}
};}
