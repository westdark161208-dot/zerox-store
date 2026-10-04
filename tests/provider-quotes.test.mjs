import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {quotesRoute,quote} from '../cloudflare/providers/quotes.mjs';
import {readSixofire,safeProviderError} from '../cloudflare/providers/sixofire-read.mjs';
const url=new URL('https://fixture/api/admin/providers/sixofire/quotes'),user={id:'owner',isFounder:true,status:'active'},reply=(body,status=200)=>({body,status});
const body=b=>new Response(JSON.stringify(b));
test('price history GET is local read-only, empty history creates no table or fabricated series',async()=>{
 const DB=database();let n=0;const result=await quotesRoute(new Request(url),{DB},url,user,reply,async()=>{n++;});assert.deepEqual(result.body.series,[]);assert.equal(n,0);assert.equal(DB.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='zx_provider_quotes'").get().n,0);
});
test('price snapshots preserve actual microUSD; explicit founder action required; unknown price is omitted',async()=>{
 const DB=database(),env={DB,SIXOFIRE_API_KEY:'fixture'},r=new Request(url,{method:'POST'});let price=1.234567,calls=0;
 const fetcher=async()=>{calls++;return body({status:true,code:200,data:[{id:1,name:'110 direct',effectivePriceUsd:price,available:true,isActive:true},{id:2,name:'Unknown'}]});};
 assert.equal((await quotesRoute(r,env,url,{...user,isFounder:false},reply,fetcher)).status,403);assert.equal(calls,0);
 await quotesRoute(r,env,url,user,reply,fetcher);price=1.2;await quotesRoute(r,env,url,user,reply,fetcher);
 const result=await quotesRoute(new Request(url),env,url,user,reply,fetcher);assert.equal(calls,2);assert.equal(result.body.currency,'USD');assert.equal(result.body.series.length,1);assert.deepEqual(result.body.series[0].points.map(p=>p.micros),[1234567,1200000]);
 for(const priceUsd of [null,undefined,-1,NaN,'',{},Infinity])assert.equal(quote({id:1,priceUsd}),null);
});
test('fixed-origin reads reject resource injection and return only allowlisted diagnostic codes',async()=>{
 await assert.rejects(readSixofire({SIXOFIRE_API_KEY:'fixture'},'/account/shop/items?key=secret',()=>{throw Error('must not call')}),/RESOURCE_NOT_ALLOWED/);
 await assert.rejects(readSixofire({SIXOFIRE_API_KEY:'fixture'},'/account/shop/items',async()=>new Response(JSON.stringify({error:'PERMISSION_DENIED',message:'PRIVATE'}),{status:403})),/SIXOFIRE_PERMISSION_DENIED/);
 assert.equal(safeProviderError(Error('secret payload PRIVATE')), 'PROVIDER_UNAVAILABLE');
});
