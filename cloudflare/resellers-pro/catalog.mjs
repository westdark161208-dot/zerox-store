import base from './store-base.json' with {type:'json'};
import '../../diamond-catalog.js';
import {gameCatalog} from '../services/games.mjs';
import {publishedCatalog} from '../editor/catalog.mjs';
import {fail,jsonBody,approved,audit} from './accounts.mjs';
export const safeImage=v=>typeof v==='string'&&v.length<=500&&!v.includes('..')&&/^(?:|(?:\.\/)?(?:assets\/)?[a-zA-Z0-9_.% /-]+\.(?:png|jpg|jpeg|webp)|\/api\/resellers\/media\/[a-f0-9-]+\.(?:png|jpg|webp)|https:\/\/zerox-sixofire-api\.westdark161208\.workers\.dev\/api\/catalog\/media\/[a-f0-9-]+\.(?:png|jpg|webp))$/.test(v);
async function optionalRows(db,table){if(!await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first())return [];return (await db.prepare('SELECT * FROM '+table).all()).results;}
export async function mirror(env,legacy){
 const products=new Map(base.map(p=>[p.id,{...p,max:1,prices:Array(7).fill(p.priceCents),checkout:/^d\d+-1$/.test(p.id)?'promotion':'store'}]));
 for(const p of globalThis.ZXDiamondCatalog||[])products.set(p.id,{id:p.id,name:p.diamonds+' Diamantes',category:'Diamantes',description:p.character||'',image:p.image||'',active:true,min:1,max:1,prices:Array(7).fill(Math.round(p.salePriceMXN*100)),checkout:'managed'});
 for(const [table,kind]of [['zx_catalog','catalog'],['zx_streaming','streaming']])for(const p of await optionalRows(env.DB,table))products.set('entity:'+kind+':'+p.id,{id:'entity:'+kind+':'+p.id,name:p.name,description:p.description||'',category:kind==='streaming'?'Streaming':p.section,image:p.image_key?'https://zerox-sixofire-api.westdark161208.workers.dev/api/catalog/media/'+p.image_key:'',prices:Array(7).fill(Math.round(p.price*100)),active:!!p.active,min:1,max:1,checkout:'managed'});
 try{for(const p of await gameCatalog(env))products.set(p.id,{id:p.id,name:p.name,category:p.category,description:'Recarga de '+p.game,image:'',active:true,min:1,max:1,prices:Array(7).fill(0),checkout:'managed'});}catch{/* Provider catalogue remains unavailable; published local products still load. */}
 const edits=await publishedCatalog(env.DB);
 for(const [id,p]of Object.entries(edits)){
  if(id.startsWith('page:')||id.startsWith('custom:block:')||id.startsWith('entity:ads:'))continue;
  const old=products.get(id)||{id,min:1,max:1,checkout:'store'};
  products.set(id,{...old,name:p.name||old.name,description:p.description||'',image:p.image||old.image||'',category:p.category||old.category||'Catálogo',active:p.active!==false,prices:Array(7).fill(p.priceCents??old.prices?.[0]??0)});
 }
 for(const [id,name,category,min,max,prices,plan]of legacy){const old=products.get(id);products.set(id,{...old,id,name:old?.name||name,description:old?.description||'',category:old?.category||category,min,max,prices,plan:plan||null,image:old?.image||'',active:old?.active!==false,checkout:'resellers'});}
 return [...products.values()];
}
export async function catalogue(env,legacy,draft=false){
 const row=await env.DB.prepare('SELECT * FROM zx_r_catalog_editor WHERE id=1').first(),overrides=JSON.parse(row[draft?'draft':'published']);
 return {revision:row.revision,overrides,products:(await mirror(env,legacy)).map(p=>({...p,...overrides[p.id],id:p.id,min:p.min,max:p.max,plan:p.plan,manualAllowed:!['promotion','managed','resellers'].includes(p.checkout),checkout:p.checkout==='resellers'?'resellers':(overrides[p.id]?.manualDelivery===true&&!['promotion','managed'].includes(p.checkout)?'manual':'store')}))};
}
export async function catalogRoute(request,env,url,user,json,legacy,state){
 const admin=url.pathname.startsWith('/api/admin/');const path=url.pathname.replace(admin?'/api/admin/resellers/portal':'/api/resellers/portal','');
 if(!path.startsWith('/catalog'))return null;
 if(admin&&!user.isFounder)fail('FORBIDDEN',403);
 if(!admin&&!await approved(env,user))fail('RESELLER_APPROVAL_REQUIRED',403);
 if(request.method==='GET'&&path==='/catalog'){
  const result=await catalogue(env,legacy,admin);
  if(admin)return json({ok:true,...result});
  const s=await state(env,user);const tier=Number(url.searchParams.get('tier')||s.tier);if(!Number.isInteger(tier)||tier<1||tier>s.tier)fail('LEVEL_LOCKED',403);
  return json({ok:true,revision:result.revision,tier,products:result.products.filter(p=>p.active).map(p=>({id:p.id,name:p.name,description:p.description,category:p.category,image:p.image,min:p.min,max:p.max,unitCents:p.prices[tier-1],checkout:p.checkout}))});
 }
 if(!admin||request.method!=='POST')return null;
 const b=await jsonBody(request),row=await env.DB.prepare('SELECT * FROM zx_r_catalog_editor WHERE id=1').first();if(b.revision!==row.revision)fail('REVISION_CONFLICT',409);
 let value;
 if(path==='/catalog/draft'){
  const p=b.product;if(!p||!(await mirror(env,legacy)).some(x=>x.id===p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.description!=='string'||p.description.length>1500||typeof p.category!=='string'||p.category.length>80||!safeImage(p.image)||typeof p.active!=='boolean'||!Array.isArray(p.prices)||p.prices.length!==7||p.prices.some(x=>!Number.isSafeInteger(x)||x<1||x>10000000))fail('INVALID_PRODUCT');
  const draft=JSON.parse(row.draft);draft[p.id]={name:p.name.trim(),description:p.description,category:p.category,image:p.image,active:p.active,prices:p.prices,manualDelivery:p.manualDelivery===true};value=JSON.stringify(draft);
 }else if(path==='/catalog/restore'){value=row.published;}else if(path==='/catalog/publish'){
  if(b.confirm!==true)fail('CONFIRM_PUBLICATION');
  const result=await env.DB.batch([
   env.DB.prepare('UPDATE zx_r_catalog_editor SET published=draft,revision=revision+1 WHERE id=1 AND revision=?').bind(b.revision),
   env.DB.prepare('INSERT INTO zx_r_catalog_versions(id,config,actor) SELECT ?,published,? FROM zx_r_catalog_editor WHERE id=1 AND changes()>0').bind(crypto.randomUUID(),user.id)
  ]);if(!result[0].meta.changes)fail('REVISION_CONFLICT',409);return json({ok:true,revision:b.revision+1});
 }else return null;
 const result=await env.DB.prepare('UPDATE zx_r_catalog_editor SET draft=?,revision=revision+1 WHERE id=1 AND revision=?').bind(value,b.revision).run();if(!result.meta.changes)fail('REVISION_CONFLICT',409);return json({ok:true,revision:b.revision+1});
}
export async function effectiveLegacy(env,legacy){const {products}=await catalogue(env,legacy);return legacy.flatMap(p=>{const edit=products.find(x=>x.id===p[0]);return edit?.active?[[p[0],edit.name,p[2],p[3],p[4],edit.prices,p[6]]]:[]});}
