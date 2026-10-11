// V3 quotes are server-owned. Callers supply catalog prices, never browser totals.
// This module does not enable production charges or change historical orders.
const METHODS = new Set(['wallet', 'all', 'card', 'spei']);
const LIMIT = 100000000;
export function feePolicy(env){
 const integer=v=>typeof v==='string'&&/^\d+$/.test(v)?Number(v):NaN;
 return {verified:env.MP_FEE_POLICY_VERIFIED==='true',version:env.MP_FEE_POLICY_VERSION,rateBasisPoints:integer(env.MP_FEE_RATE_BPS),fixedCents:integer(env.MP_FEE_FIXED_CENTS),taxBasisPoints:integer(env.MP_FEE_TAX_BPS)};
}
function money(n) {
 if (!Number.isSafeInteger(n) || n <= 0 || n > LIMIT) throw Error('INVALID_QUOTE_AMOUNT');
 return n;
}
export function calculateQuote(baseCents, method, policy) {
 money(baseCents);
 if (!METHODS.has(method)) throw Error('INVALID_PAYMENT_METHOD');
 if (method === 'wallet') return {currency:'MXN', baseCents, feeCents:0, taxCents:0, totalCents:baseCents, rateBasisPoints:0, fixedCents:0, taxBasisPoints:0, policyVersion:'wallet-base-v3'};
 // No default tax assumption: the deployed account policy must be verified.
 if (!policy || policy.verified !== true || typeof policy.version !== 'string' || !policy.version.trim() || policy.version.length > 80) throw Error('FEE_POLICY_NOT_VERIFIED');
 const {rateBasisPoints:r, fixedCents:f, taxBasisPoints:t} = policy;
 if (![r,f,t].every(Number.isSafeInteger) || r < 0 || r >= 10000 || f < 0 || f > LIMIT || t < 0 || t > 10000) throw Error('INVALID_FEE_POLICY');
 const scale=100000000n, taxFactor=BigInt(10000+t), denominator=scale-BigInt(r)*taxFactor;
 if (denominator <= 0n) throw Error('INVALID_FEE_POLICY');
 const numerator=BigInt(baseCents)*scale+BigInt(f)*taxFactor*10000n;
 const totalCents=money(Number((numerator+denominator-1n)/denominator));
 const surcharge=totalCents-baseCents;
 // Allocate rounding to processing fee so the displayed components sum exactly.
 const taxCents=Number(((BigInt(totalCents)*BigInt(r)+BigInt(f)*10000n)*BigInt(t))/scale);
 return {currency:'MXN',baseCents,feeCents:surcharge-taxCents,taxCents,totalCents,rateBasisPoints:r,fixedCents:f,taxBasisPoints:t,policyVersion:policy.version};
}
export async function quoteSchema(db) {
 await db.prepare(`CREATE TABLE IF NOT EXISTS zx_payment_quotes_v3 (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, context TEXT NOT NULL,
  method TEXT NOT NULL, quote_json TEXT NOT NULL, expires_at INTEGER NOT NULL,
  order_id TEXT UNIQUE, created_at INTEGER NOT NULL
 )`).run();
}
function identity(value) { return typeof value==='string' && value.length>0 && value.length<=512; }
export async function createQuote(db,{userId,context,baseCents,method,policy,now=Date.now(),ttlMs=300000}) {
 if (!identity(userId)||!identity(context)||!Number.isSafeInteger(now)||!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>900000||!Number.isSafeInteger(now+ttlMs)) throw Error('INVALID_QUOTE_CONTEXT');
 const values=calculateQuote(baseCents,method,policy);
 const quote={id:crypto.randomUUID(),...values,method,expiresAt:now+ttlMs};
 await db.prepare(`INSERT INTO zx_payment_quotes_v3(id,user_id,context,method,quote_json,expires_at,created_at) VALUES(?,?,?,?,?,?,?)`)
  .bind(quote.id,userId,context,method,JSON.stringify(quote),quote.expiresAt,now).run();
 return quote;
}
export async function acceptQuote(db,{id,userId,context,method,maxAmountCents,orderId,now=Date.now()}) {
 if (![id,userId,context,orderId].every(identity)||!METHODS.has(method)||!Number.isSafeInteger(maxAmountCents)||!Number.isSafeInteger(now)) throw Error('INVALID_QUOTE_CONTEXT');
 const row=await db.prepare('SELECT * FROM zx_payment_quotes_v3 WHERE id=? AND user_id=?').bind(id,userId).first();
 if (!row) throw Error('QUOTE_NOT_FOUND');
 const quote=JSON.parse(row.quote_json);
 if (row.context!==context||row.method!==method||quote.totalCents!==maxAmountCents) throw Error('QUOTE_CHANGED');
 // Same-order retries keep their original agreement, even after expiry.
 if (row.order_id===orderId) return quote;
 if (row.order_id) throw Error('QUOTE_ALREADY_USED');
 if (row.expires_at<=now) throw Error('QUOTE_EXPIRED');
 try {
  await db.prepare('UPDATE zx_payment_quotes_v3 SET order_id=? WHERE id=? AND order_id IS NULL AND expires_at>?').bind(orderId,id,now).run();
 } catch { throw Error('QUOTE_ALREADY_USED'); }
 const claimed=await db.prepare('SELECT order_id FROM zx_payment_quotes_v3 WHERE id=?').bind(id).first();
 if (claimed?.order_id!==orderId) throw Error('QUOTE_ALREADY_USED');
 return quote;
}
