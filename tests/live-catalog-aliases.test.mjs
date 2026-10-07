import test from 'node:test';
import assert from 'node:assert/strict';
import {deliveryQuote,matchesServiceName} from '../cloudflare/services/delivery.mjs';
import {variantMatches} from '../cloudflare/providers/market.mjs';
const env={DB:{prepare:()=>({first:async()=>null})},SIXOFIRE_API_KEY:'fixture',SIXOFIRE_DELIVERY_ENABLED:'true'};
test('live catalog Booya and universal boxes resolve only supported GIFT variant',async()=>{
 for(const [key,name,id] of [['booyah-normal','Pase Booya','76828'],['fragment','Fragmento Universal','17729'],['fragment-box','Caja de Fragmentos Universales','8816']]){
  const gift={id,name,itemType:'GIFT',available:true,isActive:true,priceUsd:.9,availableRegions:['US','SAC']};
  const fetcher=async url=>Response.json(String(url).includes('/items')?{data:[{...gift,id:'2569',itemType:'GIFT_V2'},gift]}:{status:true,code:200,data:[]});
  const plan=await deliveryQuote(env,key,'1136210821',1,'US',fetcher,'sixofire');
  assert.equal(plan.productId,id);assert.equal(plan.itemType,'GIFT');
  await assert.rejects(deliveryQuote(env,key,'1136210821',1,'BR',fetcher,'sixofire'));
 }
});
test('normal Booya alias does not accept premium or quantity variants',()=>{
 assert.equal(variantMatches('booyah-normal',{name:'Pase Booya'}),true);
 assert.equal(matchesServiceName('booyah-normal','Pase Booya'),true);
 for(const name of ['Pase Booya Premium','Pase Booya + 50','3 Pase Booya'])assert.equal(matchesServiceName('booyah-normal',name),false);
});
