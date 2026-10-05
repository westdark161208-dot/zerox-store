import {readSixofire,catalogItems} from './sixofire-read.mjs';
const categories=new Set(['fragment','fragment-box','booyah','level-up']);
export function serviceCatalog(items,rawMap='{}'){
 let map;try{map=JSON.parse(rawMap);}catch{throw Error('PROVIDER_SERVICE_MAPPING_INVALID');}
 if(!map||Array.isArray(map)||typeof map!=='object'||Object.entries(map).some(([id,category])=>!/^\d{1,18}$/.test(id)||!categories.has(category)))throw Error('PROVIDER_SERVICE_MAPPING_INVALID');
 // Names are only discovery hints. Financial routing requires explicit supplier product IDs.
 return items.filter(i=>!String(i.itemType||'').startsWith('DIAMONDS')).flatMap(i=>{
  const name=String(i.name||''),id=String(i.id||''),category=map[id]||null;
  if(!category&&!/fragment|hiperlibro|booyah|aumento.*nivel|level.?up|runestone/i.test(name))return [];
  const valid=category==='level-up'?i.itemType==='LEVEL_UP_PACKAGE':!!category&&i.itemType==='GIFT';
  return [{id,name:name.slice(0,120),category,configured:valid,available:i.available===true&&i.isActive===true,itemType:String(i.itemType||''),levelUpPackageId:i.levelUpPackageId==null?null:String(i.levelUpPackageId),priceUsd:Number.isFinite(Number(i.effectivePriceUsd??i.priceUsd))?Number(i.effectivePriceUsd??i.priceUsd):null,purchasesEnabled:false}];
 });
}
export async function readLevelUp(env,uid,fetcher=fetch){
 if(!/^\d{8,15}$/.test(uid||''))throw Error('INVALID_PLAYER_QUERY');
 const raw=await readSixofire(env,'/account/levelup/packages?uid='+uid,fetcher),d=raw.data;
 if(raw.status!==true||Number(raw.code)!==200||String(d?.uid)!==uid||typeof d.levelUpAvailable!=='boolean'||!Array.isArray(d.availableItemIds)||!Array.isArray(d.packages)||d.availableItemIds.some(i=>!/^\d{1,10}$/.test(String(i))))throw Error('PROVIDER_RESPONSE_FORMAT');
 return {uid,nickname:typeof d.nickname==='string'?d.nickname.slice(0,120):null,region:typeof d.region==='string'?d.region.slice(0,5):null,levelUpAvailable:d.levelUpAvailable,availableItemIds:d.availableItemIds.map(String),packages:d.packages.map(p=>({itemId:String(p.itemId),name:String(p.name||'').slice(0,120)})).filter(p=>d.availableItemIds.map(String).includes(p.itemId))};
}
export async function readServiceCatalog(env,fetcher=fetch){return serviceCatalog(catalogItems(await readSixofire(env,'/account/shop/items',fetcher)),env.SIXOFIRE_SERVICE_SKUS);}
