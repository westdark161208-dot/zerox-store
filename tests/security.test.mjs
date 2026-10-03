import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {can} from '../cloudflare/security/permissions.mjs';
import {securityRoute} from '../cloudflare/security/sessions.mjs';
const json=(body,status=200)=>({body,status});
test('permissions deny unknown actions, guests and inactive founders',()=>{
  assert.equal(can(null,'catalog.manage'),false);
  assert.equal(can({status:'active',role:'creator'},'catalog.manage'),false);
  assert.equal(can({status:'disabled',isFounder:true},'wallet.audit'),false);
  assert.equal(can({status:'active',isFounder:true},'catalog.manage'),true);
  assert.equal(can({status:'active',isFounder:true},'wallet.credit'),false);
});
test('session list excludes tokens, other users and revoked sessions; revoke is scoped and audited',async()=>{
  const DB=database(),mine=crypto.randomUUID(),theirs=crypto.randomUUID();
  DB.sql.exec('CREATE TABLE zx_sessions(id TEXT PRIMARY KEY,user_id TEXT,token_hash TEXT,created_at TEXT,expires_at TEXT,revoked_at TEXT)');
  for(const [id,uid] of [[mine,'a'],[theirs,'b']])DB.sql.prepare('INSERT INTO zx_sessions VALUES(?,?,?,CURRENT_TIMESTAMP,?,NULL)').run(id,uid,'SECRET_HASH','2099-01-01T00:00:00.000Z');
  const user={id:'a',status:'active',sessionId:mine};
  const call=async(path,body,actor=user)=>{const url=new URL('https://test/api/security/'+path);return securityRoute(new Request(url,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})}),{DB},url,actor,json)};
  assert.equal((await call('sessions',null,null)).status,401);
  const list=await call('sessions');assert.equal(list.body.sessions.length,1);assert.equal(list.body.sessions[0].current,true);assert(!JSON.stringify(list).includes('SECRET_HASH'));
  assert.equal((await call('sessions/revoke',{sessionId:theirs})).body.revoked,0);
  assert.equal(DB.sql.prepare('SELECT revoked_at FROM zx_sessions WHERE id=?').get(theirs).revoked_at,null);
  assert.equal((await call('sessions/revoke-all',{confirm:false})).status,400);
  assert.equal((await call('sessions/revoke-all',{confirm:true})).body.signOut,true);
  assert.equal((await call('sessions')).body.sessions.length,0);
  assert.equal(DB.sql.prepare('SELECT COUNT(*) n FROM zx_security_events').get().n,1);
});
test('security history contains only the authenticated user and no target identifiers',async()=>{const DB=database();DB.sql.exec('CREATE TABLE zx_security_events(id TEXT PRIMARY KEY,user_id TEXT,action TEXT,target_id TEXT,created_at TEXT)');DB.sql.prepare('INSERT INTO zx_security_events VALUES(?,?,?,?,CURRENT_TIMESTAMP)').run('a','owner','sessions.revoke','private-target');DB.sql.prepare('INSERT INTO zx_security_events VALUES(?,?,?,?,CURRENT_TIMESTAMP)').run('b','other','sessions.revoke_all','other-target');const url=new URL('https://test/api/security/events');const result=await securityRoute(new Request(url),{DB},url,{id:'owner',status:'active'},json);assert.equal(result.body.events.length,1);assert.equal(result.body.events[0].action,'sessions.revoke');assert(!JSON.stringify(result).includes('private-target'));});
