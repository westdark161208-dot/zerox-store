import {readRaFounderService} from './ra-admin-service.mjs';

async function rechargeWallet(env, fetcher) {
  if (!env.RECHARGEGAMES_API_KEY) throw Error();
  const response = await fetcher('https://api.rechargegame.games/v1/balance', {
    headers: {'X-API-Key': env.RECHARGEGAMES_API_KEY},
    redirect: 'error', signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw Error();
  const data = await response.json();
  if (!/^\d+(\.\d{1,6})?$/.test(data.balance_usdt)) throw Error();
  return {balance: data.balance_usdt, currency: 'USDT',
    movements: Array.isArray(data.ledger) ? data.ledger.slice(0,25).map(row => ({
      kind: String(row.kind), amount: String(row.amount), at: Number(row.at)
    })) : null};
}

export async function controlBalances(request, env, user, reply, fetcher = fetch) {
  if (!user?.isFounder || user.status !== 'active') return reply({ok:false},403);
  if (request.method !== 'GET') return reply({ok:false},405);
  const [ra, rg, settings] = await Promise.allSettled([
    readRaFounderService(env,'wallet'), rechargeWallet(env,fetcher),
    Promise.resolve().then(() => env.DB.prepare('SELECT settings_json FROM zx_market_settings WHERE id=1').first())
  ]);
  const rate = JSON.parse(settings.value?.settings_json || '{}').usdMxn;
  const balances = {sf:{state:'Consulta no disponible'}};
  for (const [key,result] of Object.entries({ra,rg})) {
    balances[key] = {state:'Sin conexión'};
    if (result.status !== 'fulfilled') continue;
    const {balance,currency,movements} = result.value;
    const factor = currency === 'MXN' ? 1 : ['USD','USDT'].includes(currency) && rate > 0 ? rate : null;
    balances[key] = {state:'Conectado', balance,currency,movements,
      mxn: factor === null ? null : Number(balance)*factor};
  }
  return reply({balances,rate:rate || null,queriedAt:new Date().toISOString()});
}
