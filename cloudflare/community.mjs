import {tables,sources,own} from './order-history.mjs';
const ROOT='/api/community';
async function schema(db){await db.prepare(`CREATE TABLE IF NOT EXISTS zx_reviews(id TEXT PRIMARY KEY,order_key TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10),comment TEXT NOT NULL,media_json TEXT NOT NULL DEFAULT '[]',public INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();}
export function decodeReviewMedia(input){
 if(!Array.isArray(input)||input.length>5)throw Error('INVALID_MEDIA');let total=0;
 return input.map(v=>{const m=typeof v==='string'&&v.match(/^data:(image\/(?:jpeg|png|webp)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)$/);if(!m)throw Error('INVALID_MEDIA');let bytes;try{bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));}catch{throw Error('INVALID_MEDIA');}const mime=m[1],txt=(a,b)=>new TextDecoder().decode(bytes.slice(a,b));const valid=mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==='image/png'?[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n):mime==='image/webp'?txt(0,4)==='RIFF'&&txt(8,12)==='WEBP':mime==='video/mp4'?txt(4,8)==='ftyp':[26,69,223,163].every((n,i)=>bytes[i]===n);
 total+=bytes.length;if(!valid||bytes.length<12||bytes.length>(mime.startsWith('video')?8000000:2000000)||total>12000000)throw Error('INVALID_MEDIA');return {bytes,mime};});
}
async function identity(db,t,id){if(!t.has('zx_users'))return {username:'Cliente',avatar:null};return await db.prepare(t.has('zx_profile_style')?`SELECT u.username,CASE WHEN s.is_public=1 THEN s.avatar ELSE NULL END avatar FROM zx_users u LEFT JOIN zx_profile_style s ON s.user_id=u.id WHERE u.id=? AND u.status='active'`:`SELECT username,NULL avatar FROM zx_users WHERE id=? AND status='active'`).bind(id).first()||{username:'Cliente',avatar:null};}
export async function communityRoute(request,env,url,user,json){
 const reply=(b,s=200)=>{const r=json(b,s);r.headers.set('Cache-Control','private, no-store');return r;};
 const t=await tables(env.DB),parts=sources(t),orders=parts.length?'('+parts.join(' UNION ALL ')+')':null;
 const validOrders=orders?`${orders} o ON r.order_key=o.kind||':'||o.id AND r.user_id=o.user_id AND o.state='COMPLETED' AND o.paymentState='paid'`:null;
 if(url.pathname===ROOT+'/reviews'&&request.method==='GET'){
  const page=Math.max(0,Math.min(1000,parseInt(url.searchParams.get('page'))||0));
  const sets=[];
  if(t.has('zx_reviews')&&orders)sets.push(`SELECT r.id,r.user_id,r.rating,r.comment,r.media_json,r.created_at FROM zx_reviews r JOIN ${validOrders} WHERE r.public=1`);
  // Historical consent covered anonymous text/stars only. Never make old private images public.
  if(t.has('zx_order_references')&&orders)sets.push(`SELECT r.order_key id,NULL user_id,r.rating*2 rating,r.comment,'[]' media_json,r.created_at FROM zx_order_references r JOIN ${validOrders} WHERE r.public=1 ${t.has('zx_reviews')?"AND NOT EXISTS(SELECT 1 FROM zx_reviews n WHERE n.order_key=r.order_key)":""}`);
  const rows=sets.length?(await env.DB.prepare(`SELECT * FROM (${sets.join(' UNION ALL ')}) ORDER BY created_at DESC,id DESC LIMIT 13 OFFSET ?`).bind(page*12).all()).results:[];
  const items=[];for(const r of rows.slice(0,12)){const id=await identity(env.DB,t,r.user_id);items.push({id:r.user_id?r.id:null,username:id.username,avatar:id.avatar,rating:r.rating,comment:r.comment,createdAt:r.created_at,verified:true,media:JSON.parse(r.media_json).map((m,i)=>({type:m.mime,url:ROOT+'/media/'+r.id+'/'+i}))});}
  return reply({ok:true,items,hasMore:rows.length>12});
 }
 const media=url.pathname.match(/^\/api\/community\/media\/([a-f0-9-]{36})\/([0-4])$/);
 if(media&&request.method==='GET'){
  const r=t.has('zx_reviews')&&orders?await env.DB.prepare(`SELECT r.media_json FROM zx_reviews r JOIN ${validOrders} WHERE r.id=? AND (r.public=1 OR r.user_id=?)`).bind(media[1],user?.id||'').first():null;
  const file=r&&JSON.parse(r.media_json)[Number(media[2])],object=file&&env.MEDIA?await env.MEDIA.get(file.key):null;if(!object)return reply({ok:false,error:'NOT_FOUND'},404);const headers=new Headers(reply({}).headers);headers.set('Content-Type',file.mime);headers.set('X-Content-Type-Options','nosniff');headers.set('Content-Security-Policy',"default-src 'none'; sandbox");return new Response(object.body,{headers});
 }
 if(url.pathname===ROOT+'/top'&&request.method==='GET'){
  const count=orders?Number((await env.DB.prepare(`SELECT COUNT(*) n FROM ${orders} WHERE state='COMPLETED' AND paymentState='paid' AND method NOT IN ('ra','sf','ra-funds')`).first()).n):0;
  if(count<100)return reply({ok:true,unlocked:false,completedSales:count,requiredSales:100,items:[]});
  const period=['day','week','month','year'].includes(url.searchParams.get('period'))?url.searchParams.get('period'):'month',days={day:1,week:7,month:30,year:365}[period];
  const rows=(await env.DB.prepare(`SELECT user_id,COUNT(*) purchases,SUM(CASE WHEN kind='diamond' THEN CAST(product AS INTEGER) ELSE 0 END) diamonds FROM ${orders} WHERE state='COMPLETED' AND paymentState='paid' AND method NOT IN ('ra','sf','ra-funds') AND julianday(updatedAt)>=julianday('now',?) GROUP BY user_id ORDER BY diamonds DESC,purchases DESC,user_id LIMIT 20`).bind('-'+days+' days').all()).results;
  const items=[];for(const r of rows){const id=await identity(env.DB,t,r.user_id);items.push({username:id.username,avatar:id.avatar,purchases:r.purchases,diamonds:r.diamonds});}return reply({ok:true,unlocked:true,completedSales:count,requiredSales:100,period,items});
 }
 if(url.pathname!==ROOT+'/review')return reply({ok:false,error:'NOT_FOUND'},404);
 if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 const key=url.searchParams.get('order')||'';if(!/^(diamond|service|bundle|reseller):[a-zA-Z0-9-]{1,80}$/.test(key))return reply({ok:false,error:'INVALID_ORDER'},400);
 const order=await own(env.DB,t,key,user.id);if(!order)return reply({ok:false,error:'NOT_FOUND'},404);if(!order.completed)return reply({ok:false,error:'ORDER_NOT_COMPLETED'},409);
 if(request.method==='GET'){const review=t.has('zx_reviews')?await env.DB.prepare('SELECT rating,comment,public FROM zx_reviews WHERE order_key=? AND user_id=?').bind(key,user.id).first():null;return reply({ok:true,review});}
 if(request.method!=='POST')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 if(Number(request.headers.get('Content-Length'))>17000000)return reply({ok:false,error:'MEDIA_TOO_LARGE'},413);
 const raw=await request.text();if(raw.length>17000000)return reply({ok:false,error:'MEDIA_TOO_LARGE'},413);
 let b,files;try{b=JSON.parse(raw);files=decodeReviewMedia(b.media||[]);}catch{return reply({ok:false,error:'INVALID_MEDIA'},400);}
 if(!Number.isInteger(b.rating)||b.rating<1||b.rating>10||typeof b.comment!=='string'||!b.comment.trim()||b.comment.length>1500||typeof b.public!=='boolean')return reply({ok:false,error:'INVALID_REVIEW'},400);
 if(files.length&&!env.MEDIA)return reply({ok:false,error:'UPLOAD_UNAVAILABLE'},503);
 await schema(env.DB);const old=await env.DB.prepare('SELECT id,media_json FROM zx_reviews WHERE order_key=? AND user_id=?').bind(key,user.id).first();const id=old?.id||crypto.randomUUID(),uploaded=[];
 try{for(const f of files){const key='review-media/'+crypto.randomUUID();await env.MEDIA.put(key,f.bytes,{httpMetadata:{contentType:f.mime}});uploaded.push({key,mime:f.mime});}
 const kept=files.length||b.removeMedia===true?uploaded:JSON.parse(old?.media_json||'[]');
 await env.DB.prepare(`INSERT INTO zx_reviews(id,order_key,user_id,rating,comment,media_json,public) VALUES(?,?,?,?,?,?,?) ON CONFLICT(order_key) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,media_json=excluded.media_json,public=excluded.public WHERE zx_reviews.user_id=excluded.user_id`).bind(id,key,user.id,b.rating,b.comment.trim(),JSON.stringify(kept),b.public?1:0).run();
 }catch{for(const f of uploaded)await env.MEDIA.delete(f.key);return reply({ok:false,error:'SAVE_FAILED'},503);}
 // Old objects are retained privately so simultaneous edits cannot delete each other's media.
 return reply({ok:true,id});
}
