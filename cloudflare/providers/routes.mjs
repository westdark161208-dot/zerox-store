import {integrationRead} from './integrations.mjs';
import {can} from '../security/permissions.mjs';
import {readRecargasAmerica} from './recargas-america.mjs';
export async function providerRoute(request,env,url,user,json) {
  const reply=(body,status=200)=>{const response=json(body,status);response.headers?.set('Cache-Control','no-store');return response;};
  if (!user || user.status!=='active') return reply({ok:false,error:'LOGIN_REQUIRED'},401);
  if (!can(user,'providers.read')) return reply({ok:false,error:'FORBIDDEN'},403);
  if (request.method!=='GET') return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if (!url.pathname.startsWith('/api/admin/providers/recargas-america/')) return integrationRead(env,url,reply);
  const root='/api/admin/providers/recargas-america/';
  const resource=url.pathname.slice(root.length);
  if (!url.pathname.startsWith(root) || !['status','wallet','catalog'].includes(resource)) return reply({ok:false,error:'NOT_FOUND'},404);
  if (resource==='status') return reply({ok:true,readEnabled:env.RA_READ_ENABLED==='true',keyConfigured:!!env.RECARGAS_AMERICA_API_KEY,purchasesEnabled:false});
  try {
    return reply({ok:true,provider:'recargas-america',resource,data:await readRecargasAmerica(env,resource),syncedAt:new Date().toISOString(),purchasesEnabled:false});
  } catch(error) {
    const safe=/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|HTTP_\d{3})$/.test(error.message)?error.message:'RA_UNAVAILABLE';
    return reply({ok:false,error:safe},503);
  }
}
