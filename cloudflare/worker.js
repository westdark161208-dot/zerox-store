// Immutable account ID, assigned only after the account owner verifies it.
const FOUNDER_USER_ID = "d8573fe7-331f-4248-a0ad-d99288c9a472";

const PRODUCT_MAP = {
  "ff-110": {
    sixofireProductId: "9149",
    amount: 1
  },
  "ff-340": {
    sixofireProductId: "27107",
    amount: 1
  },
  "ff-572": {
    sixofireProductId: "2622",
    amount: 1
  },
  "ff-1166": {
    sixofireProductId: "5352",
    amount: 1
  },
  "ff-2398": {
    sixofireProductId: "9725",
    amount: 1
  },
  "ff-6160": {
    sixofireProductId: "5317",
    amount: 1
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders
    }
  });
}


function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function digest(v){return b64(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v))))}
async function passwordHash(password,salt=crypto.getRandomValues(new Uint8Array(16)),iterations=100000){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations},key,256);
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}
async function passwordOK(password,stored){
  const p=String(stored||"").split("$");
  if(p.length!==4||p[0]!=="pbkdf2"||!Number.isInteger(Number(p[1]))) return false;
  return await passwordHash(password,unb64(p[2]),Number(p[1]))===stored;
}
function sessionToken(){return b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
async function authSchema(env){
  if(!env.DB) throw new Error("DB_BINDING_NOT_CONFIGURED");
  // Execute schema statements individually. This is more reliable across D1
  // deployments than batching DDL on every auth request.
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS zx_users_username_nocase ON zx_users(username COLLATE NOCASE)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_profiles (user_id TEXT PRIMARY KEY,display_name TEXT,avatar_url TEXT,xp INTEGER NOT NULL DEFAULT 0,level INTEGER NOT NULL DEFAULT 1,FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_profile_style (user_id TEXT PRIMARY KEY,bio TEXT NOT NULL DEFAULT '',favorites TEXT NOT NULL DEFAULT '[]',avatar TEXT NOT NULL DEFAULT '',banner TEXT NOT NULL DEFAULT 'violet',banner_image TEXT NOT NULL DEFAULT '',frame TEXT NOT NULL DEFAULT 'steel',FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_private_contact (user_id TEXT PRIMARY KEY,phone TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
  const styleColumns=await env.DB.prepare("PRAGMA table_info(zx_profile_style)").all();
  if(!styleColumns.results.some(column=>column.name==="is_public")) await env.DB.prepare("ALTER TABLE zx_profile_style ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,revoked_at TEXT,FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
}
async function newSession(env,userId){
  const raw=sessionToken(), tokenHash=await digest(raw), expiresAt=new Date(Date.now()+30*24*60*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO zx_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(),userId,tokenHash,expiresAt).run();
  return {token:raw,expiresAt};
}
async function currentUser(request,env){
  const m=(request.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i);
  if(!m)return null;
  const tokenHash=await digest(m[1].trim());
  const user=await env.DB.prepare("SELECT u.id,u.email,u.username,u.status,u.created_at,p.display_name,p.avatar_url,p.xp,p.level FROM zx_sessions s JOIN zx_users u ON u.id=s.user_id LEFT JOIN zx_profiles p ON p.user_id=u.id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1").bind(tokenHash,new Date().toISOString()).first();
  return user ? {...user,isFounder:!!FOUNDER_USER_ID && user.id===FOUNDER_USER_ID} : null;
}

const CATALOG_SECTIONS = ["accounts", "clans", "honor"];
async function catalogSchema(env) {
  if (!env.DB) throw new Error("DB_BINDING_NOT_CONFIGURED");
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_catalog (id TEXT PRIMARY KEY,section TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price REAL NOT NULL,image_key TEXT,video_key TEXT,active INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}
function catalogRow(row, base) {
  return {
    id: row.id, section: row.section, name: row.name,
    description: row.description, price: row.price, active: Boolean(row.active),
    imageUrl: row.image_key ? `${base}/api/catalog/media/${encodeURIComponent(row.image_key)}` : null,
    videoUrl: row.video_key ? `${base}/api/catalog/media/${encodeURIComponent(row.video_key)}` : null
  };
}
function validCatalog(body) {
  const section = String(body.section || "");
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const price = Number(body.price);
  if (!CATALOG_SECTIONS.includes(section) || !name || name.length > 120 ||
      description.length > 3000 || !Number.isFinite(price) || price < 0 || price > 1000000)
    return null;
  const key = value => value == null || value === "" ? null :
    /^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$/.test(String(value)) ? String(value) : false;
  const imageKey = key(body.imageKey), videoKey = key(body.videoKey);
  if (imageKey === false || videoKey === false ||
      (imageKey && !/\.(jpg|png|webp)$/.test(imageKey)) ||
      (videoKey && !/\.(mp4|webm)$/.test(videoKey))) return null;
  return { section, name, description, price, imageKey, videoKey, active: body.active === true };
}

async function contentSchema(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_streaming (id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',kind TEXT NOT NULL,duration INTEGER NOT NULL,price REAL NOT NULL,stock INTEGER NOT NULL DEFAULT 0,threshold INTEGER NOT NULL DEFAULT 2,image_key TEXT,active INTEGER NOT NULL DEFAULT 0)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_stream_sales (id TEXT PRIMARY KEY,reference TEXT NOT NULL UNIQUE,product_id TEXT NOT NULL,quantity INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_ads (id TEXT PRIMARY KEY,title TEXT NOT NULL,kicker TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',image_key TEXT NOT NULL,target TEXT NOT NULL,position INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 0,starts TEXT,ends TEXT)").run();
}
async function contentRoutes(request,env,url){
 const admin=url.pathname.startsWith('/api/admin/content/');
 if(admin){await authSchema(env);const u=await currentUser(request,env);if(!u||u.status!=='active'||!u.isFounder)return json({ok:false,error:'FORBIDDEN'},403)}
 await contentSchema(env);
 const base=admin?'/api/admin/content/':'/api/content/',path=url.pathname.slice(base.length);
 const media=k=>k?url.origin+'/api/catalog/media/'+encodeURIComponent(k):null;
 if(request.method==='GET'&&path==='streaming'){
 const rows=await env.DB.prepare('SELECT * FROM zx_streaming'+(admin?'': ' WHERE active=1')+' ORDER BY name').all();
 return json({ok:true,products:rows.results.map(p=>({id:p.id,name:p.name,description:p.description,kind:p.kind,duration:p.duration,price:p.price,stock:p.stock,imageUrl:media(p.image_key),...(admin?{imageKey:p.image_key,threshold:p.threshold,active:!!p.active}:{})}))});
 }
 if(request.method==='GET'&&path==='ads'){
 const now=new Date().toISOString();
 const stmt=env.DB.prepare('SELECT * FROM zx_ads'+(admin?'': ' WHERE active=1 AND (starts IS NULL OR starts<=?) AND (ends IS NULL OR ends>?)')+' ORDER BY position,id');
 const rows=await (admin?stmt:stmt.bind(now,now)).all();
 return json({ok:true,ads:rows.results.map(a=>({...a,image:media(a.image_key)}))});
 }
 if(!admin)return json({ok:false,error:'NOT_FOUND'},404);
 if(request.method==='POST'&&path==='sale'){
 const b=await request.json(),quantity=Number(b.quantity),reference=String(b.reference||'').trim();
 if(b.paymentConfirmed!==true||!Number.isInteger(quantity)||quantity<1||quantity>100||reference.length<3||reference.length>100)return json({ok:false,error:'INVALID_SALE'},400);
 const id=crypto.randomUUID();
 try{const result=await env.DB.batch([
 env.DB.prepare('INSERT INTO zx_stream_sales(id,reference,product_id,quantity) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM zx_streaming WHERE id=? AND stock>=?)').bind(id,reference,b.productId,quantity,b.productId,quantity),
 env.DB.prepare('UPDATE zx_streaming SET stock=stock-? WHERE id=? AND EXISTS(SELECT 1 FROM zx_stream_sales WHERE id=?)').bind(quantity,b.productId,id)
 ]);if(!result[0].meta.changes)return json({ok:false,error:'INSUFFICIENT_STOCK'},409)}catch(e){if(String(e.message).toLowerCase().includes('unique'))return json({ok:false,error:'REFERENCE_ALREADY_USED'},409);throw e}
 return json({ok:true,id});
 }
 if(request.method==='POST'&&(path==='streaming'||path==='ads')){
 const b=await request.json(),id=b.id||crypto.randomUUID();
 if(!/^[a-f0-9-]{36}$/.test(id))return json({ok:false,error:'INVALID_ID'},400);
 const key=b.imageKey||null;
 if(key&&!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key))return json({ok:false,error:'INVALID_IMAGE'},400);
 if(path==='streaming'){
 const name=String(b.name||'').trim(),description=String(b.description||'').trim();
 if(!name||name.length>120||description.length>2000||!['account','profile','invite'].includes(b.kind)||!Number.isInteger(b.duration)||b.duration<1||b.duration>730||!Number.isFinite(b.price)||b.price<0||b.price>1000000||!Number.isInteger(b.stock)||b.stock<0||b.stock>10000||!Number.isInteger(b.threshold)||b.threshold<0||b.threshold>10000)return json({ok:false,error:'INVALID_PRODUCT'},400);
 const saved=await env.DB.prepare('INSERT INTO zx_streaming(id,name,description,kind,duration,price,stock,threshold,image_key,active) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,kind=excluded.kind,duration=excluded.duration,price=excluded.price,stock=excluded.stock,threshold=excluded.threshold,image_key=excluded.image_key,active=excluded.active WHERE zx_streaming.stock=?').bind(id,name,description,b.kind,b.duration,b.price,b.stock,b.threshold,key,b.active?1:0,Number.isInteger(b.expectedStock)?b.expectedStock:-1).run();
 if(!saved.meta.changes)return json({ok:false,error:'STOCK_CHANGED_REFRESH_FIRST'},409);
 }else{
 const title=String(b.title||'').trim(),kicker=String(b.kicker||''),description=String(b.description||'');
 const targets=['Streaming','Cuentas','Venta Clanes','Honor de Clanes','Fragmentos','Pases Booyah','Diamantes ilimitados','Diamantes 1 vez'];
 const validDate=d=>!d||(!isNaN(Date.parse(d))&&new Date(d).toISOString()===d);
 if(!title||title.length>120||kicker.length>70||description.length>400||!key||!targets.includes(b.target)||!Number.isInteger(b.position)||b.position<0||b.position>9999||!validDate(b.starts)||!validDate(b.ends)||(b.starts&&b.ends&&b.starts>=b.ends))return json({ok:false,error:'INVALID_AD'},400);
 await env.DB.prepare('INSERT INTO zx_ads(id,title,kicker,description,image_key,target,position,active,starts,ends) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,kicker=excluded.kicker,description=excluded.description,image_key=excluded.image_key,target=excluded.target,position=excluded.position,active=excluded.active,starts=excluded.starts,ends=excluded.ends').bind(id,title,kicker,description,key,b.target,b.position,b.active?1:0,b.starts||null,b.ends||null).run();
 }return json({ok:true,id});
 }
 return json({ok:false,error:'NOT_FOUND'},404);
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      const url = new URL(request.url);
      if(url.pathname.startsWith("/api/content/")||url.pathname.startsWith("/api/admin/content/"))return await contentRoutes(request,env,url);

      if(url.pathname.startsWith("/api/auth/") || url.pathname.startsWith("/api/public-profile/")) await authSchema(env);

      if(url.pathname==="/api/auth/features" && request.method==="GET")return json({ok:true,contact:true,publicProfiles:true});

      const publicHandle=url.pathname.match(/^\/api\/public-profile\/([A-Za-z0-9_.-]{3,24})$/);
      if(publicHandle && request.method==="GET"){
        const row=await env.DB.prepare("SELECT u.id,u.username,u.created_at,p.display_name,p.level,p.xp,s.bio,s.favorites,s.avatar,s.banner,s.banner_image AS bannerImage,s.frame FROM zx_users u JOIN zx_profile_style s ON s.user_id=u.id LEFT JOIN zx_profiles p ON p.user_id=u.id WHERE u.username=? COLLATE NOCASE AND u.status='active' AND s.is_public=1 LIMIT 1").bind(publicHandle[1]).first();
        if(!row)return json({ok:false,error:"NOT_FOUND"},404);
        let favorites=[];try{favorites=JSON.parse(row.favorites||"[]")}catch{}
        return json({ok:true,profile:{username:row.username,displayName:row.display_name||row.username,createdAt:row.created_at,level:row.level||1,xp:row.xp||0,bio:row.bio,favorites,avatar:row.avatar,banner:row.banner,bannerImage:row.bannerImage,frame:row.frame,isFounder:row.id===FOUNDER_USER_ID}});
      }

      if(url.pathname==="/api/auth/username-available" && request.method==="GET"){
        const username=String(url.searchParams.get("username")||"").trim().replace(/^@+/,"");
        if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return json({ok:false,error:"INVALID_USERNAME"},400);
        const existing=await env.DB.prepare("SELECT 1 FROM zx_users WHERE username=? COLLATE NOCASE LIMIT 1").bind(username).first();
        return json({ok:true,available:!existing});
      }

      if(url.pathname==="/api/auth/register" && request.method==="POST"){
        const body=await request.json();
        const email=String(body.email||"").trim().toLowerCase(), username=String(body.username||"").trim().replace(/^@+/,""), password=String(body.password||""), displayName=String(body.displayName||username).trim();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ok:false,error:"INVALID_EMAIL"},400);
        if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) return json({ok:false,error:"INVALID_USERNAME"},400);
        if(password.length<8||password.length>128) return json({ok:false,error:"INVALID_PASSWORD"},400);
        const exists=await env.DB.prepare("SELECT id FROM zx_users WHERE lower(email)=lower(?) OR lower(username)=lower(?) LIMIT 1").bind(email,username).first();
        if(exists) return json({ok:false,error:"ACCOUNT_EXISTS"},409);
        const id=crypto.randomUUID(), hash=await passwordHash(password);
        try{
          await env.DB.prepare("INSERT INTO zx_users(id,email,username,password_hash) VALUES(?,?,?,?)").bind(id,email,username,hash).run();
          await env.DB.prepare("INSERT INTO zx_profiles(user_id,display_name) VALUES(?,?)").bind(id,displayName||username).run();
        }catch(e){
          if(String(e.message||"").toLowerCase().includes("unique")) return json({ok:false,error:"ACCOUNT_EXISTS"},409);
          throw e;
        }
        return json({ok:true,user:{id,email,username,displayName:displayName||username},session:await newSession(env,id)},201);
      }

      if(url.pathname==="/api/auth/username" && request.method==="POST"){
        const user=await currentUser(request,env);
        if(!user || user.status!=="active")return json({ok:false,error:"UNAUTHORIZED"},401);
        const username=String((await request.json()).username||"").trim().replace(/^@+/,"");
        if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return json({ok:false,error:"INVALID_USERNAME"},400);
        if(username.toLowerCase()===user.username.toLowerCase())return json({ok:true,username:user.username});
        const exists=await env.DB.prepare("SELECT id FROM zx_users WHERE username=? COLLATE NOCASE AND id<>? LIMIT 1").bind(username,user.id).first();
        if(exists)return json({ok:false,error:"USERNAME_TAKEN"},409);
        try{await env.DB.prepare("UPDATE zx_users SET username=? WHERE id=?").bind(username,user.id).run();}
        catch(error){if(String(error.message||"").toLowerCase().includes("unique"))return json({ok:false,error:"USERNAME_TAKEN"},409);throw error;}
        return json({ok:true,username});
      }

      if(url.pathname==="/api/auth/profile" && request.method==="POST"){
        const user=await currentUser(request,env);
        if(!user)return json({ok:false,error:"UNAUTHORIZED"},401);
        const body=await request.json();
        const bio=String(body.bio||"").trim(),favorites=body.favorites,avatar=String(body.avatar||""),banner=String(body.banner||"violet"),bannerImage=String(body.bannerImage||""),frame=String(body.frame||"steel"),isPublic=body.isPublic===true;
        if(bio.length>180 || !Array.isArray(favorites) || favorites.length>6 || favorites.some(x=>typeof x!=="string" || !["Free Fire","Streaming","Cuentas","Venta de clanes","Honor de clanes","Revendedores"].includes(x)))return json({ok:false,error:"INVALID_PROFILE"},400);
        if(avatar && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(avatar))return json({ok:false,error:"INVALID_AVATAR"},400);
        if(bannerImage && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(bannerImage))return json({ok:false,error:"INVALID_BANNER"},400);
        if(avatar.length>160000 || bannerImage.length>160000 || avatar.length+bannerImage.length>260000 || !["violet","crimson","electric","custom"].includes(banner) || !["steel","chrome","cobalt","titan","aurora","prism","sovereign"].includes(frame))return json({ok:false,error:"INVALID_PROFILE"},400);
        if(Number(user.level||1)<(["steel","chrome","cobalt","titan","aurora","prism","sovereign"].indexOf(frame)+1))return json({ok:false,error:"FRAME_LOCKED"},403);
        await env.DB.prepare("INSERT INTO zx_profile_style(user_id,bio,favorites,avatar,banner,banner_image,frame,is_public) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio,favorites=excluded.favorites,avatar=excluded.avatar,banner=excluded.banner,banner_image=excluded.banner_image,frame=excluded.frame,is_public=excluded.is_public").bind(user.id,bio,JSON.stringify(favorites),avatar,banner,bannerImage,frame,isPublic?1:0).run();
        return json({ok:true,profile:{bio,favorites,avatar,banner,bannerImage,frame,isPublic}});
      }

      if(url.pathname==="/api/auth/contact" && request.method==="POST"){
        const user=await currentUser(request,env);
        if(!user || user.status!=="active")return json({ok:false,error:"UNAUTHORIZED"},401);
        const body=await request.json(),password=String(body.currentPassword||"");
        const record=await env.DB.prepare("SELECT password_hash FROM zx_users WHERE id=?").bind(user.id).first();
        if(!password || !record || !(await passwordOK(password,record.password_hash)))return json({ok:false,error:"INVALID_CREDENTIALS"},401);
        const email=String(body.email||"").trim().toLowerCase(),phone=String(body.phone||"").trim();
        if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({ok:false,error:"INVALID_EMAIL"},400);
        if(phone && (!/^\+?[0-9 ()-]{8,22}$/.test(phone) || phone.replace(/\D/g,"").length<8 || phone.replace(/\D/g,"").length>15))return json({ok:false,error:"INVALID_PHONE"},400);
        const exists=await env.DB.prepare("SELECT id FROM zx_users WHERE lower(email)=lower(?) AND id<>? LIMIT 1").bind(email,user.id).first();
        if(exists)return json({ok:false,error:"ACCOUNT_EXISTS"},409);
        try{await env.DB.prepare("UPDATE zx_users SET email=? WHERE id=?").bind(email,user.id).run();}
        catch(error){if(String(error.message||"").toLowerCase().includes("unique"))return json({ok:false,error:"ACCOUNT_EXISTS"},409);throw error;}
        await env.DB.prepare("INSERT INTO zx_private_contact(user_id,phone) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,updated_at=CURRENT_TIMESTAMP").bind(user.id,phone).run();
        return json({ok:true,email,phone});
      }

      if(url.pathname==="/api/auth/login" && request.method==="POST"){
        const body=await request.json(), login=String(body.login||body.email||body.username||"").trim(), password=String(body.password||"");
        if(!login||!password) return json({ok:false,error:"MISSING_CREDENTIALS"},400);
        const u=await env.DB.prepare("SELECT u.id,u.email,u.username,u.password_hash,u.status,p.display_name,p.avatar_url FROM zx_users u LEFT JOIN zx_profiles p ON p.user_id=u.id WHERE lower(u.email)=lower(?) OR lower(u.username)=lower(?) LIMIT 1").bind(login,login).first();
        if(!u||!(await passwordOK(password,u.password_hash))) return json({ok:false,error:"INVALID_CREDENTIALS"},401);
        if(u.status!=="active") return json({ok:false,error:"ACCOUNT_DISABLED"},403);
        return json({ok:true,user:{id:u.id,email:u.email,username:u.username,displayName:u.display_name,avatarUrl:u.avatar_url},session:await newSession(env,u.id)});
      }

      if(url.pathname==="/api/auth/me" && request.method==="GET"){
        const u=await currentUser(request,env);
        if(!u)return json({ok:false,error:"UNAUTHORIZED"},401);
        const style=await env.DB.prepare("SELECT bio,favorites,avatar,banner,banner_image AS bannerImage,frame,is_public AS isPublic FROM zx_profile_style WHERE user_id=?").bind(u.id).first();
        const contact=await env.DB.prepare("SELECT phone FROM zx_private_contact WHERE user_id=?").bind(u.id).first();
        return json({ok:true,user:{...u,phone:contact?.phone||"",profile:style?{...style,isPublic:!!style.isPublic,favorites:JSON.parse(style.favorites||"[]")}:{bio:"",favorites:[],avatar:"",banner:"violet",bannerImage:"",frame:"steel",isPublic:false}}});
      }

      if(url.pathname==="/api/auth/logout" && request.method==="POST"){
        const m=(request.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i);
        if(m) await env.DB.prepare("UPDATE zx_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL").bind(await digest(m[1].trim())).run();
        return json({ok:true});
      }

      // Managed catalog is separate from the existing checkout and orders.
      if (url.pathname.startsWith("/api/catalog/") || url.pathname.startsWith("/api/admin/catalog")) {
        const base = url.origin;
        const mediaKey = url.pathname.match(/^\/api\/catalog\/media\/([0-9a-f-]{36}\.(?:jpg|png|webp|mp4|webm))$/);
        if (mediaKey && request.method === "GET") {
          if (!env.MEDIA) return json({ok:false,error:"MEDIA_BINDING_NOT_CONFIGURED"},503);
          const object = await env.MEDIA.get(mediaKey[1]);
          if (!object) return json({ok:false,error:"NOT_FOUND"},404);
          return new Response(object.body, {
            headers: {
              "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Content-Type-Options": "nosniff",
              ...corsHeaders
            }
          });
        }
        if (url.pathname === "/api/catalog/products" && request.method === "GET") {
          if (!env.DB) return json({ok:false,error:"DB_BINDING_NOT_CONFIGURED"},503);
          await catalogSchema(env);
          const section = url.searchParams.get("section");
          if (!CATALOG_SECTIONS.includes(section)) return json({ok:false,error:"INVALID_SECTION"},400);
          const rows = await env.DB.prepare("SELECT * FROM zx_catalog WHERE section=? AND active=1 ORDER BY created_at DESC LIMIT 100").bind(section).all();
          return json({ok:true,products:rows.results.map(row=>catalogRow(row,base))});
        }
        if (!url.pathname.startsWith("/api/admin/catalog")) return json({ok:false,error:"NOT_FOUND"},404);
        const user = await currentUser(request,env);
        if (!user || user.status !== "active" || user.isFounder !== true)
          return json({ok:false,error:"FORBIDDEN"},403);
        if (!env.DB) return json({ok:false,error:"DB_BINDING_NOT_CONFIGURED"},503);
        await catalogSchema(env);
        if (url.pathname === "/api/admin/catalog/status" && request.method === "GET") return json({ok:true,mediaAvailable:!!env.MEDIA});
        if (url.pathname === "/api/admin/catalog/products" && request.method === "GET") {
          const rows = await env.DB.prepare("SELECT * FROM zx_catalog ORDER BY updated_at DESC LIMIT 200").all();
          return json({ok:true,products:rows.results.map(row=>({
            ...catalogRow(row,base), imageKey:row.image_key, videoKey:row.video_key
          }))});
        }
        if (url.pathname === "/api/admin/catalog/media" && request.method === "POST") {
          if (!env.MEDIA) return json({ok:false,error:"MEDIA_BINDING_NOT_CONFIGURED"},503);
          const length = Number(request.headers.get("content-length") || 0);
          if (length > 26000000) return json({ok:false,error:"FILE_TOO_LARGE"},413);
          const form = await request.formData(), file = form.get("file");
          const types = {
            "image/jpeg":["jpg",8000000], "image/png":["png",8000000],
            "image/webp":["webp",8000000], "video/mp4":["mp4",25000000],
            "video/webm":["webm",25000000]
          };
          const spec = file && types[file.type];
          if (!spec || !file.size || file.size > spec[1]) return json({ok:false,error:"INVALID_MEDIA"},400);
          const bytes = new Uint8Array(await file.arrayBuffer());
          const signature = spec[0] === "jpg" ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255 :
            spec[0] === "png" ? bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 :
            spec[0] === "webp" ? String.fromCharCode(...bytes.slice(0,4))==="RIFF" && String.fromCharCode(...bytes.slice(8,12))==="WEBP" :
            spec[0] === "mp4" ? String.fromCharCode(...bytes.slice(4,8))==="ftyp" :
            bytes[0]===26 && bytes[1]===69 && bytes[2]===223 && bytes[3]===163;
          if (!signature) return json({ok:false,error:"INVALID_MEDIA"},400);
          const key = `${crypto.randomUUID()}.${spec[0]}`;
          await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:file.type}});
          return json({ok:true,key,url:`${base}/api/catalog/media/${key}`},201);
        }
        if (url.pathname === "/api/admin/catalog/products" && request.method === "POST") {
          const product = validCatalog(await request.json());
          if (!product) return json({ok:false,error:"INVALID_PRODUCT"},400);
          const id = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO zx_catalog(id,section,name,description,price,image_key,video_key,active) VALUES(?,?,?,?,?,?,?,?)")
            .bind(id,product.section,product.name,product.description,product.price,product.imageKey,product.videoKey,Number(product.active)).run();
          return json({ok:true,id},201);
        }
        const productId = url.pathname.match(/^\/api\/admin\/catalog\/products\/([0-9a-f-]{36})$/);
        if (productId && request.method === "PATCH") {
          const product = validCatalog(await request.json());
          if (!product) return json({ok:false,error:"INVALID_PRODUCT"},400);
          const result = await env.DB.prepare("UPDATE zx_catalog SET section=?,name=?,description=?,price=?,image_key=?,video_key=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
            .bind(product.section,product.name,product.description,product.price,product.imageKey,product.videoKey,Number(product.active),productId[1]).run();
          return result.meta.changes ? json({ok:true,id:productId[1]}) : json({ok:false,error:"NOT_FOUND"},404);
        }
        return json({ok:false,error:"NOT_FOUND"},404);
      }

// Consultar información de jugador de Free Fire
if (url.pathname === "/api/player" && request.method === "GET") {
  if (!env.FF_INFO_API_KEY) {
    return json({
      ok: false,
      error: "FF_INFO_API_KEY_NOT_CONFIGURED"
    }, 500);
  }

  const uid = (url.searchParams.get("uid") || "").trim();
  const region = (url.searchParams.get("region") || "br").trim().toLowerCase();

  if (!/^\d{5,15}$/.test(uid)) {
    return json({
      ok: false,
      error: "INVALID_UID"
    }, 400);
  }

  try {
    const apiUrl =
      `https://developers.freefirecommunity.com/api/v1/info?region=${encodeURIComponent(region)}&uid=${encodeURIComponent(uid)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": env.FF_INFO_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return json({
        ok: false,
        error: "PLAYER_LOOKUP_FAILED",
        status: response.status,
        details: data
      }, response.status);
    }

    return json({
      ok: true,
      player: data
    });
  } catch (error) {
    return json({
      ok: false,
      error: "PLAYER_LOOKUP_ERROR",
      message: error.message
    }, 500);
  }
}
      // Obtener imagen de avatar, banner, ropa u otros items de Free Fire
if (url.pathname === "/api/item-image" && request.method === "GET") {
  if (!env.FF_INFO_API_KEY) {
    return json({
      ok: false,
      error: "FF_INFO_API_KEY_NOT_CONFIGURED"
    }, 500);
  }

  const itemID = (url.searchParams.get("itemID") || "").trim();

  if (!/^\d+$/.test(itemID)) {
    return json({
      ok: false,
      error: "INVALID_ITEM_ID"
    }, 400);
  }

  try {
    const apiUrl =
      `https://developers.freefirecommunity.com/api/v1/image?itemID=${encodeURIComponent(itemID)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": env.FF_INFO_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();

      return json({
        ok: false,
        error: "ITEM_IMAGE_FAILED",
        status: response.status,
        details: errorText
      }, response.status);
    }

    const contentType =
      response.headers.get("content-type") || "image/png";

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        ...corsHeaders
      }
    });
  } catch (error) {
    return json({
      ok: false,
      error: "ITEM_IMAGE_ERROR",
      message: error.message
    }, 500);
  }
}
      // Comprobar que el Worker funciona
      if (url.pathname === "/") {
        return json({
          ok: true,
          service: "ZeroX SixOfFire API",
          status: "online"
        });
      }

      // Catálogo directo de SixOfFire
      if (
        url.pathname === "/api/products" &&
        request.method === "GET"
      ) {
        if (!env.SIXOFIRE_API_KEY) {
          return json({
            ok: false,
            error: "SIXOFIRE_API_KEY_NOT_CONFIGURED"
          }, 500);
        }

        const response = await fetch(
          "https://api.sixofire.net/account/shop/items",
          {
            headers: {
              "X-API-Key": env.SIXOFIRE_API_KEY,
              "Accept": "application/json"
            }
          }
        );

        const data = await response.json();

        return json(data, response.status);
      }

      // Productos configurados en ZeroX
      if (
        url.pathname === "/api/zerox-products" &&
        request.method === "GET"
      ) {
        return json({
          ok: true,
          products: PRODUCT_MAP
        });
      }
