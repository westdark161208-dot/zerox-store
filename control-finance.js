// Read-only Control views. No funding, provider orders or balance adjustments.
(() => {
  const API='https://zerox-sixofire-api.westdark161208.workers.dev';
  const q=id=>document.getElementById(id);
  let generation=0, nextCursor=null, providerReady=false;
  const pending=new Set();
  const token=()=>{try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}};
  const money=cents=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100);
  function clear(){
    generation++; for(const controller of pending)controller.abort();pending.clear();
    nextCursor=null;providerReady=false;
    q('wallet-audit-rows').replaceChildren();
    for(const id of ['wallet-audit-status','provider-status','provider-balance-result'])q(id).textContent='';
    q('wallet-audit-next').hidden=true;
    for(const id of ['wallet-audit-refresh','wallet-audit-next','provider-check','provider-balance'])q(id).disabled=true;
  }
  async function read(path, apply, fail, finish){
    const current=token(), version=generation;
    if(!current||q('workspace').hidden)return;
    const controller=new AbortController();pending.add(controller);
    const timer=setTimeout(()=>controller.abort(),15000);
    const valid=()=>version===generation&&token()===current&&!q('workspace').hidden&&!document.hidden;
    try{
      const response=await fetch(API+path,{headers:{Authorization:'Bearer '+current},cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error(response.status===403?'Acceso no autorizado.':response.status===401?'Tu sesión expiró. Inicia sesión de nuevo.':'Consulta no disponible.');
      const data=await response.json();if(!data.ok)throw Error('Consulta no disponible.');
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
      q('provider-status').textContent=providerReady?'Consulta de saldo habilitada. Compras automáticas desactivadas.':!data.readEnabled?'Integración de consulta desactivada.':'Integración pendiente de credencial del servidor.';
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
  q('wallet-audit-refresh').onclick=()=>wallet();q('wallet-audit-next').onclick=()=>wallet(true);
  q('provider-check').onclick=provider;q('provider-balance').onclick=balance;
  window.addEventListener('zx-control-clear',clear);
  window.addEventListener('zx-control-ready',()=>{
    q('wallet-audit-refresh').disabled=false;q('provider-check').disabled=false;
    q('wallet-audit-status').textContent='Consulta los movimientos cuando lo necesites.';
    q('provider-status').textContent='Consulta la configuración antes de solicitar saldo.';
  });
  clear();
})();
