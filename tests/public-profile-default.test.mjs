import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
import {database} from './helpers/d1.mjs';

test('a new account is discoverable by handle, private choices and inactive accounts remain hidden',async()=>{
  const env={DB:database()};
  const call=(path,options)=>worker.fetch(new Request('https://store.test'+path,options),env);
  const registration=await call('/api/auth/register',{method:'POST',body:JSON.stringify({
    username:'TestPlayer',email:'player@example.test',country:'MX',password:'sample-password'
  })});
  assert.equal(registration.status,201);
  const lookup=()=>call('/api/public-profile/testplayer');
  const profile=(await (await lookup()).json()).profile;
  assert.equal(profile.username,'TestPlayer');
  assert.equal(profile.email,undefined);
  env.DB.sql.exec('DELETE FROM zx_profile_style');
  assert.equal((await lookup()).status,200);
  env.DB.sql.exec('INSERT INTO zx_profile_style(user_id,is_public) SELECT id,0 FROM zx_users');
  assert.equal((await lookup()).status,404);
  env.DB.sql.exec("DELETE FROM zx_profile_style; UPDATE zx_users SET status='deleted'");
  assert.equal((await lookup()).status,404);
});
