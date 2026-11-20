export const apiBase = 'https://zerox-sixofire-api.westdark161208.workers.dev';
export const settingsPath = '/api/manual-recharges';

export const sections = {
  general: 'Recarga de saldo',
  transfer: 'Transferencia manual',
  oxxo: 'Depósito OXXO'
};

const fields = [
  ['general', 'heading', 'Título de la sección', 'Recargar saldo'],
  ['general', 'note', 'Indicaciones de la sección', 'Incluye tu usuario de Zero’X. El saldo se abona después de revisar tu depósito.', 450],
  ['transfer', 'transferButton', 'Botón para abrir', 'Transferencia manual'],
  ['transfer', 'transferImage', 'Logotipo del método', 'assets/payments/mercadopago.jpg', 'image'],
  ['transfer', 'transferTitle', 'Título de la ventana', 'Transferencia manual'],
  ['transfer', 'bank', 'Nombre del método', '🇲🇽 Mercado Pago W'],
  ['transfer', 'concept', 'Concepto que se muestra y se copia', 'DONACION / PRÉSTAMO'],
  ['transfer', 'copyLabel', 'Botones de copiar', '▣ Copiar'],
  ['transfer', 'transferMinimum', 'Aviso de importe mínimo', 'Recarga mínima: $20 MXN. Comprueba los datos del destinatario antes de confirmar tu transferencia.', 450],
  ['transfer', 'transferTiming', 'Aviso de acreditación', 'Zero’X Store no cobra comisión por esta recarga manual. El tiempo de acreditación puede ser de minutos a horas, según la disponibilidad del administrador.', 450],
  ['transfer', 'transferProof', 'Indicaciones del comprobante', 'Después de transferir, envía la captura de tu comprobante e incluye tu usuario, importe, fecha y referencia. El saldo se acredita después de verificar el ingreso y comprobar que no se ha abonado antes.', 450],
  ['transfer', 'transferReceipt', 'Botón del comprobante', 'Comparte tu comprobante aquí ↗'],
  ['transfer', 'transferFooter', 'Nota de WhatsApp', 'Adjunta el comprobante en WhatsApp. Abrir el chat no lo envía automáticamente.', 450],
  ['oxxo', 'oxxoButton', 'Botón para abrir', 'Depósito manual'],
  ['oxxo', 'oxxoImage', 'Logotipo del método', 'assets/payments/oxxo.jpg', 'image'],
  ['oxxo', 'oxxoTitle', 'Título de la ventana', 'Recarga tu saldo en OXXO'],
  ['oxxo', 'oxxoIntro', 'Instrucciones de depósito', 'Deposita en OXXO por medio del código o usa el número de tarjeta debajo.', 450],
  ['oxxo', 'oxxoCopy', 'Botón de copiar', 'Copiar número'],
  ['oxxo', 'oxxoReceipt', 'Botón del comprobante', 'Comparte tu comprobante aquí ↗'],
  ['oxxo', 'oxxoFooter', 'Aviso de acreditación', 'Incluye tu nombre de usuario. El abono es manual y puede tardar de minutos a horas, según la disponibilidad del administrador. Tu saldo se actualizará después de revisar el depósito.', 450]
];

export const appearance = fields.map(([section, key, label, initial, limit = 100]) =>
  ({section, key, label, initial, limit}));
export const defaults = Object.fromEntries(appearance.map(field => [field.key, field.initial]));

export function validValue(field, value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (field.limit !== 'image') return value.length <= field.limit;
  const prefix = apiBase + '/api/catalog/media/';
  return value === field.initial || (value.startsWith(prefix) &&
    /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:jpg|png|webp)$/.test(value.slice(prefix.length)));
}
