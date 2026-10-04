/* Personal MXN balance and private island; server decides funding availability. */
(()=>{
 const q=id=>document.getElementById(id),value=q('zx-header-wallet-value'),island=q('zx-wallet-island');let generation=0,controller;

 const token=()=>getZeroXSession()?.token;
 const money=cents=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100)+' MXN';
 function methods(available=false){const host=q('zx-wallet-island-methods');if(!host)return;host.replaceChildren();let index=0;for(const [code,name,icon] of [['card','Tarjeta','▰'],['oxxo','OXXO','OXXO'],['spei','Transferencia','⇄'],['all','Mercado Pago','MP']]){const tile=document.createElement(available?'a':'span');tile.className='zx-island-method zx-island-method-'+code;if(available)tile.href='wallet-payment.html?method='+code;const mark=document.createElement('b'),label=document.createElement('span');mark.innerHTML=window.ZX_PAYMENT_ICONS?.[code]||'';mark.setAttribute('aria-hidden','true');label.textContent=name;tile.append(mark,label);host.append(tile);}q('zx-wallet-island-topup').hidden=!available;}
 function clear(){generation++;controller?.abort();value.textContent=token()?'Consultar saldo':'Inicia sesión';if(!island)return;q('zx-wallet-island-value').textContent='—';q('zx-wallet-island-status').textContent='Consulta tu saldo para ver la disponibilidad de recarga.';methods(false);}
 function hide(){if(island?.open)island.close();clear();}
 async function refresh(){clear();const current=token(),version=generation;if(!current||document.hidden)return;controller=new AbortController();value.textContent='Consultando…';
  try{const data=await zeroxAuthRequest('/api/wallet/me',{cache:'no-store',signal:controller.signal});if(version!==generation||current!==token()||document.hidden)return;
   if(data.currency!=='MXN'||!Number.isSafeInteger(data.availableCents)||data.availableCents<0)throw Error('INVALID_BALANCE');
   value.textContent=money(data.availableCents);if(island){q('zx-wallet-island-value').textContent=money(data.availableCents);methods(data.fundingPilotAvailable===true);q('zx-wallet-island-status').textContent=data.fundingPilotAvailable===true?'Recarga real disponible en el piloto de tu cuenta.':'Consulta de saldo disponible. La recarga está en preparación para esta cuenta.';}
  }catch(e){if(version===generation&&current===token()&&!document.hidden){value.textContent=e.status===401?'Inicia sesión':'Saldo no disponible';if(island)q('zx-wallet-island-status').textContent=e.status===401?'Tu sesión terminó. Vuelve a iniciar sesión.':'No pudimos consultar tu saldo. Puedes volver a intentarlo.';}}
 }
 q('zx-header-wallet').addEventListener('click',()=>{if(!token()){q('open-account').click();return;}if(island&&!island.open)island.showModal();refresh();});
 q('zx-wallet-island-close')?.addEventListener('click',()=>{island.close();q('zx-header-wallet').focus();});q('zx-wallet-island-refresh')?.addEventListener('click',refresh);
 island?.addEventListener('click',e=>{if(e.target!==island)return;const r=island.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)island.close();});
 window.addEventListener('zx-session-change',hide);window.addEventListener('zx-account-ready',refresh);
 window.addEventListener('storage',e=>{if(e.key==='zerox-session'||e.key===null){hide();refresh();}});window.addEventListener('pagehide',hide);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();else refresh();});refresh();
})();
