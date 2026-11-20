import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/api/manual-recharges.js';
import {apiBase, defaults} from '../manual-recharges.mjs';

function setup() {
  let entry;
  const bucket = {
    get: async () => entry,
    async put(key, raw, {onlyIf}) {
      if (onlyIf.has('If-None-Match') ? entry : onlyIf.get('If-Match') !== '"' + entry?.etag + '"') return null;
      entry = {etag:createHash('md5').update(raw).digest('hex'), json:async () => JSON.parse(raw)};
      return entry;
    }
  };
  return (method, payload, token = '') => onRequest({env:{MANUAL_APPEARANCE:bucket},
    request:new Request('https://zeroxstore.com/api/manual-recharges', {method,
      headers:{'Content-Type':'application/json', ...(token && {Authorization:'Bearer ' + token})},
      ...(payload && {body:JSON.stringify(payload)})})});
}

test('published appearance is founder-only, round-trips text and media, and rejects stale writes', async t => {
  t.mock.method(globalThis, 'fetch', async (url, {headers}) => {
    assert.equal(url, apiBase + '/api/auth/me');
    return Response.json({user:{isFounder:headers.Authorization === 'Bearer founder'}});
  });
  const route = setup();
  assert.deepEqual(await (await route('GET')).json(), {revision:'', values:{}});
  const values = {...defaults, concept:'CONCEPTO NUEVO', transferImage:apiBase + '/api/catalog/media/12345678-1234-1234-1234-123456789abc.png'};
  const body = {revision:'', values};
  assert.equal((await route('POST', body)).status, 403);
  assert.equal((await route('POST', body, 'customer')).status, 403);
  const saved = await (await route('POST', body, 'founder')).json();
  assert.ok(saved.revision);
  assert.deepEqual((await (await route('GET')).json()).values, values);
  assert.equal((await route('POST', body, 'founder')).status, 409);
  const edit = {revision:saved.revision, values:{...values, concept:'NUEVO'}};
  assert.equal((await route('POST', edit, 'founder')).status, 200);
  assert.equal((await route('POST', edit, 'founder')).status, 409);
  for (const change of [{clabe:'123'}, {transferImage:'https://example.com/image.png'}, {concept:' '}]) {
    assert.equal((await route('POST', {...edit, values:{...values, ...change}}, 'founder')).status, 400);
  }
});

test('storefront binds every visual field and copies the displayed transfer value', async () => {
  assert.equal(defaults.concept, 'DONACION / PRÉSTAMO');
  const [html, modal] = await Promise.all(['index.html','oxxo-deposit.js'].map(f => readFile(new URL('../' + f, import.meta.url), 'utf8')));
  const used = [...(html + modal).matchAll(/data-manual-(?:text|image)="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual([...new Set(used)].sort(), Object.keys(defaults).sort());
  assert.match(modal, /data-manual-text="concept"><\/span><button[^>]+aria-label="Copiar concepto"/);
  assert.match(modal, /copy\(transfer, button.previousElementSibling.textContent/);
});
