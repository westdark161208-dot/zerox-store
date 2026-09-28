import {catalog,getProduct} from './catalog.mjs';
import {createOrder} from './engine.mjs';
export async function diamondRoute(request,env,url,user,json){
 if(request.method==='GET'&&url.pathname==='/api/diamonds/catalog')return json({ok:true,automaticDelivery:false,paymentsEnabled:false,products:catalog.map(({recipe,salePriceCents,...p})=>p)});
 if(request.method==='POST'&&url.pathname==='/api/diamonds/preview'){
  const b=await request.json(),p=getProduct(b.productId);
  if(!p||!/^[0-9]{5,15}$/.test(String(b.playerId||'')))return json({ok:false,error:'INVALID_PRODUCT_OR_PLAYER'},400);
  return json({ok:true,product:{id:p.id,diamonds:p.diamonds,salePriceMXN:p.salePriceMXN},playerVerified:false,automaticDelivery:false,paymentsEnabled:false});
 }
 // Requires an explicit server-side activation after the D1 migration. No payments collected.
 if(env.DIAMOND_ORDER_DRAFTS_ENABLED!=='true')return json({ok:false,error:'DIAMOND_ORDERS_NOT_ACTIVE'},503);
 if(!user)return json({ok:false,error:'AUTH_REQUIRED'},401);
 if(request.method==='POST'&&url.pathname==='/api/diamonds/orders'){
  const b=await request.json();if(b.playerConfirmed!==true)return json({ok:false,error:'PLAYER_CONFIRMATION_REQUIRED'},400);
  try{const p=await createOrder(env.DB,{userId:user.id,requestKey:request.headers.get('Idempotency-Key')||'',productId:b.productId,playerId:String(b.playerId||'')});return json({ok:true,order:{id:p.id,state:p.state,diamonds:p.diamonds,priceMXN:p.sale_price_cents/100,playerId:p.player_id}});}
  catch(e){return json({ok:false,error:e.message},400);}
 }
 const match=url.pathname.match(/^\/api\/diamonds\/orders\/([a-f0-9-]{36})$/);
 if(match&&request.method==='GET'){
  const p=await env.DB.prepare('SELECT id,state,diamonds,delivered,sale_price_cents,player_id FROM zx_diamond_orders WHERE id=? AND user_id=?').bind(match[1],user.id).first();
  return p?json({ok:true,order:{id:p.id,state:p.state,diamonds:p.diamonds,delivered:p.delivered,priceMXN:p.sale_price_cents/100,playerId:p.player_id}}):json({ok:false,error:'NOT_FOUND'},404);
 }
 return json({ok:false,error:'NOT_FOUND'},404);
}
