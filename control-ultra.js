(() => {
  const panel = document.querySelector('#liquidity');
  const cards = [...panel.querySelectorAll('[data-wallet]')];
  const dialog = panel.querySelector('dialog');
  let data, selected, controller;
  const format = n => Number(n).toLocaleString('es-MX',{maximumFractionDigits:4});
  function paint() {
    for (const card of cards) {
      const row = data?.balances?.[card.dataset.wallet] || {};
      card.querySelector('strong').textContent = row.balance == null ? '—' : format(row.balance)+' '+row.currency;
      card.querySelector('span').textContent = row.mxn == null ? 'MXN —' : '≈ $'+format(row.mxn)+' MXN';
      card.querySelector('em').textContent = row.state || data?.status || 'Sin consultar';
    }
    if (!selected) return;
    const row = data?.balances?.[selected.dataset.wallet];
    dialog.querySelector('h2').textContent = selected.querySelector('small').textContent;
    dialog.querySelector('p').textContent = [...selected.children].slice(1).map(el=>el.textContent).join(' · ')
      + (data?.queriedAt ? ' · Consultado '+new Date(data.queriedAt).toLocaleString('es-MX') : '')
      + (row?.currency==='USDT' && data?.rate ? ' · Estimación con paridad USD y tipo de cambio '+data.rate : '');
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
      const token=JSON.parse(localStorage.getItem('zerox-session')).token;
      const res=await fetch('https://zerox-sixofire-api.westdark161208.workers.dev/api/admin/providers/control-balances',{
        headers:{Authorization:'Bearer '+token},cache:'no-store',signal:pending.signal});
      if (!res.ok) throw Error();
      const result=await res.json();
      if (!pending.signal.aborted) data=result;
    } catch { if (!pending.signal.aborted) data={status:'Consulta fallida'}; }
    if (!pending.signal.aborted) paint();
  }
  cards.forEach(card=>card.onclick=()=>{selected=card;paint();dialog.showModal()});
  document.querySelector('#wallet-reload').onclick=refresh;
  window.addEventListener('zx-control-ready',()=>{panel.hidden=false;refresh()});
  window.addEventListener('zx-control-clear',()=>{controller?.abort();dialog.close();selected=null;data=null;paint();panel.hidden=true});
})();
