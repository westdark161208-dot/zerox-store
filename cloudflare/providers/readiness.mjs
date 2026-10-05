import {resolvedRaEnvironment} from './ra-associations.mjs';
import {catalog,getProduct} from '../diamonds/catalog.mjs';
import {publishedCatalog,publishedProduct} from '../editor/catalog.mjs';
import {verifiedPlayer,purchaseConfiguration} from '../diamonds/purchases.mjs';
import {raLiveQuote} from '../diamonds/recargas-america.mjs';
import {validateRecargasAccount} from './recargas-america.mjs';
// Founder diagnostics only: no preferences, orders, debits or supplier purchases.
export async function readinessRoute(request,env,url,user,reply,fetcher=fetch){
 if(!user?.isFounder||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 let detectedRegion=null;
 try{
  env=await resolvedRaEnvironment(env,fetcher);
  if(request.method==='GET'){
   const edits=await publishedCatalog(env.DB);
   return reply({ok:true,products:catalog.filter(p=>edits[p.id]?.active!==false).map(p=>({id:p.id,name:edits[p.id]?.name||p.name,diamonds:p.diamonds,amountCents:edits[p.id]?.priceCents||p.salePriceCents})),configuration:purchaseConfiguration(env)});
  }
  if(request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const raw=await request.text();if(raw.length>1000)return reply({ok:false,error:'INVALID_REQUEST'},400);
  const b=JSON.parse(raw),uid=String(b.uid||'');if(!/^\d{5,15}$/.test(uid))return reply({ok:false,error:'INVALID_PLAYER_QUERY'},400);
  const product=await publishedProduct(env.DB,getProduct(b.productId));if(!product)return reply({ok:false,error:'PRODUCT_UNAVAILABLE'},404);
  const region=await verifiedPlayer(env,uid,fetcher);detectedRegion=region;const quote=await raLiveQuote(env,product.diamonds,region,uid,fetcher),validation=[];
  for(const p of quote.plan.packs){const result=await validateRecargasAccount(env,p.productId,uid,fetcher);validation.push({productId:p.productId,...result});}
  const config=purchaseConfiguration(env),reasons=[...config.reasons];
  if(!quote.canAfford)reasons.push('RA_INSUFFICIENT_FUNDS');
  if(validation.some(v=>v.supported&&v.status!==true))reasons.push('RA_PLAYER_REJECTED');
  if(product.salePriceCents>20000)reasons.push('PRODUCT_OUTSIDE_PILOT');
  return reply({ok:true,checkedAt:new Date().toISOString(),ready:!reasons.length,reasons,region,diamonds:product.diamonds,amountCents:product.salePriceCents,provider:'recargas-america',wallet:quote.wallet,canAfford:quote.canAfford,totalMicros:quote.plan.totalMicros,operationCount:quote.plan.operationCount,packs:quote.plan.packs.map(p=>({productId:p.productId,name:p.providerItemName,sku:p.catalogSku,playerField:p.playerField,diamonds:p.diamonds,quantity:p.quantity,price:p.price})),validation,purchasesPerformed:0});
 }catch(e){const safe=/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|HTTP_\d{3}|MAPPING_INVALID|MAPPING_MISSING|REGION_UNVERIFIED|REGION_UNAVAILABLE|PRODUCT_UNAVAILABLE|PRODUCT_MISMATCH|CURRENCY_UNVERIFIED|AMOUNT_INVALID|PRICE_INVALID|EXACT_RECIPE_UNAVAILABLE)$/.test(e.message)||['PLAYER_VERIFIER_MISSING','PLAYER_VERIFICATION_FAILED'].includes(e.message);return reply({ok:false,error:safe?e.message:'READINESS_UNAVAILABLE',...(detectedRegion?{region:detectedRegion}:{})},503);}
}
