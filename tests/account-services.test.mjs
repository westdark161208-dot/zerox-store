import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../account-services.js',import.meta.url),'utf8');
function setup(request){
  class Element {
    constructor(){this.children=[];this.handlers={};this.hidden=false;this.textContent='';this.disabled=false}
    addEventListener(name,fn){this.handlers[name]=fn}
    replaceChildren(){this.children=[]}
    append(...items){this.children.push(...items)}
    querySelectorAll(){return []}
    click(){return this.handlers.click?.()}
  }
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
  const window={addEventListener(){},confirm:()=>true};
  let token='first';
  runInNewContext(code,{document:{getElementById:get,createElement:()=>new Element()},window,
    getZeroXSession:()=>token?{token}:null,zeroxAuthRequest:request,Intl,Date});
  return {get,window,setToken:value=>{token=value}};
}
test('late wallet response cannot disclose previous account balance after logout',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r),ui=setup(()=>pending);
  const work=ui.get('zx-wallet-refresh').click();
  ui.setToken(null);ui.window.zxResetAccountServices();
  resolve({currency:'MXN',availableCents:10000,movements:[]});await work;
  assert.equal(ui.get('zx-wallet-balance').hidden,true);
  assert.equal(ui.get('zx-wallet-balance').textContent,'');
});
test('disabled wallet is shown as unavailable, never as a fabricated zero balance',async()=>{
  const ui=setup(async()=>{throw Error('WALLET_NOT_ACTIVE')});
  await ui.get('zx-wallet-refresh').click();
  assert.equal(ui.get('zx-wallet-balance').hidden,true);
  assert.match(ui.get('zx-wallet-status').textContent,/no está habilitado/);
});
test('session listing renders only text and a current-session marker',async()=>{
  const ui=setup(async()=>({sessions:[{id:'session',current:true,created_at:'2026-10-03 00:00:00',expires_at:'2026-11-03T00:00:00Z'}]}));
  await ui.get('zx-sessions-refresh').click();
  assert.equal(ui.get('zx-session-list').children[0].children[0].textContent,'Esta sesión');
  assert.equal(ui.get('zx-sessions-revoke-all').hidden,false);
});
