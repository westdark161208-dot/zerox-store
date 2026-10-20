// Fixture shared with payment E2E; never a commercial RA mapping.
export const product=Object.freeze({id:999001,sku:'FIXTURE-ONLY-100',name:'Fixture FF 100 + 10',type:'recharge',price:'1',required_fields:['player_id']});
export function simulatedUpstream(mode='success'){
 if(!['success','processing','timeout','reject','partial'].includes(mode))throw Error('INVALID_SIMULATION');
 const calls=[];
 return {calls,async upstream(path,method,body,key){
 calls.push({path,method});
 if(path==='/products/catalog'&&method==='GET')return {success:true,data:[product]};
 if(path==='/wallet'&&method==='GET'){if(mode==='reject')throw Error('SIMULATED_REJECTION');return {success:true,data:{balance:100,currency:'USD'}};}
 if(path==='/catalog/validate'&&method==='POST')return {success:true,data:{supported:true,status:true}};
 if(path==='/buy/catalog'&&method==='POST'){
 if(body.product_id!==product.id||body.quantity!==1)throw Error('FIXTURE_SCOPE');
 if(mode==='timeout')throw Error('SIMULATED_TIMEOUT');
 if(mode==='partial')return {success:true,data:{status:'COMPLETED'}};
 return {success:true,data:{order_id:'SIM-'+key.replaceAll(':','-'),item:product.name,amount_charged:1,status:mode==='processing'?'PROCESSING':'COMPLETED'}};
 }
 if(/^\/catalog\/orders\/SIM-[a-f0-9-]+$/.test(path)&&method==='GET')return {success:true,data:{order_id:path.split('/').at(-1),product:product.name,status:'COMPLETED'}};
 throw Error('SIMULATION_ROUTE_DENIED');
 }};
}
