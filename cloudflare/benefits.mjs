import {sources,tables} from './order-history.mjs';
export async function benefitsRoute(request,env,user,json,passwordHash){
  if (!user) return json({ok:false,error:'LOGIN_REQUIRED'},401);
  const admin=new URL(request.url).pathname==='/api/admin/benefits';
  if(admin && !user.isFounder)return json({ok:false,error:'FORBIDDEN'},403);
  const db=env.DB;
  await db.prepare('CREATE TABLE IF NOT EXISTS zx_awards(level INTEGER PRIMARY KEY,title TEXT NOT NULL)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS zx_member_styles(user_id TEXT PRIMARY KEY,color TEXT NOT NULL,font TEXT NOT NULL,frame TEXT NOT NULL)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS zx_member_perks(user_id TEXT PRIMARY KEY,badge TEXT NOT NULL,rules TEXT NOT NULL)').run();
  if(request.method==='GET'){
    const awards=(await db.prepare('SELECT level,title FROM zx_awards ORDER BY level').all()).results;
    if(admin)return json({ok:true,awards});
    const parts=sources(await tables(db));
    const count=parts.length?(await db.prepare("SELECT COUNT(*) AS n FROM (SELECT DISTINCT kind,id FROM ("+parts.join(' UNION ALL ')+") WHERE user_id=? AND state='COMPLETED' AND paymentState='paid' AND amountCents>0 AND method NOT IN ('ra','sf','ra-funds'))").bind(user.id).first()).n:0;
    const xp=(user.xp||0)+count*10,level=Math.min(8,Math.max(user.level||1,1+Math.floor(xp/100)));
    const style=await db.prepare('SELECT color,font,frame FROM zx_member_styles WHERE user_id=?').bind(user.id).first();
    const perks=await db.prepare('SELECT badge FROM zx_member_perks WHERE user_id=?').bind(user.id).first();
    return json({ok:true,xp,level,style,badge:perks?.badge,awards:awards.filter(a=>a.level<=level)});
  }
  if(!admin || request.method!=='POST')return json({ok:false},405);
  const b=await request.json();
  if(b.action==='reward' && Number.isInteger(b.level)&&b.level>=1&&b.level<=8&&typeof b.title==='string'&&b.title.trim()&&b.title.length<=1000){
    await db.prepare('INSERT INTO zx_awards VALUES(?,?) ON CONFLICT(level) DO UPDATE SET title=excluded.title').bind(b.level,b.title.trim()).run();
    return json({ok:true});
  }
  if(b.action!=='create'||!/^#[a-f0-9]{6}$/i.test(b.color)||!['serif','sans-serif','monospace','Georgia','Verdana','Tahoma','Trebuchet MS','Courier New','Impact','cursive','fantasy'].includes(b.font)||!['gold','violet','aqua','ruby','silver','emerald'].includes(b.frame)||!/^\S+@\S+\.\S+$/.test(b.email)||!/^\w{3,24}$/.test(b.username)||typeof b.password!=='string'||b.password.length<8||b.password.length>128)return json({ok:false,error:'INVALID_FIELDS'},400);
  const rules=b.rules??[],badge=b.badge??'';
  if(!['','VIP','Elite','Leyenda','Pionero'].includes(badge)||!Array.isArray(rules)||rules.length>100||rules.some(r=>!r||!['freefire','diamonds','passes','fragments','boxes','category','product'].includes(r.scope)||typeof r.key!=='string'||r.key.length>100||(['product','category'].includes(r.scope)&&!r.key.trim())||!Number.isInteger(r.percent)||r.percent<1||r.percent>99))return json({ok:false,error:'INVALID_BENEFITS'},400);
  const id=crypto.randomUUID(), hash=await passwordHash(b.password);
  try{await db.batch([
    db.prepare('INSERT INTO zx_users(id,email,username,password_hash) VALUES(?,?,?,?)').bind(id,b.email.toLowerCase().trim(),b.username,hash),
    db.prepare('INSERT INTO zx_profiles(user_id,display_name) VALUES(?,?)').bind(id,b.username),
    db.prepare('INSERT INTO zx_profile_style(user_id,is_public) VALUES(?,1)').bind(id),
    db.prepare('INSERT INTO zx_member_perks VALUES(?,?,?)').bind(id,badge,JSON.stringify(rules)),
    db.prepare('INSERT INTO zx_member_styles VALUES(?,?,?,?)').bind(id,b.color,b.font,b.frame)
  ]);}catch(error){if(/unique/i.test(error.message))return json({ok:false,error:'ACCOUNT_EXISTS'},409);throw error}
  return json({ok:true},201);
}
