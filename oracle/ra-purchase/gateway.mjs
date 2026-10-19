import {validSecret,verify,canonical,digest,boundedText,validPayload,response} from '../../cloudflare/ra-purchase/protocol.mjs';
const safeRef=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(x);
function identity(p,c){return c.verified===true&&c.baseDiamonds===100&&c.bonusDiamonds===10&&c.region==='US'&&typeof c.bonusEvidence==='string'&&!!c.bonusEvidence.trim()&&p.productId===c.productId&&p.catalogSku===c.sku&&p.name===c.name&&p.field===c.field&&Number.isFinite(c.maxPriceUsd)&&c.maxPriceUsd>0&&Number(p.maxPriceUsd)<=c.maxPriceUsd;}
export function createGateway({config,store,upstream,clock=Date.now}){
 return async request=>{
 const url=new URL(request.url),action=url.pathname.split('/').at(-1);
 if(request.method!=='POST'||url.search||url.pathname!=='/v1/ff110/'+action||!['validate','submit','lookup'].includes(action))return response({ok:false},404);
 if(config.enabled!==true||!validSecret(config.proxySecret)||!store||!config.product)return response({ok:false},503);
 try{
 const body=await boundedText(request),time=request.headers.get('x-zerox-time'),nonce=request.headers.get('x-zerox-nonce'),signature=request.headers.get('x-zerox-signature');
 if(!/^\d{13}$/.test(time||'')||Math.abs(clock()-Number(time))>30000||! /^[a-f0-9-]{36}$/.test(nonce||'')||!await verify(config.proxySecret,canonical(url.pathname,time,nonce,body),signature))return response({ok:false},401);
 if(!store.authorize(nonce,clock()))return response({ok:false},429);
 const p=JSON.parse(body);if(!validPayload(p,action)||!identity(p,config.product))return response({ok:false},400);
 const {reference,...base}=p,hash=await digest(JSON.stringify(base));
 const done=result=>response({ok:true,action,...result});
 if(action==='lookup'){
 const old=store.get(p.operationId);if(!old||old.hash!==hash||old.reference!==reference)return response({ok:false},409);
 if(old.result.status==='SUCCESS')return done(old.result);
 const raw=await upstream('/catalog/orders/'+reference,'GET'),d=raw?.data;
 if(raw?.success!==true||d?.order_id!==reference||d.product!==p.name)return done({status:'UNKNOWN',reference});
 const result={status:d.status==='COMPLETED'&&d.needs_review!==true?'SUCCESS':'PROCESSING',reference};store.save(p.operationId,result);return done(result);
 }
 if(action==='submit'){
 const claim=store.claim(p.operationId,hash);if(claim.hash!==hash)return response({ok:false},409);
 // Durable claim happens BEFORE contacting RA. A crash, timeout or replay never resends.
 if(!claim.created)return done(claim.result);
 }
 let submitted=false;
 try{
 const raw=await upstream('/products/catalog','GET'),items=raw?.data;
 const matches=Array.isArray(items)?items.filter(i=>i.id===p.productId):[];const item=matches[0];
 if(raw?.success!==true||matches.length!==1||item.sku!==p.catalogSku||item.name!==p.name||item.type!=='recharge'||item.required_fields?.length!==1||item.required_fields[0]!==p.field||!Number.isFinite(Number(item.price))||Number(item.price)<=0||Number(item.price)>Number(p.maxPriceUsd))throw Error('PRODUCT');
 const validated=await upstream('/catalog/validate','POST',{product_id:p.productId,service_user_id:p.playerId});
 if(validated?.success!==true||validated.data?.supported!==true||validated.data?.status!==true)throw Error('ACCOUNT');
 if(action==='validate')return done({supported:true,status:true});
 const wallet=await upstream('/wallet','GET');if(wallet?.success!==true||wallet.data?.currency!=='USD'||!Number.isFinite(Number(wallet.data.balance))||Number(wallet.data.balance)<Number(item.price))throw Error('FUNDS');
 submitted=true;
 const rawBuy=await upstream('/buy/catalog','POST',{product_id:p.productId,quantity:1,[p.field]:p.playerId},p.operationId),d=rawBuy?.data;
 let result={status:'UNKNOWN'};
 if(rawBuy?.success===true&&safeRef(d?.order_id)&&d.item===p.name&&Number(d.amount_charged)>0&&Number(d.amount_charged)<=Number(p.maxPriceUsd))result={status:d.status==='COMPLETED'&&d.needs_review!==true?'SUCCESS':'PROCESSING',reference:d.order_id};
 store.save(p.operationId,result);return done(result);
 }catch{
 if(action==='validate')return response({ok:false,error:'VALIDATION_UNAVAILABLE'},503);
 const result={status:submitted?'UNKNOWN':'NOT_ACCEPTED'};store.save(p.operationId,result);return done(result);
 }
 }catch{return response({ok:false,error:'GATEWAY_UNAVAILABLE'},503);}
 };
}
