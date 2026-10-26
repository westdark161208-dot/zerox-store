import '../resellers-theme.js';
const defaults=()=>ZXResellerTheme.defaults();
export function validateAppearance(input){
 if(!input||typeof input!=='object')throw Error('INVALID_APPEARANCE');
 const out=defaults();
 for(const k of Object.keys(out.colors)){if(!/^#[0-9a-f]{6}$/i.test(input.colors?.[k]||''))throw Error('INVALID_COLOR');out.colors[k]=input.colors[k];}
 if(!['off','soft','medium','intense'].includes(input.glow))throw Error('INVALID_GLOW');out.glow=input.glow;
 for(const k of ZXResellerTheme.slots){const x=input.images?.[k];if(!x||typeof x.src!=='string'||!(x.src===''||x.src==='./assets/resellers-reference.png'||/^\/api\/resellers\/media\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(x.src)))throw Error('INVALID_IMAGE');if(!['center','top','bottom','left','right'].includes(x.position)||!['cover','contain'].includes(x.fit))throw Error('INVALID_IMAGE_POSITION');for(const p of ['shade','opacity','light'])if(!Number.isFinite(x[p])||x[p]<0||x[p]>1)throw Error('INVALID_IMAGE_EFFECT');out.images[k]={src:x.src,position:x.position,fit:x.fit,shade:x.shade,opacity:x.opacity,light:x.light};}
 return out;
}
export async function appearanceSchema(env){
 await env.DB.batch([
 env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_r_appearance(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL DEFAULT 0,draft TEXT,published TEXT,version_id TEXT)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_r_appearance_versions(id TEXT PRIMARY KEY,config TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_r_media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_r_settings(id INTEGER PRIMARY KEY CHECK(id=1),instructions TEXT NOT NULL DEFAULT '',actor TEXT,updated_at TEXT)"),
 env.DB.prepare('INSERT OR IGNORE INTO zx_r_appearance(id) VALUES(1)'),env.DB.prepare('INSERT OR IGNORE INTO zx_r_settings(id) VALUES(1)')]);
}
// Parse actual image headers, never rely on browser-supplied type/dimensions.
export function imageInfo(a){const v=new DataView(a.buffer,a.byteOffset,a.byteLength),str=(s,n)=>String.fromCharCode(...a.slice(s,s+n));let width,height,mime,ext;
 if(a.length>=24&&str(0,8)==='\x89PNG\r\n\x1a\n'&&str(12,4)==='IHDR'){width=v.getUint32(16);height=v.getUint32(20);mime='image/png';ext='png';}
 else if(a.length>12&&a[0]===255&&a[1]===216){let i=2;while(i+4<a.length){if(a[i++]!==255)break;let marker=a[i++];if(marker===216||marker===217)continue;const n=v.getUint16(i);if(n<2||i+n>a.length)break;if([192,193,194].includes(marker)&&n>=8){height=v.getUint16(i+3);width=v.getUint16(i+5);mime='image/jpeg';ext='jpg';break;}i+=n;}}
 else if(a.length>=30&&str(0,4)==='RIFF'&&str(8,4)==='WEBP'&&v.getUint32(4,true)+8===a.length){const type=str(12,4);if(type==='VP8X'){width=1+a[24]+(a[25]<<8)+(a[26]<<16);height=1+a[27]+(a[28]<<8)+(a[29]<<16);}else if(type==='VP8 '&&a[23]===157&&a[24]===1&&a[25]===42){width=v.getUint16(26,true)&16383;height=v.getUint16(28,true)&16383;}else if(type==='VP8L'&&a[20]===47){const bits=v.getUint32(21,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;}mime='image/webp';ext='webp';}
 if(!width||!height||width>4096||height>4096||width*height>12000000)throw Error('INVALID_IMAGE_DIMENSIONS');return {width,height,mime,ext};
}
async function boundedForm(request){const reader=request.body?.getReader();if(!reader)throw Error('INVALID_MEDIA');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4500000){await reader.cancel();throw Error('FILE_TOO_LARGE')}chunks.push(value)}const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}return new Request(request.url,{method:'POST',headers:request.headers,body}).formData();}
export async function appearanceRoute(request,env,url,user,json){
 const admin=url.pathname.startsWith('/api/admin/');const path=url.pathname.replace(admin?'/api/admin/resellers':'/api/resellers','');
 if(!['/appearance','/appearance/draft','/appearance/publish','/appearance/restore','/media','/settings'].includes(path)&&!path.startsWith('/media/'))return null;
 if(admin&&(user?.isFounder!==true||user.status!=='active'))return json({ok:false,error:'FORBIDDEN'},403);
 if(!admin&&request.method!=='GET')return json({ok:false,error:'NOT_FOUND'},404);
 await appearanceSchema(env);
 if(!admin&&path.startsWith('/media/')){const key=path.slice(7);if(!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))return json({ok:false},404);const file=await env.MEDIA?.get('resellers/'+key);if(!file)return json({ok:false},404);const response=json({});return new Response(file.body,{headers:{...Object.fromEntries(response.headers),'Content-Type':file.httpMetadata.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}
 if(path==='/appearance'&&request.method==='GET'){const row=await env.DB.prepare('SELECT * FROM zx_r_appearance WHERE id=1').first();if(!admin)return json({ok:true,config:row.published?JSON.parse(row.published):defaults()});const versions=await env.DB.prepare('SELECT id,actor,created_at FROM zx_r_appearance_versions ORDER BY created_at DESC,rowid DESC LIMIT 30').all();return json({ok:true,revision:row.revision,draft:row.draft?JSON.parse(row.draft):row.published?JSON.parse(row.published):defaults(),published:row.published?JSON.parse(row.published):defaults(),versions:versions.results});}
 if(path==='/settings'&&request.method==='GET'){const row=await env.DB.prepare('SELECT instructions FROM zx_r_settings WHERE id=1').first();return json({ok:true,instructions:row.instructions});}
 if(admin&&path==='/media'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT id,width,height,created_at FROM zx_r_media ORDER BY created_at DESC LIMIT 100').all();return json({ok:true,images:rows.results});}
 if(!admin||request.method!=='POST')return json({ok:false,error:'NOT_FOUND'},404);
 if(path==='/media'){
 if(!env.MEDIA)return json({ok:false,error:'MEDIA_BINDING_NOT_CONFIGURED'},503);
 if(Number(request.headers.get('content-length'))>4500000)return json({ok:false,error:'FILE_TOO_LARGE'},413);
 let form;try{form=await boundedForm(request)}catch(e){return json({ok:false,error:e.message==='FILE_TOO_LARGE'?'FILE_TOO_LARGE':'INVALID_MEDIA'},400)}const file=form.get('file');if(!file||!file.size||file.size>4000000)return json({ok:false,error:'FILE_TOO_LARGE'},400);
 try{const bytes=new Uint8Array(await file.arrayBuffer()),info=imageInfo(bytes);if(file.type!==info.mime)return json({ok:false,error:'INVALID_MEDIA'},400);const key=crypto.randomUUID()+'.'+info.ext;await env.MEDIA.put('resellers/'+key,bytes,{httpMetadata:{contentType:info.mime}});await env.DB.prepare('INSERT INTO zx_r_media(id,mime,width,height,actor) VALUES(?,?,?,?,?)').bind(key,info.mime,info.width,info.height,user.id).run();return json({ok:true,src:'/api/resellers/media/'+key,...info},201);}catch(e){if(e.message.startsWith('INVALID_'))return json({ok:false,error:e.message},400);throw e;}}
 const b=await request.json();
 if(path==='/settings'){if(typeof b.instructions!=='string'||b.instructions.length>3000)return json({ok:false,error:'INVALID_INSTRUCTIONS'},400);await env.DB.prepare('UPDATE zx_r_settings SET instructions=?,actor=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').bind(b.instructions.trim(),user.id).run();return json({ok:true});}
 if(!Number.isSafeInteger(b.revision)||b.revision<0)return json({ok:false,error:'REVISION_REQUIRED'},400);
 if(path==='/appearance/draft'){let config;try{config=validateAppearance(b.config)}catch(e){return json({ok:false,error:e.message},400)}for(const item of Object.values(config.images)){if(item.src.startsWith('/api/')){const row=await env.DB.prepare('SELECT id FROM zx_r_media WHERE id=?').bind(item.src.split('/').pop()).first();if(!row)return json({ok:false,error:'UNKNOWN_IMAGE'},400);}}
 const result=await env.DB.prepare('UPDATE zx_r_appearance SET draft=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(config),b.revision).run();return json({ok:!!result.meta.changes,error:result.meta.changes?null:'REVISION_CONFLICT'},result.meta.changes?200:409);}
 if(path==='/appearance/restore'){const result=await env.DB.prepare('UPDATE zx_r_appearance SET draft=published,revision=revision+1 WHERE id=1 AND revision=?').bind(b.revision).run();return json({ok:!!result.meta.changes,error:result.meta.changes?null:'REVISION_CONFLICT'},result.meta.changes?200:409);}
 if(path==='/appearance/publish'){if(b.confirm!==true)return json({ok:false,error:'CONFIRM_PUBLICATION'},400);const id=crypto.randomUUID();const result=await env.DB.batch([env.DB.prepare('INSERT INTO zx_r_appearance_versions(id,config,actor) SELECT ?,draft,? FROM zx_r_appearance WHERE id=1 AND revision=? AND draft IS NOT NULL').bind(id,user.id,b.revision),env.DB.prepare('UPDATE zx_r_appearance SET published=draft,version_id=?,revision=revision+1 WHERE id=1 AND revision=? AND EXISTS(SELECT 1 FROM zx_r_appearance_versions WHERE id=?)').bind(id,b.revision,id)]);return json({ok:!!result[0].meta.changes,error:result[0].meta.changes?null:'REVISION_CONFLICT'},result[0].meta.changes?200:409);}
 return json({ok:false,error:'NOT_FOUND'},404);
}
