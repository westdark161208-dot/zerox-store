// Contract: supplied RecargasAmerica_API.postman_collection v1.0.0.
// Read-only adapter: intentionally has no purchase method.
const BASE='https://panel.recargasamerica.com/api/v1';
export async function readRecargasAmerica(env, resource, fetcher=fetch) {
  if (env.RA_READ_ENABLED !== 'true') throw Error('RA_READ_DISABLED');
  if (!env.RECARGAS_AMERICA_API_KEY) throw Error('RA_KEY_MISSING');
  const path={wallet:'/wallet',catalog:'/products/catalog'}[resource];
  if (!path) throw Error('RA_RESOURCE_NOT_ALLOWED');
  let response;
  try {
    response=await fetcher(BASE+path,{method:'GET',redirect:'manual',
      headers:{Authorization:'Bearer '+env.RECARGAS_AMERICA_API_KEY,Accept:'application/json'},
      signal:AbortSignal.timeout(10000)});
  } catch {throw Error('RA_UNAVAILABLE')}
  if (!response.ok) throw Error('RA_HTTP_'+response.status);
  let body;
  try {body=await response.json()} catch {throw Error('RA_INVALID_RESPONSE')}
  if (body?.success !== true) throw Error('RA_INVALID_RESPONSE');
  if (resource==='wallet') {
    const data=body.data;
    if (!data || !['number','string'].includes(typeof data.balance) || String(data.balance).trim()==='' ||
        !Number.isFinite(Number(data.balance)) || Number(data.balance)<0 || !/^[A-Z]{3,5}$/.test(data.currency)) throw Error('RA_INVALID_RESPONSE');
    // Report currency as returned. USD is not assumed to be USDT or customer MXN.
    return {balance:String(data.balance),currency:data.currency};
  }
  if (!Array.isArray(body.data)) throw Error('RA_INVALID_RESPONSE');
  return body.data.map(p=>{
    if (!p || !Number.isSafeInteger(p.id) || p.id<=0 || typeof p.name!=='string' ||
        !['number','string'].includes(typeof p.price) || String(p.price).trim()==='' ||
        !Number.isFinite(Number(p.price)) || Number(p.price)<0 || !Array.isArray(p.required_fields)) throw Error('RA_INVALID_RESPONSE');
    return {id:p.id,sku:String(p.sku||''),name:p.name,type:String(p.type||''),price:String(p.price),
      requiredFields:p.required_fields.filter(v=>typeof v==='string')};
  });
}
