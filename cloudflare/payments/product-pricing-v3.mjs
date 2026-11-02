import '../../retail-pricing.js';
import {retailDiscount} from '../coupons.mjs';
import {calculateQuote,feePolicy,quoteSchema,createQuote,acceptQuote} from './quotes-v3.mjs';
export const productQuotesEnabled=env=>env.MP_PRODUCT_QUOTES_V3==='true';
export async function productPricing(env,baseCents,couponCode,method,member){
 const enabled=productQuotesEnabled(env);
 const discount=await retailDiscount(env.DB,enabled?baseCents:globalThis.ZXRetailPricing.legacyPriceCents(baseCents),couponCode,method);
 if(member && !couponCode && !['ra','sf','ra-funds'].includes(method)){
   const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='zx_member_perks'").first();
   const perks=exists && await env.DB.prepare('SELECT rules FROM zx_member_perks WHERE user_id=?').bind(member.userId).first();
   if(perks){
     const percent=JSON.parse(perks.rules).reduce((best,rule)=>{
       const matches=rule.scope==='product'?rule.key===member.id:
         rule.scope==='category'?rule.key.toLowerCase()===member.category?.toLowerCase():
         rule.scope==='freefire'?member.game==='freefire':rule.scope===member.section;
       return matches?Math.max(best,rule.percent):best;
     },0);
     if(percent){discount.discountCents=Math.floor(discount.subtotalCents*percent/100);discount.amountCents=discount.subtotalCents-discount.discountCents;discount.memberPercent=percent}
   }
 }
 if(!enabled)return discount;
 const charge=calculateQuote(discount.amountCents,['ra','sf','ra-funds'].includes(method)?'wallet':method,feePolicy(env));
 return {...discount,amountCents:charge.totalCents,paymentQuote:charge,version:'v3'};
}
// Include destination, quantity and price snapshot: a quote cannot migrate to
// another product, coupon or account even when their totals happen to match.
async function contextFor(selection,pricing){
 const bytes=new TextEncoder().encode(JSON.stringify({selection,subtotal:pricing.subtotalCents,discount:pricing.discountCents,coupon:pricing.coupon?.code||'',base:pricing.paymentQuote.baseCents}));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return 'product:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function prepareProductQuote(env,userId,selection,pricing,method){
 if(!productQuotesEnabled(env)||!['wallet','all','card','spei'].includes(method))throw Error('PRODUCT_QUOTE_UNAVAILABLE');
 await quoteSchema(env.DB);
 return createQuote(env.DB,{userId,context:await contextFor(selection,pricing),baseCents:pricing.paymentQuote.baseCents,method,policy:feePolicy(env)});
}
export async function acceptProductQuote(env,userId,selection,pricing,body,requestKey){
 if(!productQuotesEnabled(env)||['ra','sf','ra-funds'].includes(body.method))return pricing;
 await quoteSchema(env.DB);
 const quote=await acceptQuote(env.DB,{id:body.quoteId,userId,context:await contextFor(selection,pricing),method:body.method,maxAmountCents:body.maxAmountCents,orderId:requestKey});
 // Preserve the accepted fee snapshot during its validity window; the catalog
// and discount are still revalidated by contextFor above.
 return {...pricing,amountCents:quote.totalCents,paymentQuote:quote};
}
