import {can} from '../security/permissions.mjs';
import {walletSchema,walletState} from './ledger.mjs';
export async function walletRoute(request,env,url,user,json) {
  if(!can(user,'wallet.self'))return json({ok:false,error:'LOGIN_REQUIRED'},401);
  if(request.method!=='GET')return json({ok:false,error:'WALLET_WRITES_NOT_ACTIVE'},405);
  if(url.pathname!=='/api/wallet/me')return json({ok:false,error:'NOT_FOUND'},404);
  if(env.WALLET_READ_ENABLED!=='true')return json({ok:false,error:'WALLET_NOT_ACTIVE'},503);
  await walletSchema(env.DB);
  return json({ok:true,...await walletState(env.DB,user.id),topupsEnabled:false,purchasesEnabled:false});
}
