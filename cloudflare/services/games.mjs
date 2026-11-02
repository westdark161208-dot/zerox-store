import {raPrivateMode} from '../providers/ra-private-policy.mjs';
import '../../game-sections.js';
import {readRecargasAmerica,validateRecargasAccount} from '../providers/recargas-america.mjs';
const sections=globalThis.ZXGameSections;
export function gameItem(item){const section=sections.find(s=>item.name.startsWith(s.prefix));return section&&item.type==='recharge'&&item.requiredFields.length===1&&['player_id','manual_id'].includes(item.requiredFields[0])?{id:'ra-game-'+item.id,name:item.name,section:section.id,category:section.name,game:section.name,providerId:item.id,sku:item.sku,field:item.requiredFields[0],platformPending:!!section.platformPending}:null;}
export async function gameCatalog(env,fetcher=fetch){
 const legacy=env.RA_FF110_PILOT_ONLY==='true'?[]:(await readRecargasAmerica(env,'catalog',fetcher)).map(gameItem).filter(Boolean);
 if(env.SMART_PUBLIC_CATALOG_ENABLED!=='true')return legacy;
 const {results}=await env.DB.prepare(`SELECT DISTINCT p.* FROM zx_smart_products p JOIN zx_smart_mapping m USING(product_id)
   JOIN zx_smart_catalog c USING(provider,sku) JOIN zx_smart_sync s USING(provider)
   WHERE p.published=1 AND s.stamp>? AND json_extract(c.details,'$.available')=1`).bind(Date.now()-7200000).all();
 const ids=new Set(legacy.map(row=>row.id));
 for(const row of results){
   const section=sections.find(entry=>entry.id===row.section);
   if(section && /^smart-[a-z0-9-]{1,60}$/.test(row.product_id) && !ids.has(row.product_id))
     legacy.push({id:row.product_id,name:row.name,section:section.id,category:section.name,game:section.name,platformPending:true});
 }
 return legacy;
}
export async function gameDelivery(env,id,uid,source,fetcher=fetch){
 if(env.RA_FF110_PILOT_ONLY==='true'||raPrivateMode(env)||env.RA_DELIVERY_ENABLED!=='true'||env.RA_CONTRACT_VERIFIED!=='true')throw Error('PRODUCT_NOT_AVAILABLE');
 const items=await readRecargasAmerica(env,'catalog',fetcher),item=items.find(i=>'ra-game-'+i.id===id),game=item&&gameItem(item);
 if(!game||game.platformPending||!source||source.id!==item.id||source.sku!==item.sku||source.name!==item.name||source.field!==game.field)throw Error('PRODUCT_DELIVERY_MAPPING_REQUIRED');
 const validation=await validateRecargasAccount(env,item.id,uid,fetcher);
 if(!validation.supported||validation.status!==true)throw Error('PLAYER_REJECTED');
 const wallet=await readRecargasAmerica(env,'wallet',fetcher);
 if(!(Number(item.price)>0)||wallet.currency!=='USD'||Number(wallet.balance)<Number(item.price))throw Error('DELIVERY_FUNDS_UNAVAILABLE');
 return {provider:'recargas-america',productId:item.id,sku:item.sku,name:item.name,field:game.field,price:Number(item.price),quantity:1,region:game.game,accountName:validation.accountName};
}
