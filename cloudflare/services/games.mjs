import '../../game-sections.js';
import {readRecargasAmerica,validateRecargasAccount} from '../providers/recargas-america.mjs';
const sections=globalThis.ZXGameSections;
export function gameItem(item){const section=sections.find(s=>item.name.startsWith(s.prefix));return section&&item.type==='recharge'&&item.requiredFields.length===1&&['player_id','manual_id'].includes(item.requiredFields[0])?{id:'ra-game-'+item.id,name:item.name,section:section.id,category:section.name,game:section.name,providerId:item.id,sku:item.sku,field:item.requiredFields[0],platformPending:!!section.platformPending}:null;}
export async function gameCatalog(env,fetcher=fetch){return (await readRecargasAmerica(env,'catalog',fetcher)).map(gameItem).filter(Boolean);}
export async function gameDelivery(env,id,uid,source,fetcher=fetch){
 if(env.RA_DELIVERY_ENABLED!=='true'||env.RA_CONTRACT_VERIFIED!=='true')throw Error('PRODUCT_NOT_AVAILABLE');
 const items=await readRecargasAmerica(env,'catalog',fetcher),item=items.find(i=>'ra-game-'+i.id===id),game=item&&gameItem(item);
 if(!game||game.platformPending||!source||source.id!==item.id||source.sku!==item.sku||source.name!==item.name||source.field!==game.field)throw Error('PRODUCT_DELIVERY_MAPPING_REQUIRED');
 const validation=await validateRecargasAccount(env,item.id,uid,fetcher);
 if(!validation.supported||validation.status!==true)throw Error('PLAYER_REJECTED');
 const wallet=await readRecargasAmerica(env,'wallet',fetcher);
 if(!(Number(item.price)>0)||wallet.currency!=='USD'||Number(wallet.balance)<Number(item.price))throw Error('DELIVERY_FUNDS_UNAVAILABLE');
 return {provider:'recargas-america',productId:item.id,sku:item.sku,name:item.name,field:game.field,price:Number(item.price),quantity:1,region:game.game,accountName:validation.accountName};
}
