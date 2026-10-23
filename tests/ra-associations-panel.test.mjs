import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../ra-associations.js',import.meta.url),'utf8');
function panel(){
 const elements=new Map(),events={},calls=[];let session='session-fixture';
 class Element{constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.hidden=false;this.disabled=false;this.checked=false;this.textContent='';}replaceChildren(){this.children=[];this.value='';}append(e){this.children.push(e);if(this.tag==='select'&&this.children.length===1)this.value=String(e.value);}after(e){elements.set(e.id,e);}}
 const q=id=>{if(!elements.has(id))elements.set(id,new Element(['ra-associations-total','ra-associations-product'].includes(id)?'select':'div'));return elements.get(id);};
 const data={ok:true,managedExternally:false,currency:'USD',bases:[{base:100,bonus:10,total:110}],catalog:[{id:5,sku:'ADS005',name:'Free Fire 100 +10 Diamantes',price:'0.80',baseDiamonds:100,requiredFields:['manual_id'],regions:[]}],associations:[{total:110,revision:0,entry:null,status:'pending'}],products:[{id:'zx-diamonds-220',diamonds:220,recipes:[]}]};
 let handler=async()=>Response.json(data);
 vm.runInNewContext(code,{document:{getElementById:q,createElement:t=>new Element(t),hidden:false},window:{addEventListener:(n,f)=>events[n]=f},localStorage:{getItem:()=>JSON.stringify({token:session})},fetch:async(url,opts)=>{calls.push({url,opts});return handler(url,opts);},AbortSignal});
 return {q,calls,events,data,setHandler:f=>handler=f,setSession:v=>session=v};
}
test('association panel displays normalized base/bonus, USD and pending recipes, then posts exact identity',async()=>{
 const p=panel();await p.q('ra-associations-load').onclick();assert.equal(p.q('ra-associations-form').hidden,false);assert.match(p.q('ra-associations-product').children[0].textContent,/USD 0.80.*manual_id.*Región por confirmar/);assert.match(p.q('ra-associations-match').textContent,/100 base \+ 10.*110/);assert.match(p.q('ra-associations-saved').children[0].textContent,/Pendiente/);
 p.q('ra-associations-regions').value='US';p.q('ra-associations-evidence').value='Fixture owner confirmed region and bonus';p.q('ra-associations-confirm').checked=true;
 p.q('ra-associations-form').onsubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
 const post=p.calls.find(c=>c.opts.method==='POST');assert.ok(post);const b=JSON.parse(post.opts.body);assert.equal(b.sku,'ADS005');assert.equal(b.name,p.data.catalog[0].name);assert.equal(b.productId,5);assert.equal(b.total,110);assert.equal(b.confirmed,true);
 assert.ok(p.calls.every(c=>c.url.endsWith('/associations')));
});
test('association panel clears private state and discards late responses after logout',async()=>{
 const p=panel();let finish;p.setHandler(()=>new Promise(resolve=>finish=resolve));const waiting=p.q('ra-associations-load').onclick();p.setSession('new-session');p.events['zx-control-clear']();finish(Response.json(p.data));await waiting;
 assert.equal(p.q('ra-associations-form').hidden,true);assert.equal(p.q('ra-associations-product').children.length,0);assert.equal(p.q('ra-associations-recipes').children.length,0);
});
