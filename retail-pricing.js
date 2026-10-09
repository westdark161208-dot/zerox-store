/* Shared retail price policy. Values in the editor remain the merchant's base price.
   The published price includes processing costs for every retail payment method.
   Wallet funding and supplier/reseller balances do not use this function. */
(()=>{
 const policy=Object.freeze({version:'mx-2026-10-v1',rateBasisPoints:349,fixedCents:400,taxBasisPoints:1600});
 function priceCents(baseCents){
  if(!Number.isSafeInteger(baseCents)||baseCents<0||baseCents>100000000)throw Error('INVALID_RETAIL_PRICE');
  if(baseCents===0)return 0;
  // Integer arithmetic: gross - (gross * rate + fixed) * (1 + IVA) >= base.
  const scale=100000000n,tax=BigInt(10000+policy.taxBasisPoints);
  const numerator=BigInt(baseCents)*scale+BigInt(policy.fixedCents)*tax*10000n,denominator=scale-BigInt(policy.rateBasisPoints)*tax;
  return Number((numerator+denominator-1n)/denominator);
 }
 globalThis.ZXRetailPricing=Object.freeze({policy,priceCents,priceMXN:value=>priceCents(Math.round(Number(value)*100))/100});
})();
