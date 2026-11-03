import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from '../../tests/helpers/d1.mjs';
import {readFileSync} from 'node:fs';
import worker from './worker.mjs';
test('isolated worker reports staging D1 health and exposes no live checkout or provider bridge',async()=>{
 const DB=database();DB.sql.exec(readFileSync(new URL('../../cloudflare/universal/schema.sql',import.meta.url),'utf8'));
 const call=(path,method='GET')=>worker.fetch(new Request('https://fixture.invalid'+path,{method}),{DB});
 assert.deepEqual(await (await call('/health')).json(),{service:'zerox-smart-engine-staging',livePurchases:false,catalogCount:0});
 for(const path of ['/trial','/api/payments/checkout','/api/admin/providers/smart/trial','/v1/orders'])
   assert.equal((await call(path,'POST')).status,404);
 assert.equal((await call('/api/providers/rechargegames/webhook','POST')).status,503);
});
test('cron disabled by default and enabled trials require the staging token',async()=>{
 await worker.scheduled({scheduledTime:0},{},{waitUntil(){assert.fail('unexpected catalog call')}});
 const res=await worker.fetch(new Request('https://fixture.invalid/trial',{method:'POST'}),{SMART_TRIALS_ENABLED:'true',STAGING_TRIAL_TOKEN:'x'.repeat(32)});
 assert.equal(res.status,404);
});
