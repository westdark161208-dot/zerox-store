import {selectOffer} from './engine.mjs';

export async function selectCatalogOffer(env, order, now = Date.now()) {
  const {results} = await env.DB.prepare(`SELECT m.*, c.details, t.fx,t.source_fee,t.balance,t.fee_mxn,
    min(t.expires_at,s.stamp+7200000) AS expires_at FROM zx_smart_mapping m
    JOIN zx_smart_catalog c USING(provider,sku) JOIN zx_smart_sync s USING(provider)
    JOIN zx_smart_terms t ON t.provider=m.provider AND t.currency=json_extract(c.details,'$.currency')
    WHERE m.product_id=? AND m.region=? AND m.server=? AND m.delivery=?`)
    .bind(order.productId,order.region,order.server,order.delivery).all();
  const flags={rechargegames:'RECHARGEGAMES_CATALOG_ENABLED',recargasamerica:'SMART_RA_CATALOG_ENABLED',sixofire:'SMART_SIXOFIRE_CATALOG_ENABLED'};
  const offers=results.map(row=>{
    const item=JSON.parse(row.details), price=String(item.price);
    const [units,fraction='']=price.split('.');
    const cost=/^\d{1,9}(\.\d{1,6})?$/.test(price)?Number(units)*1000000+Number(fraction.padEnd(6,'0')):0;
    return {provider:row.provider,key:row.sku,productId:row.product_id,region:row.region,
      server:row.server,delivery:row.delivery,approved:true,enabled:env[flags[row.provider]]==='true',
      available:item.available===true && (!item.region || item.region===row.region) && (!item.delivery || item.delivery===row.delivery),sourceCost:cost,
      expiresAt:row.expires_at,fx:row.fx,sourceFee:row.source_fee,balance:row.balance,feeMxn:row.fee_mxn};
  });
  return selectOffer(order,offers,now);
}

// Founder-only rehearsal. A durable reference pins the SKU across retries or price changes.
export async function trialOrder(env, body, fetcher=fetch) {
  if(env.SMART_TRIALS_ENABLED!=='true') return new Response(null,{status:404});
  const {reference,playerId,serverId=null,productId,region,server,delivery,saleMxn,marginBps}=body;
  if(!/^[\w-]{1,60}$/.test(typeof reference==='string'?reference:'') ||
      ![playerId,productId,region,server,delivery].every(v=>typeof v==='string' && v.trim() && v.length<=240) ||
      !(serverId===null || typeof serverId==='string' && serverId.length<=100) ||
      !Number.isSafeInteger(saleMxn)||saleMxn<=0||!Number.isInteger(marginBps)||marginBps<0||marginBps>10000)
    return new Response(null,{status:400});
  const fingerprint=JSON.stringify([productId,region,server,delivery,playerId,serverId,saleMxn,marginBps]);
  const lookup=()=>env.DB.prepare('SELECT * FROM zx_smart_trials WHERE reference=?').bind(reference).first();
  let trial=await lookup();
  if(!trial){
    const offer=await selectCatalogOffer(env,body);
    if(!offer || offer.provider!=='rechargegames')return Response.json({simulationOnly:true,offer});
    await env.DB.prepare('INSERT INTO zx_smart_trials VALUES(?,?,?,?) ON CONFLICT(reference) DO NOTHING')
      .bind(reference,fingerprint,offer.provider,offer.key).run();
    trial=await lookup();
  }
  if(trial.fingerprint!==fingerprint)return new Response(null,{status:409});
  if(!env.RECHARGEGAMES_API_KEY || env.RECHARGEGAMES_CATALOG_ENABLED!=='true')return new Response(null,{status:503});
  const upstream=await fetcher('https://api.rechargegame.games/v1/orders',{method:'POST',redirect:'error',
    signal:AbortSignal.timeout(20000),headers:{'X-API-Key':env.RECHARGEGAMES_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({test:true,buyer_ref:'zx-trial-'+reference,product_key:trial.sku,player_id:playerId,server_id:serverId})});
  if(!upstream.ok)return Response.json({providerStatus:upstream.status},{status:502});
  const result=await upstream.json();
  return Response.json({simulationOnly:true,orderId:result.order_id,status:result.status});
}
