// Run with QA_NODE_MODULES pointing to a local installation of miniflare and esbuild.
// This harness never binds remote databases, providers, cron triggers or credentials.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const modules=process.env.QA_NODE_MODULES;if(!modules)throw Error('QA_NODE_MODULES is required');
process.env.CLOUDFLARE_CF_FETCH_ENABLED='false';
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(path.join(modules,'miniflare/dist/src/index.js')));
const {build}=await import(pathToFileURL(path.join(modules,'esbuild/lib/main.js')));
const root=fileURLToPath(new URL('../',import.meta.url)),temp=await mkdtemp(path.join(tmpdir(),'zerox-r-d1-'));
const source=`import {resellerRoute} from ${JSON.stringify(path.join(root,'cloudflare/resellers.js'))};export default {async fetch(request,env){const who=request.headers.get('x-qa-user');const user=who?{id:who,username:who,status:'active',isFounder:who==='founder'}:null;return resellerRoute(request,env,new URL(request.url),user,(data,status=200)=>new Response(JSON.stringify(data),{status}));}};`;
await build({stdin:{contents:source,resolveDir:root},bundle:true,format:'esm',outfile:path.join(temp,'worker.mjs')});
const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'qa',modules:true,modulesRoot:temp,scriptPath:path.join(temp,'worker.mjs'),compatibilityDate:'2025-09-01',d1Databases:['DB'],r2Buckets:['MEDIA']}]}));
try{const db=await mf.getD1Database('DB');await db.prepare('CREATE TABLE zx_users(id TEXT PRIMARY KEY,username TEXT)').run();await db.prepare("INSERT INTO zx_users VALUES('buyer','buyer'),('founder','founder')").run();
 const call=async(p,b,u='buyer')=>{const r=await mf.dispatchFetch('http://qa/api/'+p,{method:b?'POST':'GET',headers:{'x-qa-user':u},body:b?JSON.stringify(b):undefined});return {status:r.status,...await r.json()}};
 await call('resellers/me');const requests=[1,2,3,4].map(i=>({requestId:crypto.randomUUID(),amountCents:20000,note:'qa receipt '+i}));const results=await Promise.all(requests.map(b=>call('resellers/topups',b)));assert.equal(results.filter(r=>r.ok).length,1);const r=requests[results.findIndex(r=>r.ok)];const approval={id:r.requestId,action:'approve',paymentConfirmed:true,paymentReference:'QA-REFERENCE'};const approvals=await Promise.all([1,2,3,4].map(()=>call('admin/resellers/topups/review',approval,'founder')));assert.equal(approvals.filter(r=>r.ok).length,1);assert.equal((await call('resellers/me')).balanceCents,20000);
 const theme=await call('admin/resellers/appearance',null,'founder');theme.draft.colors.primary='#123456';await call('admin/resellers/appearance/draft',{revision:0,config:theme.draft},'founder');assert.notEqual((await call('resellers/appearance')).config.colors.primary,'#123456');const published=await Promise.all([1,2].map(()=>call('admin/resellers/appearance/publish',{revision:1,confirm:true},'founder')));assert.equal(published.filter(r=>r.ok).length,1);assert.equal((await call('resellers/appearance')).config.colors.primary,'#123456');
 console.log('PASS: actual local D1/workerd concurrent topups, unique credit, isolated draft, concurrent publication. No remote resources.');
}finally{await mf.dispose();await rm(temp,{recursive:true,force:true})}
