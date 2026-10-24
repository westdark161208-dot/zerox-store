import {exactPlan,decimalUnits} from '../diamonds/catalog.mjs';
import {readRaCatalogService} from '../providers/ra-admin-service.mjs';
import {raMapping} from '../diamonds/recargas-america.mjs';
import {compatibleAssociation} from '../providers/ra-association-catalog.mjs';
export const isCombo=id=>/^smart:diamonds:[a-f0-9-]{36}$/.test(id||'');
export function comboFields(p){
 if(!Number.isSafeInteger(p.diamonds)||p.diamonds<1||typeof p.visible!=='boolean'||typeof p.available!=='boolean'||!Array.isArray(p.regions)||!p.regions.length||p.regions.length>10||p.regions.some(r=>!/^[A-Z]{2,5}$/.test(r))||new Set(p.regions).size!==p.regions.length||p.minMarginBps!==null&&(!Number.isSafeInteger(p.minMarginBps)||p.minMarginBps<0||p.minMarginBps>10000)||p.priceCents<1)return null;
 return {diamonds:p.diamonds,visible:p.visible,available:p.available,regions:[...p.regions].sort(),minMarginBps:p.minMarginBps};
}
async function readPublished(db){
 if(!await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_store_editor'").first())return {};
 return JSON.parse((await db.prepare('SELECT published FROM zx_store_editor WHERE id=1').first())?.published||'{}');
}
export async function smartProducts(db){return Object.values(await readPublished(db)).filter(p=>isCombo(p.id)&&p.active&&p.visible);}
export async function smartMapping(env){
 // Identical explicit > saved precedence; automatic name-based associations are not verified evidence.
 if(typeof env.RA_DIAMOND_PACKS==='string'&&env.RA_DIAMOND_PACKS.trim()&&env.RA_DIAMOND_PACKS.trim()!=='{}')return raMapping(env);
 if(!await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_ra_pack_associations'").first())return {};
 const rows=(await env.DB.prepare('SELECT total,entry_json FROM zx_ra_pack_associations ORDER BY total').all()).results;
 return raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify(Object.fromEntries(rows.map(r=>[r.total,JSON.parse(r.entry_json)])))});
}
export function smartQuote(product,items,map,region,policy={}){
 if(!product.regions.includes(region))return {region,status:'incompatible'};
 const entries=Object.entries(map).filter(([,p])=>p.regions.includes(region));
 if(!Object.keys(map).length)return {region,status:'pending_association'};
 if(!entries.length)return {region,status:'incompatible'};
 // Explicit policy: do not silently claim all-in costs while fees are unknown.
 if(policy.feesVerified!==true)return {region,status:'pending_association',reason:'FEES_UNVERIFIED'};
 const fixed=decimalUnits(policy.feePerOperationUSD??'0'),bps=policy.feeBps??0;
 if(!Number.isSafeInteger(bps)||bps<0||bps>10000)throw Error('INVALID_FEE_POLICY');
 const packs=[];
 for(const [total,entry] of entries){
  const item=items.find(i=>i.id===entry.productId),base={base:entry.baseDiamonds,bonus:entry.bonusDiamonds,total:Number(total)};
  if(!entry.bonusEvidence?.trim()||!compatibleAssociation(entry,base,items)||item.active===false||item.available===false)continue;
  const price=decimalUnits(item.price),configured=policy.stockByProduct?.[entry.productId];
  const stock=item.stock===undefined?configured:configured===undefined?item.stock:Math.min(item.stock,configured);
  if(stock!==undefined&&(!Number.isSafeInteger(stock)||stock<0))throw Error('INVALID_AVAILABILITY');
  packs.push({key:String(entry.productId).padStart(16,'0'),diamonds:Number(total),units:price+fixed+(price*BigInt(bps)+9999n)/10000n,stock,productId:entry.productId,sku:entry.sku,name:entry.name,baseDiamonds:entry.baseDiamonds,bonusDiamonds:entry.bonusDiamonds,bonusEvidence:entry.bonusEvidence});
 }
 if(!packs.length)return {region,status:'incompatible',reason:'NO_VERIFIED_AVAILABLE_PACKS'};
 let result;try{result=exactPlan(packs,product.diamonds,{maxOperations:policy.maxOperations??product.diamonds,budgetUnits:policy.budgetUSD===undefined?null:decimalUnits(policy.budgetUSD)});}catch(e){if(e.message==='NO_EXACT_RECIPE')return {region,status:'no_exact_combination'};throw e;}
 const fx=policy.usdMxn===undefined?null:decimalUnits(policy.usdMxn),mxn=fx===null?null:(result.totalUnits*fx+9999999999n)/10000000000n;
 if(result.totalUnits>BigInt(Number.MAX_SAFE_INTEGER)||mxn!==null&&mxn>BigInt(Number.MAX_SAFE_INTEGER))throw Error('COST_OUT_OF_RANGE');
 const margin=mxn===null?null:product.priceCents-Number(mxn);
 return {region,status:'ready',totalMicros:String(result.totalUnits),costUSD:(result.totalUnits/1000000n)+'.'+String(result.totalUnits%1000000n).padStart(6,'0'),costMXNCents:mxn===null?null:Number(mxn),salePriceCents:product.priceCents,marginCents:margin,marginBps:margin===null?null:Number(BigInt(margin)*10000n/BigInt(product.priceCents)),marginAlert:margin===null||product.minMarginBps===null?null:BigInt(margin)*10000n<BigInt(product.priceCents)*BigInt(product.minMarginBps),operationCount:result.operationCount,packs:result.packs.map(({units,key,stock,...p})=>({...p,unitCostMicros:String(units)}))};
}
export async function smartRecipeRoute(request,env,user,reply){
 if(user?.isFounder!==true||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 if(request.method!=='GET')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 try{
  const products=Object.values(await readPublished(env.DB)).filter(p=>isCombo(p.id)&&p.active);
  const [items,map]=await Promise.all([readRaCatalogService(env,'catalog'),smartMapping(env)]);
  const policy=JSON.parse(env.RA_SMART_RECIPE_POLICY||'{}'),quotedAt=new Date().toISOString();
  return reply({ok:true,purchasesEnabled:false,quotedAt,products:products.map(p=>({...p,quotes:p.regions.map(r=>({...smartQuote(p,items,map,r,policy),quotedAt}))}))});
 }catch{return reply({ok:false,error:'SMART_QUOTE_UNAVAILABLE'},503);}
}
