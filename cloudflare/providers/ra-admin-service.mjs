import {raFinancialConflict} from './ra-private-policy.mjs';
// Read-only service-binding bridge for the separately verified RA test Worker.
// Never fall back to the provider's public origin or to an unauthenticated request.
const RESOURCES = Object.freeze({
  wallet: '/admin/ra/wallet',
  catalog: '/admin/ra/catalog'
});
const MAX_BYTES = 3 * 1024 * 1024;
const FAILURE = 'RA_ADMIN_READ_UNAVAILABLE';

async function boundedJson(response) {
  const reported = response.headers.get('content-length');
  if (reported !== null && (!/^\d+$/.test(reported) || Number(reported) > MAX_BYTES)) throw Error(FAILURE);
  if (!response.body) throw Error(FAILURE);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw Error(FAILURE);
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(buffer));
}

export async function readRaAdminService(env, resource) {
  const path = Object.hasOwn(RESOURCES, resource) ? RESOURCES[resource] : null;
  if (!path) throw Error('RA_RESOURCE_NOT_ALLOWED');
  if (env?.RA_ADMIN_READ_ENABLED !== 'true' ||
      env.RA_ADMIN_READ_TRANSPORT !== 'service-binding' ||
      env.RA_ADMIN_READ_CONTRACT_VERIFIED !== 'true') throw Error('RA_ADMIN_READ_DISABLED');
  if (raFinancialConflict(env)) throw Error('RA_PRIVATE_READ_PRODUCTION_GUARD');
  const token = env.RA_READ_ADMIN_TOKEN;
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token) ||
      token === env.RA_PROXY_SECRET || token === env.RECARGAS_AMERICA_API_KEY ||
      typeof env.RA_READ_SERVICE?.fetch !== 'function') throw Error(FAILURE);

  return readPrivateResource(env,resource,path,token);
}

// Independent panel channel: never changes commercial routing or legacy flags.
export function catalogReadReady(env){
 const token=env.RA_CATALOG_READ_TOKEN;
 return env.RA_CATALOG_READ_ENABLED==='true' && env.RA_CATALOG_READ_CONTRACT_VERIFIED==='true' &&
 typeof token==='string' && /^[0-9a-f]{64}$/.test(token) &&
 ![env.RA_READ_ADMIN_TOKEN,env.RA_PROXY_SECRET,env.RECARGAS_AMERICA_API_KEY,env.RA_PURCHASE_SERVICE_TOKEN,env.RA_PURCHASE_PROXY_SECRET].includes(token) &&
 typeof env.RA_READ_SERVICE?.fetch==='function';
}
export async function readRaCatalogService(env,resource){
 if(!Object.hasOwn(RESOURCES,resource))throw Error('RA_RESOURCE_NOT_ALLOWED');
 if(!catalogReadReady(env))throw Error(FAILURE);
 return readPrivateResource(env,resource,RESOURCES[resource],env.RA_CATALOG_READ_TOKEN);
}
export function readRaFounderService(env,resource){
 // Configured but disabled/malformed channel fails closed, never tries another token.
 return env.RA_CATALOG_READ_ENABLED!==undefined || env.RA_CATALOG_READ_TOKEN!==undefined
 ? readRaCatalogService(env,resource) : readRaAdminService(env,resource);
}
async function readPrivateResource(env,resource,path,token){
  let data;
  try {
    // The host is an internal Request URL placeholder; service binding routes to the bound Worker.
    const response = await env.RA_READ_SERVICE.fetch('https://ra-service.internal' + path, {
      method: 'GET', redirect: 'manual',
      headers: {Authorization: 'Bearer ' + token, Accept: 'application/json'},
      signal: AbortSignal.timeout(10000)
    });
    if (response.status !== 200 || response.redirected) throw Error(FAILURE);
    data = await boundedJson(response);
  } catch { throw Error(FAILURE); }
  if (data?.ok !== true || data.resource !== resource ||
      data.purchasesEnabled !== false) throw Error(FAILURE);

  if (resource === 'wallet') {
    const wallet = data.data;
    if (!wallet || wallet.currency !== 'USD' ||
        !['string','number'].includes(typeof wallet.balance) ||
        String(wallet.balance).trim() === '' ||
        !Number.isFinite(Number(wallet.balance)) || Number(wallet.balance) < 0)
      throw Error(FAILURE);
    return {balance: String(wallet.balance), currency: 'USD'};
  }

  if (!Array.isArray(data.data) || data.data.length > 2000 ||
      data.productCount !== data.data.length || data.invalidProducts !== 0)
    throw Error(FAILURE);
  const ids = new Set(), skus = new Set();
  return data.data.map(item => {
    if (!item || !Number.isSafeInteger(item.id) || item.id <= 0 ||
        typeof item.name !== 'string' || !item.name.trim() || item.name.length > 240 ||
        ids.has(item.id) || typeof item.sku !== 'string' || !item.sku.trim() || item.sku.length > 120 || skus.has(item.sku) ||
        typeof item.type !== 'string' || !item.type.trim() || item.type.length > 120 ||
        !['string','number'].includes(typeof item.price) ||
        String(item.price).trim() === '' ||
        !Number.isFinite(Number(item.price)) || Number(item.price) < 0 ||
        !Array.isArray(item.requiredFields) || item.requiredFields.length > 30 ||
        !item.requiredFields.every(field => typeof field === 'string' && field.length <= 120))
      throw Error(FAILURE);
    ids.add(item.id); skus.add(item.sku);
    return {id: item.id, sku: item.sku,
      name: item.name, type: item.type,
      price: String(item.price), requiredFields: [...item.requiredFields]};
  });
}
