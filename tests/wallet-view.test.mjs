import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function setup(){
 class Element extends EventTarget{hidden=false;disabled=false;textContent='';children=[];replaceChildren(...c){this.children=c}append(...c){this.children.push(...c)}}
 const e=Object.fromEntries(['zx-wallet-balance','zx-wallet-movements','zx-wallet-refresh','zx-wallet-status','account-modal'].map(x=>[x,new Element()]));
 let token='one',resolve,reject;const doc=new EventTarget();doc.getElementById=id=>e[id];doc.createElement=()=>new Element();const win=new EventTarget();
 const ctx=vm.createContext({document:doc,window:win,Intl,Date,getZeroXSession:()=>({token}),zeroxAuthRequest:()=>new Promise((a,b)=>{resolve=a;reject=b})});
 vm.runInContext(readFileSync(new URL('../wallet-view.js',import.meta.url),'utf8'),ctx);
 return {e,win,doc,change:()=>{token='two';win.zxResetWalletView()},resolve:d=>resolve(d),reject:d=>reject(d)};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('wallet late response after account change or dialog close cannot reveal prior balance',async()=>{
 for(const reset of [s=>s.change(),s=>s.e['account-modal'].dispatchEvent(new Event('close'))]){
 const s=setup();s.e['zx-wallet-refresh'].dispatchEvent(new Event('click'));reset(s);s.resolve({currency:'MXN',availableCents:4000,movements:[]});await settle();assert.equal(s.e['zx-wallet-balance'].hidden,true);assert.equal(s.e['zx-wallet-movements'].children.length,0);
 }
});
test('disabled wallet never presents an invented zero balance and permits retry',async()=>{
 const s=setup();s.e['zx-wallet-refresh'].dispatchEvent(new Event('click'));s.reject(new Error('WALLET_NOT_ACTIVE'));await settle();assert.equal(s.e['zx-wallet-balance'].hidden,true);assert.match(s.e['zx-wallet-status'].textContent,/no está habilitada/);assert.equal(s.e['zx-wallet-refresh'].disabled,false);
});
test('read wallet shows MXN and clears private data when the page hides',async()=>{
 const s=setup();s.e['zx-wallet-refresh'].dispatchEvent(new Event('click'));s.resolve({currency:'MXN',availableCents:4000,movements:[]});await settle();assert.equal(s.e['zx-wallet-balance'].hidden,false);assert.match(s.e['zx-wallet-balance'].textContent,/40.*MXN/);s.doc.hidden=true;s.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(s.e['zx-wallet-balance'].hidden,true);assert.equal(s.e['zx-wallet-movements'].children.length,0);
});
