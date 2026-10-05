import {associationRoute,resolvedRaEnvironment} from './ra-associations.mjs';
import {readinessRoute} from './readiness.mjs';
import {marketRoute} from './market.mjs';
import {purchaseConfiguration} from '../diamonds/purchases.mjs';
import {quotesRoute} from './quotes.mjs';
import {integrationRead} from './integrations.mjs';
import {can} from '../security/permissions.mjs';
import {readRecargasAmerica,validateRecargasAccount} from './recargas-america.mjs';
export async function providerRoute(request,env,url,user,json) {
  const reply=(body,status=200)=>{const response=json(body,status);response.headers?.set('Cache-Control','no-store');return response;};
  if (!user || user.status!=='active') return reply({ok:false,error:'LOGIN_REQUIRED'},401);
  if (!can(user,'providers.read')) return reply({ok:false,error:'FORBIDDEN'},403);
  if(url.pathname==='/api/admin/providers/recargas-america/associations')return associationRoute(request,env,url,user,reply);
  if(url.pathname==='/api/admin/providers/recargas-america/readiness')return readinessRoute(request,env,url,user,reply);
  if(url.pathname.startsWith('/api/admin/providers/market'))return marketRoute(request,env,url,user,reply);
  if(url.pathname==='/api/admin/providers/sixofire/quotes')return quotesRoute(request,env,url,user,reply);
  if(url.pathname==='/api/admin/providers/recargas-america/validate'&&request.method==='POST'){
    try{const body=await request.json();return reply({ok:true,data:await validateRecargasAccount(env,body.productId,String(body.uid||'')),purchasesEnabled:false});}
    catch{return reply({ok:false,error:'RA_VALIDATION_UNAVAILABLE'},503);}
  }
  if (request.method!=='GET') return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if (!url.pathname.startsWith('/api/admin/providers/recargas-america/')) return integrationRead(env,url,reply);
  const root='/api/admin/providers/recargas-america/';
  const resource=url.pathname.slice(root.length);
  if (!url.pathname.startsWith(root) || !['status','wallet','catalog'].includes(resource)) return reply({ok:false,error:'NOT_FOUND'},404);
  if (resource==='status'){env=await resolvedRaEnvironment(env);return reply({ok:true,readEnabled:env.RA_READ_ENABLED==='true',keyConfigured:!!env.RECARGAS_AMERICA_API_KEY,purchasesEnabled:purchaseConfiguration(env).enabled,reasons:purchaseConfiguration(env).reasons,providerFor:'diamonds'});}
  try {
    return reply({ok:true,provider:'recargas-america',resource,data:await readRecargasAmerica(env,resource),syncedAt:new Date().toISOString(),purchasesEnabled:false});
  } catch(error) {
    const safe=/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|HTTP_\d{3})$/.test(error.message)?error.message:'RA_UNAVAILABLE';
    return reply({ok:false,error:safe},503);
  }
}
