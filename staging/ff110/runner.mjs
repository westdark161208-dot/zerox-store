// Private scheduled-only staging probe. No fetch handler or public entrypoint.
import {product} from './fixture.mjs';
const ID='22222222-2222-4222-8222-222222222222:0';
const base={operationId:ID,playerId:'SIMULATED-PLAYER',region:'US',productId:product.id,catalogSku:product.sku,name:product.name,maxPriceUsd:'1',field:'player_id'};
const validSecret=v=>typeof v==='string'&&v.length>=32&&v.length<=256;
function live(env,now){
 const expires=Number(env.FF110_RUNNER_EXPIRES_AT);
 return Number.isSafeInteger(expires)&&expires>now&&expires-now<=20*60*1000;
}
export async function runProbe(env,{now=Date.now(),log=console.log}={}){
 const results=[];
 const emit=(name,ok)=>{results.push({name,pass:ok});log('FF110_SIM '+name+' '+(ok?'PASS':'FAIL'));};
 if(!live(env,now)||!validSecret(env.FF110_SIM_SERVICE_TOKEN)||typeof env.FF110_SIM_WORKER?.fetch!=='function'){
  emit('guard',false);return results;
 }
 const call=async(action,body=base,token=env.FF110_SIM_SERVICE_TOKEN)=>{
  const request=new Request('https://staging.invalid/v1/ff110/'+action,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const response=await env.FF110_SIM_WORKER.fetch(request);
  let data={};try{data=await response.json();}catch{}
  return {status:response.status,data};
 };
 // Every assertion is isolated; do not log response bodies, credentials or identifiers.
 const check=async(name,fn)=>{try{emit(name,await fn());}catch{emit(name,false);}};
 await check('invalid_token',async()=> (await call('validate',base,'invalid')).status===401);
 await check('real_product_denied',async()=> (await call('submit',{...base,productId:5,catalogSku:'ADS005'})).status===400);
 await check('validate',async()=>{const r=await call('validate');return r.status===200&&r.data.ok===true&&r.data.supported===true;});
 let reference;
 await check('submit',async()=>{const r=await call('submit');reference=r.data.reference;return r.status===200&&r.data.status==='SUCCESS'&&typeof reference==='string'&&reference.startsWith('SIM-');});
 if(reference){
  await check('duplicate',async()=>{const r=await call('submit');return r.status===200&&r.data.status==='SUCCESS'&&r.data.reference===reference;});
  await check('lookup',async()=>{const r=await call('lookup',{...base,reference});return r.status===200&&r.data.status==='SUCCESS'&&r.data.reference===reference;});
 }else{emit('duplicate',false);emit('lookup',false);}
 return results;
}
export default {
 async scheduled(_event,env,ctx){
  ctx.waitUntil(runProbe(env).then(results=>{
   if(results.some(r=>!r.pass))throw Error('FF110_SIM_CHECK_FAILED');
  }));
 }
};
