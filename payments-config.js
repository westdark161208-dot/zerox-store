// Enlaces públicos de cobro del vendedor. No colocar claves ni contraseñas aquí.
// Activar únicamente enlaces emitidos por la cuenta real de Zero'X Store.
window.ZEROX_PAYMENT_LINKS = Object.freeze({
  PayPal: "",
  Binance: "",
  Transferencia: "",
  Deposito: ""
});

const zxMethodMarks={
 card:'<svg viewBox="0 0 48 36" fill="none" aria-hidden="true"><rect x="2" y="3" width="44" height="30" rx="6" stroke="currentColor" stroke-width="2"/><path d="M3 12h42M9 25h9m7 0h12" stroke="currentColor" stroke-width="3"/></svg>',
 spei:'<svg viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M4 12L24 3l20 9H4ZM10 16v13m9-13v13m10-13v13m9-13v13M5 33h38" stroke="currentColor" stroke-width="2"/></svg>',
 oxxo:'<img class="zx-payment-logo" src="assets/payments/oxxo.jpg" alt="" width="84" height="44">',
 all:'<img class="zx-payment-logo" src="assets/payments/mercadopago.jpg" alt="" width="100" height="40">',
 wallet:'<svg viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M40 13V6H7a4 4 0 0 0-4 4v25h38V14H8" stroke="currentColor" stroke-width="2"/><path d="M30 21h14v9H30z" stroke="currentColor" stroke-width="2"/><circle cx="35" cy="25.5" r="1.5" fill="currentColor"/></svg>'
};window.ZX_PAYMENT_ICONS=Object.freeze(zxMethodMarks);
