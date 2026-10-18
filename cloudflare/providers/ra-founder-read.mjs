import {readRaAdminService} from './ra-admin-service.mjs';
export async function raFounderRead(request,env,user,reply){
 if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 if(user.isFounder!==true)return reply({ok:false,error:'FORBIDDEN'},403);
 const url=new URL(request.url),resource=url.pathname.split('/').at(-1);
 if(request.method!=='GET')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 if(url.search)return reply({ok:false,error:'INVALID_REQUEST'},400);
 if(!['wallet','catalog','status'].includes(resource))return reply({ok:false,error:'RA_PRIVATE_READ_ONLY'},403);
 if(resource==='status'){
  const ready=env.RA_ADMIN_READ_ENABLED==='true'&&env.RA_ADMIN_READ_TRANSPORT==='service-binding'&&env.RA_ADMIN_READ_CONTRACT_VERIFIED==='true'&&typeof env.RA_READ_SERVICE?.fetch==='function'&&/^[0-9a-f]{64}$/.test(env.RA_READ_ADMIN_TOKEN||'');
  return reply({ok:true,readEnabled:ready,keyConfigured:ready,readTransport:'service-binding',readOnly:true,purchasesEnabled:false,reasons:['RA_PRIVATE_READ_ONLY']});
 }
 try{const data=await readRaAdminService(env,resource);return reply({ok:true,provider:'recargas-america',resource,data,...(resource==='catalog'?{currency:'USD',productCount:data.length}:{}),syncedAt:new Date().toISOString(),purchasesEnabled:false});}
 catch{return reply({ok:false,error:'RA_ADMIN_READ_UNAVAILABLE'},503);}
}
