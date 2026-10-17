import test from 'node:test';
import assert from 'node:assert/strict';
import {readRaAdminService} from './ra-admin-service.mjs';
const token='a'.repeat(64);
const wallet={ok:true,resource:'wallet',purchasesEnabled:false,data:{balance:'20.45',currency:'USD'}};
const product={id:100,sku:'RA-100',name:'Example',type:'game',price:'2.50',requiredFields:['player_id']};
const catalog={ok:true,resource:'catalog',purchasesEnabled:false,productCount:1,invalidProducts:0,data:[product]};
function env({response=wallet, status=200, ...overrides}={}) {
  const calls=[];
  const values={RA_ADMIN_READ_ENABLED:'true',RA_ADMIN_READ_TRANSPORT:'service-binding',
    RA_ADMIN_READ_CONTRACT_VERIFIED:'true',RA_READ_ADMIN_TOKEN:token,
    RA_READ_SERVICE:{async fetch(url,opts){calls.push({url,opts});return new Response(JSON.stringify(response),{status,headers:{'content-type':'application/json'}})}},
    ...overrides};
  return {values,calls};
}
test('wallet: only service binding and sanitized output',async()=>{
  const t=env();const value=await readRaAdminService(t.values,'wallet');
  assert.deepEqual(value,{balance:'20.45',currency:'USD'});
  assert.deepEqual(t.calls.map(x=>new URL(x.url).pathname),['/admin/ra/wallet']);
  assert.equal(t.calls[0].opts.method,'GET');
  assert.equal(t.calls[0].opts.headers.Authorization,'Bearer '+token);
});
test('catalog: count and payload verified',async()=>{
  const t=env({response:catalog});
  assert.deepEqual(await readRaAdminService(t.values,'catalog'),[product]);
  assert.deepEqual(t.calls.map(x=>new URL(x.url).pathname),['/admin/ra/catalog']);
});
test('reject unknown resource without fetch',async()=>{
  const t=env();await assert.rejects(readRaAdminService(t.values,'buy'),/RA_RESOURCE_NOT_ALLOWED/);assert.equal(t.calls.length,0);
});
for(const [name,broken] of [
  ['disabled',{RA_ADMIN_READ_ENABLED:'false'}],
  ['wrong transport',{RA_ADMIN_READ_TRANSPORT:'direct'}],
  ['unverified',{RA_ADMIN_READ_CONTRACT_VERIFIED:'false'}],
  ['missing service',{RA_READ_SERVICE:undefined}],
  ['missing secret',{RA_READ_ADMIN_TOKEN:undefined}],
  ['short secret',{RA_READ_ADMIN_TOKEN:'bad'}],
  ['secret collides with proxy',{RA_PROXY_SECRET:token}],
  ['secret collides with provider',{RECARGAS_AMERICA_API_KEY:token}]
])test('fail closed: '+name,async()=>{
  const t=env(broken);
  await assert.rejects(readRaAdminService(t.values,'wallet'),/RA_ADMIN_READ_(DISABLED|UNAVAILABLE)/);
  assert.equal(t.calls.length,0);
});
for (const [name,response,status=200] of [
  ['upstream forbidden',wallet,403],
  ['upstream error',wallet,500],
  ['failed response',{...wallet,ok:false}],
  ['purchases enabled',{...wallet,purchasesEnabled:true}],
  ['wrong resource',{...wallet,resource:'catalog'}],
  ['incorrect currency',{...wallet,data:{balance:'20',currency:'MXN'}}],
  ['negative balance',{...wallet,data:{balance:'-1',currency:'USD'}}],
  ['non-numeric balance',{...wallet,data:{balance:'secret',currency:'USD'}}],
  ['invalid products',{...catalog,invalidProducts:1}],
  ['mismatched catalog count',{...catalog,productCount:99}],
  ['catalog negative price',{...catalog,data:[{...product,price:'-5'}]}]
])test('reject invalid upstream: '+name,async()=>{
  const t=env({response,status});
  await assert.rejects(readRaAdminService(t.values,name.includes('catalog')||name.includes('products')?'catalog':'wallet'),/RA_ADMIN_READ_UNAVAILABLE/);
});
test('reject network failure, no fallback',async()=>{
  const t=env({RA_READ_SERVICE:{fetch(){throw Error('network')}}});
  await assert.rejects(readRaAdminService(t.values,'wallet'),/RA_ADMIN_READ_UNAVAILABLE/);
});
test('reject oversized response, no fallback',async()=>{
  const t=env({RA_READ_SERVICE:{fetch(){return new Response('{"ok":true}',{headers:{'content-length':String(4*1024*1024)}})}}});
  await assert.rejects(readRaAdminService(t.values,'wallet'),/RA_ADMIN_READ_UNAVAILABLE/);
});
