import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {database} from './helpers/d1.mjs';
import worker from '../cloudflare/worker.js';
test('worker identity, no-store and session revocation apply to actual routes',async()=>{
  const DB=database(),env={DB,WALLET_READ_ENABLED:'true'},token='local-test-token';
  const call=(path,opts={})=>worker.fetch(new Request('https://local'+path,{...opts,headers:{Authorization:'Bearer '+token,...opts.headers}}),env);
  // Initialize the existing auth schema through its real public feature endpoint.
  await call('/api/auth/features');
  DB.sql.prepare('INSERT INTO zx_users(id,email,username,password_hash) VALUES(?,?,?,?)').run('customer','customer@example.invalid','customer','unused');
  DB.sql.prepare('INSERT INTO zx_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(crypto.randomUUID(),'customer',createHash('sha256').update(token).digest('base64'),'2099-01-01T00:00:00.000Z');
  for(const path of ['/api/admin/providers/recargas-america/status','/api/admin/catalog/products','/api/admin/content/ads','/api/admin/resellers']) {
    const response=await call(path);assert.equal(response.status,403,path);assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
  assert.equal((await call('/api/wallet/me')).status,200);
  assert.equal((await call('/api/security/sessions')).status,200);
  assert.equal((await call('/api/security/sessions/revoke-all',{method:'POST',body:'{"confirm":true}'})).status,200);
  assert.equal((await call('/api/auth/me')).status,401);
  assert.equal((await call('/api/wallet/me')).status,401);
  assert.equal((await call('/api/security/sessions')).status,401);
});
test('disabled account cannot read wallet or sessions even with an unexpired token',async()=>{
  const DB=database(),env={DB,WALLET_READ_ENABLED:'true'};
  await worker.fetch(new Request('https://local/api/auth/features'),env);
  DB.sql.prepare('INSERT INTO zx_users(id,email,username,password_hash,status) VALUES(?,?,?,?,?)').run('disabled','disabled@example.invalid','disabled','unused','disabled');
  DB.sql.prepare('INSERT INTO zx_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(crypto.randomUUID(),'disabled',createHash('sha256').update('disabled-token').digest('base64'),'2099-01-01T00:00:00.000Z');
  for(const path of ['/api/auth/me','/api/security/sessions','/api/wallet/me'])assert.equal((await worker.fetch(new Request('https://local'+path,{headers:{Authorization:'Bearer disabled-token'}}),env)).status,401);
});
