import {COOKIE,digest,sessionToken,login} from './auth.mjs';
import {page,css,js} from './panel.mjs';
import {FOUNDER_USER_ID} from '../security/founder.mjs';
import {raFounderRead} from '../providers/ra-founder-read.mjs';
import {founderBalancesRoute} from '../providers/founder-balances.mjs';
const ROOT='/api/admin/providers/';
const routes=new Map([[ROOT+'recargas-america/status','status'],[ROOT+'founder-balances','balances'],[ROOT+'recargas-america/wallet','wallet'],[ROOT+'recargas-america/catalog','catalog']]);
function reply(body,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
// Only a separately provisioned staging identity database. No schema or activity writes.
export default {async fetch(request,env){
 const url=new URL(request.url),resource=routes.get(url.pathname);

 if(url.search)return reply({ok:false,error:'INVALID_REQUEST'},400);
 if(env.STAGING_READ_ONLY!=='true'||['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED'].some(k=>env[k]!=='false'))return reply({ok:false,error:'STAGING_DISABLED'},503);
 const html=(body,type='text/html')=>new Response(body,{headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 try{
  if(url.pathname==='/auth/login'&&request.method==='POST')return await login(request,env,reply);
  if(request.method==='GET'&&url.pathname==='/')return html(page(false));
  if(request.method==='GET'&&url.pathname==='/panel.js')return html(js,'application/javascript');
  if(request.method==='GET'&&url.pathname==='/panel.css')return html(css,'text/css');
  if(!resource&&!['/panel','/auth/logout'].includes(url.pathname))return reply({ok:false,error:'NOT_FOUND'},404);
  if(request.method!=='GET'&&!(url.pathname==='/auth/logout'&&request.method==='POST'))return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const token=sessionToken(request);
  if(!token||! /^[A-Za-z0-9_-]{43}$/.test(token))return reply({ok:false,error:'LOGIN_REQUIRED'},401);
  const hash=await digest(token);
  const user=await env.STAGING_AUTH_DB.prepare('SELECT u.id,u.status FROM zx_sessions s JOIN zx_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1').bind(hash,new Date().toISOString()).first();
  if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
  if(user.id!==FOUNDER_USER_ID)return reply({ok:false,error:'FORBIDDEN'},403);
  if(url.pathname==='/auth/logout'){
   if(request.headers.get('origin')!==url.origin)return reply({ok:false},403);
   await env.STAGING_AUTH_DB.prepare('UPDATE zx_sessions SET revoked_at=? WHERE token_hash=?').bind(new Date().toISOString(),hash).run();
   const r=reply({ok:true});r.headers.set('Set-Cookie',COOKIE+'=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return r;
  }
  if(url.pathname==='/panel')return html(page(true));
  if(resource==='balances')return founderBalancesRoute(request,env,{...user,isFounder:true},reply);
  return raFounderRead(request,env,{...user,isFounder:true},reply);
 }catch{return reply({ok:false,error:'PRIVATE_READ_UNAVAILABLE'},503);}
}};
