import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecargasAmerica} from '../cloudflare/providers/recargas-america.mjs';
import {providerRoute} from '../cloudflare/providers/routes.mjs';
const env={RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'test-fixture-not-a-key'};
test('RA adapter is disabled by default and only issues GET to fixed provider host',async()=>{
  let calls=0;
  const fetcher=async(url,opts)=>{calls++;assert.equal(url,'https://panel.recargasamerica.com/api/v1/wallet');assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');return Response.json({success:true,data:{balance:150,currency:'USD',secret:'redacted'}})};
  await assert.rejects(readRecargasAmerica({},'wallet',fetcher),/RA_READ_DISABLED/);
  await assert.rejects(readRecargasAmerica(env,'buy',fetcher),/RA_RESOURCE_NOT_ALLOWED/);
  assert.equal(calls,0);
  assert.deepEqual(await readRecargasAmerica(env,'wallet',fetcher),{balance:'150',currency:'USD'});
});
test('provider responses are validated and upstream failures are not exposed',async()=>{
  await assert.rejects(readRecargasAmerica(env,'wallet',async()=>{throw Error('secret leaked')}),/^Error: RA_UNAVAILABLE$/);
  await assert.rejects(readRecargasAmerica(env,'wallet',async()=>Response.json({success:true,data:{balance:null,currency:'USD'}})),/RA_INVALID_RESPONSE/);
  const rows=await readRecargasAmerica(env,'catalog',async()=>Response.json({success:true,data:[{id:1,sku:'FF',name:'Product',price:1.15,type:'recharge',required_fields:['player_id'],password:'PRIVATE'}]}));
  assert.equal(rows[0].requiredFields[0],'player_id');assert(!JSON.stringify(rows).includes('PRIVATE'));
});
test('provider endpoints deny guests, regular users, inactive founder and all writes',async()=>{
  const url=new URL('https://test/api/admin/providers/recargas-america/status'),json=(body,status=200)=>({body,status});
  for(const user of [null,{status:'active'},{status:'disabled',isFounder:true}])assert.notEqual((await providerRoute(new Request(url),env,url,user,json)).status,200);
  assert.equal((await providerRoute(new Request(url,{method:'POST'}),env,url,{status:'active',isFounder:true},json)).status,405);
});
