import {validSecret,boundedText,validPayload} from '../ra-purchase/protocol.mjs';
export function privatePurchaseReady(env){
 return env.RA_FF110_PILOT_ONLY==='true'&&env.RA_FF110_PURCHASE_ENABLED==='true'&&env.RA_FF110_CONTRACT_VERIFIED==='true'&&env.RA_FF110_PRODUCT_VERIFIED==='true'&&
 env.RA_ADMIN_READ_ENABLED==='true'&&env.RA_ADMIN_READ_TRANSPORT==='service-binding'&&env.RA_ADMIN_READ_CONTRACT_VERIFIED==='true'&&typeof env.RA_READ_SERVICE?.fetch==='function'&&validSecret(env.RA_READ_ADMIN_TOKEN)&&
 ['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED'].every(k=>env[k]==='false')&&
 typeof env.RA_PURCHASE_SERVICE?.fetch==='function'&&validSecret(env.RA_PURCHASE_SERVICE_TOKEN)&&
 ![env.RA_READ_ADMIN_TOKEN,env.RA_PROXY_SECRET,env.RECARGAS_AMERICA_API_KEY].includes(env.RA_PURCHASE_SERVICE_TOKEN);
}
export function privatePayload(plan,pack,operationId){return {operationId,playerId:plan.playerId,region:plan.region,productId:pack.productId,catalogSku:pack.catalogSku,name:pack.providerItemName,maxPriceUsd:String(pack.price),field:pack.playerField||'player_id'};}
export async function privatePurchaseCall(env,action,payload){
 if(!privatePurchaseReady(env)||!validPayload(payload,action))throw Error('RA_FF110_PURCHASE_TRANSPORT_PENDING');
 try{
 const r=await env.RA_PURCHASE_SERVICE.fetch('https://ra-purchase.internal/v1/ff110/'+action,{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+env.RA_PURCHASE_SERVICE_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(28000)});
 if(r.status!==200||r.redirected)throw Error('TRANSPORT');const data=JSON.parse(await boundedText(r));
 if(data.ok!==true||data.action!==action)throw Error('CONTRACT');
 if(action==='validate'){if(typeof data.supported!=='boolean'||typeof data.status!=='boolean')throw Error('CONTRACT');return {supported:data.supported,status:data.status};}
 if(!['SUCCESS','PROCESSING','UNKNOWN','NOT_ACCEPTED'].includes(data.status))throw Error('CONTRACT');
 if(['SUCCESS','PROCESSING'].includes(data.status)&&!/^[A-Za-z0-9_-]{1,120}$/.test(data.reference||''))throw Error('CONTRACT');
 return {status:data.status,...(/^[A-Za-z0-9_-]{1,120}$/.test(data.reference||'')?{reference:data.reference}:{})};
 }catch{throw Error('RA_PRIVATE_PURCHASE_UNAVAILABLE');}
}
