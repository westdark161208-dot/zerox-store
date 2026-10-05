import {readRecargasAmerica} from './recargas-america.mjs';
// Supplier liquidity is not customer wallet credit. No financial writes here.
export async function founderBalancesRoute(request,env,user,reply,fetcher=fetch){
 if(!user?.isFounder||user.status!=='active')return reply({ok:false,error:'FORBIDDEN'},403);
 if(request.method!=='GET')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 let ra;try{const wallet=await readRecargasAmerica(env,'wallet',fetcher);const value=Number(wallet.balance);const estimatedMxnCents=['USD','USDT'].includes(wallet.currency)?Math.floor(value*1699):wallet.currency==='MXN'?Math.floor(value*100):null;
 ra={available:true,balance:wallet.balance,currency:wallet.currency,estimatedMxnCents:Number.isSafeInteger(estimatedMxnCents)?estimatedMxnCents:null,referenceRate:16.99};}catch{ra={available:false,error:'BALANCE_UNAVAILABLE'};}
 // Current documented SF endpoints expose products/orders, not monetary wallet balances.
 // Do not invent an endpoint, infer funds from orders, or substitute Garena diamonds.
 return reply({ok:true,queriedAt:new Date().toISOString(),balances:{ra,sf:{available:false,error:'BALANCE_CONTRACT_PENDING'}},walletCredited:false});
}
