import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function setup(){
  class Element{hidden=false;disabled=false;textContent='';children=[];replaceChildren(...c){this.children=c;}append(...c){this.children.push(...c);}}
  const ids=['workspace','wallet-audit-rows','wallet-audit-status','wallet-audit-refresh','wallet-audit-next','provider-status','provider-check','provider-balance','provider-balance-result'];
  const e=Object.fromEntries(ids.map(id=>[id,new Element()])),window=new EventTarget(),calls=[];
  const document={hidden:false,getElementById:id=>e[id],createElement:()=>new Element()};
  let token='one';
  const context=vm.createContext({window,document,Intl,Date,AbortController,setTimeout,clearTimeout,localStorage:{getItem:()=>JSON.stringify({token})},fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve:body=>resolve({ok:true,json:async()=>body})}))});
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
