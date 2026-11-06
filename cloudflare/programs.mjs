import {sources,tables} from './order-history.mjs';
import {walletSchema} from './wallet/ledger.mjs';
import {serviceSettings} from './services/delivery.mjs';
import {geographySchema} from './accounts/geography.mjs';

export const tiers=[[1000,220],[4000,452],[10000,682],[30000,1270],[50000,2508],[100000,6270]];
export async function programSchema(db){
  await geographySchema(db);
  await db.batch([
    'CREATE TABLE IF NOT EXISTS zx_invite_codes(owner TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL)',
    'CREATE TABLE IF NOT EXISTS zx_invites(guest TEXT PRIMARY KEY, host TEXT NOT NULL,guest_country TEXT NOT NULL,host_country TEXT NOT NULL, settled INTEGER DEFAULT 0,CHECK(guest<>host))',
    'CREATE INDEX IF NOT EXISTS zx_invites_host ON zx_invites(host)',
    "CREATE TABLE IF NOT EXISTS zx_creator_entries(video TEXT PRIMARY KEY,owner TEXT NOT NULL,handle TEXT NOT NULL,uid TEXT NOT NULL,views INTEGER NOT NULL,verified INTEGER,diamonds INTEGER,status TEXT DEFAULT 'pendiente')"
  ].map(s=>db.prepare(s)));
}
export async function invitation(db,code,guest,country){
  await programSchema(db);
  const host=await db.prepare("SELECT owner,country FROM zx_invite_codes JOIN zx_customer_location ON user_id=owner JOIN zx_users ON id=owner WHERE code=? AND status='active'").bind(String(code).trim().toUpperCase()).first();
  return host&&db.prepare('INSERT INTO zx_invites(guest,host,guest_country,host_country) VALUES(?,?,?,?)').bind(guest,host.owner,country,host.country);
}
function credit(db,user,cents,key){
  return db.prepare(`INSERT INTO zx_wallet_ledger(id,user_id,kind,amount_cents,currency,previous_balance,resulting_balance,source,reference,request_key,actor)
    SELECT ?,?,'credit',?,'MXN',balance,balance+?,'referral',?,?,'programa-referidos'
    FROM (SELECT COALESCE(SUM(amount_cents),0) balance FROM zx_wallet_ledger WHERE user_id=?) WHERE 1
    ON CONFLICT(source,reference) DO NOTHING`).bind(crypto.randomUUID(),user,cents,cents,key,key,user);
}
export async function settleInvites(db){
  const existing=await tables(db);
  if(!existing.has('zx_invites'))return;
  const orders=sources(existing);
  if(!orders.length)return;
  const rate=(await serviceSettings(db)).usdMxn;
  const usd=Number.isFinite(rate)&&rate>0&&rate<=1000?Math.round(rate*100):0;
  const ready=await db.prepare(`SELECT i.* FROM zx_invites i JOIN zx_users h ON h.id=host JOIN zx_users g ON g.id=guest
    WHERE settled=0 AND h.status='active' AND g.status='active' AND (?>0 OR (host_country='MX' AND guest_country='MX'))
    AND EXISTS(SELECT 1 FROM (${orders.join(' UNION ALL ')}) WHERE user_id=guest AND state='COMPLETED'
    AND paymentState='paid' AND amountCents>0 AND method NOT IN ('ra','sf','ra-funds')) ORDER BY i.rowid LIMIT 10`).bind(usd).all();
  if(!ready.results.length)return;
  await walletSchema(db);
  for(const r of ready.results){
    await db.batch([credit(db,r.guest,r.guest_country==='MX'?2000:usd,r.guest+':guest'),
      credit(db,r.host,r.host_country==='MX'?2000:usd,r.guest+':host'),
      db.prepare('UPDATE zx_invites SET settled=1 WHERE guest=?').bind(r.guest)]);
  }
}
export async function programRoute(request,env,user,json){
  if(!user)return json({ok:false,error:'Inicia sesión para continuar.'},401);
  const db=env.DB;
  await programSchema(db);
  const path=new URL(request.url).pathname;
  if(path==='/api/programs/referrals' && request.method==='GET'){
    const location=await db.prepare('SELECT country FROM zx_customer_location WHERE user_id=?').bind(user.id).first();
    if(!location)return json({ok:false,error:'Completa el país de tu perfil para obtener tu código.'},409);
    await db.prepare('INSERT INTO zx_invite_codes VALUES(?,?) ON CONFLICT(owner) DO NOTHING').bind(user.id,'ZX-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase()).run();
    await walletSchema(db);
    const {code}=await db.prepare('SELECT code FROM zx_invite_codes WHERE owner=?').bind(user.id).first();
    const stats=await db.prepare('SELECT count(*) invited,coalesce(sum(settled),0) rewarded FROM zx_invites WHERE host=?').bind(user.id).first();
    const {cents}=await db.prepare("SELECT coalesce(sum(amount_cents),0) cents FROM zx_wallet_ledger WHERE source='referral' AND user_id=?").bind(user.id).first();
    return json({ok:true,code,...stats,cents});
  }
  if(path!=='/api/programs/creators')return json({ok:false},404);
  if(request.method==='GET'){
    const entries=await db.prepare('SELECT video,handle,uid,views,status,diamonds FROM zx_creator_entries WHERE owner=? ORDER BY rowid DESC LIMIT 50').bind(user.id).all();
    const queue=user.isFounder?(await db.prepare("SELECT video,handle,uid,views,status,diamonds FROM zx_creator_entries WHERE status IN ('pendiente','aprobado') ORDER BY rowid LIMIT 50").all()).results:null;
    return json({ok:true,entries:entries.results,queue});
  }
  if(request.method!=='POST')return json({ok:false},405);
  const b=await request.json();
  if(b.action){
    if(!user.isFounder)return json({ok:false},403);
    const approved=b.action==='aprobado',delivered=b.action==='entregado';
    if(!['aprobado','rechazado','entregado'].includes(b.action))return json({ok:false},400);
    const reward=tiers.filter(([min])=>min<=b.verified).at(-1)?.[1];
    if(approved&&(!Number.isSafeInteger(b.verified)||!reward))return json({ok:false,error:'Verifica al menos 1,000 vistas.'},400);
    const result=await db.prepare('UPDATE zx_creator_entries SET status=?,verified=coalesce(?,verified),diamonds=coalesce(?,diamonds) WHERE video=? AND status=?').bind(b.action,approved?b.verified:null,approved?reward:null,b.video,delivered?'aprobado':'pendiente').run();
    return json({ok:!!result.meta.changes},result.meta.changes?200:409);
  }
  const match=String(b.url).match(/^https:\/\/(?:www\.)?tiktok\.com\/@([\w.]{2,24})\/video\/(\d{10,24})\/?(?:\?[^#]*)?$/i);
  if(!match||match[1].toLowerCase()!==String(b.handle).replace(/^@/,'').toLowerCase()||!/^\d{5,20}$/.test(b.uid)||!Number.isSafeInteger(b.views)||b.views<1000)return json({ok:false,error:'Revisa el enlace completo, usuario, ID y vistas.'},400);
  const result=await db.prepare('INSERT INTO zx_creator_entries(video,owner,handle,uid,views) VALUES(?,?,?,?,?) ON CONFLICT(video) DO NOTHING').bind(match[2],user.id,match[1],b.uid,b.views).run();
  return result.meta.changes?json({ok:true},201):json({ok:false,error:'Este video ya tiene una solicitud.'},409);
}
