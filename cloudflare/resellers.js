import {singleLevel} from './resellers-pro/pricing.mjs';
import {umyRoute} from './resellers-pro/umy.mjs';
import {orderRoute} from './resellers-pro/orders.mjs';
import {catalogRoute,effectiveLegacy} from './resellers-pro/catalog.mjs';
import {proSchema, profile, approved, accountRoute} from './resellers-pro/accounts.mjs';
import {appearanceRoute} from "./resellers-appearance.js";
import "../diamonds.js";
// All monetary values are integer MXN cents. Prices and permissions are server-owned.
export const LEVELS=['Novato','Principiante','Élite','Maestro','Titán','Legendario','Zero’X Supreme'];
const CATALOG=[
 ['ff-booyah-76828','Pase Booyah','Pases Booyah',1,100,[3200,3100,3000,2900,2800,2700,2600]],
 ['ff-frag-17729','Fragmentos universales','Fragmentos',40,1400,[95,90,85,80,75,70,65]],
 ['ff-runas-4815','Fragmentos de runas','Fragmentos',40,1400,[95,90,85,80,75,70,65]],
 ['ff-galaxia-5657','Fragmentos de hiperlibro Galaxia','Fragmentos',40,1400,[95,90,85,80,75,70,65]],
 ['ff-revolucion-7649','Fragmentos de hiperlibro Revolución','Fragmentos',40,1400,[95,90,85,80,75,70,65]],
 ['ff-cajas-8816','Cajas de fragmentos universales','Cajas',7,280,[345,340,335,330,325,320,315]]
];
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
for(const p of ZXDiamonds.products)CATALOG.push([p.id,p.amount.toLocaleString('en-US')+' Diamantes','Diamantes',1,1,Array.from({length:7},(_,i)=>ZXDiamonds.price(p.publicCents,i+1)),p.plan]);
export async function schema(env){
 for(const sql of [
 'CREATE TABLE IF NOT EXISTS zx_r_members(user_id TEXT PRIMARY KEY,tier INTEGER NOT NULL DEFAULT 0)',
 'CREATE TABLE IF NOT EXISTS zx_r_ledger(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,amount INTEGER NOT NULL,kind TEXT NOT NULL,reference TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
 "CREATE TABLE IF NOT EXISTS zx_r_topups(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,amount INTEGER NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',reviewer TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 "CREATE TABLE IF NOT EXISTS zx_r_orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,request_key TEXT NOT NULL,product_id TEXT NOT NULL,product_name TEXT NOT NULL,tier INTEGER NOT NULL,quantity INTEGER NOT NULL,total INTEGER NOT NULL,uid TEXT NOT NULL,region TEXT NOT NULL,nickname TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',reviewer TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT,UNIQUE(user_id,request_key))",
 "CREATE TABLE IF NOT EXISTS zx_r_topup_requests(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,note_key TEXT NOT NULL,UNIQUE(user_id,note_key))",
 "CREATE TABLE IF NOT EXISTS zx_r_topup_reviews(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,payment_reference TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
 'CREATE INDEX IF NOT EXISTS zx_r_ledger_user ON zx_r_ledger(user_id)',
 'CREATE INDEX IF NOT EXISTS zx_r_orders_user ON zx_r_orders(user_id,status,completed_at)'
 ])await env.DB.prepare(sql).run();
 const columns=await env.DB.prepare('PRAGMA table_info(zx_r_orders)').all();
 if(!columns.results.some(c=>c.name==='plan')){try{await env.DB.prepare("ALTER TABLE zx_r_orders ADD COLUMN plan TEXT NOT NULL DEFAULT '[]'").run()}catch(e){if(!String(e).includes('duplicate column'))throw e}}

}
export async function state(env,user){
 const money=await env.DB.prepare("SELECT COALESCE(SUM(amount),0) balance,COALESCE(SUM(CASE WHEN kind='credit' THEN amount ELSE 0 END),0) deposits FROM zx_r_ledger WHERE user_id=?").bind(user.id).first();
 const sales=await env.DB.prepare("SELECT SUM(CASE WHEN completed_at>=datetime('now','-7 days') THEN 1 ELSE 0 END) weekly,SUM(CASE WHEN completed_at>=datetime('now','-30 days') THEN 1 ELSE 0 END) monthly FROM zx_r_orders WHERE user_id=? AND status='completed'").bind(user.id).first();
 let earned=money.deposits>=20000?1:0;
 if(earned){for(const [tier,count] of [[2,10],[3,30],[4,50],[5,100]])if(sales.weekly>=count)earned=tier;if(sales.monthly>=500)earned=Math.max(earned,6);if(sales.monthly>=1000)earned=7;}
 await env.DB.prepare('INSERT INTO zx_r_members(user_id,tier) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET tier=MAX(tier,excluded.tier)').bind(user.id,earned).run();
 const member=await env.DB.prepare('SELECT tier FROM zx_r_members WHERE user_id=?').bind(user.id).first();
 let effectiveTier=user.isFounder?7:member.tier;
 if(env.RESELLERS_PORTAL_PRO_ENABLED==='true'){await proSchema(env);const account=await profile(env,user);effectiveTier=account?.status==='approved'?(account.manual_tier??Math.max(1,member.tier)):0;}
 if(singleLevel(env)&&env.RESELLERS_PORTAL_PRO_ENABLED==='true')effectiveTier=effectiveTier>0?1:0;
 return {singleLevel:singleLevel(env),balanceCents:money.balance,depositedCents:money.deposits,tier:effectiveTier,isFounder:!!user.isFounder,weekly:Number(sales.weekly||0),monthly:Number(sales.monthly||0),levels:LEVELS};
}
export async function resellerRoute(request,env,url,user,respond){
 const json=(data,status)=>{const response=respond(data,status);response.headers.set('Cache-Control','no-store');return response;};
 if(url.pathname==='/api/resellers/portal/status'&&request.method==='GET')return json({ok:true,enabled:env.RESELLERS_PORTAL_PRO_ENABLED==='true',version:'resellers-portal-pro-1'});
 const visual=await appearanceRoute(request,env,url,user,json);if(visual)return visual;
 if(!user||user.status!=='active')return json({ok:false,error:'LOGIN_REQUIRED'},401);
 const admin=url.pathname.startsWith('/api/admin/resellers');
 if(admin&&!user.isFounder)return json({ok:false,error:'FORBIDDEN'},403);
 await schema(env);
 const path=url.pathname.replace(admin?'/api/admin/resellers':'/api/resellers','');
 if(env.RESELLERS_PORTAL_PRO_ENABLED==='true'){
 await proSchema(env);
 if(path.startsWith('/portal/')){try{return await umyRoute(request,env,url,user,json)||await orderRoute(request,env,url,user,json,CATALOG,state)||await catalogRoute(request,env,url,user,json,CATALOG,state)||await accountRoute(request,env,url,user,json,state)||json({ok:false,error:'NOT_FOUND'},404)}catch(e){if(e.status)return json({ok:false,error:e.message},e.status);throw e}}
 if(!admin&&['/catalog','/orders'].includes(path)&&!await approved(env,user))return json({ok:false,error:'RESELLER_APPROVAL_REQUIRED'},403);
 }
 if(request.method==='GET'&&admin&&path===''){
 const topups=await env.DB.prepare("SELECT t.*,u.username FROM zx_r_topups t JOIN zx_users u ON u.id=t.user_id WHERE t.status='pending' ORDER BY t.created_at LIMIT 100").all();
 const orders=await env.DB.prepare("SELECT o.*,u.username FROM zx_r_orders o JOIN zx_users u ON u.id=o.user_id WHERE o.status='pending' ORDER BY o.created_at LIMIT 100").all();
 const history=await env.DB.prepare('SELECT t.*,u.username,r.actor,r.action,r.payment_reference,r.created_at reviewed_at FROM zx_r_topups t JOIN zx_users u ON u.id=t.user_id LEFT JOIN zx_r_topup_reviews r ON r.id=t.id ORDER BY t.created_at DESC LIMIT 200').all();
 const members=await env.DB.prepare('SELECT u.id,u.username,COALESCE(m.tier,0) tier,COALESCE((SELECT SUM(amount) FROM zx_r_ledger WHERE user_id=u.id),0) balance FROM zx_users u JOIN zx_r_members m ON m.user_id=u.id ORDER BY u.username LIMIT 200').all();
 return json({ok:true,topups:topups.results,orders:orders.results,history:history.results,members:members.results});
 }
 if(request.method==='GET'&&!admin&&path==='/me'){
 const s=await state(env,user);
 const orders=await env.DB.prepare('SELECT * FROM zx_r_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.id).all();
 const topups=await env.DB.prepare('SELECT id,amount,note,status,created_at FROM zx_r_topups WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(user.id).all();
 const ledger=await env.DB.prepare('SELECT amount,kind,created_at FROM zx_r_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.id).all();
 return json({ok:true,username:user.username,...s,orders:orders.results,topups:topups.results,ledger:ledger.results});
 }
 if(request.method==='GET'&&!admin&&path==='/catalog'){
 const tier=Number(url.searchParams.get('tier')),s=await state(env,user),catalog=env.RESELLERS_PORTAL_PRO_ENABLED==='true'?await effectiveLegacy(env,CATALOG):CATALOG;
 if(!Number.isInteger(tier)||tier<1||tier>7||tier>s.tier)return json({ok:false,error:'LEVEL_LOCKED'},403);
 return json({ok:true,tier,name:LEVELS[tier-1],products:catalog.map(([id,name,category,min,max,prices,plan])=>({id,name,category,min,max,unitCents:prices[tier-1],plan:plan||null}))});
 }
 if(request.method!=='POST')return json({ok:false,error:'NOT_FOUND'},404);
 const b=await request.json();
 if(!admin&&path==='/topups'){
 if(!uuid(b.requestId)||!Number.isSafeInteger(b.amountCents)||b.amountCents<20000||b.amountCents>10000000||typeof b.note!=='string'||b.note.trim().length<3||b.note.length>200)return json({ok:false,error:'INVALID_TOPUP'},400);
 const old=await env.DB.prepare('SELECT * FROM zx_r_topups WHERE id=?').bind(b.requestId).first();
 if(old)return old.user_id===user.id&&old.amount===b.amountCents&&old.note===b.note.trim()?json({ok:true,pending:old.status==='pending',repeated:true}):json({ok:false,error:'REQUEST_CONFLICT'},409);
 const noteKey=b.note.trim().normalize('NFKC').toUpperCase().replace(/\s+/g,' ');
 try{const result=await env.DB.batch([
 env.DB.prepare("INSERT INTO zx_r_topup_requests(id,user_id,note_key) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM zx_r_topups WHERE user_id=? AND status='pending') AND NOT EXISTS(SELECT 1 FROM zx_r_topups WHERE user_id=? AND status='approved' AND UPPER(TRIM(note))=?)").bind(b.requestId,user.id,noteKey,user.id,user.id,noteKey),
 env.DB.prepare('INSERT INTO zx_r_topups(id,user_id,amount,note) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_r_topup_requests WHERE id=?)').bind(b.requestId,user.id,b.amountCents,b.note.trim(),b.requestId)
 ]);if(!result[0].meta.changes)return json({ok:false,error:'PENDING_TOPUP_EXISTS'},409);}catch(e){if(String(e).toLowerCase().includes('unique'))return json({ok:false,error:'DUPLICATE_REFERENCE'},409);throw e;}
 return json({ok:true,pending:true});
 }
 if(admin&&path==='/topups/review'){
 const topup=await env.DB.prepare("SELECT * FROM zx_r_topups WHERE id=? AND status='pending'").bind(b.id).first();
 if(!topup)return json({ok:false,error:'ALREADY_REVIEWED'},409);
 if(b.action==='reject'){const result=await env.DB.batch([
 env.DB.prepare("INSERT OR IGNORE INTO zx_r_topup_reviews(id,actor,action) SELECT ?,?,'reject' FROM zx_r_topups WHERE id=? AND status='pending'").bind(b.id,user.id,b.id),
 env.DB.prepare("UPDATE zx_r_topups SET status='rejected',reviewer=? WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM zx_r_topup_reviews WHERE id=? AND action='reject')").bind(user.id,b.id,b.id),
 env.DB.prepare("DELETE FROM zx_r_topup_requests WHERE id=? AND EXISTS(SELECT 1 FROM zx_r_topups WHERE id=? AND status='rejected')").bind(b.id,b.id)
 ]);return json({ok:!!result[1].meta.changes},result[1].meta.changes?200:409);}
 if(b.action!=='approve'||b.paymentConfirmed!==true||typeof b.paymentReference!=='string'||b.paymentReference.trim().length<3||b.paymentReference.length>120)return json({ok:false,error:'PAYMENT_CONFIRMATION_REQUIRED'},400);
 const ledgerId=crypto.randomUUID();
 try{const result=await env.DB.batch([
 env.DB.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,user_id,amount,'credit',? FROM zx_r_topups WHERE id=? AND status='pending'").bind(ledgerId,'payment:'+b.paymentReference.trim().toUpperCase(),b.id),
 env.DB.prepare("UPDATE zx_r_topups SET status='approved',reviewer=? WHERE id=? AND EXISTS(SELECT 1 FROM zx_r_ledger WHERE id=?)").bind(user.id,b.id,ledgerId),
 env.DB.prepare("INSERT INTO zx_r_topup_reviews(id,actor,action,payment_reference) SELECT ?,?,'approve',? WHERE EXISTS(SELECT 1 FROM zx_r_ledger WHERE id=?)").bind(b.id,user.id,b.paymentReference.trim().toUpperCase(),ledgerId)
 ]);if(!result[0].meta.changes)return json({ok:false,error:'ALREADY_REVIEWED'},409);}catch(e){if(String(e).toLowerCase().includes('unique'))return json({ok:false,error:'PAYMENT_ALREADY_CREDITED'},409);throw e;}
 await state(env,{id:topup.user_id,isFounder:false});
 return json({ok:true});
 }
 if(!admin&&path==='/orders'){
 const s=await state(env,user),catalog=env.RESELLERS_PORTAL_PRO_ENABLED==='true'?await effectiveLegacy(env,CATALOG):CATALOG,p=catalog.find(p=>p[0]===b.productId);
 if(!uuid(b.requestId)||!p||!Number.isInteger(b.tier)||b.tier<1||b.tier>s.tier||b.tier>7||!Number.isInteger(b.quantity)||b.quantity<p[3]||b.quantity>p[4]||!/^\d{5,15}$/.test(String(b.uid||''))||!['br','sg','ind'].includes(b.region))return json({ok:false,error:'INVALID_ORDER_OR_LEVEL'},400);
 const old=await env.DB.prepare('SELECT * FROM zx_r_orders WHERE user_id=? AND request_key=?').bind(user.id,b.requestId).first();
 if(old)return json({ok:true,order:old,repeated:true});
 const total=p[5][b.tier-1]*b.quantity;
 if(s.balanceCents<total)return json({ok:false,error:'INSUFFICIENT_BALANCE'},409);
 if(!env.FF_INFO_API_KEY)return json({ok:false,error:'PLAYER_VERIFICATION_UNAVAILABLE'},503);
 const lookup=await fetch(`https://developers.freefirecommunity.com/api/v1/info?region=${b.region}&uid=${encodeURIComponent(b.uid)}`,{headers:{'x-api-key':env.FF_INFO_API_KEY},signal:AbortSignal.timeout(15000)});
 const player=await lookup.json(),info=player.basicInfo||player.basic_info||player.player?.basicInfo||player.data?.basicInfo;
 if(!lookup.ok||!info?.nickname||String(info.accountId||info.uid||'')!==String(b.uid))return json({ok:false,error:'PLAYER_NOT_VERIFIED'},400);
 if(env.RESELLERS_PORTAL_PRO_ENABLED==='true'&&!await approved(env,user))return json({ok:false,error:'RESELLER_APPROVAL_REQUIRED'},403);
 const id=crypto.randomUUID(),ledgerId=crypto.randomUUID();
 try{const out=await env.DB.batch([
 (env.RESELLERS_PORTAL_PRO_ENABLED==='true'&&!user.isFounder?env.DB.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,?,?,'purchase',? WHERE (SELECT COALESCE(SUM(amount),0) FROM zx_r_ledger WHERE user_id=?)>=? AND EXISTS(SELECT 1 FROM zx_r_accounts WHERE user_id=? AND status='approved')").bind(ledgerId,user.id,-total,'order:'+user.id+':'+b.requestId,user.id,total,user.id):env.DB.prepare("INSERT INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,?,?,'purchase',? WHERE (SELECT COALESCE(SUM(amount),0) FROM zx_r_ledger WHERE user_id=?)>=?").bind(ledgerId,user.id,-total,'order:'+user.id+':'+b.requestId,user.id,total)),
 env.DB.prepare('INSERT INTO zx_r_orders(id,user_id,request_key,product_id,product_name,tier,quantity,total,uid,region,nickname,plan) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_r_ledger WHERE id=?)').bind(id,user.id,b.requestId,p[0],p[1],b.tier,b.quantity,total,String(b.uid),b.region,info.nickname,JSON.stringify(p[6]||[]),ledgerId)
 ]);if(!out[0].meta.changes)return json({ok:false,error:'INSUFFICIENT_BALANCE'},409);}catch(e){if(String(e).toLowerCase().includes('unique')){const order=await env.DB.prepare('SELECT * FROM zx_r_orders WHERE user_id=? AND request_key=?').bind(user.id,b.requestId).first();if(order)return json({ok:true,order,repeated:true});}throw e;}
 return json({ok:true,order:await env.DB.prepare('SELECT * FROM zx_r_orders WHERE id=?').bind(id).first()});
 }
 if(admin&&path==='/orders/review'){
 if(b.action==='complete'){
 if(b.deliveryConfirmed!==true)return json({ok:false,error:'CONFIRM_DELIVERY'},400);
 const out=await env.DB.prepare("UPDATE zx_r_orders SET status='completed',completed_at=CURRENT_TIMESTAMP,reviewer=? WHERE id=? AND status='pending'").bind(user.id,b.id).run();
 if(out.meta.changes){const order=await env.DB.prepare('SELECT user_id FROM zx_r_orders WHERE id=?').bind(b.id).first();await state(env,{id:order.user_id,isFounder:false});}
 return json({ok:!!out.meta.changes,error:out.meta.changes?null:'ALREADY_REVIEWED'},out.meta.changes?200:409);
 }
 if(b.action==='refund'){
 await env.DB.batch([
 env.DB.prepare("INSERT OR IGNORE INTO zx_r_ledger(id,user_id,amount,kind,reference) SELECT ?,user_id,total,'refund',? FROM zx_r_orders WHERE id=? AND status='pending'").bind(crypto.randomUUID(),'refund:'+b.id,b.id),
 env.DB.prepare("UPDATE zx_r_orders SET status='refunded',reviewer=? WHERE id=? AND status='pending'").bind(user.id,b.id)
 ]);return json({ok:true});
 }
 }
 return json({ok:false,error:'NOT_FOUND'},404);
}

