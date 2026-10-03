/* Private account services. No tokens, balances or histories are persisted here. */
(() => {
  const el=id=>document.getElementById(id);
  let generation=0;
  const money=cents=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100)+' MXN';
  const date=value=>{
    const parsed=new Date(value?.includes('T')?value:String(value).replace(' ','T')+'Z');
    return Number.isNaN(parsed.getTime())?'Fecha no disponible':parsed.toLocaleString('es-MX');
  };
  const current=()=>getZeroXSession()?.token||null;
  const valid=(version,token)=>version===generation && token && token===current();
  function clear() {
    generation++;
    el('zx-wallet-balance').hidden=true;el('zx-wallet-balance').textContent='';
    el('zx-wallet-movements').replaceChildren();el('zx-session-list').replaceChildren();
    el('zx-sessions-revoke-all').hidden=true;
    el('zx-wallet-status').textContent='Consulta tu saldo disponible en pesos mexicanos.';
    el('zx-sessions-status').textContent='';
    for(const id of ['zx-wallet-refresh','zx-sessions-refresh','zx-sessions-revoke-all'])el(id).disabled=false;
  }
  window.zxResetAccountServices=clear;
  const message=error=>error.status===401?'Tu sesión terminó. Vuelve a iniciar sesión.':
    ['WALLET_NOT_ACTIVE','NOT_FOUND'].includes(error.message)?'Este servicio todavía no está habilitado.':
    'No pudimos consultar el servicio. Inténtalo de nuevo.';
  el('zx-wallet-refresh').addEventListener('click',async()=>{
    const version=generation,token=current(),button=el('zx-wallet-refresh');if(!token)return;
    button.disabled=true;el('zx-wallet-status').textContent='Consultando saldo…';
    el('zx-wallet-balance').hidden=true;el('zx-wallet-movements').replaceChildren();
    try {
      const data=await zeroxAuthRequest('/api/wallet/me',{cache:'no-store'});
      if(!valid(version,token))return;
      if(data.currency!=='MXN'||!Number.isSafeInteger(data.availableCents)||!Array.isArray(data.movements))throw Error('INVALID_RESPONSE');
      el('zx-wallet-balance').textContent=money(data.availableCents);el('zx-wallet-balance').hidden=false;
      el('zx-wallet-status').textContent=data.movements.length?'Últimos movimientos confirmados.':'Aún no tienes movimientos en tu wallet.';
      for(const movement of data.movements){
        const row=document.createElement('li');
        const title=document.createElement('strong'),detail=document.createElement('small');
        title.textContent=({credit:'Abono',purchase:'Compra',refund:'Devolución'}[movement.kind]||'Movimiento')+' · '+money(movement.amountCents);
        detail.textContent=date(movement.createdAt);row.append(title,detail);el('zx-wallet-movements').append(row);
      }
    }catch(error){if(valid(version,token))el('zx-wallet-status').textContent=message(error)}
    finally{if(valid(version,token))button.disabled=false}
  });
  async function revoke(sessionId=null){
    const version=generation,token=current();if(!token)return;
    if(!window.confirm(sessionId?'¿Cerrar esta sesión?':'Se cerrarán todas tus sesiones, incluida esta. ¿Continuar?'))return;
    const controls=[...el('zx-session-list').querySelectorAll('button'),el('zx-sessions-revoke-all'),el('zx-sessions-refresh')];
    controls.forEach(b=>b.disabled=true);
    try{
      const data=await zeroxAuthRequest('/api/security/sessions/'+(sessionId?'revoke':'revoke-all'),{
        method:'POST',cache:'no-store',body:JSON.stringify(sessionId?{sessionId}:{confirm:true})});
      if(!valid(version,token))return;
      if(data.signOut){clear();el('logout-account').click();return;}
      await sessions();
    }catch(error){if(valid(version,token))el('zx-sessions-status').textContent=message(error)}
    finally{if(valid(version,token))controls.forEach(b=>b.disabled=false)}
  }
  async function sessions(){
    const version=generation,token=current(),button=el('zx-sessions-refresh');if(!token)return;
    button.disabled=true;el('zx-session-list').replaceChildren();el('zx-sessions-revoke-all').hidden=true;
    el('zx-sessions-status').textContent='Consultando sesiones…';
    try{
      const data=await zeroxAuthRequest('/api/security/sessions',{cache:'no-store'});
      if(!valid(version,token))return;
      if(!Array.isArray(data.sessions))throw Error('INVALID_RESPONSE');
      for(const session of data.sessions){
        const row=document.createElement('li'),label=document.createElement('strong'),detail=document.createElement('small'),close=document.createElement('button');
        label.textContent=session.current?'Esta sesión':'Otra sesión';
        detail.textContent='Inicio: '+date(session.created_at)+' · Vence: '+date(session.expires_at);
        close.type='button';close.textContent='Cerrar sesión';close.addEventListener('click',()=>revoke(session.id));
        row.append(label,detail,close);el('zx-session-list').append(row);
      }
      el('zx-sessions-status').textContent=data.sessions.length?'Solo se muestran las sesiones de tu cuenta.':'No hay sesiones activas.';
      el('zx-sessions-revoke-all').hidden=!data.sessions.length;
    }catch(error){if(valid(version,token))el('zx-sessions-status').textContent=message(error)}
    finally{if(valid(version,token))button.disabled=false}
  }
  el('zx-sessions-refresh').addEventListener('click',sessions);
  el('zx-sessions-revoke-all').addEventListener('click',()=>revoke());
  window.addEventListener('storage',event=>{if(event.key==='zerox-session')clear()});
  clear();
})();
