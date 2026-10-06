import {resolvedRaEnvironment} from '../providers/ra-associations.mjs';
import {purchaseConfiguration} from '../diamonds/purchases.mjs';
import {fundingPilotEnabled} from '../payments/funding-routes.mjs';
import {can} from '../security/permissions.mjs';
import {walletSchema,walletState} from './ledger.mjs';
export async function walletRoute(request,env,url,user,json) {
  const reply=(body,status=200)=>{const response=json(body,status);response.headers?.set('Cache-Control','no-store');return response;};
  if(!can(user,'wallet.self'))return reply({ok:false,error:'LOGIN_REQUIRED'},401);
  if(request.method!=='GET')return reply({ok:false,error:'WALLET_WRITES_NOT_ACTIVE'},405);
  if(url.pathname!=='/api/wallet/me')return reply({ok:false,error:'NOT_FOUND'},404);
  if(env.WALLET_READ_ENABLED!=='true')return reply({ok:false,error:'WALLET_NOT_ACTIVE'},503);
  await walletSchema(env.DB);
  if(user.isFounder===true)env=await resolvedRaEnvironment(env);
  return reply({ok:true,...await walletState(env.DB,user.id),topupsEnabled:false,fundingPilotAvailable:(user.isFounder===true||env.PUBLIC_COMMERCE_ENABLED==='true')&&fundingPilotEnabled(env),purchasesEnabled:(user.isFounder===true||env.PUBLIC_COMMERCE_ENABLED==='true')&&purchaseConfiguration(env).enabled});
}
