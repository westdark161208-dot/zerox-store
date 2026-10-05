import test from 'node:test';import assert from 'node:assert/strict';import {founderBalancesRoute} from '../cloudflare/providers/founder-balances.mjs';
const reply=(body,status=200)=>({body,status}),request=new Request('https://fixture/api/admin/providers/founder-balances'),owner={isFounder:true,status:'active'};
test('supplier balances are founder-only, fixed-origin read-only and do not fabricate SF or wallet credits',async()=>{
 for(const user of [null,{status:'active'},{...owner,status:'disabled'}])assert.equal((await founderBalancesRoute(request,{},user,reply,()=>{throw Error('must not fetch')})).status,403);
 const r=await founderBalancesRoute(request,{RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'SECRET'},owner,reply,async(url,options)=>{assert.equal(url,'https://panel.recargasamerica.com/api/v1/wallet');assert.equal(options.method,'GET');return Response.json({success:true,data:{balance:'1.6862',currency:'USD'}});});
 assert.equal(r.body.balances.ra.estimatedMxnCents,2864);assert.equal(r.body.balances.ra.currency,'USD');assert.equal(r.body.balances.sf.available,false);assert.equal(r.body.walletCredited,false);assert(!JSON.stringify(r).includes('SECRET'));
 const failed=await founderBalancesRoute(request,{RA_READ_ENABLED:'true',RECARGAS_AMERICA_API_KEY:'SECRET'},owner,reply,()=>{throw Error('SECRET')});assert.equal(failed.body.balances.ra.available,false);assert(!JSON.stringify(failed).includes('SECRET'));
});
