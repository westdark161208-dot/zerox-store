// Private read-only adapters. Fixed origins and no raw provider payloads or errors.
const text=v=>['string','number'].includes(typeof v)?String(v).slice(0,120):null;
const count=v=>v!==null&&v!==undefined&&v!==''&&Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):null;
export async function integrationRead(env,url,reply,fetcher=fetch){
 const path=url.pathname;
 if(path==='/api/admin/providers/integrations/status')return reply({ok:true,integrations:[
  {id:'sixofire',name:'Sixofire',keyConfigured:!!env.SIXOFIRE_API_KEY,capabilities:['catalog'],purchasesEnabled:false},
  {id:'freefire-info',name:'Free Fire Community',keyConfigured:!!env.FF_INFO_API_KEY,capabilities:['player'],purchasesEnabled:false}
 ]});
 let endpoint,headers,kind;
 if(path==='/api/admin/providers/sixofire/catalog'){
  if(!env.SIXOFIRE_API_KEY)return reply({ok:false,error:'PROVIDER_KEY_MISSING'},503);
  endpoint='https://api.sixofire.net/account/shop/items';headers={'X-API-Key':env.SIXOFIRE_API_KEY};kind='catalog';
 }else if(path==='/api/admin/providers/sixofire/order-access'){
  if(!env.SIXOFIRE_API_KEY)return reply({ok:false,error:'PROVIDER_KEY_MISSING'},503);
  endpoint='https://api.sixofire.net/account/shop/orders?page=1&limit=1';headers={'X-API-Key':env.SIXOFIRE_API_KEY};kind='order-access';
 }else if(path==='/api/admin/providers/freefire-info/player'){
  const uid=url.searchParams.get('uid'),region=url.searchParams.get('region')||'br';
  if(!/^\d{5,15}$/.test(uid||'')||!['br','us','sac','na','eu','ind','sg','id','th','vn','tw','me','pk','bd','cis'].includes(region))return reply({ok:false,error:'INVALID_PLAYER_QUERY'},400);
  if(!env.FF_INFO_API_KEY)return reply({ok:false,error:'PROVIDER_KEY_MISSING'},503);
  endpoint='https://developers.freefirecommunity.com/api/v1/info?'+new URLSearchParams({uid,region});headers={'x-api-key':env.FF_INFO_API_KEY};kind='player';
 }else return reply({ok:false,error:'NOT_FOUND'},404);
 try{
  const response=await fetcher(endpoint,{method:'GET',redirect:'manual',headers:{...headers,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)return reply({ok:false,error:response.status===401||response.status===403?'PROVIDER_CREDENTIAL_REJECTED':response.status===429?'PROVIDER_RATE_LIMITED':'PROVIDER_UNAVAILABLE'},503);
  const raw=await response.json();let data;
  if(kind==='order-access'){
   if(raw.status!==true||raw.code!==200||!raw.data||typeof raw.data!=='object')throw Error('invalid');
   data={orderReadAvailable:true,deliveryEnabled:false,balanceVerified:false};
  }else if(kind==='player'){
   const b=raw.basicInfo||raw.player?.basicInfo;
   if(!b||!text(b.nickname)||String(b.accountId)!==url.searchParams.get('uid'))throw Error('invalid');
   data={uid:text(b.accountId),nickname:text(b.nickname),region:text(b.region),level:count(b.level),rank:count(b.rank),likes:count(b.liked??b.likes)};
  }else{
   const items=Array.isArray(raw)?raw:raw.items||raw.data?.items||raw.data;
   if(!Array.isArray(items))throw Error('invalid');
   data={total:items.length,items:items.slice(0,100).map(i=>({id:text(i.id??i.item_id??i.product_id),name:text(i.name??i.title),available:i.available===true&&i.isActive===true,itemType:text(i.itemType),diamonds:count(i.diamondQuantity),regions:Array.isArray(i.availableRegions)?i.availableRegions.map(text).filter(Boolean).slice(0,20):[]} )).filter(i=>i.id||i.name)};
  }
  return reply({ok:true,data,queriedAt:new Date().toISOString(),purchasesEnabled:false});
 }catch{return reply({ok:false,error:'PROVIDER_UNAVAILABLE'},503);}
}
