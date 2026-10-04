/* Read-only personal MXN balance. No persisted amounts or public aggregate. */
(()=>{
 const q=id=>document.getElementById(id),value=q('zx-header-wallet-value');let generation=0,controller;
 const token=()=>getZeroXSession()?.token;
 function clear(){generation++;controller?.abort();value.textContent=token()?'Consultar saldo':'Inicia sesión';}
 async function refresh(){clear();const current=token(),version=generation;if(!current||document.hidden)return;controller=new AbortController();value.textContent='Consultando…';
  try{const data=await zeroxAuthRequest('/api/wallet/me',{cache:'no-store',signal:controller.signal});if(version!==generation||current!==token()||document.hidden)return;
   if(data.currency!=='MXN'||!Number.isSafeInteger(data.availableCents)||data.availableCents<0)throw Error('INVALID_BALANCE');
   value.textContent=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(data.availableCents/100)+' MXN';
  }catch(e){if(version===generation&&current===token()&&!document.hidden)value.textContent=e.status===401?'Inicia sesión':'Saldo no disponible';}
 }
 q('zx-header-wallet').addEventListener('click',()=>{refresh();q('open-account').click();if(token())q('zx-wallet-refresh').click();});
 window.addEventListener('zx-session-change',clear);window.addEventListener('zx-account-ready',refresh);
 window.addEventListener('storage',e=>{if(e.key==='zerox-session'||e.key===null)refresh();});window.addEventListener('pagehide',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else refresh();});refresh();
})();
