import {readSixofire,catalogItems,safeProviderError} from './sixofire-read.mjs';
const id=v=>/^[A-Za-z0-9_-]{1,80}$/.test(String(v||''))?String(v):null;
export function quote(item){
 const productId=id(item.id),value=item.effectivePriceUsd??item.priceUsd;
 if(!productId||value===null||value===undefined||value===''||!['number','string'].includes(typeof value)||!Number.isFinite(Number(value))||Number(value)<0)return null;
 const micros=Math.round(Number(value)*1000000);if(!Number.isSafeInteger(micros))return null;
 return {productId,name:String(item.name||productId).slice(0,120),micros,available:item.available===true&&item.isActive===true};
}
export async function quotesRoute(request,env,url,user,reply,fetcher=fetch){
 if(!user?.isFounder||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 if(url.pathname!=='/api/admin/providers/sixofire/quotes')return reply({ok:false,error:'NOT_FOUND'},404);
 if(!['GET','POST'].includes(request.method))return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 try{
  if(request.method==='POST'){
   const items=catalogItems(await readSixofire(env,'/account/shop/items',fetcher)).map(quote).filter(Boolean);
   if(!items.length)return reply({ok:false,error:'PROVIDER_PRICES_NOT_REPORTED'},503);
   await env.DB.prepare(`CREATE TABLE IF NOT EXISTS zx_provider_quotes (snapshot_id TEXT NOT NULL,product_id TEXT NOT NULL,name TEXT NOT NULL,price_micros INTEGER NOT NULL,available INTEGER NOT NULL,queried_at TEXT NOT NULL,PRIMARY KEY(snapshot_id,product_id))`).run();
   // Bounded one snapshot, unique IDs, no raw response or credential persisted.
   const unique=[...new Map(items.map(p=>[p.productId,p])).values()].slice(0,100),snapshot=crypto.randomUUID(),at=new Date().toISOString();
   await env.DB.batch(unique.map(p=>env.DB.prepare('INSERT INTO zx_provider_quotes VALUES(?,?,?,?,?,?)').bind(snapshot,p.productId,p.name,p.micros,p.available?1:0,at)));
   return reply({ok:true,snapshotId:snapshot,count:unique.length,queriedAt:at,currency:'USD'});
  }
  const table=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_provider_quotes'").first();
  if(!table)return reply({ok:true,currency:'USD',series:[]});
  const rows=(await env.DB.prepare('SELECT product_id,name,price_micros,available,queried_at FROM zx_provider_quotes ORDER BY queried_at DESC,rowid DESC LIMIT 400').all()).results;
  const series=new Map();for(const row of rows){if(!series.has(row.product_id)){if(series.size>=20)continue;series.set(row.product_id,{id:row.product_id,name:row.name,points:[]});}const p=series.get(row.product_id).points;if(p.length<20)p.push({micros:row.price_micros,available:row.available===1,at:row.queried_at});}
  return reply({ok:true,currency:'USD',series:[...series.values()].map(s=>({...s,points:s.points.reverse()}))});
 }catch(error){return reply({ok:false,error:safeProviderError(error)},503);}
}
