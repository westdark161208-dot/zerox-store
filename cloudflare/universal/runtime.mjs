import {readRechargeGames} from './rechargegames.mjs';
import {verifyRechargeEvent} from './engine.mjs';
import {readRaCatalogService} from '../providers/ra-admin-service.mjs';
import {readSixofire, catalogItems} from '../providers/sixofire-read.mjs';

const sources = {
  rechargegames: ['RECHARGEGAMES_CATALOG_ENABLED', readRechargeGames],
  recargasamerica: ['SMART_RA_CATALOG_ENABLED', async env =>
    (await readRaCatalogService(env, 'catalog')).map(row => ({
      ...row, key: row.sku, currency: 'USD', available: null, region: null
    }))],
  sixofire: ['SMART_SIXOFIRE_CATALOG_ENABLED', async env =>
    catalogItems(await readSixofire(env, '/account/shop/items')).map(row => ({
      key: String(row.id ?? ''), name: row.name, kind: row.itemType,
      currency: 'USD', price: row.effectivePriceUsd ?? row.priceUsd ?? null,
      available: row.available === true && row.isActive === true, region: null
    }))]
};

export async function syncCatalog(env, provider, read, started) {
  const rows = await read(env);
  const keys = new Set();
  if (!rows.length) throw Error('empty_snapshot');
  for (const row of rows) {
    if (!row.key || !row.name || keys.has(row.key)) throw Error('invalid_snapshot');
    keys.add(row.key);
  }
  // One atomic replacement, split into rows inside SQLite to avoid large D1 bindings.
  const db = env.DB;
  const ops = [db.prepare('INSERT INTO zx_smart_sync(provider,stamp) VALUES(?,?) ON CONFLICT(provider) DO UPDATE SET stamp=excluded.stamp WHERE excluded.stamp>stamp').bind(provider,started)];
  const current = 'EXISTS(SELECT 1 FROM zx_smart_sync WHERE provider=? AND stamp=?)';
  ops.push(db.prepare('DELETE FROM zx_smart_catalog WHERE provider=? AND '+current).bind(provider,provider,started));
  for (let i=0;i<rows.length;i+=40) {
    ops.push(db.prepare("INSERT INTO zx_smart_catalog(provider,sku,details) SELECT ?,json_extract(value,'$.key'),value FROM json_each(?) WHERE "+current)
      .bind(provider,JSON.stringify(rows.slice(i,i+40)),provider,started));
  }
  await db.batch(ops);
}

export function scheduleCatalog(event,env,ctx) {
  if (new Date(event.scheduledTime).getUTCMinutes() !== 0) return;
  for (const [provider,[flag,read]] of Object.entries(sources)) {
    if (env[flag] === 'true') ctx.waitUntil(syncCatalog(env,provider,read,event.scheduledTime));
  }
}

export async function rechargeWebhook(request,env) {
  if (!env.RECHARGEGAMES_WEBHOOK_SECRET) return new Response(null,{status:503});
  if (request.method !== 'POST') return new Response(null,{status:405});
  const bytes = await request.arrayBuffer();
  let id;
  try { id = await verifyRechargeEvent(request.headers,bytes,env.RECHARGEGAMES_WEBHOOK_SECRET); }
  catch { return new Response(null,{status:401}); }
  let event;
  try { event = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return new Response(null,{status:400}); }
  if (event?.type === 'webhook.test') return new Response(null,{status:204});
  const order = event?.data;
  if (!['order.delivered','order.failed'].includes(event?.type) || event.id !== id ||
      event.type !== 'order.'+order?.status || typeof order?.order_id !== 'string' || !order.order_id)
    return new Response(null,{status:422});
  await env.DB.prepare('INSERT INTO zx_smart_events(id,order_id,buyer_ref,status,is_test) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
    .bind(id,order.order_id,order.buyer_ref ?? null,order.status,Number(order.test === true)).run();
  return new Response(null,{status:204});
}
