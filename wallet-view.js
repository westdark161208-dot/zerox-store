/* Own-user read-only wallet. Late responses cannot restore a hidden/private view. */
(()=>{
 const el=id=>document.getElementById(id);let generation=0;
 const money=cents=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100)+' MXN';
 function clear(){generation++;el('zx-wallet-balance').hidden=true;el('zx-wallet-balance').textContent='';el('zx-wallet-movements').replaceChildren();el('zx-wallet-refresh').disabled=false;el('zx-wallet-status').textContent='Consulta tu saldo y movimientos.';}
 window.zxResetWalletView=clear;
 el('zx-wallet-refresh').addEventListener('click',async()=>{
  clear();const version=generation,token=getZeroXSession()?.token;if(!token)return;
  const valid=()=>version===generation&&token===getZeroXSession()?.token;
  el('zx-wallet-refresh').disabled=true;el('zx-wallet-status').textContent='Consultando saldo…';
  try{
   const d=await zeroxAuthRequest('/api/wallet/me',{cache:'no-store'});if(!valid())return;
   if(d.currency!=='MXN'||!Number.isSafeInteger(d.availableCents)||d.availableCents<0||!Array.isArray(d.movements))throw Error('INVALID_RESPONSE');
   el('zx-wallet-balance').textContent=money(d.availableCents);el('zx-wallet-balance').hidden=false;
   el('zx-wallet-status').textContent='Saldo interno de tu cuenta. Los fondos del proveedor, si aparecen debajo, se usan por separado.';
   for(const m of d.movements){
    if(!Number.isSafeInteger(m.amountCents))throw Error('INVALID_RESPONSE');
    const row=document.createElement('li'),label=document.createElement('strong'),detail=document.createElement('small');
    label.textContent=({credit:'Abono',purchase:'Compra',refund:'Devolución'}[m.kind]||'Movimiento')+' · '+money(m.amountCents);
    const date=new Date(String(m.createdAt).replace(' ','T')+(/[Z+-]/.test(String(m.createdAt).slice(-6))?'':'Z'));
    detail.textContent=Number.isNaN(date.getTime())?'Fecha no disponible':date.toLocaleString('es-MX');row.append(label,detail);el('zx-wallet-movements').append(row);
   }
   if(!d.movements.length){const row=document.createElement('li');row.textContent='Sin movimientos registrados.';el('zx-wallet-movements').append(row)}
  }catch(e){if(valid()){el('zx-wallet-balance').hidden=true;el('zx-wallet-movements').replaceChildren();el('zx-wallet-status').textContent=e.status===401?'Tu sesión terminó. Vuelve a iniciar sesión.':['WALLET_NOT_ACTIVE','NOT_FOUND'].includes(e.message)?'La consulta de wallet todavía no está habilitada.':'No pudimos consultar el saldo. Inténtalo de nuevo.'}}
  finally{if(valid())el('zx-wallet-refresh').disabled=false}
 });
 window.addEventListener('storage',e=>{if(e.key==='zerox-session')clear()});
 window.addEventListener('pagehide',clear);window.addEventListener('zx-account-ready',()=>el('zx-wallet-refresh').click());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
 el('account-modal').addEventListener('close',clear);clear();
})();
