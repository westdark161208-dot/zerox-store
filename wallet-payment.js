(() => {
 const API='https://zerox-sixofire-api.westdark161208.workers.dev';
 const ROOT='/api/payments/mercadopago/funding';
 const q=id=>document.getElementById(id);
 const token=()=>{try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}};
 let generation=0,enabled=false;
 let attempt=new URL(location.href).searchParams.get('attempt');
 if(!/^[a-f0-9-]{36}$/.test(attempt||''))attempt=null;
 function clear(){generation++;enabled=false;q('funding-create').disabled=true;q('funding-refresh').disabled=true;q('funding-checkout').hidden=true;q('funding-checkout').removeAttribute('href');q('funding-result').textContent='';q('funding-status').textContent='Inicia sesión en la tienda y vuelve a consultar.';}
 async function api(path,options={}){
  const current=token(),version=generation;
  if(!current)throw Error('Inicia sesión con tu cuenta fundadora.');
  const response=await fetch(API+path,{...options,headers:{Authorization:'Bearer '+current,'Content-Type':'application/json',...options.headers},cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(version!==generation||token()!==current||document.hidden)throw Error('STALE_RESPONSE');
  if(!response.ok||!data.ok)throw Error(data.error==='FUNDING_PILOT_DISABLED'?'Esta prueba aún no está habilitada.':data.error==='CHECKOUT_RECONCILIATION_REQUIRED'?'El intento necesita revisión. No vuelvas a pagar hasta aclararlo.':'No se pudo completar la consulta.');
  return data;
 }
 async function refresh(){const version=generation;q('funding-refresh').disabled=true;try{
  const data=await api(ROOT+'/intents/'+attempt);
  const names={pending:'Pendiente de confirmación',verified:'Pago verificado, procesando saldo',confirmed:'Saldo abonado',failed:'Pago rechazado',cancelled:'Pago cancelado',review_required:'Revisión requerida'};
  if(data.checkoutUrl&&data.state==='pending'){const link=new URL(data.checkoutUrl);if(link.protocol==='https:'&&['www.mercadopago.com.mx','www.mercadopago.com'].includes(link.hostname)){q('funding-checkout').href=link.href;q('funding-checkout').hidden=false;}}else{q('funding-checkout').hidden=true;q('funding-checkout').removeAttribute('href');}
  q('funding-result').textContent=(names[data.state]||'Estado pendiente de revisión')+' · '+new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(data.amountCents/100);
 }catch(e){if(version===generation&&e.message!=='STALE_RESPONSE')q('funding-result').textContent=e.message;}finally{if(version===generation)q('funding-refresh').disabled=false;}}
 async function init(){clear();const version=generation;try{
  const data=await api('/api/admin/payments/mercadopago/status');enabled=data.checkoutEnabled===true;
  q('funding-status').textContent=enabled?'Prueba real habilitada solo para la cuenta fundadora.':'Prueba desactivada: pendiente de configuración y validación del servidor.';
  q('funding-create').disabled=!enabled||!!attempt;q('funding-amount').disabled=!!attempt;
  q('funding-refresh').disabled=!enabled||!attempt;
  if(enabled&&attempt)await refresh();
 }catch(e){if(version===generation&&e.message!=='STALE_RESPONSE')q('funding-status').textContent=e.message;}}
 q('funding-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!enabled||q('funding-create').disabled)return;
  const amount=q('funding-amount').value;
  if(!/^\d{1,3}(\.\d{1,2})?$/.test(amount)){q('funding-result').textContent='Indica un importe con máximo dos decimales.';return;}
  const cents=Math.round(Number(amount)*100);if(cents<1000||cents>20000)return;
  const version=generation;q('funding-create').disabled=true;q('funding-amount').disabled=true;
  attempt=attempt||crypto.randomUUID();history.replaceState(null,'','?attempt='+attempt);
  try{const data=await api(ROOT+'/checkout',{method:'POST',headers:{'Idempotency-Key':attempt},body:JSON.stringify({amountCents:cents})});
   const link=new URL(data.checkoutUrl);if(link.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(link.hostname))throw Error('Enlace de pago inválido.');
   q('funding-checkout').href=link.href;q('funding-checkout').hidden=false;q('funding-result').textContent='Pago preparado. Abre Mercado Pago para revisar y pagar el importe.';
  }catch(e){if(version===generation&&e.message!=='STALE_RESPONSE')q('funding-result').textContent=e.message;}
  finally{if(version===generation)q('funding-refresh').disabled=false;}
 });
 q('funding-refresh').onclick=refresh;
 window.addEventListener('storage',event=>{if(event.key==='zerox-session'||event.key===null)clear();});
 window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else init();});init();
})();
