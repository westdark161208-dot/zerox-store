import test from 'node:test';
import assert from 'node:assert/strict';
import {readRechargeGames, parseCatalog} from './rechargegames.mjs';
const product = {product_key:'topup/game/br/pack', name:'Pack', price:0.94, delivery:'player_id'};
function snapshot(...products) {
  return {currency:'USDT',categories:[{slug:'game',kind:'topup',groups:[{slug:'br',products}]}]};
}
test('disabled and missing-secret paths make zero requests', async () => {
  let calls = 0;
  for (const env of [{},{RECHARGEGAMES_CATALOG_ENABLED:'true'}]) {
    await assert.rejects(readRechargeGames(env, () => calls++));
  }
  assert.equal(calls,0);
});
test('full catalog read is private, GET-only, and output remains in review', async () => {
  const [row] = await readRechargeGames({RECHARGEGAMES_CATALOG_ENABLED:'true', RECHARGEGAMES_API_KEY:'fixture'}, async (url, options) => {
    assert.equal(new URL(url).search,'?all=true');
    assert.equal(options.method ?? 'GET','GET');
    assert.equal(options.redirect,'error');
    return Response.json(snapshot(product));
  });
  assert.equal(row.key,product.product_key);
  assert.equal(row.status,'review');
  assert.equal(row.price,'0.94');
});
test('reject ambiguous and empty snapshots', () => {
  assert.throws(() => parseCatalog(snapshot(product,product)),/duplicate/);
  assert.throws(() => parseCatalog(snapshot()),/empty/);
});
test('retain unavailable and unpriced products for review', () => {
  const [row] = parseCatalog(snapshot({...product,price:null,out_of_stock:true}));
  assert.equal(row.available,false);
  assert.equal(row.price,null);
});
