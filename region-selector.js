/* Preferences affect display only, never authentication, game region or checkout. */
(() => {
  const config = globalThis.ZXRegionalConfig;
  const dialog = document.getElementById('zx-region-dialog');
  const opener = document.getElementById('zx-region-open');
  const country = document.getElementById('zx-country');
  const currency = document.getElementById('currency');
  if (!config || !dialog || !opener || !country || !currency) return;
  const carousel=document.getElementById('zx-currency-carousel');
  const cards=[];
  const key = 'zerox-region-preferences-v1';
  function fill(select, rows, label) {
    select.replaceChildren(...rows.map(row => {
      const option = document.createElement('option');
      option.value = row.code; option.textContent = label(row); return option;
    }));
  }
  fill(country, config.countries, c => `${c.flag} ${c.name}`);
  fill(currency, config.currencies, c => c.code);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  country.value = config.countries.some(c => c.code === saved.country) ? saved.country : 'MX';
  currency.value = config.currencies.some(c => c.code === saved.currency) ? saved.currency : 'MXN';
  function refresh() {
    for(const card of cards)card.setAttribute('aria-pressed',String(card.dataset.currency===currency.value));
    const selected = config.countries.find(c => c.code === country.value);
    opener.textContent = `${selected.flag} ${currency.value}`;
    opener.setAttribute('aria-label', `País ${selected.name}, moneda ${currency.value}`);
    document.getElementById('zx-region-rate').textContent = currency.value === 'MXN'
      ? 'Precios base en pesos mexicanos (MXN).'
      : `Precios estimados en ${currency.value}. Conversión informativa con tasas de referencia; no es una cotización en tiempo real. El importe del pago se confirma al comprar.`;
    const footer = document.getElementById('zx-payment-methods');
    if (footer) {
      // A label here cannot enable a payment. Activation requires server support.
      const active = config.paymentMethods.filter(m => m.enabled === true && m.countries.includes(country.value));
      footer.replaceChildren(...active.map(m => {
        const label = document.createElement('span'); label.textContent = m.label; return label;
      }));
      footer.hidden = active.length === 0;
    }
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({country:country.value, currency:currency.value})); } catch {}
    refresh();
  }
  if(carousel){
    for(const row of config.currencies){const card=document.createElement('button');card.type='button';card.className='zx-currency-card';card.dataset.currency=row.code;card.setAttribute('aria-label',row.code+' · '+row.name);const flag=document.createElement('span'),code=document.createElement('strong'),name=document.createElement('small');flag.textContent=row.flag;flag.setAttribute('aria-hidden','true');code.textContent=row.code;name.textContent=row.name;card.append(flag,code,name);card.addEventListener('click',()=>{currency.value=row.code;currency.dispatchEvent(new Event('change',{bubbles:true}));card.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});});cards.push(card);carousel.append(card);}
    let scrollTimer;
    function selectCentered(){const bounds=carousel.getBoundingClientRect(),center=bounds.left+bounds.width/2;let nearest=null,distance=Infinity;for(const card of cards){const r=card.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;nearest=card;}}if(nearest&&currency.value!==nearest.dataset.currency){currency.value=nearest.dataset.currency;currency.dispatchEvent(new Event('change',{bubbles:true}));}}
    carousel.addEventListener('scrollend',selectCentered);
    carousel.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(selectCentered,180);},{passive:true});
    for(const [id,direction] of [['zx-currency-prev',-1],['zx-currency-next',1]])document.getElementById(id)?.addEventListener('click',()=>{const i=config.currencies.findIndex(c=>c.code===currency.value),next=(i+direction+cards.length)%cards.length;cards[next].click();cards[next].focus({preventScroll:true});});
  }
  document.getElementById('zx-guide-currency')?.addEventListener('click',()=>opener.click());
  country.addEventListener('change', save);
  currency.addEventListener('change', save);
  opener.addEventListener('click', () => {dialog.showModal();cards.find(c=>c.dataset.currency===currency.value)?.scrollIntoView({block:'nearest',inline:'center'});});
  function close() { dialog.close(); opener.focus(); }
  document.getElementById('zx-region-close').addEventListener('click', close);
  document.getElementById('zx-region-done').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  }});
  refresh();
  // Reuse the existing renderer after restoring the currency, including the cart.
  currency.dispatchEvent(new Event('change', {bubbles:true}));
})();
