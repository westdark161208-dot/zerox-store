import {giftMessage,validGiftMessage} from './gift-message.mjs';
import {publishedCatalog} from '../editor/catalog.mjs';
import {readRecargasAmerica} from './recargas-america.mjs';
import {readSixofire,catalogItems,safeProviderError} from './sixofire-read.mjs';
export const productKeys=Object.freeze({'booyah-normal':'Pase Booyah','booyah-premium':'Pase Booyah Premium + 50 medallas','weekly-basic':'Membresía semanal básica','weekly':'Membresía semanal','monthly':'Membresía mensual','fragment':'Fragmentos universales','fragment-box':'Caja de fragmentos','evo-box':'Caja de fragmentos evolutivos','level-up-6':'Pase de nivel 6','level-up-10':'Pase de nivel 10','level-up-15':'Pase de nivel 15','level-up-20':'Pase de nivel 20','level-up-25':'Pase de nivel 25','level-up-30':'Pase de nivel 30'});
const defaults=[['weekly-basic',1,'ADS001','Tarjeta Semanal Básica de Free Fire'],['weekly',2,'ADS002','Tarjeta Semanal de Free Fire'],['monthly',3,'ADS003','Tarjeta Mensual de Free Fire'],['booyah-premium',4,'ADS004','Pase Booyah Premium de Free fire']].map(([productKey,productId,sku,name])=>({productKey,provider:'recargas-america',productId:String(productId),sku,name,source:'merchant-video-830668',regions:[]}));
const cleanName=v=>String(v||'').trim().toLowerCase();
export function normalizeOffers(provider,items){return items.flatMap(i=>{
 const id=String(i.id||''),value=provider==='sixofire'?(i.effectivePriceUsd??i.priceUsd):i.price;
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(id)||value==null||value===''||!Number.isFinite(Number(value))||Number(value)<=0)return [];
 const priceMicros=Math.round(Number(value)*1e6);if(!Number.isSafeInteger(priceMicros))return [];
 const fields=provider==='recargas-america'?i.requiredFields:null;
 const fulfillment=provider==='recargas-america'?(i.type==='recharge'&&fields?.length===1&&['player_id','manual_id'].includes(fields[0])?'uid':i.type==='pin'?'pin':'other'):['GIFT','LEVEL_UP_PACKAGE'].includes(i.itemType)?'uid':'other';
 return [{provider,productId:id,name:String(i.name||'').slice(0,120),sku:String(i.sku||id).slice(0,80),priceMicros,currency:'USD',fulfillment,available:provider==='sixofire'?i.available===true&&i.isActive===true:true,itemType:String(i.itemType||i.type||''),regions:provider==='sixofire'&&Array.isArray(i.availableRegions)?i.availableRegions.filter(r=>/^[A-Z]{2,5}$/.test(r)):[]}];
 });}
