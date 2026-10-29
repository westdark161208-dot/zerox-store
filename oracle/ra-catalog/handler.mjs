import {validSecret,verify,canonical,boundedText,response} from '../../cloudflare/ra-purchase/protocol.mjs';
import {createCatalogAdapter,requirePlan} from './adapter.mjs';
export function createCatalogHandler({config,store,upstream,clock=Date.now}){
 const adapter=createCatalogAdapter({store,upstream});
 return async request=>{
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/healthz'&&!url.search)return response({ok:true,service:'zerox-ra-catalog',version:1,purchasesEnabled:config.enabled===true});
  const action=url.pathname.split('/').at(-1);
  if(request.method!=='POST'||url.search||url.pathname!=='/v1/catalog/'+action||!['preflight','submit','lookup'].includes(action))return response({ok:false},404);
  if(config.enabled!==true||!validSecret(config.proxySecret))return response({ok:false,error:'DISABLED'},503);
  try{
   const body=await boundedText(request),time=request.headers.get('x-zerox-time'),nonce=request.headers.get('x-zerox-nonce');
   if(!/^\d{13}$/.test(time||'')||Math.abs(clock()-Number(time))>30000||! /^[a-f0-9-]{36}$/.test(nonce||'')||!await verify(config.proxySecret,canonical(url.pathname,time,nonce,body),request.headers.get('x-zerox-signature')))return response({ok:false},401);
   if(!store.authorize(nonce,clock()))return response({ok:false},429);
   const p=JSON.parse(body);requirePlan(p?.plan);
   if(Object.keys(p).some(k=>!['plan','operationId'].includes(k))||action!=='preflight'&&!/^[a-f0-9-]{36}$/.test(p.operationId||''))return response({ok:false},400);
   const result=action==='preflight'?await adapter.preflight(p.plan):await adapter[action](p.operationId,p.plan);
   return response({ok:true,action,result});
  }catch{return response({ok:false,error:'CATALOG_OPERATION_UNAVAILABLE'},503);}
 };
}
