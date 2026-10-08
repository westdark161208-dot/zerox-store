import {activitySchema,accountLifecycle} from '../accounts/lifecycle.mjs';
import {countryRegions,geographySchema} from '../accounts/geography.mjs';
import {walletSchema,walletState,postMovement} from './ledger.mjs';
export async function walletAdminRoute(request,env,url,user,json){
 const reply=(b,s=200)=>{const r=json(b,s);r.headers?.set('Cache-Control','private, no-store');return r;};
 if(user?.isFounder!==true||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 await activitySchema(env.DB);await geographySchema(env.DB);await walletSchema(env.DB);await env.DB.prepare('CREATE TABLE IF NOT EXISTS zx_purchase_contacts(order_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,phone TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 if(url.pathname==='/api/admin/customers/account')return accountLifecycle(request,env,user,reply);
 if(url.pathname==='/api/admin/customers'&&request.method==='GET'){
  const q=(url.searchParams.get('q')||'').trim().slice(0,120),page=Math.max(0,parseInt(url.searchParams.get('page'))||0);
  const region=url.searchParams.get('region')||'',country=url.searchParams.get('country')||'';const codes=Object.entries(countryRegions).filter(([,r])=>r===region).map(([c])=>c);
  const geo=region==='unknown'?" AND l.country IS NULL":codes.length?" AND l.country IN ("+codes.map(()=>'?').join(',')+")":'';
  const activity=url.searchParams.get('activity')||'';
  const activityFilter=activity==='inactive'?" AND COALESCE(a.last_seen_at,u.created_at)<datetime('now','-30 days') AND u.status!='deleted'":activity==='deleted'?" AND u.status='deleted'":" AND u.status!='deleted'";
  const args=[q,q,q,...codes,...(country?[country]:[]),page*25];
  const rows=(await env.DB.prepare(`SELECT u.id,u.username,u.email,u.status,u.created_at AS createdAt,a.last_seen_at AS lastSeenAt,l.country,l.state,(SELECT phone FROM zx_purchase_contacts c WHERE c.user_id=u.id ORDER BY created_at DESC LIMIT 1) phone,COALESCE((SELECT SUM(amount_cents) FROM zx_wallet_ledger l WHERE l.user_id=u.id),0) balanceCents FROM zx_users u LEFT JOIN zx_customer_location l ON l.user_id=u.id LEFT JOIN zx_account_activity a ON a.user_id=u.id WHERE (?='' OR instr(lower(u.username),lower(?))>0 OR instr(lower(u.email),lower(?))>0)${activityFilter}${geo}${country?' AND l.country=?':''} ORDER BY u.created_at DESC,u.id LIMIT 26 OFFSET ?`).bind(...args).all()).results;
  const counts=(await env.DB.prepare("SELECT country,COUNT(*) count FROM zx_users u LEFT JOIN zx_customer_location l ON l.user_id=u.id WHERE u.status!='deleted' GROUP BY country").all()).results;return reply({ok:true,users:rows.slice(0,25),hasMore:rows.length>25,countries:counts.map(c=>({...c,region:countryRegions[c.country]||'unknown'}))});
 }
 if(url.pathname!=='/api/admin/customers/balance'||request.method!=='POST')return reply({ok:false,error:'NOT_FOUND'},404);
 const b=await request.json(),key=request.headers.get('Idempotency-Key');
 if(b.source==='adjustment'&&!b.reference)b.reference='AJUSTE-'+key;
 if(!/^[a-f0-9-]{36}$/.test(key||'')||typeof b.userId!=='string'||!['credit','debit'].includes(b.action)||!['oxxo','adjustment'].includes(b.source)||b.source==='oxxo'&&b.action!=='credit'||!Number.isSafeInteger(b.amountCents)||b.amountCents<1||b.amountCents>500000||typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>300||typeof b.reference!=='string'||!b.reference.trim()||b.reference.length>100||b.confirmed!==true)return reply({ok:false,error:'INVALID_ADJUSTMENT'},400);
 const target=await env.DB.prepare('SELECT id,username,status FROM zx_users WHERE id=?').bind(b.userId).first();if(!target||target.status!=='active')return reply({ok:false,error:'ACCOUNT_NOT_ACTIVE'},409);
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS zx_wallet_adjustments(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,action TEXT NOT NULL,amount_cents INTEGER NOT NULL,source TEXT NOT NULL,reference TEXT NOT NULL,reason TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(source,reference))`).run();
 const reference=b.reference.trim().toUpperCase(),reason=b.reason.trim();
 await env.DB.prepare('INSERT INTO zx_wallet_adjustments(id,user_id,action,amount_cents,source,reference,reason,actor) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(key,b.userId,b.action,b.amountCents,b.source,reference,reason,user.id).run();
 const saved=await env.DB.prepare('SELECT * FROM zx_wallet_adjustments WHERE id=?').bind(key).first();
 if(!saved||saved.user_id!==b.userId||saved.action!==b.action||saved.amount_cents!==b.amountCents||saved.source!==b.source||saved.reference!==reference||saved.reason!==reason||saved.actor!==user.id)return reply({ok:false,error:'ADJUSTMENT_CONFLICT'},409);
 try{const movement=await postMovement(env.DB,{userId:b.userId,kind:b.action==='credit'?'credit':'purchase',amountCents:b.amountCents,currency:'MXN',source:'manual-'+b.source,reference,requestKey:'manual:'+key,orderId:b.action==='debit'?'adjustment:'+key:null,actor:user.id});return reply({ok:true,username:target.username,movementId:movement.id,...await walletState(env.DB,b.userId)});}catch{return reply({ok:false,error:'BALANCE_ADJUSTMENT_REJECTED'},409);}
}
