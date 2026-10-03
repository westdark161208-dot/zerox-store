import {can, permissionsFor} from './permissions.mjs';

export async function securitySchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS zx_security_events (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL,
    target_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS zx_security_events_user ON zx_security_events(user_id,created_at)').run();
}

export async function securityRoute(request, env, url, user, json) {
  if (!can(user, 'sessions.self')) return json({ok:false,error:'LOGIN_REQUIRED'},401);
  if (url.pathname === '/api/security/permissions' && request.method === 'GET') {
    return json({ok:true,permissions:permissionsFor(user),passkeysEnabled:false});
  }
  if (url.pathname === '/api/security/sessions' && request.method === 'GET') {
    const rows = await env.DB.prepare(`SELECT id,created_at,expires_at FROM zx_sessions
      WHERE user_id=? AND revoked_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 100`)
      .bind(user.id,new Date().toISOString()).all();
    return json({ok:true,sessions:rows.results.map(row=>({...row,current:row.id===user.sessionId}))});
  }
  if (request.method !== 'POST' || !['/api/security/sessions/revoke','/api/security/sessions/revoke-all'].includes(url.pathname)) {
    return json({ok:false,error:'NOT_FOUND'},404);
  }
  let body;
  try { body=await request.json(); } catch { return json({ok:false,error:'INVALID_REQUEST'},400); }
  const all=url.pathname.endsWith('/revoke-all');
  if (all ? body?.confirm !== true : typeof body?.sessionId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.sessionId)) {
    return json({ok:false,error:'INVALID_REQUEST'},400);
  }
  await securitySchema(env.DB);
  const target=all?'all':body.sessionId;
  const where=all?'user_id=? AND revoked_at IS NULL':'user_id=? AND id=? AND revoked_at IS NULL';
  const args=all?[user.id]:[user.id,target];
  const result=await env.DB.batch([
    env.DB.prepare(`UPDATE zx_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE ${where}`).bind(...args),
    env.DB.prepare(`INSERT INTO zx_security_events(id,user_id,action,target_id)
      SELECT ?,?,?,? WHERE changes()>0`).bind(crypto.randomUUID(),user.id,all?'sessions.revoke_all':'sessions.revoke',target)
  ]);
  // A foreign or nonexistent session is indistinguishable; no cross-user mutation.
  return json({ok:true,revoked:result[0].meta.changes,signOut:all||target===user.sessionId});
}