export function compareOffers(offers,fees={},fx=null){
 const rows=offers.map(o=>{const f=fees[o.provider],verified=!!f&&Number.isFinite(f.percent)&&f.percent>=0&&f.percent<=30&&Number.isSafeInteger(f.fixedMicros)&&f.fixedMicros>=0;
 const totalMicros=verified?Math.ceil(o.priceMicros*(1+f.percent/100))+f.fixedMicros:null;
 return {...o,totalMicros,feesVerified:verified,costMxnCents:totalMicros!=null&&Number.isFinite(fx)&&fx>0?Math.ceil(totalMicros/1e6*fx*100):null};});
 const eligible=rows.filter(o=>o.available&&o.fulfillment==='uid'&&o.currency==='USD'),base=[...eligible].sort((a,b)=>a.priceMicros-b.priceMicros||a.provider.localeCompare(b.provider));
 // A cheaper base quote is not a verified total. Require all comparable fees before routing.
 const ready=eligible.length>0&&eligible.every(o=>o.feesVerified),ranked=ready?[...eligible].sort((a,b)=>a.totalMicros-b.totalMicros||a.provider.localeCompare(b.provider)):[];
 return {offers:rows,baseLeader:base[0]?.provider||null,selectedProvider:ranked[0]?.provider||null,selectedProductId:ranked[0]?.productId||null,comparisonComplete:ready};
}
export function selectSupplier(group,region,now=Date.now()){
 const at=Date.parse(group?.queriedAt);
 if(!group?.comparisonComplete||!Number.isFinite(at)||now-at>120000||now<at||!group.offers?.length)throw Error('SUPPLIER_QUOTES_UNVERIFIED');
 const eligible=group.offers.filter(o=>o.available&&o.fulfillment==='uid'&&o.feesVerified&&Number.isSafeInteger(o.totalMicros)&&o.regions.includes(region)).sort((a,b)=>a.totalMicros-b.totalMicros||a.provider.localeCompare(b.provider));
 if(!eligible.length)throw Error('SUPPLIER_REGION_UNVERIFIED');return eligible[0];
}
async function schema(db){await db.prepare('CREATE TABLE IF NOT EXISTS zx_market_settings(id INTEGER PRIMARY KEY CHECK(id=1),settings_json TEXT NOT NULL)').run();await db.prepare('CREATE TABLE IF NOT EXISTS zx_market_snapshots(id TEXT PRIMARY KEY,queried_at TEXT NOT NULL,data_json TEXT NOT NULL)').run();}
async function settings(db){const table=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_market_settings'").first();return table?JSON.parse((await db.prepare('SELECT settings_json FROM zx_market_settings WHERE id=1').first())?.settings_json||'{}'):{};}
const mappingKey=m=>m.productKey+':'+m.provider;
async function catalog(env,provider,fetcher){return provider==='recargas-america'?normalizeOffers(provider,await readRecargasAmerica(env,'catalog',fetcher)):normalizeOffers(provider,catalogItems(await readSixofire(env,'/account/shop/items',fetcher)));}
export async function refreshMarket(env,fetcher=fetch){
 const config=await settings(env.DB),results=await Promise.allSettled(['recargas-america','sixofire'].map(p=>catalog(env,p,fetcher))),at=new Date().toISOString(),offers=[],errors=[];
 results.forEach((r,i)=>{const provider=['recargas-america','sixofire'][i];if(r.status==='fulfilled')offers.push(...r.value);else errors.push({provider,error:provider==='sixofire'?safeProviderError(r.reason):/^RA_(READ_DISABLED|KEY_MISSING|HTTP_\d{3}|INVALID_RESPONSE|UNAVAILABLE)$/.test(r.reason.message)?r.reason.message:'RA_UNAVAILABLE'});});
 const published=await publishedCatalog(env.DB);const publicIds={'booyah-normal':'ff-booyah-76828','booyah-premium':'ff-ra-booyah-premium','weekly-basic':'ff-ra-weekly-basic','weekly':'ff-ra-weekly','monthly':'ff-ra-monthly'};
 const mappings=[...new Map([...defaults,...(config.mappings||[])].map(m=>[mappingKey(m),m])).values()],groups=[];
 for(const [key,label] of Object.entries(productKeys)){
  const linked=mappings.filter(m=>m.productKey===key).flatMap(m=>{const match=offers.find(o=>o.provider===m.provider&&o.productId===m.productId&&o.sku===m.sku&&cleanName(o.name)===cleanName(m.name)&&o.fulfillment==='uid');return match?[{...match,regions:match.regions.length?match.regions:m.regions||[]}]:[];});
  if(linked.length){const comparison=compareOffers(linked,config.fees,config.usdMxn);if(errors.length){comparison.comparisonComplete=false;comparison.selectedProvider=null;comparison.selectedProductId=null;}
   const salePriceCents=published[publicIds[key]]?.active!==false?(published[publicIds[key]]?.priceCents||(key==='booyah-normal'?3500:null)):null;
   groups.push({key,label,queriedAt:at,...comparison,salePriceCents,marginBeforePaymentFeesCents:salePriceCents&&comparison.selectedProvider?(()=>{const cost=comparison.offers.find(o=>o.provider===comparison.selectedProvider)?.costMxnCents;return cost==null?null:salePriceCents-cost;})():null});}

 }
 const data={queriedAt:at,currency:'USD',usdMxn:config.usdMxn||null,errors,groups,inventory:offers.slice(0,500),settings:config,productKeys,deliveryEnabled:false};
 await schema(env.DB);await env.DB.prepare('INSERT INTO zx_market_snapshots VALUES(?,?,?)').bind(crypto.randomUUID(),at,JSON.stringify(data)).run();
 // Bound retained history; prices are observations, never a live execution authorization.
 await env.DB.prepare('DELETE FROM zx_market_snapshots WHERE id NOT IN (SELECT id FROM zx_market_snapshots ORDER BY queried_at DESC,rowid DESC LIMIT 30)').run();return data;
}

export function variantMatches(key,item){
 const name=cleanName(item.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(key==='booyah-premium')return /booyah/.test(name)&&/premium/.test(name);
 if(key==='booyah-normal')return /\b(?:pase booyah?|booyah pass)\b/.test(name)&&!/premium/.test(name);
 if(key==='weekly-basic')return /semanal|weekly/.test(name)&&/basica|basic/.test(name);
 if(key==='weekly')return /semanal|weekly/.test(name)&&!/basica|basic/.test(name);
 if(key==='monthly')return /mensual|monthly/.test(name);
 if(key==='evo-box')return /evo|evolutiv/.test(name)&&/caja|box/.test(name);
 if(key==='fragment-box')return /fragment/.test(name)&&/caja|box/.test(name);
 if(key==='fragment')return /fragment/.test(name)&&!/caja|box/.test(name);
 if(key.startsWith('level-up-'))return item.itemType==='LEVEL_UP_PACKAGE'&&new RegExp('(?:nivel|level)\\D*'+key.split('-').at(-1)+'(?:\\D|$)').test(name);
 return false;
}
export async function marketRoute(request,env,url,user,reply,fetcher=fetch){
 if(!user?.isFounder||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 const root='/api/admin/providers/market';try{
  if(url.pathname===root+'/gift-message'){
   const config=await settings(env.DB);
   if(request.method==='GET')return reply({ok:true,message:giftMessage(config),supported:{sixofire:'GIFT',recargasAmerica:false}});
   if(request.method==='POST'){const b=await request.json();if(!validGiftMessage(b.message))return reply({ok:false,error:'INVALID_GIFT_MESSAGE'},400);config.giftMessage=b.message.trim();await schema(env.DB);await env.DB.prepare('INSERT INTO zx_market_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET settings_json=excluded.settings_json').bind(JSON.stringify(config)).run();return reply({ok:true,message:config.giftMessage});}
  }

  if(url.pathname===root+'/refresh'&&request.method==='POST')return reply({ok:true,data:await refreshMarket(env,fetcher)});
  if(url.pathname===root&&request.method==='GET'){
   const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_market_snapshots'").first();
   const rows=exists?(await env.DB.prepare('SELECT queried_at,data_json FROM zx_market_snapshots ORDER BY queried_at DESC,rowid DESC LIMIT 20').all()).results:[];
   const history=rows.reverse().map(r=>({at:r.queried_at,groups:JSON.parse(r.data_json).groups.map(g=>({key:g.key,label:g.label,offers:g.offers.map(o=>({provider:o.provider,priceMicros:o.priceMicros,totalMicros:o.totalMicros}))}))}));
   return reply({ok:true,data:rows.length?JSON.parse(rows.at(-1).data_json):null,settings:await settings(env.DB),productKeys,history});
  }
  if(url.pathname===root+'/mapping'&&request.method==='POST'){
   const b=await request.json();if(!productKeys[b.productKey]||!['recargas-america','sixofire'].includes(b.provider)||typeof b.productId!=='string'||!Array.isArray(b.regions)||!b.regions.length||b.regions.some(r=>!/^[A-Z]{2,5}$/.test(r)))return reply({ok:false,error:'INVALID_MAPPING'},400);
   const items=await catalog(env,b.provider,fetcher),item=items.find(i=>i.productId===b.productId);if(!item||item.fulfillment!=='uid'||!item.available)return reply({ok:false,error:'UID_PRODUCT_REQUIRED'},400);
   if(!variantMatches(b.productKey,item))return reply({ok:false,error:'VARIANT_MISMATCH'},400);
   const config=await settings(env.DB),mapping={productKey:b.productKey,provider:b.provider,productId:item.productId,sku:item.sku,name:item.name,regions:b.regions,source:'creator-association'};config.mappings=[...(config.mappings||[]).filter(m=>mappingKey(m)!==mappingKey(mapping)),mapping];
   await schema(env.DB);await env.DB.prepare('INSERT INTO zx_market_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET settings_json=excluded.settings_json').bind(JSON.stringify(config)).run();return reply({ok:true});
  }
  if(url.pathname===root+'/costs'&&request.method==='POST'){
   const b=await request.json();if(!Number.isFinite(b.usdMxn)||b.usdMxn<=0||b.usdMxn>1000||!b.fees||['sixofire','recargas-america'].some(p=>!Number.isFinite(b.fees[p]?.percent)||b.fees[p].percent<0||b.fees[p].percent>30||!Number.isSafeInteger(b.fees[p]?.fixedMicros)||b.fees[p].fixedMicros<0||b.fees[p].fixedMicros>100e6))return reply({ok:false,error:'INVALID_COSTS'},400);
   const config=await settings(env.DB);config.usdMxn=b.usdMxn;config.fees=b.fees;await schema(env.DB);await env.DB.prepare('INSERT INTO zx_market_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET settings_json=excluded.settings_json').bind(JSON.stringify(config)).run();return reply({ok:true});
  }
  return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 }catch{return reply({ok:false,error:'MARKET_UNAVAILABLE'},503);}
}
