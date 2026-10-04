import test from 'node:test';import assert from 'node:assert/strict';
import {integrationRead} from '../cloudflare/providers/integrations.mjs';import {providerRoute} from '../cloudflare/providers/routes.mjs';
const reply=(body,status=200)=>({body,status}),url=path=>new URL('https://test/api/admin/providers/'+path),env={SIXOFIRE_API_KEY:'private-key',FF_INFO_API_KEY:'private-key'};
test('integration status reveals capabilities only; provider admin denies guests and writes',async()=>{
 const u=url('integrations/status');for(const user of [null,{status:'active',isFounder:false},{status:'disabled',isFounder:true}])assert.notEqual((await providerRoute(new Request(u),env,u,user,reply)).status,200);
 assert.equal((await providerRoute(new Request(u,{method:'POST'}),env,u,{status:'active',isFounder:true},reply)).status,405);
 const r=await integrationRead(env,u,reply);assert(!JSON.stringify(r).includes('private-key'));assert.equal(r.body.integrations[0].keyConfigured,true);
});
test('Sixofire reads fixed catalog host without forwarding redirects or private fields',async()=>{
 const u=url('sixofire/catalog');let calls=0;const r=await integrationRead(env,u,reply,async(endpoint,options)=>{calls++;assert.equal(endpoint,'https://api.sixofire.net/account/shop/items');assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');return Response.json({data:[{id:9149,name:'Diamantes',secret:'PRIVATE'}]});});assert.equal(calls,1);assert.equal(r.body.data.items[0].name,'Diamantes');assert(!JSON.stringify(r).includes('PRIVATE'));
 const redirect=await integrationRead(env,u,reply,async()=>new Response(null,{status:302,headers:{Location:'https://evil.test'}}));assert.equal(redirect.status,503);
});
test('player query validates UID/region and identity, safely selects only public game fields',async()=>{
 const u=url('freefire-info/player?uid=12345678&region=br');const r=await integrationRead(env,u,reply,async(endpoint,options)=>{assert.equal(new URL(endpoint).hostname,'developers.freefirecommunity.com');assert.equal(options.method,'GET');return Response.json({basicInfo:{accountId:12345678,nickname:'Player',level:7,private:'PRIVATE'}});});assert.equal(r.body.data.level,7);assert.equal(r.body.data.likes,null);assert(!JSON.stringify(r).includes('PRIVATE'));
 assert.equal((await integrationRead(env,url('freefire-info/player?uid=123&region=evil'),reply,()=>{throw Error('must not call')})).status,400);
 assert.equal((await integrationRead(env,u,reply,async()=>Response.json({basicInfo:{accountId:999,nickname:'Wrong'}}))).status,503);
 assert(!JSON.stringify(await integrationRead(env,u,reply,async()=>{throw Error('private-key')})).includes('private-key'));
});
