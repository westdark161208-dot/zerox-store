// Private adapter. Callers must commit a complete validated snapshot atomically.
export async function readRechargeGames(env, request = fetch) {
  if (env.RECHARGEGAMES_CATALOG_ENABLED !== 'true') throw Error('catalog_disabled');
  if (!env.RECHARGEGAMES_API_KEY) throw Error('missing_provider_secret');
  const response = await request('https://api.rechargegame.games/v1/products?all=true', {
    headers: { 'X-API-Key': env.RECHARGEGAMES_API_KEY },
    redirect: 'error',
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw Error('catalog_http_' + response.status);
  return parseCatalog(await response.json());
}

export function parseCatalog(snapshot) {
  if (snapshot?.currency !== 'USDT' || !Array.isArray(snapshot.categories)) throw Error('invalid_catalog');
  const offers = new Map();
  for (const game of snapshot.categories) {
    for (const region of game.groups) {
      for (const item of region.products) {
        const key = item.product_key;
        if (![game.slug, region.slug, item.name, key].every(v => typeof v === 'string' && v.trim())) throw Error('invalid_identity');
        if (offers.has(key)) throw Error('duplicate_product_key');
        const price = String(item.price);
        const priced = /^\d{1,9}(\.\d{1,6})?$/.test(price) && Number(price) > 0;
        offers.set(key, {
          provider: 'rechargegames', key, game: game.slug, kind: game.kind, region: region.slug,
          name: item.name, delivery: item.delivery, currency: snapshot.currency,
          price: priced ? price : null, available: item.out_of_stock === false || !Object.hasOwn(item, 'out_of_stock'),
          status: 'review'
        });
      }
    }
  }
  if (!offers.size) throw Error('empty_catalog');
  return [...offers.values()];
}
