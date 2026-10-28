import {readRaFounderService} from '../providers/ra-admin-service.mjs';
import {editorSchema} from '../editor/catalog.mjs';
import {fail} from './accounts.mjs';
// Stable IDs make imports repeatable without overwriting founder edits.
async function stable(value){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));const h=[...bytes.slice(0,16)].map(v=>v.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export function raSection(name){for(const label of ['Free Fire','Blood Strike','PUBG Mobile','Delta Force','Arena Breakout','BLEACH','Crossfire','Roblox','Fortnite','Call of Duty','Minecraft','Mobile Legends','Honor of Kings','Genshin Impact','Honkai','Valorant','League of Legends','Netflix','Disney','Spotify','Xbox','PlayStation','Steam'])if(name.toLowerCase().includes(label.toLowerCase()))return label;return 'Recargas América · Otros';}
export async function importRa(env,user,b){
 if(!user?.isFounder)fail('FORBIDDEN',403);
 if(!Number.isFinite(b.mxnPerUsd)||b.mxnPerUsd<=0||b.mxnPerUsd>1000||!Number.isFinite(b.markupPercent)||b.markupPercent<0||b.markupPercent>1000)fail('INVALID_EXCHANGE_OR_MARKUP');
 await editorSchema(env.DB);
 const row=await env.DB.prepare('SELECT * FROM zx_store_editor WHERE id=1').first();
 if(b.storeRevision!==row.revision)fail('REVISION_CONFLICT',409);
 let source;try{source=await readRaFounderService(env,'catalog')}catch{fail('RA_CATALOG_UNAVAILABLE',503)}
 const draft=JSON.parse(row.draft),published=JSON.parse(row.published),added=[];
 for(const item of source){
  const section=raSection(item.name),block='custom:block:'+await stable('ra-section:'+section),id='custom:product:'+await stable('ra-product:'+item.id);
  if(!draft[block]&&!published[block])draft[block]={id:block,name:section,description:'Catálogo Recargas América',character:'RECARGAS AMÉRICA',priceCents:0,active:true,image:'',category:'',region:'',position:0};
  if(draft[id]||published[id])continue;
  const cents=Math.round(Number(item.price)*b.mxnPerUsd*(1+b.markupPercent/100)*100);
  if(!Number.isSafeInteger(cents)||cents<1||cents>100000000)fail('INVALID_PRODUCT_PRICE');
  const fields=item.requiredFields.filter(x=>!/password|secret|token|contrase/i.test(x));
  const p={id,name:item.name.slice(0,100),description:('Entrega manual por administración. Datos requeridos: '+(fields.join(', ')||'consultar con soporte')+'. Referencia RA: '+item.id).slice(0,1500),character:'RA '+item.id,priceCents:cents,active:true,image:'',category:block,region:'',position:0};
  draft[id]=p;added.push({id,name:p.name,section,priceCents:cents});
 }
 if(b.preview===true)return {ok:true,storeRevision:row.revision,providerCount:source.length,products:added};
 if(b.confirm!==true)fail('CONFIRM_IMPORT');
 const result=await env.DB.prepare('UPDATE zx_store_editor SET draft=?,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(JSON.stringify(draft),user.id,b.storeRevision).run();
 if(!result.meta.changes)fail('REVISION_CONFLICT',409);
 return {ok:true,added:added.length,storeRevision:row.revision+1,draftOnly:true};
}
