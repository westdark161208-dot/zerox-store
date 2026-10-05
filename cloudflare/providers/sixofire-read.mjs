// Fixed-origin reads; only allowlisted upstream error codes leave the server.
export const providerErrors=new Set(['PERMISSION_DENIED','SUBSCRIPTION_REQUIRED','SUBSCRIPTION_INACTIVE','SUBSCRIPTION_REQUESTS_EXHAUSTED','INVALID_API_KEY','MISSING_API_KEY','RATE_LIMIT','INSUFFICIENT_FUNDS']);
export async function readSixofire(env,path,fetcher=fetch){
 if(!env.SIXOFIRE_API_KEY)throw Error('PROVIDER_KEY_MISSING');
 if(!['/account/shop/items','/account/shop/orders?page=1&limit=1'].includes(path)&&!/^\/account\/levelup\/packages\?uid=\d{8,15}$/.test(path)&&!/^\/account\/shop\/orders\/[1-9]\d{0,18}$/.test(path))throw Error('PROVIDER_RESOURCE_NOT_ALLOWED');
 let response,raw;try{response=await fetcher('https://api.sixofire.net'+path,{method:'GET',redirect:'manual',headers:{'X-API-Key':env.SIXOFIRE_API_KEY,Accept:'application/json'},signal:AbortSignal.timeout(12000)});raw=await response.json();}catch{throw Error('PROVIDER_UNAVAILABLE');}
 const code=[raw?.errorCode,raw?.error,raw?.code].find(v=>typeof v==='string'&&providerErrors.has(v));
 if(!response.ok||raw?.status===false||raw?.success===false){if(code)throw Error('SIXOFIRE_'+code);throw Error(response.status===401?'PROVIDER_CREDENTIAL_REJECTED':response.status===403?'PROVIDER_PERMISSION_OR_SUBSCRIPTION':response.status===429?'PROVIDER_RATE_LIMITED':'PROVIDER_UNAVAILABLE');}
 if(!raw||typeof raw!=='object')throw Error('PROVIDER_RESPONSE_FORMAT');return raw;
}
export function catalogItems(raw){const items=Array.isArray(raw)?raw:raw?.items||raw?.data?.items||raw?.data;if(!Array.isArray(items)||items.length>2000)throw Error('PROVIDER_RESPONSE_FORMAT');return items;}
export function safeProviderError(error){return /^SIXOFIRE_/.test(error.message)&&providerErrors.has(error.message.slice(9))?error.message:['PROVIDER_KEY_MISSING','PROVIDER_RESOURCE_NOT_ALLOWED','PROVIDER_CREDENTIAL_REJECTED','PROVIDER_PERMISSION_OR_SUBSCRIPTION','PROVIDER_RATE_LIMITED','PROVIDER_RESPONSE_FORMAT'].includes(error.message)?error.message:'PROVIDER_UNAVAILABLE';}
