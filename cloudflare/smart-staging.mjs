import { rechargeWebhook, scheduleCatalog } from './universal/runtime.mjs';

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/providers/rechargegames/webhook') return rechargeWebhook(request, env);
    if (path === '/health' && request.method === 'GET') {
      await env.DB.prepare('SELECT stamp FROM zx_smart_sync LIMIT 1').all();
      return Response.json({worker: 'zerox-smart-engine-staging', purchases: false});
    }
    return new Response(null, {status: 404});
  },
  scheduled(event, env, ctx) {
    if (env.RECHARGEGAMES_API_KEY) scheduleCatalog(event, env, ctx);
  }
};
