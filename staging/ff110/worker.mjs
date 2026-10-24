import bridge from '../../cloudflare/ra-purchase/worker.mjs';
import {boundedText} from '../../cloudflare/ra-purchase/protocol.mjs';
import {product} from './fixture.mjs';
export default {async fetch(request,env){
 const expires=Number(env.FF110_SIM_EXPIRES_AT);
 if(!Number.isFinite(expires)||Date.now()>=expires||expires-Date.now()>20*60*1000)return new Response(null,{status:503});
 let body;try{body=JSON.parse(await boundedText(request.clone()));}catch{return new Response(null,{status:400});}
 if(body.productId!==product.id||body.catalogSku!==product.sku||body.name!==product.name)return new Response(null,{status:400});
 return bridge.fetch(request,{RA_FF110_BRIDGE_ENABLED:'true',RA_PURCHASE_SERVICE_TOKEN:env.FF110_SIM_SERVICE_TOKEN,RA_PURCHASE_PROXY_SECRET:env.FF110_SIM_PROXY_SECRET,RA_PURCHASE_GATEWAY:env.FF110_SIM_GATEWAY});
}};
