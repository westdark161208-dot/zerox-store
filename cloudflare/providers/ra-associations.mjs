import {readRecargasAmerica} from './recargas-america.mjs';
import {raMapping} from '../diamonds/recargas-america.mjs';
export const raBases=Object.freeze([{total:110,base:100,bonus:10},{total:341,base:310,bonus:31},{total:572,base:520,bonus:52},{total:1166,base:1060,bonus:106},{total:2398,base:2180,bonus:218},{total:6160,base:5600,bonus:560}]);
export function matchesDiamondPack(item,base){
 const numbers=String(item.name||'').match(/\d[\d.,]*/g)||[];
 return item.type==='recharge'&&typeof item.sku==='string'&&!!item.sku.trim()&&/diamant|diamond/i.test(item.name)&&numbers.some(n=>Number(n.replace(/[.,]/g,''))===base)&&/\+\s*10\s*%/i.test(item.name)&&item.requiredFields?.length===1&&['manual_id','player_id'].includes(item.requiredFields[0])&&Number(item.price)>0;
}
const external=env=>typeof env.RA_DIAMOND_PACKS==='string'&&env.RA_DIAMOND_PACKS.trim()!==''&&env.RA_DIAMOND_PACKS.trim()!=='{}';
async function rows(db){if(!db)return [];const exists=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_ra_pack_associations'").first();return exists?(await db.prepare('SELECT * FROM zx_ra_pack_associations ORDER BY total').all()).results:[];}
// Owner confirmed US coverage and the store's 10% totals. Resolve actual live references,
// never guessed IDs or example SKUs. Explicit saved/Cloudflare mappings take priority.
export function automaticUsMapping(env,items){
 if(env.RA_AUTO_ASSOCIATE_US!=='true')return {};
 const map={};
 for(const pack of raBases){
  const found=items.filter(i=>matchesDiamondPack(i,pack.base));
  if(found.length!==1)continue;
  const item=found[0];
  if(items.filter(i=>i.id===item.id).length!==1||items.filter(i=>i.sku===item.sku).length!==1)continue;
  map[pack.total]={productId:item.id,sku:item.sku,name:item.name,baseDiamonds:pack.base,bonusDiamonds:pack.bonus,regions:['US'],playerField:item.requiredFields[0],bonusEvidence:'Owner confirmed US coverage; live catalog explicitly advertises '+pack.base+' diamonds +10% bonus. Reference: '+item.sku};
 }
 raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify(map)});return map;
}
export async function resolvedRaEnvironment(env,fetcher=fetch,items=null){
 if(external(env))return env;
 const saved=await rows(env.DB);let automatic={};
 if(env.RA_AUTO_ASSOCIATE_US==='true'){
  // An unavailable catalog must not disable balance reads or expose an upstream error.
  // A fresh preflight still blocks every purchase when quotes cannot be verified.
  try{automatic=automaticUsMapping(env,items||await readRecargasAmerica(env,'catalog',fetcher));}catch{}
 }
 const map={...automatic,...Object.fromEntries(saved.map(r=>[String(r.total),JSON.parse(r.entry_json)]))};
 if(!Object.keys(map).length)return env;
 raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify(map)});
 return {...env,RA_DIAMOND_PACKS:JSON.stringify(map)};
}
async function schema(db){await db.prepare('CREATE TABLE IF NOT EXISTS zx_ra_pack_associations(total INTEGER PRIMARY KEY,entry_json TEXT NOT NULL,revision INTEGER NOT NULL,updated_by TEXT NOT NULL,updated_at TEXT NOT NULL)').run();await db.prepare('CREATE TABLE IF NOT EXISTS zx_ra_pack_association_history(id TEXT PRIMARY KEY,total INTEGER NOT NULL,revision INTEGER NOT NULL,entry_json TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(total,revision))').run();}
export async function associationRoute(request,env,url,user,reply,fetcher=fetch){
 if(!user?.isFounder||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 try{
  if(request.method==='GET'){
   const [items,saved]=await Promise.all([readRecargasAmerica(env,'catalog',fetcher),rows(env.DB)]);
   const map=raMapping(await resolvedRaEnvironment(env,fetcher,items));
   return reply({ok:true,managedExternally:external(env),bases:raBases,catalog:items.filter(p=>raBases.some(b=>matchesDiamondPack(p,b.base))),associations:raBases.map(b=>({total:b.total,revision:saved.find(r=>r.total===b.total)?.revision||0,entry:map[b.total]||null})),purchasesEnabled:false});
  }
  if(request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(external(env))return reply({ok:false,error:'RA_MAPPING_MANAGED_EXTERNALLY'},409);
  const raw=await request.text();if(raw.length>3000)return reply({ok:false,error:'INVALID_ASSOCIATION'},400);
  let b;try{b=JSON.parse(raw)}catch{return reply({ok:false,error:'INVALID_ASSOCIATION'},400)}
  const pack=raBases.find(p=>p.total===b.total);
  if(!pack||!Number.isSafeInteger(b.productId)||b.productId<1||!Number.isSafeInteger(b.revision)||b.revision<0||b.confirmed!==true||!Array.isArray(b.regions)||!b.regions.length||b.regions.length>10||b.regions.some(r=>typeof r!=='string'||!/^[A-Z]{2,5}$/.test(r))||typeof b.bonusEvidence!=='string'||b.bonusEvidence.trim().length<15||b.bonusEvidence.length>600)return reply({ok:false,error:'INVALID_ASSOCIATION'},400);
  const matches=(await readRecargasAmerica(env,'catalog',fetcher)).filter(i=>i.id===b.productId),item=matches[0];
  if(matches.length!==1||!matchesDiamondPack(item,pack.base))return reply({ok:false,error:'RA_DIAMOND_PRODUCT_REQUIRED'},400);
  const entry={productId:item.id,sku:item.sku,name:item.name,baseDiamonds:pack.base,bonusDiamonds:pack.bonus,regions:[...new Set(b.regions)],playerField:item.requiredFields[0],bonusEvidence:b.bonusEvidence.trim()};
  raMapping({...env,RA_DIAMOND_PACKS:JSON.stringify({[pack.total]:entry})});
  await schema(env.DB);const old=await env.DB.prepare('SELECT revision FROM zx_ra_pack_associations WHERE total=?').bind(pack.total).first();if((old?.revision||0)!==b.revision)return reply({ok:false,error:'ASSOCIATION_CONFLICT'},409);
  const at=new Date().toISOString(),id=crypto.randomUUID(),revision=b.revision+1,encoded=JSON.stringify(entry);
  const result=await env.DB.batch([
   env.DB.prepare('INSERT INTO zx_ra_pack_associations VALUES(?,?,?,?,?) ON CONFLICT(total) DO UPDATE SET entry_json=excluded.entry_json,revision=excluded.revision,updated_by=excluded.updated_by,updated_at=excluded.updated_at WHERE zx_ra_pack_associations.revision=?').bind(pack.total,encoded,revision,user.id,at,b.revision),
   env.DB.prepare('INSERT INTO zx_ra_pack_association_history SELECT ?,total,revision,entry_json,updated_by,updated_at FROM zx_ra_pack_associations WHERE total=? AND revision=? AND entry_json=? AND updated_by=? AND updated_at=? ON CONFLICT(total,revision) DO NOTHING').bind(id,pack.total,revision,encoded,user.id,at)
  ]);
  if(!result[0].meta.changes)return reply({ok:false,error:'ASSOCIATION_CONFLICT'},409);
  return reply({ok:true,total:pack.total,revision,entry,purchasesEnabled:false});
 }catch(e){return reply({ok:false,error:/^RA_(READ_DISABLED|KEY_MISSING|UNAVAILABLE|INVALID_RESPONSE|HTTP_\d{3}|MAPPING_INVALID)$/.test(e.message)?e.message:'ASSOCIATION_UNAVAILABLE'},503);}
}
