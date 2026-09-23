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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_profiles (user_id TEXT PRIMARY KEY,display_name TEXT,avatar_url TEXT,xp INTEGER NOT NULL DEFAULT 0,level INTEGER NOT NULL DEFAULT 1,FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS zx_profile_style (user_id TEXT PRIMARY KEY,bio TEXT NOT NULL DEFAULT '',favorites TEXT NOT NULL DEFAULT '[]',avatar TEXT NOT NULL DEFAULT '',banner TEXT NOT NULL DEFAULT 'violet',banner_image TEXT NOT NULL DEFAULT '',frame TEXT NOT NULL DEFAULT 'steel',FOREIGN KEY(user_id) REFERENCES zx_users(id) ON DELETE CASCADE)").run();
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
  return env.DB.prepare("SELECT u.id,u.email,u.username,u.status,u.created_at,p.display_name,p.avatar_url,p.xp,p.level FROM zx_sessions s JOIN zx_users u ON u.id=s.user_id LEFT JOIN zx_profiles p ON p.user_id=u.id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1").bind(tokenHash,new Date().toISOString()).first();
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

      if(url.pathname.startsWith("/api/auth/")) await authSchema(env);

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

      if(url.pathname==="/api/auth/profile" && request.method==="POST"){
        const user=await currentUser(request,env);
        if(!user)return json({ok:false,error:"UNAUTHORIZED"},401);
        const body=await request.json();
        const bio=String(body.bio||"").trim(),favorites=body.favorites,avatar=String(body.avatar||""),banner=String(body.banner||"violet"),bannerImage=String(body.bannerImage||""),frame=String(body.frame||"steel");
        if(bio.length>180 || !Array.isArray(favorites) || favorites.length>6 || favorites.some(x=>typeof x!=="string" || !["Free Fire","Streaming","Cuentas","Venta de clanes","Honor de clanes","Revendedores"].includes(x)))return json({ok:false,error:"INVALID_PROFILE"},400);
        if(avatar && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(avatar))return json({ok:false,error:"INVALID_AVATAR"},400);
        if(bannerImage && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(bannerImage))return json({ok:false,error:"INVALID_BANNER"},400);
        if(avatar.length>160000 || bannerImage.length>160000 || avatar.length+bannerImage.length>260000 || !["violet","crimson","electric","custom"].includes(banner) || !["steel","chrome","cobalt","titan","aurora","prism","sovereign"].includes(frame))return json({ok:false,error:"INVALID_PROFILE"},400);
        if(Number(user.level||1)<(["steel","chrome","cobalt","titan","aurora","prism","sovereign"].indexOf(frame)+1))return json({ok:false,error:"FRAME_LOCKED"},403);
        await env.DB.prepare("INSERT INTO zx_profile_style(user_id,bio,favorites,avatar,banner,banner_image,frame) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio,favorites=excluded.favorites,avatar=excluded.avatar,banner=excluded.banner,banner_image=excluded.banner_image,frame=excluded.frame").bind(user.id,bio,JSON.stringify(favorites),avatar,banner,bannerImage,frame).run();
        return json({ok:true,profile:{bio,favorites,avatar,banner,bannerImage,frame}});
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
        const style=await env.DB.prepare("SELECT bio,favorites,avatar,banner,banner_image AS bannerImage,frame FROM zx_profile_style WHERE user_id=?").bind(u.id).first();
        return json({ok:true,user:{...u,profile:style?{...style,favorites:JSON.parse(style.favorites||"[]")}:{bio:"",favorites:[],avatar:"",banner:"violet",bannerImage:"",frame:"steel"}}});
      }

      if(url.pathname==="/api/auth/logout" && request.method==="POST"){
        const m=(request.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i);
        if(m) await env.DB.prepare("UPDATE zx_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL").bind(await digest(m[1].trim())).run();
        return json({ok:true});
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
