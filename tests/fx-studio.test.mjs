import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,change,configOf,layer,neutral,presets,publicView,references,resolved,types} from '../fx-studio/model.mjs';
import {onRequest} from '../functions/api/fx-studio.js';
const cfg=structuredClone(presets[0].config);
const design={action:'design',id:'sample',name:'Diseño de prueba',category:'Luz',description:'Prueba',config:cfg};
const linked=(id)=>({action:'item',id,link:'sample'});
test('four unique layers, independent switches and ordered planes round-trip',()=>{
  for(const plane of ['front','back'])for(const active of [true,false]){
    const input=structuredClone(cfg);input[plane]=active;input.layers.reverse();
    input.layers[0].enabled=false;assert.deepEqual(configOf(input),input);
  }
  for(const type of Object.keys(types))assert.equal(configOf({...neutral(),layers:[layer(type)]}).layers[0].type,type);
  for(const bad of [{...cfg,version:2},{...cfg,layers:[...cfg.layers,layer()]},{...cfg,layers:[cfg.layers[0],cfg.layers[0]]},
    {...cfg,layers:[{...layer(),opacity:200}]},{...cfg,layers:[{...layer(),color:'url(bad)'}]}])assert.throws(()=>configOf(bad));
});
test('copies, confirmed linked edits, favorites and deletions keep their promised scope',()=>{
  let s=change(blank(),design);
  for(const id of ['ff-1','ra-game-45'])s=change(s,linked(id));
  s=change(s,{action:'item',id:'entity:catalog:example',config:cfg});
  s=change(s,{action:'collection',id:'my-picks',name:'Favoritos',ids:['sample','gold']});
  const next=structuredClone(cfg);next.layers[0].color='#ffbb11';
  assert.throws(()=>change(s,{...design,config:next}),/CONFIRM_LINKED/);
  s=change(s,{...design,config:next,confirmLinked:2});
  assert.deepEqual(resolved(s,'ff-1'),next);assert.deepEqual(resolved(s,'ra-game-45'),next);
  assert.deepEqual(resolved(s,'entity:catalog:example'),cfg);
  assert.equal(resolved(s,'untouched'),undefined);assert.equal(publicView(s).collections,undefined);
  assert.throws(()=>change(s,{action:'deleteDesign',id:'sample',confirmLinked:2}),/CONFIRM_DELETE/);
  s=change(s,{action:'deleteDesign',id:'sample',confirmLinked:2,confirmDelete:true});
  assert.deepEqual(resolved(s,'ff-1'),next);assert.deepEqual(references(s,'sample'),[]);
  assert.deepEqual(s.collections['my-picks'].ids,['gold']);
  assert.throws(()=>change(s,{...design,id:'gold'}),/BUILTIN/);
  s=change(s,{action:'restore',id:'ff-1'});assert.equal(publicView(s).items['ff-1'],undefined);
});
test('public metadata excludes disabled presets, favorite names and drafts',()=>{
  let s=change(blank(),design);s=change(s,{action:'item',id:'off',config:{...cfg,back:false,front:false}});
  assert.deepEqual(publicView(s),{version:1,items:{},designs:{}});
  s=change(s,linked('active'));assert.deepEqual(resolved(publicView(s),'active'),cfg);
});
test('only the existing founder check admits editing; conditional writes reject stale revisions',async()=>{
  let data, rev=0;
  const bucket={get:async()=>data?{etag:String(rev),json:async()=>JSON.parse(data)}:null,
    async put(key,value,{onlyIf}) {
      assert.equal(key,'storefront/fx-studio/v1.json');
      if(onlyIf.has('If-None-Match')?!!data:onlyIf.get('If-Match')!=='"'+rev+'"')return null;
      data=value;return {etag:String(++rev)};
    }};
  const env={MANUAL_APPEARANCE:bucket,STORE_IDENTITY:{fetch:r=>Response.json({ok:true,user:{isFounder:r.headers.get('Authorization')==='Bearer test-founder'}})}};
  const req=(path='',body,token='')=>onRequest({request:new Request('https://test.local/api/fx-studio'+path,{method:body?'POST':'GET',
    headers:token?{Authorization:'Bearer '+token}:{},body:body&&JSON.stringify(body)}),env});
  assert.equal((await req('?editor')).status,401);
  assert.equal((await req('',{revision:'',command:design},'member')).status,403);
  let r=await req('',{revision:'',command:design},'test-founder');assert.equal(r.status,200);
  assert.equal((await req('',{revision:'',command:linked('d110-1')},'test-founder')).status,409);
  r=await req('',{revision:(await r.json()).revision,command:linked('d110-1')},'test-founder');assert.equal(r.status,200);
  assert.deepEqual(resolved(await (await req()).json(),'d110-1'),cfg);
});
