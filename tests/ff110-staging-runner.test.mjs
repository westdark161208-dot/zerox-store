import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHarness} from '../staging/ff110/harness.mjs';
import worker from '../staging/ff110/worker.mjs';
import {runProbe} from '../staging/ff110/runner.mjs';
const proxy='b'.repeat(64),token='c'.repeat(64);
async function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'ff110-runner-test-'));
 const h=createHarness({journalPath:join(dir,'journal.sqlite'),proxySecret:proxy});
 const port=await h.listen();
 t.after(async()=>{await h.close();rmSync(dir,{recursive:true,force:true});});
 const stagingEnv={FF110_SIM_EXPIRES_AT:String(Date.now()+60000),FF110_SIM_SERVICE_TOKEN:token,FF110_SIM_PROXY_SECRET:proxy,FF110_SIM_GATEWAY:{fetch(url,options){return fetch('http://127.0.0.1:'+port+new URL(url).pathname,options);}}};
 return {h,env:{FF110_RUNNER_EXPIRES_AT:String(Date.now()+60000),FF110_SIM_SERVICE_TOKEN:token,FF110_SIM_WORKER:{fetch(req){return worker.fetch(req,stagingEnv);}}}};
}
test('runner scheduled contract verifies private simulation without real provider',async t=>{
 const {h,env}=await fixture(t),logs=[];
 const results=await runProbe(env,{log:s=>logs.push(s)});
 assert.deepEqual(results.map(x=>x.name),['invalid_token','real_product_denied','validate','submit','duplicate','lookup']);
 assert.ok(results.every(x=>x.pass),JSON.stringify(results));
 assert.equal(h.calls.filter(c=>c.path==='/buy/catalog').length,1);
 assert.ok(logs.every(s=>/^FF110_SIM [a-z_]+ PASS$/.test(s)));
});
test('runner expires closed and does not contact service',async()=>{
 let calls=0;const env={FF110_RUNNER_EXPIRES_AT:'0',FF110_SIM_SERVICE_TOKEN:token,FF110_SIM_WORKER:{fetch(){calls++;throw Error('UNEXPECTED');}}};
 const logs=[];const r=await runProbe(env,{log:s=>logs.push(s)});
 assert.deepEqual(r,[{name:'guard',pass:false}]);assert.equal(calls,0);assert.deepEqual(logs,['FF110_SIM guard FAIL']);
});
test('runner manifest has no public endpoint or active schedule',async()=>{
 const {readFileSync}=await import('node:fs');
 const cfg=JSON.parse(readFileSync(new URL('../staging/ff110/runner.wrangler.jsonc',import.meta.url)));
 assert.equal(cfg.workers_dev,false);assert.equal(cfg.preview_urls,false);
 assert.equal(cfg.vars.FF110_RUNNER_EXPIRES_AT,'0');assert.equal(cfg.routes,undefined);
 assert.equal(cfg.triggers,undefined);assert.equal(cfg.services[0].service,'zerox-ff110-sim-staging');
});
