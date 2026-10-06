// Customer-facing projections deliberately exclude provider names, costs and recipes.
const ROOT='/api/orders';
async function tables(db){return new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));}
async function schema(db){await db.prepare(`CREATE TABLE IF NOT EXISTS zx_order_references (order_key TEXT PRIMARY KEY,user_id TEXT NOT NULL,rating INTEGER NOT NULL,comment TEXT NOT NULL,image_key TEXT,public INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();}
function sources(t){const a=[];if(t.has('zx_diamond_orders')&&t.has('zx_product_payments'))a.push(`SELECT 'diamond' kind,o.id,o.user_id,o.diamonds||' diamantes Free Fire' product,o.player_id playerId,CASE WHEN o.state='COMPLETED' AND (o.delivered<>o.diamonds OR o.paid_at IS NULL) THEN 'REQUIRES_REVIEW' ELSE o.state END state,o.sale_price_cents amountCents,o.created_at createdAt,o.updated_at updatedAt,p.method,p.state paymentState,o.snapshot_json snapshot FROM zx_diamond_orders o JOIN zx_product_payments p ON p.order_id=o.id`);if(t.has('zx_r_orders'))a.push(`SELECT 'reseller' kind,id,user_id,product_name product,uid playerId,CASE WHEN status='completed' THEN 'COMPLETED' ELSE 'PROCESSING' END state,total amountCents,created_at createdAt,COALESCE(completed_at,created_at) updatedAt,'wallet' method,'paid' paymentState,'{}' snapshot FROM zx_r_orders`);return a;}
function project(r){let plan={};try{plan=JSON.parse(r.snapshot).fulfillmentPlan||{};}catch{}return {key:r.kind+':'+r.id,id:r.id,kind:r.kind,folio:'ZX-'+r.id,product:r.product,playerId:r.playerId,state:r.state,createdAt:r.createdAt,updatedAt:r.updatedAt,completed:r.state==='COMPLETED'&&r.paymentState==='paid',method:['ra-funds','wallet'].includes(r.method)?'Saldo de cuenta':'Pago en línea',...(r.method==='ra-funds'?{amountMicros:plan.totalMicros,currency:plan.currency||'USD'}:{amountCents:r.amountCents,currency:'MXN'})};}
async function own(db,t,key,userId){const parts=sources(t);if(!parts.length)return null;const r=await db.prepare(`SELECT * FROM (${parts.join(' UNION ALL ')}) WHERE kind||':'||id=? AND user_id=?`).bind(key,userId).first();return r?project(r):null;}
export async function orderHistoryRoute(request,env,url,user,json){
 const reply=(b,s=200)=>{const r=json(b,s);r.headers?.set('Cache-Control','private, no-store');return r;};
 const t=await tables(env.DB),parts=sources(t);
 if(url.pathname===ROOT+'/activity'&&request.method==='GET'){
  if(!parts.length)return reply({ok:true,items:[]});
  const rows=(await env.DB.prepare(`SELECT kind,id,user_id,product,updatedAt FROM (${parts.join(' UNION ALL ')}) WHERE state='COMPLETED' AND paymentState='paid' AND julianday(updatedAt)>=julianday('now','-7 days') ORDER BY julianday(updatedAt) DESC,id DESC LIMIT 15`).all()).results;
  // Public handle only; respect private avatar visibility. Never return account IDs or player IDs.
  const items=[];for(const r of rows){const identity=t.has('zx_users')?await env.DB.prepare(t.has('zx_profile_style')?"SELECT u.username,CASE WHEN s.is_public=1 THEN s.avatar ELSE NULL END avatar FROM zx_users u LEFT JOIN zx_profile_style s ON s.user_id=u.id WHERE u.id=? AND u.status='active'":"SELECT username,NULL avatar FROM zx_users WHERE id=? AND status='active'").bind(r.user_id).first():null;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(r.kind+':'+r.id));items.push({event:Array.from(new Uint8Array(hash)).map(n=>n.toString(16).padStart(2,'0')).join(''),customer:identity?.username?'@'+identity.username:'Un cliente',avatar:identity?.avatar||null,product:r.product,completedAt:r.updatedAt});}
  const references=t.has('zx_order_references')?(await env.DB.prepare(`SELECT r.rating,r.comment,r.created_at AS createdAt FROM zx_order_references r JOIN (${parts.join(' UNION ALL ')}) o ON r.order_key=o.kind||':'||o.id AND r.user_id=o.user_id WHERE r.public=1 AND o.state='COMPLETED' AND o.paymentState='paid' ORDER BY r.created_at DESC LIMIT 6`).all()).results:[];
  return reply({ok:true,items,references});
 }
 if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 if(url.pathname===ROOT+'/me'&&request.method==='GET'){
  const page=Math.max(0,Math.min(10000,parseInt(url.searchParams.get('page'))||0)),search=(url.searchParams.get('q')||'').trim().replace(/^ZX-/i,'').slice(0,100);
  const rows=parts.length?(await env.DB.prepare(`SELECT * FROM (${parts.join(' UNION ALL ')}) WHERE user_id=? AND (?='' OR id=?) ORDER BY julianday(createdAt) DESC,id DESC LIMIT 26 OFFSET ?`).bind(user.id,search,search,page*25).all()).results:[];
  const items=rows.slice(0,25).map(project);
  if(t.has('zx_order_references'))for(const item of items)item.reference=await env.DB.prepare('SELECT rating,comment,public,image_key IS NOT NULL AS hasImage FROM zx_order_references WHERE order_key=? AND user_id=?').bind(item.key,user.id).first();
  return reply({ok:true,items,hasMore:rows.length>25});
 }
 const key=url.searchParams.get('order')||'';
 if(!/^(diamond|reseller):[a-zA-Z0-9-]{1,80}$/.test(key))return reply({ok:false,error:'INVALID_ORDER'},400);
 const order=await own(env.DB,t,key,user.id);if(!order)return reply({ok:false,error:'NOT_FOUND'},404);
 if(url.pathname===ROOT+'/reference/image'&&request.method==='GET'){
  const ref=t.has('zx_order_references')?await env.DB.prepare('SELECT image_key FROM zx_order_references WHERE order_key=? AND user_id=?').bind(key,user.id).first():null;
  const object=ref?.image_key&&env.MEDIA?await env.MEDIA.get(ref.image_key):null;if(!object)return reply({ok:false,error:'NOT_FOUND'},404);
  const headers=new Headers(reply({}).headers);headers.set('Content-Type',object.httpMetadata?.contentType||'image/jpeg');headers.set('X-Content-Type-Options','nosniff');return new Response(object.body,{headers});
 }
 if(url.pathname!==ROOT+'/reference'||request.method!=='POST')return reply({ok:false,error:'NOT_FOUND'},404);
 if(!order.completed)return reply({ok:false,error:'ORDER_NOT_COMPLETED'},409);
 if(Number(request.headers.get('Content-Length'))>3000000)return reply({ok:false,error:'IMAGE_TOO_LARGE'},413);
 const raw=await request.text();if(raw.length>3000000)return reply({ok:false,error:'IMAGE_TOO_LARGE'},413);
 let b;try{b=JSON.parse(raw);}catch{return reply({ok:false,error:'INVALID_REFERENCE'},400);}
 if(!Number.isInteger(b.rating)||b.rating<1||b.rating>5||typeof b.comment!=='string'||!b.comment.trim()||b.comment.length>1000||typeof b.public!=='boolean')return reply({ok:false,error:'INVALID_REFERENCE'},400);
 let imageKey=null;
 if(b.image){
  const match=typeof b.image==='string'&&b.image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)return reply({ok:false,error:'INVALID_IMAGE'},400);
  let bytes;try{bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));}catch{return reply({ok:false,error:'INVALID_IMAGE'},400);}
  const valid=match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:match[1]==='png'?[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n):new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
  if(!valid||bytes.length<12||bytes.length>2000000)return reply({ok:false,error:'INVALID_IMAGE'},400);
  if(!env.MEDIA)return reply({ok:false,error:'UPLOAD_UNAVAILABLE'},503);
  imageKey='private-references/'+crypto.randomUUID();await env.MEDIA.put(imageKey,bytes,{httpMetadata:{contentType:'image/'+match[1]}});
 }
 await schema(env.DB);const old=await env.DB.prepare('SELECT image_key FROM zx_order_references WHERE order_key=? AND user_id=?').bind(key,user.id).first();
 try{await env.DB.prepare(`INSERT INTO zx_order_references(order_key,user_id,rating,comment,image_key,public) VALUES(?,?,?,?,?,?) ON CONFLICT(order_key) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,image_key=COALESCE(excluded.image_key,zx_order_references.image_key),public=excluded.public WHERE zx_order_references.user_id=excluded.user_id`).bind(key,user.id,b.rating,b.comment.trim(),imageKey,b.public?1:0).run();}catch(e){if(imageKey)await env.MEDIA.delete(imageKey);throw e;}
 if(imageKey&&old?.image_key)await env.MEDIA.delete(old.image_key);
 return reply({ok:true});
}
