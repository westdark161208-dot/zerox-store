import {syncCatalog,rechargeWebhook} from '../../cloudflare/universal/runtime.mjs';
import {readRechargeGames} from '../../cloudflare/universal/rechargegames.mjs';
import {trialOrder} from '../../cloudflare/universal/orders.mjs';

export default {
  async fetch(request,env) {
    const path=new URL(request.url).pathname;
    if(path==='/health' && request.method==='GET'){
      const row=await env.DB.prepare("SELECT count(*) AS n FROM zx_smart_catalog WHERE provider='rechargegames'").first();
      return Response.json({service:'zerox-smart-engine-staging',livePurchases:false,catalogCount:row.n},{headers:{'Cache-Control':'no-store'}});
    }
    if(path==='/api/providers/rechargegames/webhook')return rechargeWebhook(request,env);
    if(path==='/trial' && request.method==='POST' && env.SMART_TRIALS_ENABLED==='true' &&
       env.STAGING_TRIAL_TOKEN?.length>=32 && request.headers.get('Authorization')==='Bearer '+env.STAGING_TRIAL_TOKEN)
      return trialOrder(env,await request.json());
    return new Response(null,{status:404});
  },
  async scheduled(event,env,ctx) {
    if(env.RECHARGEGAMES_CATALOG_ENABLED==='true')
      ctx.waitUntil(syncCatalog(env,'rechargegames',readRechargeGames,event.scheduledTime));
  }
};
