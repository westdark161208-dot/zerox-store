// Read-only Control views. No funding, provider orders or balance adjustments.
(() => {
  const API='https://zerox-sixofire-api.westdark161208.workers.dev';
  const q=id=>document.getElementById(id);
  let generation=0, nextCursor=null, providerReady=false, paymentReady=false;
  const pending=new Set();
  const token=()=>{try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}};
  const money=cents=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100);
  function clear(){
    generation++; for(const controller of pending)controller.abort();pending.clear();
    nextCursor=null;providerReady=false;paymentReady=false;
    q('wallet-audit-rows').replaceChildren();
    for(const id of ['wallet-audit-status','provider-status','provider-balance-result','payment-config-status','payment-audit-status','payment-account-status'])q(id).textContent='';
    q('wallet-audit-next').hidden=true;q('payment-audit-id').value='';
    for(const id of ['wallet-audit-refresh','wallet-audit-next','provider-check','provider-balance','payment-config-check','payment-audit-check','payment-account-check'])q(id).disabled=true;
  }
  const reasons={PRODUCT_PAYMENTS_DISABLED:'pagos de productos pendientes de activación',DELIVERY_DISABLED:'entrega automática pendiente',PROVIDER_CONTRACT_UNVERIFIED:'contrato de entrega por confirmar',RA_MAPPING_MISSING:'paquetes de diamantes por asociar',RA_MAPPING_INVALID:'asociación de paquetes por revisar',RA_READ_DISABLED:'consultas del proveedor desactivadas',PROVIDER_KEY_MISSING:'credencial del proveedor pendiente',PROVIDER_TEST_KEY:'la credencial es de prueba',PRODUCTION_PAYMENT_CONFIG_MISSING:'configuración de pagos pendiente'};
  const diagnostics={
    MP_PRODUCTION_READ_DISABLED:'La consulta de producción está desactivada en el servidor.',
    MP_PRODUCTION_CONFIG_MISSING:'Falta la credencial de producción o la cuenta receptora en el servidor.',
    MP_PRODUCTION_ACCOUNT_MISMATCH:'La cuenta de la credencial no coincide con la receptora configurada en México. Revisa el User ID y la cuenta de Mercado Pago.',
    MP_PRODUCTION_CREDENTIAL_REJECTED:'Mercado Pago rechazó la credencial (401). Revisa el Access Token de producción guardado en Cloudflare.',
    MP_PRODUCTION_ACCESS_REJECTED:'Mercado Pago denegó el acceso (403). Revisa los permisos y el estado de la aplicación.',
    MP_PRODUCTION_RATE_LIMITED:'Mercado Pago limitó las consultas (429). Espera un momento y vuelve a intentar.',
    MP_PRODUCTION_TIMEOUT:'Mercado Pago no respondió a tiempo. Vuelve a intentar.',
    MP_PRODUCTION_CONNECTION_FAILED:'El servidor no pudo conectarse con Mercado Pago. Vuelve a intentar.',
    MP_PRODUCTION_EVIDENCE_REJECTED:'El pago no coincide con la cuenta, moneda o modo de producción esperado.'
  };
  async function read(path, apply, fail, finish){
    const current=token(), version=generation;
    if(!current||q('workspace').hidden)return;
    const controller=new AbortController();pending.add(controller);
    const timer=setTimeout(()=>controller.abort(),15000);
    const valid=()=>version===generation&&token()===current&&!q('workspace').hidden&&!document.hidden;
    try{
      const response=await fetch(API+path,{headers:{Authorization:'Bearer '+current},cache:'no-store',signal:controller.signal});
      if(response.status===403)throw Error('Acceso no autorizado.');
      if(response.status===401)throw Error('Tu sesión expiró. Inicia sesión de nuevo.');
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw Error(Object.hasOwn(diagnostics,data?.error)?diagnostics[data.error]:'Consulta no disponible.');
      if(valid())apply(data);
    }catch(error){if(valid())fail(error.name==='AbortError'?'La consulta tardó demasiado. Puedes reintentar.':error.message);}
    finally{clearTimeout(timer);pending.delete(controller);if(valid())finish();}
  }
  function wallet(older=false){
    const cursor=older?nextCursor:null;
    q('wallet-audit-refresh').disabled=true;q('wallet-audit-next').disabled=true;
    q('wallet-audit-status').textContent='Consultando movimientos…';q('wallet-audit-rows').replaceChildren();
    read('/api/admin/control/wallet'+(cursor?'?before='+encodeURIComponent(cursor):''),data=>{
      nextCursor=data.nextCursor;
      q('wallet-audit-next').hidden=!nextCursor;
      q('wallet-audit-status').textContent=!data.available?'El libro de Wallet aún no está disponible.':data.movements.length?'Últimos movimientos del registro consultado.':'No hay movimientos registrados.';
      const names={credit:'Abono',purchase:'Compra',refund:'Reembolso'};
      for(const m of data.movements){
        const tr=document.createElement('tr');
        for(const value of [m.id,names[m.kind]||m.kind,money(m.amountCents),money(m.resultingBalanceCents),m.status,m.createdAt]){
          const td=document.createElement('td');td.textContent=value;tr.append(td);
        }
        q('wallet-audit-rows').append(tr);
      }
    },message=>{q('wallet-audit-status').textContent=message;},()=>{
      q('wallet-audit-refresh').disabled=false;q('wallet-audit-next').disabled=false;
    });
  }
  function provider(){
    providerReady=false;q('provider-check').disabled=true;q('provider-balance').disabled=true;
    q('provider-balance-result').textContent='';q('provider-status').textContent='Consultando configuración…';
    read('/api/admin/providers/recargas-america/status',data=>{
      providerReady=data.readEnabled===true&&data.keyConfigured===true;
      q('provider-status').textContent=providerReady?(data.purchasesEnabled?'Piloto de diamantes configurado. Cada compra comprobará producto, ID y saldo antes de cobrar.':'Consultas habilitadas. Entrega pendiente: '+(data.reasons||[]).map(r=>reasons[r]||'validación del servidor pendiente').join(' · ')):!data.readEnabled?'Integración de consulta desactivada.':'Integración pendiente de credencial del servidor.';
    },message=>{q('provider-status').textContent=message;},()=>{
      q('provider-check').disabled=false;q('provider-balance').disabled=!providerReady;
    });
  }
  function balance(){
    if(!providerReady||q('provider-balance').disabled)return;
    q('provider-check').disabled=true;q('provider-balance').disabled=true;
    q('provider-balance-result').textContent='Consultando saldo…';
    read('/api/admin/providers/recargas-america/wallet',data=>{
      q('provider-balance-result').textContent=`Saldo reportado: ${data.data.balance} ${data.data.currency} · Consulta: ${new Date(data.syncedAt).toLocaleString('es-MX')}`;
    },message=>{q('provider-balance-result').textContent=message;},()=>{
      q('provider-check').disabled=false;q('provider-balance').disabled=!providerReady;
    });
  }
  function paymentConfig(){
    paymentReady=false;q('payment-account-check').disabled=true;q('payment-account-status').textContent='';q('payment-config-check').disabled=true;q('payment-audit-check').disabled=true;
    q('payment-audit-status').textContent='';q('payment-config-status').textContent='Consultando configuración…';
    read('/api/admin/payments/mercadopago/status',data=>{
      paymentReady=data.readEnabled&&data.tokenConfigured&&data.collectorConfigured;
      q('payment-config-status').textContent=paymentReady?`Consulta habilitada · Piloto de abono: ${data.checkoutEnabled?'habilitado para fundador':'desactivado'} · Firma webhook: ${data.webhookConfigured?'configurada':'pendiente'}.`:`Consulta: ${data.readEnabled?'habilitada':'desactivada'} · Credencial: ${data.tokenConfigured?'configurada':'pendiente'} · Cuenta receptora: ${data.collectorConfigured?'configurada':'pendiente'} · Firma webhook: ${data.webhookConfigured?'configurada':'pendiente'}`;
    },message=>{q('payment-config-status').textContent=message;},()=>{q('payment-config-check').disabled=false;q('payment-audit-check').disabled=!paymentReady;q('payment-account-check').disabled=!paymentReady;});
  }
  function paymentAccount(){
    if(!paymentReady||q('payment-account-check').disabled)return;
    q('payment-account-check').disabled=true;q('payment-config-check').disabled=true;
    q('payment-account-status').textContent='Verificando conexión y cuenta receptora…';
    read('/api/admin/payments/mercadopago/account',data=>{
      q('payment-account-status').textContent=data.account.receiverMatched===true?'La credencial corresponde a la cuenta receptora configurada en México. Esta consulta no valida un pago ni abona saldo.':'La cuenta receptora no pudo verificarse.';
    },message=>{q('payment-account-status').textContent=message;},()=>{q('payment-config-check').disabled=false;q('payment-account-check').disabled=!paymentReady;});
  }
  function paymentAudit(){
    if(!paymentReady||q('payment-audit-check').disabled)return;
    const id=q('payment-audit-id').value.trim();
    if(!/^\d{1,30}$/.test(id)){q('payment-audit-status').textContent='Escribe un ID numérico de pago válido.';return;}
    q('payment-config-check').disabled=true;q('payment-audit-check').disabled=true;q('payment-audit-status').textContent='Consultando pago…';
    read('/api/admin/payments/mercadopago/payments/'+id,data=>{
      const p=data.payment;q('payment-audit-status').textContent=`Pago ${p.id} · ${p.status} · ${money(p.amountCents)} MXN · Sin abono ni entrega desde esta consulta.`;
    },message=>{q('payment-audit-status').textContent=message;},()=>{q('payment-config-check').disabled=false;q('payment-audit-check').disabled=!paymentReady;q('payment-account-check').disabled=!paymentReady;});
  }
  q('payment-account-check').onclick=paymentAccount;q('payment-config-check').onclick=paymentConfig;q('payment-audit-check').onclick=paymentAudit;
  q('wallet-audit-refresh').onclick=()=>wallet();q('wallet-audit-next').onclick=()=>wallet(true);
  q('provider-check').onclick=provider;q('provider-balance').onclick=balance;
  window.addEventListener('zx-control-clear',clear);
  window.addEventListener('zx-control-ready',()=>{
    q('wallet-audit-refresh').disabled=false;q('provider-check').disabled=false;q('payment-config-check').disabled=false;
    q('wallet-audit-status').textContent='Consulta los movimientos cuando lo necesites.';
    q('provider-status').textContent='Consulta la configuración antes de solicitar saldo.';
  });
  clear();
})();
