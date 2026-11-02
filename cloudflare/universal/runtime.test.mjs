import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {database} from '../../tests/helpers/d1.mjs';
import {syncCatalog} from './runtime.mjs';
import {trialOrder} from './orders.mjs';
test('atomic feed replacement, stale sync, pinned trial and conflicting retries',async()=>{
 const DB=database(),env={DB,SMART_TRIALS_ENABLED:'true',RECHARGEGAMES_CATALOG_ENABLED:'true',RECHARGEGAMES_API_KEY:'fixture'};
 DB.sql.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 const row={key:'fixture',name:'Fixture',price:'1.25',currency:'USDT',region:'mx',available:true};
 const now=Date.now();
 await syncCatalog(env,'rechargegames',async()=>[row],now);
 await syncCatalog(env,'rechargegames',async()=>[{...row,key:'old'}],now-1);
 await assert.rejects(syncCatalog(env,'rechargegames',async()=>[row,row],now+1));
 DB.sql.exec("INSERT INTO zx_smart_mapping VALUES('rechargegames','fixture','smart-x','mx','global','code')");
 DB.sql.prepare("INSERT INTO zx_smart_terms VALUES('rechargegames','USDT',20000000,0,2000000,0,?)").run(now+60000);
 const body={reference:'id',playerId:'fixture',productId:'smart-x',region:'mx',server:'global',delivery:'code',saleMxn:30000000,marginBps:0};
 const send=async(url,opts)=>{const data=JSON.parse(opts.body);assert.equal(data.test,true);assert.equal(data.product_key,'fixture');assert.equal(data.buyer_ref,'zx-trial-id');return Response.json({order_id:'fixture',status:'pending'});};
 assert.equal((await trialOrder(env,body,send)).status,200);
 DB.sql.exec('DELETE FROM zx_smart_terms');
 assert.equal((await trialOrder(env,body,send)).status,200);
 assert.equal((await trialOrder(env,{...body,playerId:'different'},send)).status,409);
});
test('signed deliveries and failures are recorded once; unsigned requests are rejected',async()=>{
 const {rechargeWebhook}=await import('./runtime.mjs');
 const {createHmac}=await import('node:crypto');
 const DB=database(),env={DB,RECHARGEGAMES_WEBHOOK_SECRET:'whsec_'+btoa('fixture')};
 DB.sql.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 for(const status of ['delivered','failed']){
   const id='evt-'+status, stamp=String(Math.floor(Date.now()/1000));
   const body=JSON.stringify({type:'order.'+status,id,data:{order_id:'order-'+status,status,test:true}});
   const signature=createHmac('sha256','fixture').update(id+'.'+stamp+'.'+body).digest('base64');
   const req=(sig)=>new Request('https://fixture.invalid/',{method:'POST',body,headers:{'webhook-id':id,'webhook-timestamp':stamp,'webhook-signature':'v1,'+sig}});
   assert.equal((await rechargeWebhook(req('wrong'),env)).status,401);
   for(let retry=0;retry<2;retry++)assert.equal((await rechargeWebhook(req(signature),env)).status,204);
 }
 assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM zx_smart_events').get().n,2);
});
