import '../../diamond-catalog.js';
import '../../editor-elements.js';
import staticIds from './static-products.json' with {type:'json'};
const bases=globalThis.ZXDiamondCatalog;
export async function editorSchema(db){
 await db.prepare("CREATE TABLE IF NOT EXISTS zx_store_editor(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL DEFAULT 0,draft TEXT NOT NULL DEFAULT '{}',published TEXT NOT NULL DEFAULT '{}',updated_by TEXT,updated_at TEXT)").run();
 await db.prepare('CREATE TABLE IF NOT EXISTS zx_store_editor_history(revision INTEGER PRIMARY KEY,published TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 await db.prepare('INSERT OR IGNORE INTO zx_store_editor(id) VALUES(1)').run();
}
export async function publishedCatalog(db){await editorSchema(db);return JSON.parse((await db.prepare('SELECT published FROM zx_store_editor WHERE id=1').first()).published);}
export async function publishedProduct(db,base){
 if(!base)return null;
 const p=(await publishedCatalog(db))[base.id];
 if(p?.active===false)return null;
 return p?{...base,name:p.name,salePriceMXN:p.priceCents/100,salePriceCents:p.priceCents}:base;
}
export function validateEdit(p){
 if(!p||typeof p!=='object'||(!bases.some(b=>b.id===p.id)&&!staticIds.includes(p.id)&&!/^entity:(catalog|streaming|ads):[a-f0-9-]{36}$/.test(p.id)&&!globalThis.ZXEditorElements.some(e=>'page:'+e.id===p.id)))return null;
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.description!=='string'||p.description.length>1500||typeof p.character!=='string'||p.character.length>100||typeof p.active!=='boolean')return null;
 if(!Number.isSafeInteger(p.priceCents)||p.priceCents<(p.id.startsWith('page:')||p.id.startsWith('entity:ads:')?0:1)||p.priceCents>100000000)return null;
 // Local artwork or existing server media only; no arbitrary tracking or script URLs.
 if(typeof p.image!=='string'||p.image.length>500||p.image.includes('..')||!(/^(?:|(?:\.\/)?(?:assets\/)?[a-zA-Z0-9_.% /-]+\.(?:png|jpg|jpeg|webp)|https:\/\/zerox-sixofire-api\.westdark161208\.workers\.dev\/api\/catalog\/media\/[a-f0-9-]{36}\.(?:png|jpg|webp))$/).test(p.image))return null;
 if(p.category!==undefined&&(typeof p.category!=='string'||p.category.length>80))return null;
 if(p.region!==undefined&&(typeof p.region!=='string'||p.region.length>60))return null;
 if(p.position!==undefined&&(!Number.isInteger(p.position)||p.position<0||p.position>9999))return null;

 return {id:p.id,name:p.name.trim(),description:p.description.trim(),character:p.character.trim(),priceCents:p.priceCents,active:p.active,image:p.image,category:p.category||'',region:p.region||'',position:p.position||0};
}
export async function editorRoute(request,env,url,user,respond){
 const json=(data,status=200)=>{const response=respond(data,status);response.headers?.set('Cache-Control','no-store');return response;};
 const publicRead=url.pathname==='/api/store-editor/catalog'&&request.method==='GET';
 if(!publicRead&&(!user||user.status!=='active'||user.isFounder!==true))return json({ok:false,error:'FORBIDDEN'},403);
 await editorSchema(env.DB);
 if(publicRead)return json({ok:true,products:await publishedCatalog(env.DB)});
 if(request.method==='GET')return json({ok:true,...await env.DB.prepare('SELECT revision,draft,published FROM zx_store_editor WHERE id=1').first()});
 if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 const raw=await request.text();if(raw.length>12000)return json({ok:false,error:'TOO_LARGE'},413);
 let b;try{b=JSON.parse(raw)}catch{return json({ok:false,error:'INVALID_JSON'},400)}
 if(!Number.isSafeInteger(b.revision)||b.revision<0)return json({ok:false,error:'INVALID_REVISION'},400);
 const row=await env.DB.prepare('SELECT revision,draft FROM zx_store_editor WHERE id=1').first();
 if(row.revision!==b.revision)return json({ok:false,error:'EDITOR_CONFLICT'},409);
 let result;
 if(url.pathname==='/api/admin/store-editor/draft'){
  const p=validateEdit(b.product);if(!p)return json({ok:false,error:'INVALID_PRODUCT'},400);
  const entity=/^entity:(catalog|streaming|ads):(.+)$/.exec(p.id);
  if(entity&&p.image&&!p.image.startsWith('https://zerox-sixofire-api.westdark161208.workers.dev/api/catalog/media/'))return json({ok:false,error:'UPLOAD_IMAGE_REQUIRED'},400);
  if(entity){const table={catalog:'zx_catalog',streaming:'zx_streaming',ads:'zx_ads'}[entity[1]];if(!await env.DB.prepare('SELECT id FROM '+table+' WHERE id=?').bind(entity[2]).first())return json({ok:false,error:'UNKNOWN_PRODUCT'},400);}
  const draft=JSON.parse(row.draft);draft[p.id]=p;
  result=await env.DB.prepare('UPDATE zx_store_editor SET draft=?,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(JSON.stringify(draft),user.id,b.revision).run();
 }else if(url.pathname==='/api/admin/store-editor/publish'){
  if(b.confirm!==true)return json({ok:false,error:'CONFIRM_REQUIRED'},400);
  const updates=[];
  for(const [key,p] of Object.entries(JSON.parse(row.draft))){
   const m=/^entity:(catalog|streaming|ads):(.+)$/.exec(key);if(!m)continue;
   const imageKey=p.image.match(/\/media\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/)?.[1]||null;
   const guard=' AND EXISTS(SELECT 1 FROM zx_store_editor WHERE id=1 AND revision=?)';
   if(m[1]==='ads')updates.push(env.DB.prepare('UPDATE zx_ads SET title=?,kicker=?,description=?,image_key=COALESCE(?,image_key),active=?,position=? WHERE id=?'+guard).bind(p.name,p.character,p.description,imageKey,Number(p.active),p.position,m[2],b.revision));
   else updates.push(env.DB.prepare('UPDATE '+({catalog:'zx_catalog',streaming:'zx_streaming'}[m[1]])+' SET name=?,description=?,price=?,image_key=COALESCE(?,image_key),active=? WHERE id=?'+guard).bind(p.name,p.description,p.priceCents/100,imageKey,Number(p.active),m[2],b.revision));
  }
  const results=await env.DB.batch([...updates,env.DB.prepare('INSERT INTO zx_store_editor_history(revision,published,actor) SELECT revision+1,draft,? FROM zx_store_editor WHERE id=1 AND revision=?').bind(user.id,b.revision),env.DB.prepare('UPDATE zx_store_editor SET published=draft,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(user.id,b.revision)]);result=results.at(-1);
 }else return json({ok:false,error:'NOT_FOUND'},404);
 return result.meta.changes?json({ok:true,revision:b.revision+1}):json({ok:false,error:'EDITOR_CONFLICT'},409);
}
