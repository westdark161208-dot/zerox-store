import {notifyApplication} from './umy.mjs';
import {imageInfo} from '../resellers-appearance.js';
export const SUPPORT='529514754210';
export const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
export const clean=(v,min,max)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail('INVALID_FIELDS');return v.trim()};
export async function proSchema(env){
 const db=env.DB;
 for(const sql of [
 "CREATE TABLE IF NOT EXISTS zx_r_pro_migrations(id TEXT PRIMARY KEY)",
 "CREATE TABLE IF NOT EXISTS zx_r_accounts(user_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'pending',manual_tier INTEGER,name_color TEXT NOT NULL DEFAULT '#edf4f0',frame TEXT NOT NULL DEFAULT 'none',store_name TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 "CREATE TABLE IF NOT EXISTS zx_r_applications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,email TEXT NOT NULL,username TEXT NOT NULL,store_name TEXT NOT NULL,phone TEXT NOT NULL,weekly_sales INTEGER NOT NULL,reason TEXT NOT NULL,receipt_key TEXT NOT NULL,receipt_mime TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',reviewer TEXT,review_note TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT)",
 "CREATE UNIQUE INDEX IF NOT EXISTS zx_r_application_pending ON zx_r_applications(user_id) WHERE status='pending'",
 "CREATE TABLE IF NOT EXISTS zx_r_pro_audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,user_id TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 "CREATE TABLE IF NOT EXISTS zx_r_umy_outbox(id TEXT PRIMARY KEY,application_id TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending',message_id TEXT,last_error TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 "CREATE TABLE IF NOT EXISTS zx_r_catalog_editor(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL DEFAULT 0,draft TEXT NOT NULL DEFAULT '{}',published TEXT NOT NULL DEFAULT '{}')",
 "CREATE TABLE IF NOT EXISTS zx_r_catalog_versions(id TEXT PRIMARY KEY,config TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 "INSERT OR IGNORE INTO zx_r_catalog_editor(id) VALUES(1)"
 ])await db.prepare(sql).run();
 // One-time grandfathering. A later deposit must never bypass administrative admission.
 await db.batch([
 db.prepare("INSERT OR IGNORE INTO zx_r_accounts(user_id,status) SELECT user_id,'approved' FROM zx_r_members WHERE tier>0 AND NOT EXISTS(SELECT 1 FROM zx_r_pro_migrations WHERE id='legacy-members-v1')"),
 db.prepare("INSERT OR IGNORE INTO zx_r_pro_migrations(id) VALUES('legacy-members-v1')")]);
}
export async function profile(env,user){
 if(user?.isFounder)return {user_id:user.id,status:'approved',manual_tier:7,name_color:'#ff4040',frame:'crown',store_name:'Zero’X Store',revision:0};
 return user?await env.DB.prepare('SELECT * FROM zx_r_accounts WHERE user_id=?').bind(user.id).first():null;
}
export const approved=async(env,user)=>user?.status==='active'&&(await profile(env,user))?.status==='approved';
export const audit=(db,actor,id,action,detail)=>db.prepare('INSERT INTO zx_r_pro_audit(id,actor,user_id,action,detail) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),actor,id,action,JSON.stringify(detail));
export async function body(request,max=16000){const reader=request.body?.getReader();if(!reader)fail('BODY_REQUIRED');let length=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();fail('TOO_LARGE',413)}chunks.push(value)}const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return bytes;}
export async function jsonBody(request){try{const value=JSON.parse(new TextDecoder().decode(await body(request)));if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_JSON');return value}catch(e){if(e.status)throw e;fail('INVALID_JSON')}}
async function passwordHash(password){
 const salt=crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256);
 const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));
 return `pbkdf2$100000$${b64(salt)}$${b64(bits)}`;
}
export async function accountRoute(request,env,url,user,json,state){
 const admin=url.pathname.startsWith('/api/admin/resellers/portal');
 const path=url.pathname.replace(admin?'/api/admin/resellers/portal':'/api/resellers/portal','');
 if(!user||user.status!=='active')return json({ok:false,error:'LOGIN_REQUIRED'},401);
 if(admin&&!user.isFounder)return json({ok:false,error:'FORBIDDEN'},403);
 const db=env.DB;
 if(!admin&&path==='/me'&&request.method==='GET'){
  const account=await profile(env,user), financial=await state(env,user);
  const storedProfile=await db.prepare('SELECT avatar_url FROM zx_profiles WHERE user_id=?').bind(user.id).first();
  const hasStyle=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_profile_style'").first();
  const style=hasStyle?await db.prepare('SELECT avatar FROM zx_profile_style WHERE user_id=?').bind(user.id).first():null;
  const applications=await db.prepare('SELECT id,status,review_note,created_at FROM zx_r_applications WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(user.id).all();
  return json({ok:true,account,user:{id:user.id,username:user.username,email:user.email,avatar:style?.avatar||storedProfile?.avatar_url||user.avatar_url||''},...financial,applications:applications.results});
 }
 const receipt=/^\/applications\/([a-f0-9-]{36})\/receipt$/.exec(path);
 if(receipt&&request.method==='GET'){
  const row=await db.prepare('SELECT * FROM zx_r_applications WHERE id=?').bind(receipt[1]).first();
  if(!row||(!admin&&row.user_id!==user.id))return json({ok:false,error:'NOT_FOUND'},404);
  const file=await env.MEDIA?.get(row.receipt_key);if(!file)return json({ok:false,error:'NOT_FOUND'},404);
  const headers=new Headers(json({}).headers);headers.set('Content-Type',row.receipt_mime);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Content-Security-Policy',"default-src 'none'");return new Response(file.body,{headers});
 }
 if(!admin&&path==='/applications'&&request.method==='POST'){
  const account=await profile(env,user);if(account?.status==='approved'||account?.status==='disabled')fail('ACCOUNT_ALREADY_REVIEWED',409);
  if(!env.MEDIA)fail('MEDIA_UNAVAILABLE',503);
  const bytes=await body(request,4500000);let form;
  try{form=await new Request(request.url,{method:'POST',headers:request.headers,body:bytes}).formData()}catch{fail('INVALID_FORM')}
  const id=form.get('requestId');if(!uuid(id))fail('INVALID_REQUEST_ID');
  const previous=await db.prepare('SELECT id,user_id FROM zx_r_applications WHERE id=?').bind(id).first();
  if(previous){if(previous.user_id!==user.id)fail('REQUEST_CONFLICT',409);return json({ok:true,id,repeated:true})}
  if(await db.prepare("SELECT id FROM zx_r_applications WHERE user_id=? AND status='pending'").bind(user.id).first())fail('APPLICATION_PENDING',409);
  const email=clean(form.get('email'),3,254).toLowerCase(),username=clean(form.get('username'),3,32),store=clean(form.get('storeName'),2,100),phone=clean(form.get('phone'),8,20),reason=clean(form.get('reason'),10,1500),sales=Number(form.get('weeklySales'));
  if(email!==user.email?.toLowerCase()||username!==user.username)fail('ACCOUNT_IDENTITY_MISMATCH');
  if(!/^\+[1-9]\d{7,14}$/.test(phone)||!Number.isSafeInteger(sales)||sales<0||sales>1000000||form.get('consent')!=='true')fail('INVALID_FIELDS');
  const file=form.get('receipt');if(!file||typeof file.arrayBuffer!=='function'||file.size>4000000||file.size===0)fail('INVALID_RECEIPT');
  const raw=new Uint8Array(await file.arrayBuffer());let info;try{info=imageInfo(raw)}catch{fail('INVALID_RECEIPT')}
  if(!['image/png','image/jpeg'].includes(info.mime)||file.type!==info.mime)fail('INVALID_RECEIPT');
  const key='resellers-private/applications/'+crypto.randomUUID()+'.'+info.ext;
  await env.MEDIA.put(key,raw,{httpMetadata:{contentType:info.mime}});
  try{await db.batch([
   db.prepare('INSERT INTO zx_r_applications(id,user_id,email,username,store_name,phone,weekly_sales,reason,receipt_key,receipt_mime) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,user.id,email,username,store,phone,sales,reason,key,info.mime),
   db.prepare("INSERT INTO zx_r_accounts(user_id,status,store_name) VALUES(?,'pending',?) ON CONFLICT(user_id) DO UPDATE SET status='pending',store_name=excluded.store_name,revision=revision+1 WHERE status='rejected'").bind(user.id,store),
   db.prepare('INSERT INTO zx_r_umy_outbox(id,application_id) VALUES(?,?)').bind(crypto.randomUUID(),id)
  ])}catch(e){await env.MEDIA.delete?.(key);if(/unique/i.test(String(e)))fail('APPLICATION_PENDING',409);throw e}
  return json({ok:true,id,notification:await notifyApplication(env,id)},201);
 }
 if(!admin)return null;
 if(path==='/applications'&&request.method==='GET'){
  const status=url.searchParams.get('status')||'pending';if(!['pending','approved','rejected'].includes(status))fail('INVALID_STATUS');
  const rows=await db.prepare('SELECT a.id,a.user_id,a.email,a.username,a.store_name,a.phone,a.weekly_sales,a.reason,a.status,a.review_note,a.created_at,o.status notification_status FROM zx_r_applications a LEFT JOIN zx_r_umy_outbox o ON o.application_id=a.id WHERE a.status=? ORDER BY a.created_at DESC LIMIT 200').bind(status).all();return json({ok:true,applications:rows.results});
 }
 if(path==='/accounts'&&request.method==='GET'){
  const query='%'+(url.searchParams.get('q')||'').slice(0,100)+'%';
  const rows=await db.prepare("SELECT a.*,u.email,u.username,u.avatar_url FROM (SELECT u.*,p.avatar_url FROM zx_users u LEFT JOIN zx_profiles p ON p.user_id=u.id) u JOIN zx_r_accounts a ON a.user_id=u.id WHERE u.username LIKE ? OR u.email LIKE ? ORDER BY a.created_at DESC LIMIT 200").bind(query,query).all();return json({ok:true,accounts:rows.results});
 }
 if(path==='/account'&&request.method==='GET'){
  const id=url.searchParams.get('id');const account=await db.prepare('SELECT a.*,u.username,u.email FROM zx_r_accounts a JOIN zx_users u ON u.id=a.user_id WHERE a.user_id=?').bind(id).first();if(!account)fail('NOT_FOUND',404);
  const ledger=await db.prepare('SELECT amount,kind,reference,created_at FROM zx_r_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(id).all();
  const logs=await db.prepare('SELECT actor,action,detail,created_at FROM zx_r_pro_audit WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(id).all();
  return json({ok:true,account,financial:await state(env,{id,isFounder:false}),ledger:ledger.results,audit:logs.results});
 }
 if(request.method!=='POST')return null;
 if(!['/accounts/create','/accounts/update','/accounts/credit','/applications/review'].includes(path))return null;
 const b=await jsonBody(request);
 if(path==='/accounts/create'){
  const email=clean(b.email,3,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('INVALID_EMAIL');
  const existing=await db.prepare('SELECT id,status FROM zx_users WHERE lower(email)=?').bind(email).first();
  if(existing&&existing.status!=='active')fail('ACCOUNT_DISABLED',409);
  const id=existing?.id||crypto.randomUUID();if(id===user.id)fail('CANNOT_EDIT_FOUNDER');const account=await profile(env,{id});if(account)fail('RESELLER_ACCOUNT_EXISTS',409);
  const statements=[];
  if(!existing){const username=clean(b.username,3,24);if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(username))fail('INVALID_USERNAME');if(await db.prepare('SELECT id FROM zx_users WHERE lower(username)=lower(?)').bind(username).first())fail('ACCOUNT_EXISTS',409);const password=clean(b.password,12,128);statements.push(db.prepare('INSERT INTO zx_users(id,email,username,password_hash) VALUES(?,?,?,?)').bind(id,email,username,await passwordHash(password)),db.prepare('INSERT INTO zx_profiles(user_id,display_name) VALUES(?,?)').bind(id,username));}
  statements.push(db.prepare("INSERT INTO zx_r_accounts(user_id,status,manual_tier,store_name) VALUES(?,'approved',NULL,?)").bind(id,clean(b.storeName||'Tienda Resellers',2,100)),audit(db,user.id,id,'account.create',{existing:!!existing}));
  try{await db.batch(statements)}catch(e){if(/unique/i.test(String(e)))fail('ACCOUNT_EXISTS',409);throw e}
  return json({ok:true,userId:id,existing:!!existing},201);
 }
 if(path==='/applications/review'){
  if(!uuid(b.id)||!['approve','reject'].includes(b.action))fail('INVALID_REVIEW');
  const application=await db.prepare("SELECT * FROM zx_r_applications WHERE id=? AND status='pending'").bind(b.id).first();if(!application)fail('ALREADY_REVIEWED',409);
  const note=clean(b.note||'Revisión administrativa',3,500),status=b.action==='approve'?'approved':'rejected',logId=crypto.randomUUID(),statements=[];
  if(status==='approved'){
   if(b.paymentConfirmed!==true||!Number.isSafeInteger(b.amountCents)||b.amountCents<20000||b.amountCents>10000000)fail('PAYMENT_CONFIRMATION_REQUIRED');
   const reference=clean(b.paymentReference,3,120).normalize('NFKC').toUpperCase();
   statements.push(db.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,user_id,?,'credit',? FROM zx_r_applications WHERE id=? AND status='pending'").bind(logId,b.amountCents,'payment:'+reference,b.id));
  }
  statements.push(db.prepare('INSERT INTO zx_r_pro_audit(id,actor,user_id,action,detail) SELECT ?,?,user_id,?,? FROM zx_r_applications WHERE id=? AND status=\'pending\'').bind(status==='approved'?crypto.randomUUID():logId,user.id,'application.'+b.action,JSON.stringify({applicationId:b.id,note}),b.id));
  statements.push(db.prepare('UPDATE zx_r_accounts SET status=?,store_name=?,manual_tier=CASE WHEN ?=\'approved\' THEN manual_tier ELSE manual_tier END,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND EXISTS(SELECT 1 FROM zx_r_applications WHERE id=? AND status=\'pending\')').bind(status,application.store_name,status,application.user_id,b.id));
  statements.push(db.prepare('UPDATE zx_r_applications SET status=?,reviewer=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status=\'pending\'').bind(status,user.id,note,b.id));
  try{const result=await db.batch(statements);if(!result.at(-1).meta.changes)fail('ALREADY_REVIEWED',409)}catch(e){if(/unique/i.test(String(e)))fail('PAYMENT_ALREADY_CREDITED',409);throw e}
  return json({ok:true,status});
 }
 const id=clean(b.userId,1,80),account=await profile(env,{id});if(!account)fail('NOT_FOUND',404);
 if(id===user.id)fail('CANNOT_EDIT_FOUNDER');
 if(path==='/accounts/update'){
  if(!['approved','disabled'].includes(account.status))fail('APPLICATION_REVIEW_REQUIRED',409);
  if(!Number.isInteger(b.revision)||b.revision!==account.revision)fail('REVISION_CONFLICT',409);
  if(!['approved','disabled'].includes(b.status)||!(b.tier===null||Number.isInteger(b.tier)&&b.tier>=1&&b.tier<=7)||!/^#[a-f0-9]{6}$/i.test(b.color)||!['none','neon','gold','crown','violet','ice'].includes(b.frame))fail('INVALID_FIELDS');
  const result=await db.batch([
   db.prepare('UPDATE zx_r_accounts SET status=?,manual_tier=?,name_color=?,frame=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND revision=?').bind(b.status,b.tier,b.color,b.frame,id,b.revision),
   db.prepare('INSERT INTO zx_r_pro_audit(id,actor,user_id,action,detail) SELECT ?,?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),user.id,id,'account.update',JSON.stringify({status:b.status,tier:b.tier,color:b.color,frame:b.frame}))]);
  if(!result[0].meta.changes)fail('REVISION_CONFLICT',409);return json({ok:true});
 }
 if(path==='/accounts/credit'){
  if(!uuid(b.requestId)||b.confirm!==true||!Number.isSafeInteger(b.amountCents)||b.amountCents<1||b.amountCents>10000000)fail('INVALID_CREDIT');
  const reference='payment:'+clean(b.reference,3,120).normalize('NFKC').toUpperCase(),reason=clean(b.reason,5,500);
  const prior=await db.prepare('SELECT * FROM zx_r_pro_audit WHERE id=?').bind(b.requestId).first();
  const detail=JSON.stringify({amountCents:b.amountCents,reference,reason});
  if(prior){if(prior.user_id!==id||prior.actor!==user.id||prior.detail!==detail)fail('REQUEST_CONFLICT',409);return json({ok:true,repeated:true})}
  try{await db.batch([db.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) VALUES(?,?,?,'credit',?)").bind(crypto.randomUUID(),id,b.amountCents,reference),db.prepare('INSERT INTO zx_r_pro_audit(id,actor,user_id,action,detail) VALUES(?,?,?,?,?)').bind(b.requestId,user.id,id,'account.credit',detail)])}catch(e){if(/unique/i.test(String(e)))fail('PAYMENT_ALREADY_CREDITED',409);throw e}
  return json({ok:true});
 }
 return null;
}
