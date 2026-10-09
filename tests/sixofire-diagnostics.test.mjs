import test from 'node:test';
import assert from 'node:assert/strict';
import {readSixofire,safeProviderError} from '../cloudflare/providers/sixofire-read.mjs';
const env={SIXOFIRE_API_KEY:'private-key'},path='/account/shop/orders?page=1&limit=1';
async function result(fetcher){try{await readSixofire(env,path,fetcher);return 'OK';}catch(e){return safeProviderError(e);}}
test('Sixofire HTTP diagnostics survive non-JSON error responses without exposing bodies',async()=>{
 for(const [status,code] of [[401,'PROVIDER_CREDENTIAL_REJECTED'],[403,'PROVIDER_PERMISSION_OR_SUBSCRIPTION'],[429,'PROVIDER_RATE_LIMITED'],[404,'PROVIDER_HTTP_404'],[500,'PROVIDER_HTTP_500'],[502,'PROVIDER_HTTP_502'],[302,'PROVIDER_REDIRECT_REJECTED']])assert.equal(await result(async()=>new Response('private-key internal detail',{status})),code);
 assert.equal(await result(async()=>new Response('private-key',{status:200})),'PROVIDER_RESPONSE_FORMAT');
});
test('Sixofire distinguishes connection failure and timeout without leaking thrown errors',async()=>{
 assert.equal(await result(async()=>{throw Error('private-key')}),'PROVIDER_CONNECTION_FAILED');
 assert.equal(await result(async()=>{throw new DOMException('private-key','TimeoutError')}),'PROVIDER_TIMEOUT');
 assert.equal(safeProviderError(Error('PROVIDER_HTTP_500 private-key')),'PROVIDER_UNAVAILABLE');
});
test('Sixofire preserves allowlisted license failures and successful reads',async()=>{
 assert.equal(await result(async()=>Response.json({status:false,errorCode:'SUBSCRIPTION_REQUIRED',message:'private-key'},{status:403})),'SIXOFIRE_SUBSCRIPTION_REQUIRED');
 assert.equal(await result(async()=>Response.json({status:false,errorCode:'unknown private-key'},{status:503})),'PROVIDER_HTTP_503');
 assert.equal(await result(async()=>Response.json({code:200,status:true,data:{items:[]}})),'OK');
});
