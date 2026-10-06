import {readRecargasAmerica,validateRecargasAccount} from '../providers/recargas-america.mjs';
import {readSixofire,catalogItems} from '../providers/sixofire-read.mjs';
const normalized=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={'weekly-basic':['Tarjeta Semanal Básica de Free Fire'],'weekly':['Tarjeta Semanal de Free Fire'],'monthly':['Tarjeta Mensual de Free Fire'],'booyah-premium':['Pase Booyah Premium de Free Fire'],'booyah-normal':['Booyah Pass','Pase Booyah'],'fragment':['Token Universal','Fragmento Universal','Fragmentos universales'],'fragment-box':['Caja de Tokens','Caja de fragmentos','Cajas de fragmentos'],'evo-box':['Caja Evo','Cajas Evo']};
export async function serviceSettings(db){const t=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_market_settings'").first();return t?JSON.parse((await db.prepare('SELECT settings_json FROM zx_market_settings WHERE id=1').first())?.settings_json||'{}'):{};}
export async function deliveryQuote(env,key,uid,quantity,region,fetcher=fetch,preferred=null){
 const settings=await serviceSettings(env.DB),plans=[];
 for(const provider of preferred?[preferred]:['recargas-america','sixofire']){try{
  const configured=(settings.mappings||[]).filter(m=>m.productKey===key&&m.provider===provider&&m.regions?.includes(region));
  if(configured.length>1)continue;
  if(provider==='recargas-america'){
   if(env.RA_DELIVERY_ENABLED!=='true')continue;
   const catalog=await readRecargasAmerica(env,'catalog',fetcher),mapping=configured[0];
   const matches=catalog.filter(i=>mapping?String(i.id)===String(mapping.productId)&&i.sku===mapping.sku&&i.name===mapping.name:aliases[key]?.some(a=>normalized(i.name)===normalized(a)));
   if(matches.length!==1)continue;const item=matches[0];
   if(item.type!=='recharge'||item.requiredFields.length!==1||!['player_id','manual_id'].includes(item.requiredFields[0])||!(Number(item.price)>0))continue;
   const validation=await validateRecargasAccount(env,item.id,uid,fetcher);
   // A new association requires a positive destination validation, not a guessed region.
   if(validation.supported&&validation.status!==true||!mapping&&!validation.supported)continue;
   const wallet=await readRecargasAmerica(env,'wallet',fetcher);if(wallet.currency!=='USD'||Number(wallet.balance)<Number(item.price)*quantity)continue;
   plans.push({provider,productId:item.id,sku:item.sku,name:item.name,field:item.requiredFields[0],price:Number(item.price),quantity,region});
  }else{
   if(env.SIXOFIRE_DELIVERY_ENABLED!=='true'||!/^\d{8,12}$/.test(uid))continue;
   const catalog=catalogItems(await readSixofire(env,'/account/shop/items',fetcher)),mapping=configured[0];
   const matches=catalog.filter(i=>mapping?String(i.id)===String(mapping.productId)&&String(i.sku||i.id)===mapping.sku&&i.name===mapping.name:(key.startsWith('diamonds:')?i.itemType==='DIAMONDS_DIRECT'&&Number(i.diamondQuantity)===Number(key.split(':')[1]):aliases[key]?.some(a=>normalized(i.name)===normalized(a))));
   if(matches.length!==1)continue;const i=matches[0],price=Number(i.effectivePriceUsd??i.priceUsd);
   if(i.itemType!==(key.startsWith('diamonds:')?'DIAMONDS_DIRECT':'GIFT')||!i.available||!i.isActive||!(price>0)||!/^\d{4,5}$/.test(String(i.id)))continue;
   if(i.availableRegions?.length&&!i.availableRegions.includes(region))continue;
   if(quantity>1&&(i.isStackable!==true||quantity<Number(i.minStack)||quantity>Number(i.maxStack)))continue;
   await readSixofire(env,'/account/shop/orders?page=1&limit=1',fetcher);
   plans.push({provider,productId:String(i.id),sku:String(i.sku||i.id),name:i.name,price,quantity,region,itemType:i.itemType});
  }
 }catch{/* Other configured delivery routes may remain available. */}}
 if(!plans.length)throw Error('PRODUCT_DELIVERY_MAPPING_REQUIRED');
 return plans.sort((a,b)=>a.price-b.price)[0];
}
function sixResult(raw,plan,uid,reference){const d=raw?.data;if(raw.status!==true||![200,201].includes(Number(raw.code))||!/^\d{1,18}$/.test(String(d?.id||''))||reference&&String(d.id)!==reference||String(d.gameAccount?.uid)!==uid||d.gameAccount?.region!==plan.region)return {state:'REQUIRES_REVIEW'};const ref=String(d.id),lines=d.items,price=Number(d.totalPriceUsd??d.totalUsd);if(!Array.isArray(lines)||lines.length!==1||lines[0].name!==plan.name||lines[0].itemType!==plan.itemType||Number(lines[0].quantity)!==plan.quantity||!Number.isFinite(price)||price<=0||price>plan.price*plan.quantity+.000001)return {state:'REQUIRES_REVIEW',reference:ref};return {state:d.status==='COMPLETED'&&lines[0].status==='COMPLETED'?'COMPLETED':['FAILED','REFUNDED','PARTIAL'].includes(d.status)?'REQUIRES_REVIEW':'PROCESSING',reference:ref};}
export async function submitDelivery(env,plan,uid,key,fetcher=fetch){
 if(plan.provider==='sixofire'){
  // The official shop API takes amount, not quantity, and returns 201 on creation.
  if(env.SIXOFIRE_DELIVERY_ENABLED!=='true')throw Error('DELIVERY_DISABLED');
  const items=catalogItems(await readSixofire(env,'/account/shop/items',fetcher)),item=items.find(i=>String(i.id)===plan.productId);
  if(!item||item.name!==plan.name||!item.available||!item.isActive||item.itemType!==plan.itemType||Number(item.effectivePriceUsd??item.priceUsd)>plan.price)throw Error('PRODUCT_CHANGED');
  try{const r=await fetcher('https://api.sixofire.net/account/shop/order',{method:'POST',redirect:'manual',headers:{'X-API-Key':env.SIXOFIRE_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({uid,product_id:plan.productId,amount:plan.quantity})}),b=await r.json();return r.ok?sixResult(b,plan,uid):{state:'REQUIRES_REVIEW'};}catch{return {state:'REQUIRES_REVIEW'};}
 }
 if(env.RA_DELIVERY_ENABLED!=='true')throw Error('DELIVERY_DISABLED');
 const items=await readRecargasAmerica(env,'catalog',fetcher),wallet=await readRecargasAmerica(env,'wallet',fetcher),item=items.find(i=>i.id===plan.productId&&i.sku===plan.sku&&i.name===plan.name);
 if(!item||item.type!=='recharge'||item.requiredFields.length!==1||item.requiredFields[0]!==plan.field||Number(item.price)<=0||Number(item.price)>plan.price||wallet.currency!=='USD'||Number(wallet.balance)<plan.price*plan.quantity)throw Error('PRODUCT_CHANGED');
 try{const r=await fetcher('https://panel.recargasamerica.com/api/v1/buy/catalog',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+env.RECARGAS_AMERICA_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},signal:AbortSignal.timeout(15000),body:JSON.stringify({product_id:plan.productId,quantity:plan.quantity,[plan.field]:uid})}),b=await r.json(),d=b.data;if(r.ok&&b.success===true&&/^[A-Za-z0-9_-]{1,120}$/.test(d?.order_id||'')&&d.item===plan.name&&Number(d.amount_charged)>0&&Number(d.amount_charged)<=plan.price*plan.quantity&&(plan.quantity===1||Number(d.quantity)===plan.quantity||d.quantity==null&&Math.abs(Number(d.amount_charged)-Number(item.price)*plan.quantity)<0.000001))return {state:d.status==='COMPLETED'&&d.needs_review!==true?'COMPLETED':'PROCESSING',reference:d.order_id};}catch{}return {state:'REQUIRES_REVIEW'};
}
export async function lookupDelivery(env,plan,uid,reference,fetcher=fetch){if(plan.provider==='sixofire')return sixResult(await readSixofire(env,'/account/shop/orders/'+reference,fetcher),plan,uid,reference);const r=await fetcher('https://panel.recargasamerica.com/api/v1/catalog/orders/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+env.RECARGAS_AMERICA_API_KEY},redirect:'manual',signal:AbortSignal.timeout(10000)}),b=await r.json(),d=b.data;return r.ok&&b.success===true&&d?.order_id===reference&&d.product===plan.name&&(plan.quantity===1||Number(d.quantity)===plan.quantity)?{state:d.status==='COMPLETED'&&d.needs_review!==true?'COMPLETED':'PROCESSING',reference}:{state:'REQUIRES_REVIEW',reference};}