// Vista previa segura del pedido - NO compra nada
if (
  url.pathname === "/api/order/preview" &&
  request.method === "POST"
) {
  const body = await request.json();

  const productId = String(body.productId || "").trim();
  const playerId = String(body.playerId || "").trim();

  if (!productId || !playerId) {
    return json({
      ok: false,
      error: "MISSING_DATA",
      message: "Falta seleccionar el producto o ingresar el ID del jugador."
    }, 400);
  }

  const product = PRODUCT_MAP[productId];

  if (!product) {
    return json({
      ok: false,
      error: "INVALID_PRODUCT",
      message: "El producto solicitado no está configurado en ZeroX."
    }, 400);
  }

  if (!/^[0-9]+$/.test(playerId)) {
    return json({
      ok: false,
      error: "INVALID_PLAYER_ID",
      message: "El ID del jugador debe contener únicamente números."
    }, 400);
  }

  return json({
    ok: true,
    status: "PREVIEW_ONLY",
    message: "Pedido validado. No se realizó ninguna compra.",
    order: {
      zeroXProductId: productId,
      sixofireProductId: product.sixofireProductId,
      amount: product.amount,
      playerId: playerId
    }
  });
}
      // Órdenes BLOQUEADAS por seguridad
      if (
        url.pathname === "/api/order" &&
        request.method === "POST"
      ) {
        return json({
          ok: false,
          error: "ORDERS_DISABLED",
          message:
            "Las órdenes automáticas se habilitarán después de validar los pagos."
        }, 403);
      }

      return json({
        ok: false,
        error: "NOT_FOUND"
      }, 404);

    } catch (error) {
      return json({
        ok: false,
        error: "INTERNAL_ERROR",
        message: error.message
      }, 500);
    }
  }
};
// Activar despliegue automático desde GitHub
