// Private FF110 protocol v1. Never use these credentials for the read-only bridge.
export const validSecret = s => typeof s==='string' && /^[0-9a-f]{64}$/.test(s);
export const hex = bytes => Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest = async text => hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
const key = secret => crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
export const canonical = (path,time,nonce,body) => ['POST',path,time,nonce,body].join('\n');
export async function sign(secret,message){return hex(await crypto.subtle.sign('HMAC',await key(secret),new TextEncoder().encode(message)));}
export async function verify(secret,message,signature){
 if(!validSecret(secret)||!validSecret(signature))return false;
 return crypto.subtle.verify('HMAC',await key(secret),Uint8Array.from(signature.match(/../g),x=>parseInt(x,16)),new TextEncoder().encode(message));
}
export async function boundedText(response,max=16384){
 const reader=response.body?.getReader();if(!reader)throw Error('EMPTY_BODY');let total=0,parts=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw Error('BODY_TOO_LARGE');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export function validPayload(p,action){
 const base=['operationId','playerId','region','productId','catalogSku','name','maxPriceUsd','field'];
 const fields=action==='lookup'?[...base,'reference']:base;
 return p&&Object.getPrototypeOf(p)===Object.prototype&&Object.keys(p).every(k=>fields.includes(k))&&
 /^[a-f0-9-]{36}:0$/.test(p.operationId||'')&&/^\d{5,15}$/.test(p.playerId||'')&&p.region==='US'&&
 Number.isSafeInteger(p.productId)&&p.productId>0&&typeof p.catalogSku==='string'&&p.catalogSku.length>0&&p.catalogSku.length<=120&&
 typeof p.name==='string'&&p.name.length>0&&p.name.length<=240&&typeof p.maxPriceUsd==='string'&&/^\d{1,4}(?:\.\d{1,6})?$/.test(p.maxPriceUsd)&&Number(p.maxPriceUsd)>0&&
 ['player_id','manual_id'].includes(p.field)&&(action!=='lookup'||/^[A-Za-z0-9_-]{1,120}$/.test(p.reference||''));
}
export const response = (body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
