/* Preferences affect display only, never authentication, game region or checkout. */
(() => {
  const config = globalThis.ZXRegionalConfig;
  const dialog = document.getElementById('zx-region-dialog');
  const opener = document.getElementById('zx-region-open');
  const country = document.getElementById('zx-country');
  const currency = document.getElementById('currency');
  if (!config || !dialog || !opener || !country || !currency) return;
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
  country.addEventListener('change', save);
  currency.addEventListener('change', save);
  opener.addEventListener('click', () => dialog.showModal());
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
