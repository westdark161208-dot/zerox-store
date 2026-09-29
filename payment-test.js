(()=>{
 const API='https://zerox-sixofire-api.westdark161208.workers.dev/api/payments/mercadopago/test';
 const $=id=>document.getElementById(id);
 const say=s=>$('message').textContent=s;
 let token='',attempt=new URL(location.href).searchParams.get('attempt')||sessionStorage.getItem('zx-mp-test-attempt')||'';
 const errors={FOUNDER_REQUIRED:'Inicia sesión en la tienda con tu cuenta fundadora y vuelve a esta página.',MP_TEST_TOKEN_MISSING:'Falta guardar MP_ACCESS_TOKEN_TEST en el Worker.',TEST_SELLER_REQUIRED:'La credencial no identifica una cuenta vendedora de prueba. No se creó el checkout. Revisa en Mercado Pago la cuenta de prueba Vendedor y sus credenciales.',MP_HTTP_401:'Mercado Pago rechazó la credencial. Revisa el secreto de prueba.',ATTEMPT_INCOMPLETE_CREATE_NEW:'El intento no terminó. Consulta su estado o inicia una nueva prueba.'};
 async function api(path,options={}){
  const r=await fetch(API+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(30000)});
  const b=await r.json();if(!r.ok||!b.ok)throw Error(errors[b.error]||('No se pudo completar: '+(b.error||r.status)));return b;
 }
 async function run(button,fn){button.disabled=true;try{await fn();}catch(e){say(e.message);}finally{button.disabled=false;}}
 function remember(id){attempt=id;sessionStorage.setItem('zx-mp-test-attempt',id);$('refresh').hidden=false;$('reset').hidden=false;}
 $('create').onclick=()=>run($('create'),async()=>{
  if(!attempt)remember(crypto.randomUUID());
  say('Creando checkout de prueba…');
  const b=await api('/checkout',{method:'POST',headers:{'Idempotency-Key':attempt},body:JSON.stringify({productId:$('product').value})});
  $('checkout').href=b.checkoutUrl;$('checkout').hidden=false;
  say('Checkout preparado. Ábrelo y utiliza únicamente la cuenta compradora de prueba. Después consulta el resultado aquí.');
 });
 $('refresh').onclick=()=>run($('refresh'),async()=>{
  const b=await api('/orders/'+attempt);
  const states={approved:'Aprobado',pending:'Pendiente',in_process:'En revisión',rejected:'Rechazado',cancelled:'Cancelado',refunded:'Reembolsado',charged_back:'Contracargo'};
  say('Estado confirmado por Mercado Pago: '+(states[b.state]||b.state)+'.\nPrueba sin entrega de diamantes.');
 });
 $('reset').onclick=()=>{attempt='';sessionStorage.removeItem('zx-mp-test-attempt');$('checkout').hidden=true;$('refresh').hidden=true;$('reset').hidden=true;say('Puedes crear otra prueba.');};
 (async()=>{try{
  token=JSON.parse(localStorage.getItem('zerox-session')||'null')?.token||'';
  if(!token)throw Error(errors.FOUNDER_REQUIRED);
  const b=await api('/status');
  for(const p of globalThis.ZXDiamondCatalog){const o=document.createElement('option');o.value=p.id;o.textContent=p.diamonds.toLocaleString('es-MX')+' 💎 — $'+p.salePriceMXN.toLocaleString('es-MX')+' MXN';$('product').append(o);}
  $('controls').hidden=false;$('create').disabled=!b.tokenConfigured;
  say(b.tokenConfigured?'Secreto detectado. '+(b.webhookConfigured?'Notificaciones configuradas.':'Falta configurar la firma de Webhooks; puedes consultar el resultado manualmente.'):'Falta el secreto MP_ACCESS_TOKEN_TEST.');
  if(/^[a-f0-9-]{36}$/.test(attempt)){remember(attempt);$('refresh').click();}else attempt='';
 }catch(e){say(e.message);}})();
})();
