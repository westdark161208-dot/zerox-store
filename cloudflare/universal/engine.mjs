// Monetary inputs use integer micro-units; FX is quote MXN per source unit in millionths.
const positive = n => Number.isSafeInteger(n) && n > 0;
const natural = n => Number.isSafeInteger(n) && n >= 0;
const ceil = (a,b) => (a+b-1n)/b;

export function selectOffer(order, offers, now = Date.now()) {
  if (!positive(order.saleMxn) || !natural(order.marginBps) || order.marginBps > 10000) return null;
  const identity = ['productId','region','server','delivery'];
  if (!identity.every(k => typeof order[k] === 'string' && order[k].trim())) return null;
  let best = null;
  for (const o of offers) {
    if (!identity.every(k => o[k] === order[k]) || o.enabled !== true || o.available !== true ||
        o.approved !== true || !positive(o.expiresAt) || o.expiresAt <= now ||
        !positive(o.sourceCost) || !positive(o.fx) || !natural(o.sourceFee) ||
        !natural(o.balance) || !natural(o.feeMxn) || !o.key || !o.provider) continue;
    const debit = BigInt(o.sourceCost) + BigInt(o.sourceFee);
    if (debit > BigInt(o.balance)) continue;
    const cost = ceil(debit * BigInt(o.fx),1000000n) + BigInt(o.feeMxn);
    const sale = BigInt(order.saleMxn);
    if ((sale-cost)*10000n < sale*BigInt(order.marginBps)) continue;
    if (!best || Number(cost) < best.costMxn) best = {provider:o.provider,key:o.key,costMxn:Number(cost)};
  }
  return best;
}

export async function verifyRechargeEvent(headers, rawBody, secret, now = Date.now()) {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  if (!id || !/^\d{1,12}$/.test(timestamp) || Math.abs(now/1000-Number(timestamp)) > 300 ||
      !secret?.startsWith('whsec_') || !secret.slice(6)) throw Error('invalid_webhook');
  const decode = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw',decode(secret.slice(6)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const prefix = new TextEncoder().encode(id+'.'+timestamp+'.');
  const bytes = new Uint8Array(prefix.length+rawBody.byteLength);
  bytes.set(prefix);
  bytes.set(new Uint8Array(rawBody),prefix.length);
  for (const token of (headers.get('webhook-signature') || '').split(/\s+/)) {
    if (!/^v1,[A-Za-z0-9+/]{43}=$/.test(token)) continue;
    if (await crypto.subtle.verify('HMAC',key,decode(token.slice(3)),bytes)) return id;
  }
  throw Error('invalid_webhook');
}
