import {FOUNDER_USER_ID} from '../security/founder.mjs';
export const COOKIE='__Host-zx_ra_staging';
export async function digest(value){return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))));}
export function token(){return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function sessionToken(request){return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||(request.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];}
export async function login(request,env,reply){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({ok:false,error:'FORBIDDEN'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({ok:false},415);
 const reader=request.body?.getReader();if(!reader)return reply({ok:false},400);
 let size=0,text='';try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>256){await reader.cancel();return reply({ok:false},413);}text+=new TextDecoder().decode(chunk.value);}}finally{reader.releaseLock();}
 let code;try{code=JSON.parse(text).code;}catch{return reply({ok:false},400);}
 if(typeof code!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(code))return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 const now=new Date().toISOString();
 // Atomic consumption prevents concurrent reuse. All records exist only in staging D1.
 const grant=await env.STAGING_AUTH_DB.prepare('DELETE FROM zx_login_grants WHERE token_hash=? AND expires_at>? RETURNING user_id').bind(await digest(code),now).first();
 if(grant?.user_id!==FOUNDER_USER_ID)return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 const user=await env.STAGING_AUTH_DB.prepare('SELECT id,status FROM zx_users WHERE id=?').bind(grant.user_id).first();
 if(user?.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 const raw=token();await env.STAGING_AUTH_DB.prepare('INSERT INTO zx_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),user.id,await digest(raw),new Date(Date.now()+3600000).toISOString()).run();
 const r=reply({ok:true});r.headers.set('Set-Cookie',COOKIE+'='+raw+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600');return r;
}
