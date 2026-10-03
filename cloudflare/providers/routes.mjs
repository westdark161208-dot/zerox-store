import {can} from '../security/permissions.mjs';
import {readRecargasAmerica} from './recargas-america.mjs';
export async function providerRoute(request,env,url,user,json) {
  if (!user || user.status!=='active') return json({ok:false,error:'LOGIN_REQUIRED'},401);
  if (!can(user,'providers.read')) return json({ok:false,error:'FORBIDDEN'},403);
  if (request.method!=='GET') return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const root='/api/admin/providers/recargas-america/';
  const resource=url.pathname.slice(root.length);
  if (!url.pathname.startsWith(root) || !['status','wallet','catalog'].includes(resource)) return json({ok:false,error:'NOT_FOUND'},404);
  if (resource==='status') return json({ok:true,readEnabled:env.RA_READ_ENABLED==='true',keyConfigured:!!env.RECARGAS_AMERICA_API_KEY,purchasesEnabled:false});
  try {
    return json({ok:true,provider:'recargas-america',resource,data:await readRecargasAmerica(env,resource),syncedAt:new Date().toISOString(),purchasesEnabled:false});
  } catch(error) {
    const safe=/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|HTTP_\d{3})$/.test(error.message)?error.message:'RA_UNAVAILABLE';
    return json({ok:false,error:safe},503);
  }
}
