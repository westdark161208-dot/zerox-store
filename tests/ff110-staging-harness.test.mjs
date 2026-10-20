import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHarness} from '../staging/ff110/harness.mjs';
import worker from '../staging/ff110/worker.mjs';
import {product} from '../staging/ff110/fixture.mjs';
import {sign,canonical} from '../cloudflare/ra-purchase/protocol.mjs';
const payload={operationId:'11111111-1111-4111-8111-111111111111:0',playerId:'1136210821',region:'US',productId:product.id,catalogSku:product.sku,name:product.name,maxPriceUsd:'1',field:'player_id'};
async function setup(t,mode='success'){
 const dir=mkdtempSync(join(tmpdir(),'ff110-harness-test-'));const h=createHarness({journalPath:join(dir,'journal.sqlite'),proxySecret:'b'.repeat(64),mode});const port=await h.listen();
 t.after(async()=>{await h.close();rmSync(dir,{recursive:true,force:true});});
 const env={FF110_SIM_EXPIRES_AT:String(Date.now()+60000),FF110_SIM_SERVICE_TOKEN:'c'.repeat(64),FF110_SIM_PROXY_SECRET:'b'.repeat(64),FF110_SIM_GATEWAY:{fetch(url,options){assert.equal(new URL(url).origin,'http://127.0.0.1:8791');return fetch('http://127.0.0.1:'+port+new URL(url).pathname,options);}}};
 const call=(action,p=payload,token=env.FF110_SIM_SERVICE_TOKEN)=>worker.fetch(new Request('https://sim.internal/v1/ff110/'+action,{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(p)}),env);
 return {h,env,call};
}
test('private staging worker -> actual loopback HTTP -> gateway -> journal -> simulation',async t=>{
 const {h,call}=await setup(t);assert.equal((await call('validate')).status,200);
 const r=await (await call('submit')).json();assert.equal(r.status,'SUCCESS');
 assert.equal((await (await call('submit')).json()).reference,r.reference);
 assert.equal((await (await call('lookup',{...payload,reference:r.reference})).json()).status,'SUCCESS');
 assert.equal(h.calls.filter(c=>c.path==='/buy/catalog').length,1);
});
test('authentication, signature, replay, scope and expiry fail closed',async t=>{
 const {h,env,call}=await setup(t);assert.equal((await call('submit',payload,'wrong')).status,401);assert.equal(h.calls.length,0);
 env.FF110_SIM_PROXY_SECRET='d'.repeat(64);assert.equal((await call('submit')).status,503);assert.equal(h.calls.length,0);
 const path='/v1/ff110/validate',time=String(Date.now()),nonce=crypto.randomUUID(),body=JSON.stringify(payload);
 const req=new Request('http://fixture'+path,{method:'POST',body,headers:{'x-zerox-time':time,'x-zerox-nonce':nonce,'x-zerox-signature':await sign('b'.repeat(64),canonical(path,time,nonce,body))}});
 const copy=req.clone();assert.equal((await h.handler(req)).status,200);assert.equal((await h.handler(copy)).status,429);
 assert.equal((await call('submit',{...payload,productId:5,catalogSku:'ADS005'})).status,400);
 env.FF110_SIM_EXPIRES_AT='0';assert.equal((await call('submit')).status,503);
});
for(const [mode,status] of [['processing','PROCESSING'],['reject','NOT_ACCEPTED'],['timeout','UNKNOWN'],['partial','UNKNOWN']])test('simulation '+mode+' never falls back to RA or resubmits',async t=>{
 const {h,call}=await setup(t,mode);const r=await (await call('submit')).json();assert.equal(r.status,status);await call('submit');
 assert.equal(h.calls.filter(c=>c.path==='/buy/catalog').length,mode==='reject'?0:1);
 if(mode==='processing')assert.equal((await (await call('lookup',{...payload,reference:r.reference})).json()).status,'SUCCESS');
});
test('harness has no RA transport and deployment is private and expired by default',()=>{
 for(const file of ['harness.mjs','fixture.mjs','server.mjs']){const source=readFileSync(new URL('../staging/ff110/'+file,import.meta.url),'utf8');assert.doesNotMatch(source,/node:https|https\.request|fetch\s*\(|recargasamerica\.com|RECARGAS_AMERICA_API_KEY|RA_PURCHASE_CONFIG_FILE/);}
 const config=JSON.parse(readFileSync(new URL('../staging/ff110/wrangler.jsonc',import.meta.url)));assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);assert.equal(config.vars.FF110_SIM_EXPIRES_AT,'0');assert.equal(config.routes,undefined);
});
