import { apiBase, appearance, validValue } from '../../manual-recharges.mjs';

const key = 'storefront/manual-recharges.json';
const reply = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});

async function checkFounder(request, service) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({error: 'UNAUTHORIZED'}, 401);
  try {
    const identityRequest = new Request(apiBase + '/api/auth/me', {
      headers: {Authorization: authorization, Accept: 'application/json'},
      redirect: 'manual'
    });
    const identity = await service.fetch(identityRequest);
    if (identity.status === 401) return reply({error: 'UNAUTHORIZED'}, 401);
    if (identity.status === 403) return reply({error: 'FORBIDDEN'}, 403);
    if (identity.ok) {
      const data = await identity.json();
      if (data.ok === true && typeof data.user?.isFounder === 'boolean') {
        return data.user.isFounder ? null : reply({error: 'FORBIDDEN'}, 403);
      }
    }
  } catch { /* The identity service could not complete the check. */ }
  return reply({error: 'IDENTITY_UNAVAILABLE'}, 503);
}

export async function onRequest({request, env}) {
  const bucket = env.MANUAL_APPEARANCE;
  if (request.method === 'GET') {
    if (!bucket) return reply({error: 'STORAGE_UNAVAILABLE'}, 503);
    const saved = await bucket.get(key);
    return reply({revision: saved?.etag || '', values: saved ? await saved.json() : {}});
  }
  if (request.method !== 'POST') return reply({error: 'METHOD_NOT_ALLOWED'}, 405);
  const denied = await checkFounder(request, env.STORE_IDENTITY);
  if (denied) return denied;
  if (!bucket) return reply({error: 'STORAGE_UNAVAILABLE'}, 503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({error: 'INVALID_FORMAT'}, 415);
  const raw = await request.text();
  if (raw.length > 16000) return reply({error: 'TOO_LARGE'}, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({error: 'INVALID_JSON'}, 400); }
  if (typeof body?.revision !== 'string' || !/^(?:[a-f0-9]{32})?$/.test(body.revision) ||
      !body.values || Array.isArray(body.values) || typeof body.values !== 'object' ||
      Object.keys(body.values).length !== appearance.length ||
      !appearance.every(f => validValue(f, body.values[f.key]))) return reply({error: 'INVALID_APPEARANCE'}, 400);
  const values = Object.fromEntries(appearance.map(f => [f.key, body.values[f.key].trim()]));
  const condition = body.revision ? {'If-Match': '"' + body.revision + '"'} : {'If-None-Match': '*'};
  try {
    const saved = await bucket.put(key, JSON.stringify(values), {onlyIf: new Headers(condition), httpMetadata: {contentType: 'application/json'}});
    return saved ? reply({revision: saved.etag, values}) : reply({error: 'CONFLICT'}, 409);
  } catch {
    return reply({error: 'STORAGE_UNAVAILABLE'}, 503);
  }
}
