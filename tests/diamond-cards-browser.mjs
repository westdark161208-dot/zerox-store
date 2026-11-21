// Real storefront and editor route. SQLite emulates D1 locally; commerce requests are blocked.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {database} from './helpers/d1.mjs';
import {editorRoute} from '../cloudflare/editor/catalog.mjs';
const require=createRequire(process.env.ZX_FX_DEPS||import.meta.url);
const {chromium}=require('playwright-core');
const db=database(), founder={id:'test',status:'active',isFounder:true};
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const before=url.pathname.startsWith('/before/');
  const root=resolve(before?'original/dist':'dist');
  const path=resolve(root,'.'+(before?url.pathname.slice(7):url.pathname));
  const file=path===root?resolve(root,'index.html'):path;
  if(!file.startsWith(root+'/')){res.writeHead(404).end();return;}
  try{
    const data=await readFile(file),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  await mkdir('card-evidence',{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('zerox-session',JSON.stringify({token:'local-test'})));
  const externalWrites=[];
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===origin&&!url.pathname.startsWith('/api/'))return route.continue();
    const reply=data=>route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
    if(req.method()==='OPTIONS')return reply({});
    if(url.pathname.startsWith('/api/admin/store-editor')||url.pathname==='/api/store-editor/catalog'){
      const input=new Request(url,{method:req.method(),body:req.postData()||undefined});
      const result=await editorRoute(input,{DB:db},url,founder,(data,status=200)=>({data,status}));
      return route.fulfill({status:result.status,json:result.data,headers:{'Access-Control-Allow-Origin':'*'}});
    }
    if(req.method()!=='GET')externalWrites.push(url.pathname);
    if(url.pathname==='/api/auth/me')return reply({ok:true,user:{isFounder:true,id:'test',username:'Editor local',profile:{}}});
    if(url.pathname==='/api/fx-studio')return reply({version:1,items:{},designs:{}});
    return reply({ok:true,products:[],ads:[]});
  });
  const page=await context.newPage();page.setDefaultTimeout(9000);
  page.on('dialog',d=>d.accept());
  const catalog=category=>page.evaluate(c=>zxOpenCatalog(c),category);
  async function pair(file){
    const cards=page.locator('#products article');
    await cards.first().scrollIntoViewIfNeeded();
    await cards.first().locator('img').first().waitFor({state:'attached'});
    await cards.evaluateAll(async els=>Promise.all(els.slice(0,2).flatMap(e=>Array.from(e.querySelectorAll('img')).map(i=>i.decode().catch(()=>{})))));
    const a=await cards.first().boundingBox(),b=await cards.nth(1).boundingBox();
    const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
    await page.screenshot({path:'card-evidence/'+file+'.png',clip:{x:a.x+scroll.x,y:a.y+scroll.y,width:b.x+b.width-a.x,height:Math.max(a.height,b.height)}});
  }
  for(const [path,title] of [['/before/','antes'],['/','despues']]){
    await page.goto(origin+path);
    await page.getByRole('button',{name:'Cerrar aviso'}).click();
    await catalog('Diamantes ilimitados');await pair(title+'-ilimitados');
    await catalog('Diamantes 1 vez');await pair(title+'-primera-vez');
  }
  const sku='zx-diamonds-110',item=page.locator('#products [data-product="'+sku+'"]');
  await catalog('Diamantes ilimitados');
  const price=await item.locator('.dc-price').innerText();
  await item.locator('[data-buy-now]').click();
  assert.equal(await page.locator('#zx-diamond-dialog .zx-checkout-total').innerText(),'Total '+price);
  await page.locator('#zx-diamond-dialog [aria-label=Cerrar]').click();
  await item.locator('[data-add]').evaluate(b=>{for(let i=0;i<3;i++)b.click();});
  await catalog('Diamantes 1 vez');await page.locator('[data-add="d110-1"]').click();
  await page.reload();await page.evaluate(()=>openCart());
  assert.equal(await page.locator('#cart-count').innerText(),'4');
  assert.equal(await page.locator('#bottom-cart-count').innerText(),'4');
  assert.deepEqual(await page.evaluate(()=>cart()),[sku,sku,sku,'d110-1']);
  await page.locator('#cart').screenshot({path:'card-evidence/carrito.png'});
  await page.locator('#cart [data-remove]').first().click();
  assert.equal(await page.locator('#cart-count').innerText(),'3');
  await page.evaluate(()=>document.querySelector('#cart').close());
  await page.getByRole('button',{name:'Cerrar aviso'}).click().catch(()=>{});
  await page.locator('#open-account').click();
  await page.getByRole('button',{name:/Zero’X Editor · Toda la tienda/}).click();
  const choose=()=>page.locator('#zx-editor-bar [data-target]').selectOption(sku);
  await choose();
  const editor=page.locator('#zx-editor-dialog'),settings=editor.locator('.dc-settings');
  await settings.locator('[data-setting=width]').fill('78');
  await settings.locator('[data-setting=height]').fill('140');
  await settings.locator('[data-setting=main]').fill('#30d6cb');
  await settings.locator('summary',{hasText:'Insignia'}).click();
  await settings.locator('[data-setting=badgeOn]').check();
  await settings.locator('[data-setting=badgeText]').fill('OFERTA ESPECIAL');
  const preview=settings.locator('.dc-preview');
  assert.equal(await preview.locator('.dc-badge').innerText(),'OFERTA ESPECIAL');
  await settings.locator('select[data-size]').selectOption('desktop');
  assert.equal(await preview.getAttribute('data-size'),'desktop');
  const panel=preview.locator('.dc-panel'), height=(await panel.boundingBox()).height;
  assert.equal(height,140);
  await settings.locator('select[data-badge]').selectOption('off');
  assert.equal(await preview.locator('.dc-badge').count(),0);
  assert.equal((await panel.boundingBox()).height,height);
  await editor.locator('button[type=submit]').click();
  await editor.waitFor({state:'hidden'});
  await page.locator('#zx-editor-bar [data-publish]').click();
  await page.locator('#zx-editor-bar').getByText(/Publicado\. La tienda/).waitFor();
  await page.reload();await catalog('Diamantes ilimitados');await item.locator('.dc-badge').waitFor();
  assert.equal(await item.locator('.dc-amount').innerText(),'110');
  assert.equal(await item.locator('.dc-price').innerText(),price);
  assert.equal(await item.locator('.dc-panel').evaluate(e=>Math.round(e.getBoundingClientRect().height)),140);
  assert.equal(await page.locator('#products article').nth(1).locator('.dc-badge').count(),0);
  await pair('despues-insignia-y-dimensiones');
  for(const width of [320,390,768,1320]){
    await page.setViewportSize({width,height:844});
    const bounds=await item.evaluate(e=>{const a=e.getBoundingClientRect(),p=e.querySelector('.dc-panel').getBoundingClientRect();return {right:a.right,w:a.width,pw:p.width,scroll:e.scrollWidth};});
    assert.ok(bounds.right<=width&&bounds.scroll<=bounds.w+1);
    assert.ok(Math.abs(bounds.pw/bounds.w-.78)<.015);
    if(width===1320)await pair('escritorio');
  }
  assert.deepEqual(externalWrites,[]);
  console.log('PASS four taps across packages, both counters, reload, remove one, checkout total, per-SKU dimensions, isolated publication, badge, responsive layout. External commercial writes: 0.');
}finally{await browser.close();server.closeAllConnections();server.close();}
