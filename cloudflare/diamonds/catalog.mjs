import '../../diamond-catalog.js';
export const providerPacks = Object.freeze([
  {diamonds:110,costCents:1407},{diamonds:341,costCents:4696},
  {diamonds:572,costCents:6561},{diamonds:1166,costCents:12206},
  {diamonds:2398,costCents:24260},{diamonds:6160,costCents:60081}
].map(p=>Object.freeze({...p,sku:null})));
// Integer-cent unbounded knapsack. Cost first; fewer calls break equal-cost ties.
export function createPlanner(packs=providerPacks,max=100892){
 const costs=new Float64Array(max+1).fill(Infinity),calls=new Int32Array(max+1).fill(2147483647),choice=new Int16Array(max+1).fill(-1);
 if(!packs.length||packs.some(p=>!Number.isSafeInteger(p.diamonds)||p.diamonds<1||!Number.isSafeInteger(p.costCents)||p.costCents<1))throw Error('INVALID_PACKS');
 costs[0]=0;calls[0]=0;
 for(let n=1;n<=max;n++)for(let i=0;i<packs.length;i++){
  const p=packs[i];if(n<p.diamonds)continue;
  const cost=costs[n-p.diamonds]+p.costCents,count=calls[n-p.diamonds]+1;
  if(cost<costs[n]||(cost===costs[n]&&count<calls[n])){costs[n]=cost;calls[n]=count;choice[n]=i;}
 }
 return amount=>{
  if(!Number.isSafeInteger(amount)||amount<1||amount>max||choice[amount]<0)throw Error('NO_EXACT_RECIPE');
  const counts=new Map();for(let n=amount;n;){const i=choice[n];counts.set(i,(counts.get(i)||0)+1);n-=packs[i].diamonds;}
  return [...counts].map(([i,quantity])=>({...packs[i],quantity})).sort((a,b)=>b.diamonds-a.diamonds);
 };
}
const plan=createPlanner();
export const catalog=Object.freeze(globalThis.ZXDiamondCatalog.map(p=>Object.freeze({...p,salePriceCents:p.salePriceMXN*100,recipe:Object.freeze(plan(p.diamonds).map(Object.freeze))})));
export const getProduct=id=>catalog.find(p=>p.id===id);
export const costOf=recipe=>recipe.reduce((sum,p)=>sum+p.costCents*p.quantity,0);
export function makeSnapshot(productId,uid){
 const p=getProduct(productId);if(!p)throw Error('INVALID_PRODUCT');
 if(!/^[0-9]{5,15}$/.test(uid))throw Error('INVALID_PLAYER_ID');
 return {productId:p.id,diamonds:p.diamonds,salePriceCents:p.salePriceCents,providerCostCents:costOf(p.recipe),currency:'MXN',playerId:uid,recipe:p.recipe.map(p=>({...p})),catalogVersion:'2026-09-28-v1'};
}
