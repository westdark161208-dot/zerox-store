# Pagos V3 — avance del 10 de octubre de 2026

## Estado real

Implementación local, sin despliegue ni cobros reales. Auditoría del paquete
`ZeroX_Store_Handoff_Pagos_Saldos_v3.zip` completada. Se preservan saldos,
pedidos anteriores y política de cobro existente hasta la migración completa.

## Implementado y probado

- Cotizaciones del servidor en centavos con vencimiento, método, usuario,
  contexto, tarifa, impuestos explícitos y total aceptado.
- La cotización de saldo no agrega comisión. La de MP calcula el importe bruto
  necesario para recuperar el importe base; no asume impuestos por defecto.
- Una cotización solo puede vincularse a un pedido. Los reintentos del mismo
  pedido conservan el acuerdo original. Cambios de método, contexto o total
  requieren nueva aceptación.
- Recargas V3 conservan `amount_cents` como crédito al monedero y guardan el
  importe bruto en una tabla adicional. La evidencia MP se compara con el bruto;
  el abono conserva la operación atómica existente y acredita solo el neto.
- Los intentos anteriores siguen usando su importe original. No se reescriben.
- El formulario del monedero muestra crédito, comisión e importe total antes de
  redirigir con su botón. Descarta cotizaciones tardías después de cambiar importe
  o sesión. El endpoint rechaza cotizaciones vencidas o modificadas.

Validación: `node --test tests/*.test.mjs`: 204 pruebas aprobadas.
Incluye prueba HTTP con proveedor simulado: cobrar $24.87, acreditar $20, repetir
notificación sin duplicar abono. El ejemplo usa 3.49% + $4 sin impuestos adicionales;
no constituye confirmación de la tarifa productiva de la cuenta.

## Archivos y rutas

- `cloudflare/payments/quotes-v3.mjs`: cálculo y aceptación persistida.
- `cloudflare/payments/funding.mjs`: instantánea aditiva y conciliación bruto/neto.
- `cloudflare/payments/funding-routes.mjs`: `/api/payments/mercadopago/funding/quote`
  y aceptación en `/checkout`.
- `cloudflare/wallet/routes.mjs`: disponibilidad de la modalidad V3.
- `header-wallet.js`, `index.html`: desglose antes del pago.

## Activación bloqueada hasta completar la migración

No activar `MP_FUNDING_QUOTES_V3=true` todavía: el catálogo y los pagos de
productos aún usan `retail-pricing.js`, que incorpora la comisión al precio
general. Activar únicamente las recargas V3 ahora podría producir doble comisión.

Después de adaptar productos y validar la tarifa real, se requieren valores
explícitos de `MP_FEE_POLICY_VERIFIED`, `MP_FEE_POLICY_VERSION`, `MP_FEE_RATE_BPS`,
`MP_FEE_FIXED_CENTS` y `MP_FEE_TAX_BPS`. Ninguna de estas variables se configuró
en producción durante este avance. Los impuestos deben comprobarse, no inferirse
de las capturas. No contiene credenciales.

## Siguiente trabajo, en orden

1. Migrar precios públicos, carrito, descuentos y compras de diamantes, servicios
   y promociones: precio base para saldo; cotización separada para MP. Preservar
   precios aceptados de pedidos históricos y reintentos existentes.
2. Probar compatibilidad de la página de pago alternativa y todos los clientes
   de recarga antes de activar la exigencia de cotización en el servidor.
3. Validar visualmente en móvil y probar el ciclo integrado de productos y saldo.
4. Validar configuración productiva y entrega de proveedores; solicitar aprobación
   del propietario para la activación real conforme al V3.
5. Completar recarga manual, notificaciones FIFO con avatar cuadrado y privacidad,
   navegación contextual y soporte modal según el paquete.

No se declara resuelto el problema de compra del Pase Booyah ni la entrega de
todos los productos: requiere comprobar los mapeos y respuestas de proveedores.


## Segunda etapa — productos y clientes de recarga

Guardada el 10 de octubre de 2026, todavía sin despliegue.

- El catálogo, carrito y Editor muestran el precio base. Se conserva la función
  histórica de cálculo exclusivamente para las rutas anteriores y recuperación.
- Diamantes, servicios (incluidos juegos) y promociones comparten cálculo V3:
  descuento sobre base y, después, comisión únicamente del método MP.
- Los tres flujos exigen cotizaciones del servidor al habilitar
  `MP_PRODUCT_QUOTES_V3=true`. Están vinculadas al tipo de compra, producto,
  cantidad, destinatario, cupón y precio; promociones también vinculan su receta.
- La interfaz obtiene el desglose y solicita confirmación del importe antes de
  redirigir directamente a MP. Conserva cotización e intento en reintentos de
  diamantes y juegos. No se genera un segundo pedido para abrir el checkout.
- Los pedidos anteriores mantienen sus importes y comprobantes. Los reintentos de
  saldo verifican la tarifa histórica del pedido, no la nueva política.
- Se reparó la recuperación de promociones con saldo insuficiente: una vez
  abonado saldo, el mismo intento vuelve a validar disponibilidad y descuenta
  una sola vez. No duplica el pedido ni las operaciones de entrega.
- La página `wallet-payment.html` también acepta cotizaciones V3; se actualizaron
  versiones de recursos y caché de la PWA.

Validación actual: **210 pruebas aprobadas**, incluidos cobro bruto y abono neto,
precio de $18 con saldo frente a $22.80 con MP en configuración de prueba sin
impuesto adicional, descuento antes de comisión, rechazo de precio/destinatario
modificado y recuperación después de saldo insuficiente. Proveedores simulados;
no se realizó una compra real ni una validación visual completa en navegador.

### Reemplaza los pasos 1 y 2 pendientes de la primera etapa

Esos pasos ya están implementados en código. No publicar el frontend nuevo sin
activar conjuntamente el backend V3: los precios base del nuevo cliente no son
compatibles con el cálculo general del backend antiguo. Preparar despliegue
coordinado, comprobar política de impuestos y tarifa de la cuenta, probar en
navegador y validar la entrega antes de habilitar cobros productivos. El nuevo
flujo requiere tanto `MP_PRODUCT_QUOTES_V3=true` como `MP_FUNDING_QUOTES_V3=true`
para la configuración completa solicitada. Ninguna variable productiva se cambió.

Siguen pendientes notificaciones, recargas manuales, navegación/soporte y la
verificación real de asociaciones de todos los productos con sus proveedores.

## Evidencia de tarifa — 10 de octubre, cierre

El propietario proporcionó capturas de Checkout y de una venta por $20 MXN
con cargo MP de $5.45. El cargo observado coincide al centavo con
(20 × 0.0349 + 4) × 1.16 = 5.44968. La tarifa de Checkout mostrada es
3.49% + $4 para tarjeta, saldo MP y SPEI; la evidencia de operación corresponde
a transferencia electrónica. Se configura 349 bps, 400 centavos y 1600 bps de IVA.
No se incluyen identificadores de la operación ni datos del comprador aquí.

Configuración preparada en wrangler para ambos flags V3; aún no desplegada.
La evidencia resuelve el bloqueo de tarifa. Siguen pendientes la validación
integrada y el despliegue coordinado. No acredita por sí sola la entrega de
productos por los proveedores. OXXO manual sigue fuera de esta tarifa.
