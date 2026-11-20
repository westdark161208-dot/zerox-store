// Development only. ZX_FX_DEPS may point to a package.json with these three dev dependencies.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
const require=createRequire(process.env.ZX_FX_DEPS || import.meta.url);
const {chromium}=require('playwright-core'),{build}=require('esbuild'),{Miniflare}=require('miniflare');
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
const {outputFiles}=await build({stdin:{contents:"import {onRequest} from './functions/api/fx-studio.js';export default {fetch(request,env){return onRequest({request,env})}}",resolveDir:root},bundle:true,format:'esm',write:false});
const service=new Miniflare({workers:[
  {name:'pages',modules:true,script:outputFiles[0].text,r2Buckets:['MANUAL_APPEARANCE'],serviceBindings:{STORE_IDENTITY:'identity'}},
  {name:'identity',modules:true,script:`export default {fetch(r){return Response.json({ok:true,user:{isFounder:r.headers.get('Authorization')==='Bearer local-test'}})}}`}
]});
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/fx-studio'){
      let body='';for await(const part of req)body+=part;
      const r=await service.dispatchFetch(url,{method:req.method,headers:req.headers,...(body&&{body})});
      res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());return;
    }
    const file=resolve(dist,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(dist+'/'))throw Error();
    const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
    const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const writes=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1320,height:900},serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin)return route.continue();
    if(route.request().method()==='POST')writes.push(u.pathname);
    const data={
      '/api/auth/me':{ok:true,user:{isFounder:true,id:'local',username:'Prueba FX',email:'fx@example.invalid',profile:{}}},
      '/api/admin/store-editor':{revision:0,draft:'{}',published:'{}'},
      '/api/store-editor/catalog':{products:{}},'/api/admin/catalog/products':{products:[]},'/api/admin/content/streaming':{products:[]},
      '/api/admin/content/ads':{ads:[]}
    };
    return route.fulfill({json:data[u.pathname]||{products:[],ads:[],ok:true},headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
  });
  await ctx.addInitScript(()=>localStorage.setItem('zerox-session',JSON.stringify({token:'local-test'})));
  const page=await ctx.newPage();page.setDefaultTimeout(8000);
  page.on('dialog',d=>d.accept(d.type()==='prompt'?'Favoritos de prueba':undefined));
  page.on('pageerror',e=>console.error('Page:',e.message));
  await page.goto(origin);
  await page.getByRole('button',{name:'Cerrar aviso'}).click();
  await page.locator('#open-account').click();
  await page.getByRole('button',{name:/Zero’X Editor · Toda la tienda/}).click();
  await page.locator('#zx-editor-bar [data-target]').selectOption('zx-diamonds-110');
  const article=page.locator('#zx-editor-dialog');
  await article.getByRole('button',{name:'Efectos visuales FX'}).click();
  const studio=page.locator('#zx-fx'), btn=name=>studio.getByRole('button',{name,exact:true});
  const field=label=>studio.getByLabel(label,{exact:true});
  for(let i=0;i<4;i++)await btn('Añadir efecto').click();
  assert.equal(await btn('Añadir efecto').isDisabled(),true);
  for(const [i,plane,type] of [[0,'back','smoke'],[1,'front','cloud'],[2,'back','sparks'],[3,'front','glow']]){
    await studio.locator('.fx-layers li').nth(i).locator('button').first().click();
    await field('Plano de la capa').selectOption(plane);
    await field('Tipo de efecto').selectOption(type);
    await field('Color principal hexadecimal').fill(i===2?'#ffce55':'#b953ff');
  }
  await field('Velocidad').fill('90');await field('Intensidad').fill('40');
  await field('Traseras').uncheck();await page.waitForFunction(()=>!document.querySelector('#zx-fx .fx-stage .zx-fx-back'));
  await field('Traseras').check();await field('Delanteras').uncheck();
  await page.waitForFunction(()=>!document.querySelector('#zx-fx .fx-stage .zx-fx-front'));
  await field('Delanteras').check();await studio.locator('.fx-stage .zx-fx-front').waitFor();
  await studio.locator('.fx-layers li').last().getByRole('button',{name:'Subir capa'}).click();
  await btn('Móvil').click();assert.equal(await studio.locator('.fx-stage').getAttribute('data-device'),'mobile');
  const box=await studio.locator('.fx-stage').boundingBox();await page.mouse.click(box.x+box.width*.35,box.y+box.height*.43);
  assert.ok(Math.abs(Number(await field('Posición horizontal').inputValue())-35)<2);
  await btn('Guardar cambios').click();await studio.getByText('Cambios FX guardados.').waitFor();
  await btn('Guardar en biblioteca').click();await field('Nombre del diseño').fill('Diamante prueba');
  await field('Descripción').fill('Dos planos y cuatro capas');await btn('Guardar diseño').click();
  await btn('Diamante prueba').waitFor();
  await btn('Nueva colección').click();await btn('Eliminar colección').waitFor();
  await field('Colección de favoritos').selectOption('');await btn('Diamante prueba').click();await btn('Añadir a Favoritos de prueba').click();
  await btn('Quitar de Favoritos de prueba').waitFor();
  await btn('Cerrar ×').click();await article.getByRole('button',{name:'Cancelar'}).click();
  await page.locator('#zx-editor-bar [data-target]').selectOption('d110-1');
  await article.getByRole('button',{name:'Efectos visuales FX'}).click();await btn('Biblioteca FX').click();
  await field('Buscar por nombre').fill('Diamante prueba');await btn('Diamante prueba').click();
  await btn('Aplicar vinculado').click();await studio.getByText('Cambios FX guardados.').waitFor();
  await page.reload();
  const saved=await (await ctx.request.get(origin+'/api/fx-studio')).json();
  assert.equal(saved.items['zx-diamonds-110'].config.layers.length,4);
  assert.equal(saved.designs[saved.items['d110-1'].link].config.layers.length,4);
  assert.equal(saved.items['zx-diamonds-341'],undefined);
  // Cards use a stable product ID, so a copied design can diverge without changing the source.
  await page.getByRole('button',{name:'Cerrar aviso'}).click();
  await page.locator('#open-account').click();
  await page.getByRole('button',{name:/Zero’X Editor · Toda la tienda/}).click();
  await page.locator('#zx-editor-bar [data-target]').selectOption('zx-diamonds-341');
  await article.getByRole('button',{name:'Efectos visuales FX'}).click();
  await btn('Biblioteca FX').click();await btn('Diamante prueba').click();
  await btn('Aplicar una copia').click();await studio.getByText('Cambios FX guardados.').waitFor();
  await studio.locator('.fx-layers li').last().getByRole('button',{name:'Eliminar'}).click();
  await studio.locator('.fx-layers li').first().getByRole('button',{name:'Duplicar'}).click();
  await field('Color principal hexadecimal').fill('#ffffff');
  await btn('Guardar cambios').click();await studio.getByText('Cambios FX guardados.').waitFor();
  const checkCopy=await (await ctx.request.get(origin+'/api/fx-studio')).json();
  assert.equal(checkCopy.items['zx-diamonds-341'].config.layers[1].color,'#ffffff');
  assert.deepEqual(checkCopy.items['zx-diamonds-110'],saved.items['zx-diamonds-110']);
  assert.deepEqual(checkCopy.designs,saved.designs);
  assert.deepEqual(writes,[]);
  console.log('PASS real editor → four layers → saved library → linked second product → reload. External writes: 0.');
  // Development fixture provides visible cards without navigating through store categories.
  await page.goto(origin+'/fx-review.html');
  const cards=page.locator('article');await cards.first().locator('canvas').first().waitFor();
  assert.equal(await cards.nth(2).locator('canvas').count(),0);
  const samples=await page.evaluate(async()=>{
    const {paint}=await import('/fx-studio/effects.mjs'),{presets,types,layer}=await import('/fx-studio/model.mjs');
    const c=document.createElement('canvas');c.width=c.height=240;
    const g=c.getContext('2d',{willReadFrequently:true}),fingerprints={};
    const hash=()=>{const a=g.getImageData(0,0,240,240).data;let h=0,sum=0;
      for(let i=3;i<a.length;i+=4){sum+=a[i];h=(Math.imul(h,31)+a[i])|0;}return [sum,h];};
    for(const type of Object.keys(types)){
      const l=layer(type);const frames=[];
      for(const t of [.2,1.83]){g.clearRect(0,0,240,240);paint(g,l,t,240,240,.6);frames.push(hash());}
      fingerprints[type]=frames;
    }
    const ms=[];for(let i=0;i<50;i++){
      const t=performance.now();g.clearRect(0,0,240,240);
      for(const l of presets[0].config.layers)paint(g,l,i/20,240,240,.58);
      g.getImageData(0,0,1,1);ms.push(performance.now()-t);
    }
    ms.sort((a,b)=>a-b);
    return {fingerprints,median:ms[25],p95:ms[47]};
  });
  assert.equal(new Set(Object.values(samples.fingerprints).map(v=>v[0][1])).size,12);
  for(const [type,v] of Object.entries(samples.fingerprints)){assert.ok(v[0][0]>0,type);assert.notEqual(v[0][1],v[1][1],type);}
  console.log('PASS 12 distinct animated pixel outputs; 240px four-layer CPU benchmark (ms), median',samples.median,'p95',samples.p95);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
  const pixels=()=>cards.first().locator('canvas').first().evaluate(c=>c.toDataURL());
  const still=await pixels();await page.waitForTimeout(300);assert.equal(await pixels(),still);
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const width of [390,768,1320]){
    await page.setViewportSize({width,height:820});await cards.first().getByRole('button').click();
    assert.equal(await studio.evaluate(d=>d.scrollWidth<=d.clientWidth+1),true);
    await btn('Cerrar ×').click();
  }
  await page.evaluate(()=>{document.querySelector('main').style.marginTop='300vh';});
  await page.waitForFunction(()=>document.querySelectorAll('article canvas').length===0);
  console.log('PASS reduced motion, mobile/tablet/desktop dialog bounds, offscreen release.');
} finally {
  await browser?.close();await service.dispose();server.closeAllConnections();server.close();
}
