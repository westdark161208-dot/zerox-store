import {spawnSync} from 'node:child_process';
import {readdirSync,mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const backup=process.env.ZEROX_RELEASE_BACKUPS||'/home/opc/zerox-resellers-v2-backups';
if(!existsSync(backup))throw new Error('Backup directory is missing');
const out=mkdtempSync(path.join(backup,'portal-pro-verify-'));
function run(name,args){const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});writeFileSync(path.join(out,name+'.log'),(result.stdout||'')+(result.stderr||''));if(result.status!==0){console.error(name+': FALLÓ. Registro privado: '+path.join(out,name+'.log'));console.error(((result.stdout||'')+(result.stderr||'')).split('\n').slice(-35).join('\n'));process.exit(1)}console.log(name+': OK');}
run('tests',['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)]);
run('resellers',['cloudflare/resellers.test.mjs']);
for(const file of ['cloudflare/worker.js','cloudflare/resellers.js','resellers-portal.js','control-resellers-pro.js'])run('syntax-'+path.basename(file),['--check',file]);
run('pages-build',['scripts/build-pages.mjs']);
const require=createRequire(import.meta.url),esbuild=require(require.resolve('esbuild',{paths:['/home/opc/zerox-ff110-runtime/cloudflare-cli/node_modules']}));
await esbuild.build({absWorkingDir:root,entryPoints:['cloudflare/worker.js'],outfile:path.join(out,'worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',keepNames:true,logLevel:'warning'});
console.log('worker-bundle: OK');
let browserModule=process.env.ZEROX_PLAYWRIGHT_MODULE;
if(!browserModule){try{browserModule=require.resolve('playwright',{paths:[root,'/home/opc/zerox-ff110-runtime/cloudflare-cli/node_modules']})}catch{}}
let browserVerified=false;
if(browserModule){process.env.ZEROX_PLAYWRIGHT_MODULE=browserModule;process.env.ZEROX_SCREENSHOTS=path.join(out,'screenshots');run('browser',['tests/resellers-pro-browser.mjs']);browserVerified=true}else console.log('BROWSER: PENDIENTE. Playwright no está disponible; no se activó ninguna versión.');
writeFileSync(path.join(out,'result.json'),JSON.stringify({tests:true,resellers:true,build:true,bundle:true,browserVerified,checkedAt:new Date().toISOString()},null,2));
console.log('CARPETA: '+out);console.log('SIN CARGA, ACTIVACIÓN NI MOVIMIENTOS EN PRODUCCIÓN.');
