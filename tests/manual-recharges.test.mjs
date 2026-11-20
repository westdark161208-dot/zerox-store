import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/api/manual-recharges.js';
import {apiBase, defaults} from '../manual-recharges.mjs';

function setup(identity) {
  let entry;
  const bucket = {
    get: async () => entry,
    async put(key, raw, {onlyIf}) {
      if (onlyIf.has('If-None-Match') ? entry : onlyIf.get('If-Match') !== '"' + entry?.etag + '"') return null;
      entry = {etag:createHash('md5').update(raw).digest('hex'), json:async () => JSON.parse(raw)};
      return entry;
    }
  };
  return (method, payload, token = '') => onRequest({env:{MANUAL_APPEARANCE:bucket, STORE_IDENTITY:identity},
    request:new Request('https://zeroxstore.com/api/manual-recharges', {method,
      headers:{'Content-Type':'application/json', ...(token && {Authorization:'Bearer ' + token})},
      ...(payload && {body:JSON.stringify(payload)})})});
}

test('published appearance is founder-only, round-trips text and media, and rejects stale writes', async () => {
  const route = setup({async fetch(request) {
    assert.equal(request.url, apiBase + '/api/auth/me');
    assert.equal(request.method, 'GET');
    assert.equal(request.redirect, 'manual');
    return Response.json({ok:true, user:{isFounder:request.headers.get('Authorization') === 'Bearer founder'}});
  }});
  assert.deepEqual(await (await route('GET')).json(), {revision:'', values:{}});
  const values = {...defaults, concept:'CONCEPTO NUEVO', transferImage:apiBase + '/api/catalog/media/12345678-1234-1234-1234-123456789abc.png'};
  const body = {revision:'', values};
  assert.equal((await route('POST', body)).status, 401);
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

test('session errors are distinct from identity service failures and neither can publish', async () => {
  for (const [result, status, error] of [
    [() => new Response(null, {status:401}), 401, 'UNAUTHORIZED'],
    [() => new Response(null, {status:503}), 503, 'IDENTITY_UNAVAILABLE'],
    [() => new Response('not JSON'), 503, 'IDENTITY_UNAVAILABLE'],
    [() => Response.json({ok:true}), 503, 'IDENTITY_UNAVAILABLE'],
    [() => { throw Error('service unavailable'); }, 503, 'IDENTITY_UNAVAILABLE']
  ]) {
    const route = setup({fetch:result});
    const response = await route('POST', {revision:'', values:defaults}, 'test');
    assert.equal(response.status, status);
    assert.equal((await response.json()).error, error);
    assert.deepEqual((await (await route('GET')).json()).values, {});
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
