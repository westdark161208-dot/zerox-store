// Read-only operational overview. Never initialize or change business tables here.
export async function controlRoute(request,env,url,user,json){
 const reply=(data,status=200)=>{const response=json(data,status);response.headers?.set('Cache-Control','no-store');return response;};
 if(!user||user.status!=='active'||user.isFounder!==true)return reply({ok:false,error:'FORBIDDEN'},403);
 if(request.method!=='GET')return reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 if(url.pathname!=='/api/admin/control/overview')return reply({ok:false,error:'NOT_FOUND'},404);
 const tables=new Set((await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
 const read=async(table,sql)=>tables.has(table)?{available:true,...await env.DB.prepare(sql).first()}:{available:false};
 const metrics={};
 metrics.users=await read('zx_users',"SELECT COUNT(*) total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active FROM zx_users");
 metrics.catalog=await read('zx_catalog','SELECT COUNT(*) total,COALESCE(SUM(active),0) active FROM zx_catalog');
 metrics.streaming=await read('zx_streaming','SELECT COUNT(*) products,COALESCE(SUM(stock),0) units,COALESCE(SUM(CASE WHEN active=1 AND stock=0 THEN 1 ELSE 0 END),0) soldOut,COALESCE(SUM(CASE WHEN active=1 AND stock<=threshold THEN 1 ELSE 0 END),0) lowStock FROM zx_streaming');
 metrics.resellers=await read('zx_r_orders',"SELECT COUNT(*) total,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) pending FROM zx_r_orders");
 metrics.deposits=await read('zx_r_topups',"SELECT COUNT(*) total,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) pending FROM zx_r_topups");
 metrics.diamonds=await read('zx_diamond_orders','SELECT COUNT(*) total FROM zx_diamond_orders');
 metrics.testPayments=await read('zx_mp_test_orders','SELECT COUNT(*) total FROM zx_mp_test_orders');
 metrics.resellerBalance=await read('zx_r_ledger','SELECT COALESCE(SUM(amount),0) cents FROM zx_r_ledger');
 metrics.customerWallet=await read('zx_wallet_ledger',"SELECT COALESCE(SUM(amount_cents),0) cents,COUNT(*) movements FROM zx_wallet_ledger WHERE currency='MXN'");
 const recent=async(table,sql)=>tables.has(table)?(await env.DB.prepare(sql).all()).results:[];
 const orders=await recent('zx_r_orders','SELECT id,product_name AS product,status,total AS cents,created_at AS created FROM zx_r_orders ORDER BY created_at DESC LIMIT 20');
 const publications=await recent('zx_store_editor_history','SELECT revision,created_at AS created FROM zx_store_editor_history ORDER BY revision DESC LIMIT 10');
 return reply({ok:true,generatedAt:new Date().toISOString(),metrics,orders,publications,configuration:{paymentMode:'test',automaticDelivery:false,providerPurchases:false,customerWalletReadEnabled:env.WALLET_READ_ENABLED==='true',providerBalanceSync:'not_connected',passkeys:'pending',delegatedRoles:'pending'}});
}
