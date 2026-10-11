/* Shared retail price policy. Values in the editor remain the merchant's base price.
   The published price is the Editor base; method fees come from server quotes.
   Wallet funding and supplier/reseller balances do not use this function. */
(()=>{
 const policy=Object.freeze({version:'mx-2026-10-v1',rateBasisPoints:349,fixedCents:400,taxBasisPoints:1600});
 function legacyPriceCents(baseCents){
  if(!Number.isSafeInteger(baseCents)||baseCents<0||baseCents>100000000)throw Error('INVALID_RETAIL_PRICE');
  if(baseCents===0)return 0;
  // Integer arithmetic: gross - (gross * rate + fixed) * (1 + IVA) >= base.
  const scale=100000000n,tax=BigInt(10000+policy.taxBasisPoints);
  const numerator=BigInt(baseCents)*scale+BigInt(policy.fixedCents)*tax*10000n,denominator=scale-BigInt(policy.rateBasisPoints)*tax;
  return Number((numerator+denominator-1n)/denominator);
 }
 function priceCents(baseCents){if(!Number.isSafeInteger(baseCents)||baseCents<0||baseCents>100000000)throw Error('INVALID_RETAIL_PRICE');return baseCents;}
 function quoteSummary(q){
  if(!q||q.currency!=='MXN'||![q.baseCents,q.feeCents,q.taxCents,q.totalCents].every(Number.isSafeInteger)||q.baseCents<=0||q.feeCents<0||q.taxCents<0||q.baseCents+q.feeCents+q.taxCents!==q.totalCents)throw Error('INVALID_QUOTE');
  const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n/100)+' MXN';
  return 'Producto: '+money(q.baseCents)+' · Comisión: '+money(q.feeCents)+(q.taxCents?' · Impuesto sobre comisión: '+money(q.taxCents):'')+' · Total: '+money(q.totalCents);
 }
 globalThis.ZXRetailPricing=Object.freeze({quoteSummary,policy,priceCents,legacyPriceCents,priceMXN:value=>priceCents(Math.round(Number(value)*100))/100});
})();
