(() => {
  const panel = document.querySelector('#liquidity');
  const cards = [...panel.querySelectorAll('[data-wallet]')];
  const dialog = panel.querySelector('dialog');
  let data, selected, controller;
  const format = n => Number(n).toLocaleString('es-MX',{maximumFractionDigits:4});
  const rateForm = dialog.querySelector('#wallet-rate-form');
  const rateInput = rateForm.querySelector('input');
  const rateKey = 'zx-provider-display-usd-mxn';
  function savedRate() {
    const value = Number(localStorage.getItem(rateKey));
    return value > 0 && value <= 1000 ? value : null;
  }
  rateForm.onsubmit = event => {
    event.preventDefault();
    if (!rateForm.reportValidity()) return;
    try {
      localStorage.setItem(rateKey,String(rateInput.valueAsNumber));
      paint();
      rateForm.querySelector('output').textContent='Cambio guardado.';
    } catch { rateForm.querySelector('output').textContent='No se pudo guardar el cambio.'; }
  };
  function paint() {
    for (const card of cards) {
      const row = data?.balances?.[card.dataset.wallet] || {};
      card.querySelector('strong').textContent = row.balance == null ? '—' : format(row.balance)+' '+row.currency;
      const manual = savedRate();
      const mxn = manual && row.balance != null && ['USD','USDT'].includes(row.currency) ? Math.round(Number(row.balance)*manual*100)/100 : row.mxn;
      card.querySelector('span').textContent = mxn == null ? 'MXN —' : '≈ $'+format(mxn)+' MXN';
      card.querySelector('em').textContent = row.state || data?.status || 'Sin consultar';
    }
    if (!selected) return;
    const row = data?.balances?.[selected.dataset.wallet];
    dialog.querySelector('h2').textContent = selected.querySelector('small').textContent;
    dialog.querySelector('p').textContent = [...selected.children].slice(1).map(el=>el.textContent).join(' · ')
      + (data?.queriedAt ? ' · Consultado '+new Date(data.queriedAt).toLocaleString('es-MX') : '')
      + (row?.currency==='USDT' && (savedRate() || data?.rate) ? ' · Estimación con paridad USD y tipo de cambio '+(savedRate() || data.rate) : '');
    const lines = row?.movements?.map(m=>new Date(m.at*1000).toLocaleString('es-MX')+' · '+m.kind+' · '+m.amount+' USDT');
    dialog.querySelector('ul').replaceChildren(...(lines?.length ? lines : [lines ? 'Sin movimientos registrados' : 'Movimientos no disponibles']).map(text=>{
      const li=document.createElement('li');li.textContent=text;return li;
    }));
  }
  async function refresh() {
    controller?.abort();
    const pending = controller = new AbortController();
    data={status:'Consultando…'};paint();
    try {
      let result;
      const options={cache:'no-store',signal:pending.signal};
      try {
        result=await zeroxAuthRequest('/api/admin/providers/control-balances',options);
        if (!result.balances) throw Error();
      } catch (error) {
        if (pending.signal.aborted || [401,403].includes(error.status)) throw error;
        const legacy=await zeroxAuthRequest('/api/admin/providers/founder-balances',options);
        const ra=legacy.balances.ra;
        result={rate:ra.referenceRate,queriedAt:legacy.queriedAt,balances:{
          ra:ra.available ? {...ra,state:'Conectado',mxn:ra.estimatedMxnCents==null?null:ra.estimatedMxnCents/100} : {state:'Sin conexión'},
          rg:{state:'Consulta pendiente'},sf:{state:'Consulta no disponible'}
        }};
      }
      if (!pending.signal.aborted && result.balances.ra?.balance == null) {
        try {
          const wallet=await zeroxAuthRequest('/api/admin/providers/recargas-america/wallet',options);
          const {balance,currency}=wallet.data;
          if (!wallet.ok || !/^\d+(\.\d+)?$/.test(String(balance)) || !currency) throw Error();
          const factor=currency==='MXN'?1:['USD','USDT'].includes(currency)?result.rate:null;
          result.balances.ra={balance,currency,state:'Conectado',mxn:factor>0?Number(balance)*factor:null};
        } catch(error) {
          if ([401,403].includes(error.status)) throw error;
          result.balances.ra={state:'Saldo no disponible'};
        }
      }
      if (!pending.signal.aborted) data=result;
    } catch { if (!pending.signal.aborted) data={status:'Consulta fallida'}; }
    if (!pending.signal.aborted) paint();
  }
  cards.forEach(card=>card.onclick=()=>{selected=card;rateInput.value=savedRate() || data?.rate || "";rateForm.querySelector("output").textContent="";paint();dialog.showModal()});
  document.querySelector('#wallet-reload').onclick=refresh;
  function clear() {
    controller?.abort(); dialog.close(); selected=null; data=null; paint(); panel.hidden=true;
  }
  function sync() {
    clear();
    if (document.hidden || typeof zeroxUser==='undefined' || !zeroxUser?.isFounder || !getZeroXSession()?.token) return;
    panel.hidden=false;refresh();
  }
  window.addEventListener('zx-account-ready',sync);
  window.addEventListener('zx-session-change',clear);
  window.addEventListener('storage',e=>{if (!e.key || e.key==='zerox-session') clear()});
  window.addEventListener('pagehide',clear);
  document.addEventListener('visibilitychange',sync);
  sync();
})();
