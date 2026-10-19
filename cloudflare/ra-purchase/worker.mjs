import {validSecret,digest,sign,canonical,boundedText,validPayload,response} from './protocol.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url),action=url.pathname.split('/').at(-1);
 if(request.method!=='POST'||url.search||url.pathname!=='/v1/ff110/'+action||!['validate','submit','lookup'].includes(action))return response({ok:false},404);
 const token=env.RA_PURCHASE_SERVICE_TOKEN,proxy=env.RA_PURCHASE_PROXY_SECRET;
 if(env.RA_FF110_BRIDGE_ENABLED!=='true'||!validSecret(token)||!validSecret(proxy)||token===proxy||typeof env.RA_PURCHASE_GATEWAY?.fetch!=='function')return response({ok:false,error:'BRIDGE_DISABLED'},503);
 if(await digest(request.headers.get('authorization')||'')!==await digest('Bearer '+token))return response({ok:false},401);
 try{
 const body=await boundedText(request);if(!validPayload(JSON.parse(body),action))return response({ok:false},400);
 const time=String(Date.now()),nonce=crypto.randomUUID();
 const signature=await sign(proxy,canonical(url.pathname,time,nonce,body));
 const upstream=await env.RA_PURCHASE_GATEWAY.fetch('http://127.0.0.1:8791'+url.pathname,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','x-zerox-time':time,'x-zerox-nonce':nonce,'x-zerox-signature':signature},body,signal:AbortSignal.timeout(25000)});
 if(upstream.status!==200||upstream.redirected)return response({ok:false,error:'GATEWAY_UNAVAILABLE'},503);
 const result=JSON.parse(await boundedText(upstream));
 // Gateway has a fixed normalized response. Never forward arbitrary error bodies or headers.
 if(result.ok!==true||result.action!==action)return response({ok:false,error:'GATEWAY_UNAVAILABLE'},503);
 if(action==='validate')return response({ok:true,action,supported:result.supported===true,status:result.status===true});
 if(!['SUCCESS','PROCESSING','UNKNOWN','NOT_ACCEPTED'].includes(result.status))throw Error('CONTRACT');
 return response({ok:true,action,status:result.status,...(/^[A-Za-z0-9_-]{1,120}$/.test(result.reference||'')?{reference:result.reference}:{})});
 }catch{return response({ok:false,error:'GATEWAY_UNAVAILABLE'},503);}
}};
