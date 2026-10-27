import {readRaFounderService} from '../providers/ra-admin-service.mjs';
import {raPrivateMode} from '../providers/ra-private-policy.mjs';
import '../../game-sections.js';
import {readRecargasAmerica,validateRecargasAccount} from '../providers/recargas-america.mjs';
const sections=globalThis.ZXGameSections;
const deliverySections=new Set(['pubg-mobile','blood-strike','delta-force','arena-breakout','bleach','crossfire']);
export function gameItem(item){const section=sections.find(s=>item.name.startsWith(s.prefix));return section&&deliverySections.has(section.id)&&item.type==='recharge'&&item.requiredFields.length===1&&['player_id','manual_id'].includes(item.requiredFields[0])?{id:'ra-game-'+item.id,name:item.name,section:section.id,category:section.name,game:section.name,providerId:item.id,sku:item.sku,field:item.requiredFields[0],platformPending:!!section.platformPending}:null;}
// Catalogue visibility and permission to purchase are independent. Use Control's
// read transport exclusively; failure never falls back to the direct provider API.
export async function gameCatalog(env,fetcher=fetch){
 const items=await readRaFounderService(env,'catalog');
 return items.flatMap(item=>{
  const section=sections.find(s=>item.name.startsWith(s.prefix));
  if(!section)return [];
  const legacy=gameItem(item);
  const blocked=env.RA_FF110_PILOT_ONLY==='true'||raPrivateMode(env)||!legacy||section.platformPending||env.RA_DELIVERY_ENABLED!=='true'||env.RA_CONTRACT_VERIFIED!=='true';
  return [{id:'ra-game-'+item.id,name:item.name,section:section.id,category:section.name,game:section.name,providerId:item.id,sku:item.sku,field:legacy?.field||null,platformPending:!!section.platformPending,deliveryType:item.type,requiredFields:[...item.requiredFields],purchaseBlocked:!!blocked}];
 });
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
