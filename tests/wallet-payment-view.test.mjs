import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function setup(){
 class Element extends EventTarget{hidden=false;disabled=false;value='20';textContent='';attrs={};removeAttribute(key){delete this.attrs[key];}set href(value){this.attrs.href=value;}get href(){return this.attrs.href;}}
 const ids=['funding-status','funding-create','funding-refresh','funding-checkout','funding-result','funding-amount','funding-form'];
 const e=Object.fromEntries(ids.map(id=>[id,new Element()])),win=new EventTarget(),doc=new EventTarget(),calls=[];
 doc.hidden=false;doc.getElementById=id=>e[id];
 const ctx=vm.createContext({URL,Intl,AbortSignal,crypto,history:{replaceState(){}},location:{href:'https://test/wallet-payment.html'},window:win,document:doc,localStorage:{getItem:()=>'{"token":"fixture"}'},fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve:body=>resolve({ok:true,json:async()=>body})}))});
 vm.runInContext(readFileSync(new URL('../wallet-payment.js',import.meta.url),'utf8'),ctx);return {e,win,doc,calls};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('disabled pilot cannot submit checkout',async()=>{
 const s=setup();s.calls[0].resolve({ok:true,fundingPilotAvailable:false});await settle();
 s.e['funding-form'].dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(s.calls.length,1);assert.equal(s.e['funding-create'].disabled,true);assert.equal(s.e['funding-checkout'].hidden,true);
});
test('prepared checkout is discarded if page hides before response',async()=>{
 const s=setup();s.calls[0].resolve({ok:true,fundingPilotAvailable:true});await settle();
 s.e['funding-form'].dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(s.calls.length,2);assert.equal(JSON.parse(s.calls[1].options.body).amountCents,2000);
 s.doc.hidden=true;s.doc.dispatchEvent(new Event('visibilitychange'));
 s.calls[1].resolve({ok:true,checkoutUrl:'https://www.mercadopago.com.mx/checkout/test'});await settle();assert.equal(s.e['funding-checkout'].hidden,true);assert.equal(s.e['funding-checkout'].href,undefined);assert.equal(s.e['funding-refresh'].disabled,true);
});
