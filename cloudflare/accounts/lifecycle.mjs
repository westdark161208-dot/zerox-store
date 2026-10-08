// Account removal closes access while retaining auditable purchase and wallet records.
export async function activitySchema(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS zx_account_activity(user_id TEXT PRIMARY KEY,last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
}
export async function touchActivity(db,userId){
 await activitySchema(db);
 await db.prepare("INSERT INTO zx_account_activity(user_id) VALUES(?) ON CONFLICT(user_id) DO UPDATE SET last_seen_at=CURRENT_TIMESTAMP WHERE last_seen_at<datetime('now','-15 minutes')").bind(userId).run();
}
export async function accountLifecycle(request,env,user,reply){
 if(request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 const b=await request.json();
 if(typeof b.userId!=='string'||!['delete','restore'].includes(b.action)||b.confirmed!==true||typeof b.username!=='string')return reply({ok:false,error:'CONFIRMATION_REQUIRED'},400);
 if(b.userId===user.id)return reply({ok:false,error:'FOUNDER_PROTECTED'},409);
 const target=await env.DB.prepare('SELECT id,username,status FROM zx_users WHERE id=?').bind(b.userId).first();
 if(!target||target.username!==b.username)return reply({ok:false,error:'ACCOUNT_CONFIRMATION_MISMATCH'},409);
 const before=b.action==='delete'?'active':'deleted',after=b.action==='delete'?'deleted':'active';
 if(target.status!==before)return reply({ok:false,error:'ACCOUNT_STATE_CHANGED'},409);
 const tables=new Set((await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
 // Recheck balances and outstanding work in the same statement that closes access.
 const guards=["COALESCE((SELECT SUM(amount_cents) FROM zx_wallet_ledger WHERE user_id=zx_users.id),0)=0"];
 if(tables.has('zx_r_ledger'))guards.push("COALESCE((SELECT SUM(amount) FROM zx_r_ledger WHERE user_id=zx_users.id),0)=0");
 for(const [table,column,terminal] of [
 ['zx_funding_intents','state',"'confirmed','failed','cancelled'"],
 ['zx_diamond_orders','state',"'COMPLETED','CANCELLED','REFUNDED'"],
 ['zx_service_orders','state',"'COMPLETED','CANCELLED','REFUNDED'"],
 ['zx_bundle_orders','state',"'COMPLETED','CANCELLED','REFUNDED'"],
 ['zx_r_orders','status',"'completed','cancelled','refunded'"],
 ['zx_r_topups','status',"'approved','rejected'"]
 ])if(tables.has(table))guards.push(`NOT EXISTS(SELECT 1 FROM ${table} WHERE user_id=zx_users.id AND ${column} NOT IN (${terminal}))`);
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS zx_account_actions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 const result=await env.DB.batch([
 env.DB.prepare(`UPDATE zx_users SET status=? WHERE id=? AND username=? AND status=? ${b.action==='delete'?'AND '+guards.join(' AND '):''}`).bind(after,target.id,b.username,before),
 env.DB.prepare('INSERT INTO zx_account_actions(id,user_id,actor,action) SELECT ?,?,?,? WHERE changes()=1').bind(crypto.randomUUID(),target.id,user.id,b.action),
 env.DB.prepare("UPDATE zx_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL AND EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='deleted')").bind(target.id,target.id)
 ]);
 if(!result[0].meta.changes)return reply({ok:false,error:'ACCOUNT_HAS_BALANCE_OR_PENDING_ORDERS'},409);
 return reply({ok:true,status:after});
}
