import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function setup(){
  class Element{hidden=false;disabled=false;textContent='';children=[];replaceChildren(...c){this.children=c;}append(...c){this.children.push(...c);}}
  const ids=['workspace','wallet-audit-rows','wallet-audit-status','wallet-audit-refresh','wallet-audit-next','provider-status','provider-check','provider-balance','provider-balance-result','payment-config-status','payment-audit-status','payment-config-check','payment-audit-check','payment-audit-id','payment-account-check','payment-account-status'];
  const e=Object.fromEntries(ids.map(id=>[id,new Element()])),window=new EventTarget(),calls=[];
  const document={hidden:false,getElementById:id=>e[id],createElement:()=>new Element()};
  let token='one';
  const context=vm.createContext({window,document,Intl,Date,AbortController,setTimeout,clearTimeout,localStorage:{getItem:()=>JSON.stringify({token})},fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve:(body,status=200)=>resolve({ok:status>=200&&status<300,status,json:async()=>body})}))});
  vm.runInContext(readFileSync(new URL('../control-finance.js',import.meta.url),'utf8'),context);
  window.dispatchEvent(new Event('zx-control-ready'));
  return {e,window,calls,change:()=>{token='two';window.dispatchEvent(new Event('zx-control-clear'));}};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('late admin wallet response is discarded after session change and request is aborted',async()=>{
  const s=setup();s.e['wallet-audit-refresh'].onclick();assert.equal(s.calls.length,1);s.change();
  assert.equal(s.calls[0].options.signal.aborted,true);
  s.calls[0].resolve({ok:true,available:true,movements:[{id:'private-id',amountCents:1000,resultingBalanceCents:1000}],nextCursor:null});await settle();
  assert.equal(s.e['wallet-audit-rows'].children.length,0);assert.equal(s.e['wallet-audit-status'].textContent,'');
});
test('disabled provider configuration never issues a provider wallet request',async()=>{
  const s=setup();s.e['provider-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:false,keyConfigured:true,purchasesEnabled:false});await settle();
  assert.equal(s.e['provider-balance'].disabled,true);s.e['provider-balance'].onclick();assert.equal(s.calls.length,1);
  assert.match(s.e['provider-status'].textContent,/desactivada/);assert.equal(s.calls[0].options.cache,'no-store');
});
test('provider balance uses the original currency and is cleared on Control reset',async()=>{
  const s=setup();s.e['provider-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:true,keyConfigured:true});await settle();
  s.e['provider-balance'].onclick();s.calls[1].resolve({ok:true,data:{balance:'12.34',currency:'USD'},syncedAt:'2026-10-04T00:00:00Z'});await settle();
  assert.match(s.e['provider-balance-result'].textContent,/12.34 USD/);
  s.window.dispatchEvent(new Event('zx-control-clear'));assert.equal(s.e['provider-balance-result'].textContent,'');assert.equal(s.e['provider-balance'].disabled,true);
});
test('production payment inspection stays unavailable until server configuration is confirmed',async()=>{
  const s=setup();s.e['payment-config-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:false,tokenConfigured:false,collectorConfigured:false,webhookConfigured:false});await settle();
  assert.equal(s.e['payment-audit-check'].disabled,true);s.e['payment-audit-check'].onclick();assert.equal(s.calls.length,1);
  assert.match(s.e['payment-config-status'].textContent,/pendiente/);
});
test('real payment inspection rejects malformed IDs and clears late results after session changes',async()=>{
  const s=setup();s.e['payment-config-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:true,tokenConfigured:true,collectorConfigured:true});await settle();
  s.e['payment-audit-id'].value='not-an-id';s.e['payment-audit-check'].onclick();assert.equal(s.calls.length,1);
  s.e['payment-audit-id'].value='999';s.e['payment-audit-check'].onclick();assert.equal(s.calls.length,2);
  s.change();s.calls[1].resolve({ok:true,payment:{id:'999',status:'approved',amountCents:1000}});await settle();
  assert.equal(s.e['payment-audit-status'].textContent,'');assert.equal(s.e['payment-audit-id'].value,'');
});

test('account connection check requires configuration and discards late private response',async()=>{
 const s=setup();s.e['payment-account-check'].onclick();assert.equal(s.calls.length,0);
 s.e['payment-config-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:true,tokenConfigured:true,collectorConfigured:true,webhookConfigured:true,checkoutEnabled:false});await settle();
 assert.match(s.e['payment-config-status'].textContent,/desactivado/);
 s.e['payment-account-check'].onclick();assert.match(s.calls[1].url,/mercadopago\/account$/);
 s.change();s.calls[1].resolve({ok:true,account:{receiverMatched:true,site:'MLM'}});await settle();
 assert.equal(s.e['payment-account-status'].textContent,'');assert.equal(s.e['payment-account-check'].disabled,true);
});

test('account failures show safe diagnostics while unknown provider content stays hidden',async()=>{
 const s=setup();s.e['payment-config-check'].onclick();s.calls[0].resolve({ok:true,readEnabled:true,tokenConfigured:true,collectorConfigured:true});await settle();
 s.e['payment-account-check'].onclick();s.calls[1].resolve({ok:false,error:'MP_PRODUCTION_CREDENTIAL_REJECTED'},503);await settle();
 assert.match(s.e['payment-account-status'].textContent,/401/);assert.equal(s.e['payment-account-check'].disabled,false);
 s.e['payment-account-check'].onclick();s.calls[2].resolve({ok:false,error:'private-provider-token'},503);await settle();
 assert.equal(s.e['payment-account-status'].textContent,'Consulta no disponible.');
});
