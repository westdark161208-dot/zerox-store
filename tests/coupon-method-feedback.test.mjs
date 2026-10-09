import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../discount-codes.js',import.meta.url),'utf8');
function fixture(){const fields={input:{value:'ZX-201406A20431'},button:{},p:{}},host={classList:{add(){}},querySelector:s=>fields[s]};let resolve;const context={window:{},localStorage:{getItem:()=>JSON.stringify({token:'fixture'})},AbortSignal,fetch:()=>new Promise(r=>resolve=()=>r({ok:true,json:async()=>({ok:true,coupon:{code:'ZX-201406A20431',percent:10}})}))};vm.runInNewContext(source,context);const control=context.window.ZXCoupons.mount(host,3500);return {fields,control,complete:()=>resolve()};}
test('retail method changes preserve the validated discount and its displayed total',async()=>{const f=fixture(),pending=f.fields.button.onclick();f.complete();await pending;const text=f.fields.p.textContent;assert.match(text,/Total \$31.50 MXN/);f.control.setRetail(true);assert.equal(f.control.state().amountCents,3150);assert.equal(f.fields.p.textContent,text);});
test('switching to provider funds invalidates in-flight coupon validation',async()=>{const f=fixture(),pending=f.fields.button.onclick();f.control.setRetail(false);f.complete();await pending;assert.equal(f.control.state().amountCents,3500);assert.equal(f.control.state().couponCode,'');assert.equal(f.fields.input.disabled,true);assert.match(f.fields.p.textContent,/coste del proveedor/);f.control.setRetail(true);assert.equal(f.fields.input.disabled,false);assert.equal(f.fields.p.textContent,'');});
