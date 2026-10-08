// Retail discounts never change provider costs or wallet funding amounts.
export const normalizeCode=value=>typeof value==='string'?value.trim().toUpperCase():'';
export async function couponSchema(db){await db.prepare(`CREATE TABLE IF NOT EXISTS zx_discount_codes(code TEXT PRIMARY KEY,percent INTEGER NOT NULL CHECK(percent BETWEEN 1 AND 99),expires_at TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL,request_key TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();}
export async function readCoupon(db,value,now=Date.now()){
 const code=normalizeCode(value);if(!/^ZX-[A-F0-9]{12}$/.test(code))throw Error('COUPON_INVALID');
 await couponSchema(db);const row=await db.prepare('SELECT code,percent,expires_at,active FROM zx_discount_codes WHERE code=?').bind(code).first();
 if(!row||row.active!==1)throw Error('COUPON_INVALID');if(Date.parse(row.expires_at)<=now)throw Error('COUPON_EXPIRED');
 return {code:row.code,percent:row.percent,expiresAt:row.expires_at};
}
export function discountAmount(subtotalCents,percent){if(!Number.isSafeInteger(subtotalCents)||subtotalCents<1||subtotalCents>100000000||!Number.isInteger(percent)||percent<0||percent>99)throw Error('COUPON_INVALID');return Math.floor(subtotalCents*percent/100);}
export async function retailDiscount(db,subtotalCents,value,method='wallet'){
 const code=normalizeCode(value);if(code&&['ra','sf','ra-funds'].includes(method))throw Error('COUPON_RETAIL_ONLY');
 const coupon=code?await readCoupon(db,code):null,discountCents=discountAmount(subtotalCents,coupon?.percent||0);
 return {subtotalCents,discountCents,amountCents:subtotalCents-discountCents,coupon};
}
export function assertCouponRetry(pricing,value){if((pricing?.coupon?.code||'')!==normalizeCode(value))throw Error('IDEMPOTENCY_CONFLICT');}
export async function couponRoute(request,env,url,user,json){
 const reply=(b,s=200)=>{const r=json(b,s);r.headers?.set('Cache-Control','private, no-store');return r;};
 if(!user||user.status!=='active')return reply({ok:false,error:'LOGIN_REQUIRED'},401);
 const admin=url.pathname==='/api/admin/coupons';if(admin&&user.isFounder!==true)return reply({ok:false,error:'FORBIDDEN'},403);
 if(!admin&&url.pathname!=='/api/coupons/validate')return reply({ok:false,error:'NOT_FOUND'},404);
 try{
  await couponSchema(env.DB);
  if(!admin&&request.method==='POST'){const b=await request.json();return reply({ok:true,coupon:await readCoupon(env.DB,b.code)});}
  if(admin&&request.method==='GET')return reply({ok:true,codes:(await env.DB.prepare('SELECT code,percent,expires_at AS expiresAt,active,created_at AS createdAt FROM zx_discount_codes ORDER BY created_at DESC,code LIMIT 200').all()).results});
  if(admin&&request.method==='POST'){
   const b=await request.json();
   if(b.action==='disable'){const code=normalizeCode(b.code);if(!/^ZX-[A-F0-9]{12}$/.test(code))throw Error('COUPON_INVALID');await env.DB.prepare('UPDATE zx_discount_codes SET active=0 WHERE code=?').bind(code).run();return reply({ok:true});}
   const key=request.headers.get('Idempotency-Key'),expires=Date.parse(b.expiresAt);
   if(!/^[a-f0-9-]{36}$/.test(key||'')||!Number.isInteger(b.percent)||b.percent<1||b.percent>99||!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+5*366*86400000)throw Error('COUPON_CONFIGURATION_INVALID');
   const expiry=new Date(expires).toISOString(),code='ZX-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
   await env.DB.prepare('INSERT INTO zx_discount_codes(code,percent,expires_at,created_by,request_key) VALUES(?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(code,b.percent,expiry,user.id,key).run();
   const saved=await env.DB.prepare('SELECT code,percent,expires_at AS expiresAt,created_by FROM zx_discount_codes WHERE request_key=?').bind(key).first();
   if(saved.percent!==b.percent||saved.expiresAt!==expiry||saved.created_by!==user.id)throw Error('IDEMPOTENCY_CONFLICT');
   return reply({ok:true,coupon:{code:saved.code,percent:saved.percent,expiresAt:saved.expiresAt}});
  }
  return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 }catch(e){return reply({ok:false,error:/^(COUPON_|IDEMPOTENCY_)/.test(e.message)?e.message:'COUPON_UNAVAILABLE'},400);}
}
