import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHarness} from './harness.mjs';
process.umask(0o077);
const dir=mkdtempSync(join(tmpdir(),'zerox-ff110-sim-'));
let harness;
try{
 harness=createHarness({journalPath:join(dir,'journal.sqlite'),proxySecret:process.env.FF110_SIM_PROXY_SECRET,mode:process.env.FF110_SIM_MODE||'success'});
 const port=await harness.listen(8791);
 console.log(JSON.stringify({simulation:true,port,purchases:false}));
}catch{if(harness)await harness.close();rmSync(dir,{recursive:true,force:true});console.error('SIMULATION_START_FAILED');process.exit(1);}
let closing=false;
async function stop(){if(closing)return;closing=true;await harness.close();rmSync(dir,{recursive:true,force:true});process.exit(0);}
process.once('SIGINT',stop);process.once('SIGTERM',stop);
setTimeout(stop,20*60*1000).unref();
