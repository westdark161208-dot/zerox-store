// Opt-in cutover. Legacy prices/history remain available until migration is verified.
export const singleLevel=env=>env.RESELLERS_SINGLE_LEVEL_ENABLED==='true';
export function sectionName(value){const v=String(value||'').trim();return ['diamantes','diamantes ilimitados'].includes(v.toLocaleLowerCase('es'))?'Diamantes Ilimitados':v;}
export function discountedCents(base,discount=0){
 if(!Number.isSafeInteger(base)||base<0||base>100000000||!Number.isFinite(discount)||discount<0||discount>=100||Math.abs(discount*100-Math.round(discount*100))>1e-8)throw Error('INVALID_SECTION_PRICE');
 return Math.round(base*(10000-Math.round(discount*100))/10000);
}
export function applySectionPricing(products,overrides){
 const discounts=overrides.__sectionDiscounts||{};
 return products.map(p=>{const category=sectionName(overrides[p.id]?.category??p.category),price=discountedCents(p.prices[0],discounts[category]??0);return {...p,...overrides[p.id],id:p.id,category,basePriceCents:p.prices[0],prices:Array(7).fill(price)};});
}
