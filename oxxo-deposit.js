import {appearance, defaults, settingsPath, validValue} from './manual-recharges.mjs';

function manualDialog(method, markup) {
  const dialog = document.createElement('dialog');
  dialog.className = 'zx-oxxo-modal';
  dialog.setAttribute('aria-labelledby', 'zx-' + method + '-title');
  dialog.innerHTML = markup;
  document.body.append(dialog);
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  return dialog;
}

const oxxo = manualDialog('oxxo', `
  <button type="button" data-close aria-label="Cerrar depósito OXXO">Cerrar ×</button>
  <h2 id="zx-oxxo-title" data-manual-text="oxxoTitle"></h2><p data-manual-text="oxxoIntro"></p>
  <img src="assets/oxxo-deposit.png" alt="Código de depósito Spin by OXXO. Número: 2242 1701 0032 3890">
  <strong>2242 1701 0032 3890</strong><button type="button" data-copy data-manual-text="oxxoCopy"></button>
  <a class="zx-order-payment-link" href="https://wa.me/529514754210?text=Hola%2C%20comparto%20mi%20comprobante%20de%20dep%C3%B3sito%20OXXO%20para%20recargar%20mi%20saldo%20ZeroX.%20Mi%20usuario%20es%3A%20" target="_blank" rel="noopener noreferrer" data-manual-text="oxxoReceipt"></a>
  <p data-manual-text="oxxoFooter"></p><p data-status role="status"></p>`);

const transfer = manualDialog('transfer', `
  <button type="button" data-close aria-label="Cerrar transferencia">Cerrar ×</button>
  <h2 id="zx-transfer-title" data-manual-text="transferTitle"></h2>
  <img data-manual-image="transferImage" alt="Logotipo de transferencia" style="max-width:150px">
  <h3 class="zx-transfer-bank" data-manual-text="bank"></h3>
  <dl class="zx-transfer-details">
    <dt>CLABE</dt><dd><code>722969020278978570</code><button type="button" data-copy data-manual-text="copyLabel" aria-label="Copiar CLABE"></button></dd>
    <dt>Titular</dt><dd><span>Alexander Hernández</span><button type="button" data-copy data-manual-text="copyLabel" aria-label="Copiar titular"></button></dd>
    <dt>Concepto</dt><dd><span data-manual-text="concept"></span><button type="button" data-copy data-manual-text="copyLabel" aria-label="Copiar concepto"></button></dd>
  </dl><p data-status role="status" aria-live="polite"></p>
  <p data-manual-text="transferMinimum"></p><p data-manual-text="transferTiming"></p>
  <p data-manual-text="transferProof"></p>
  <a class="zx-order-payment-link" data-receipt data-manual-text="transferReceipt" target="_blank" rel="noopener noreferrer"></a>
  <p data-manual-text="transferFooter"></p>`);

function render(values) {
  const config = {...defaults};
  for (const field of appearance) {
    if (validValue(field, values[field.key])) config[field.key] = values[field.key];
  }
  for (const node of document.querySelectorAll('[data-manual-text]')) node.textContent = config[node.dataset.manualText];
  for (const img of document.querySelectorAll('[data-manual-image]')) img.src = config[img.dataset.manualImage];
}

render(defaults);
let lastRead = 0;
let loading = false;
async function refresh() {
  if (loading || Date.now() - lastRead < 15000) return;
  loading = true;
  try {
    const response = await fetch(settingsPath, {cache: 'no-store'});
    if (!response.ok) return;
    const {values} = await response.json();
    render(values);
    lastRead = Date.now();
  } catch { /* The local presentation is usable offline. */ }
  finally { loading = false; }
}
refresh();

async function copy(dialog, value, message) {
  const status = dialog.querySelector('[data-status]');
  try {
    await navigator.clipboard.writeText(value);
    status.textContent = message;
  } catch { status.textContent = 'Selecciona y copia el dato que aparece arriba.'; }
}
oxxo.querySelector('[data-copy]').onclick = () => copy(oxxo, '2242170100323890', 'Número copiado.');
for (const button of transfer.querySelectorAll('[data-copy]')) {
  button.onclick = () => copy(transfer, button.previousElementSibling.textContent, 'Copiado.');
}
document.getElementById('zx-open-oxxo').onclick = () => { refresh(); oxxo.showModal(); };
document.getElementById('zx-open-transfer').onclick = () => {
  refresh();
  const user = typeof zeroxUser !== 'undefined' ? zeroxUser?.username || '' : '';
  const message = 'Hola, comparto mi comprobante de transferencia manual para recargar saldo Zero’X Store. Usuario: ' + user +
    '\nImporte: $___ MXN\nFecha: ___\nReferencia de transferencia: ___\nAdjunto mi comprobante para revisión.';
  transfer.querySelector('[data-receipt]').href = 'https://wa.me/529514754210?text=' + encodeURIComponent(message);
  transfer.showModal();
};
