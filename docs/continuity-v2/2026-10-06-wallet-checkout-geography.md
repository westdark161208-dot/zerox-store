# Revisión del 6 de octubre de 2026

Base de restauración: `54df88514f4d32b68db0b6f1a2ee58a09fec42a2` (PR 28).
Rama de trabajo: `codex/wallet-country-map`.
Se revisaron el paquete ZeroX_Store_Continuidad_Work_v2_ZEROX_PAY y su BASE_ANTERIOR, además de las solicitudes posteriores del propietario. La autorización posterior incluye publicar los cambios; no se reconstruye la tienda.

## Correcciones de esta entrega

- Wallet: disponibilidad independiente de credenciales de Mercado Pago en servicios y diamantes; se conservan permisos, saldo, consentimiento, precios del servidor y comprobación de entrega.
- Catálogo de servicios: permite el nombre exacto con prefijo/sufijo Free Fire, sin confundir Premium, variantes ni cantidades. Las asociaciones explícitas siguen teniendo prioridad y respetan sus regiones. Los errores de conexión/fondos ya no se convierten todos en falta de asociación. Detalles de proveedores solo para fundador.
- Mercado Pago: el botón de pago redirige a la URL de producción validada, sin un enlace adicional en el primer checkout, tanto en productos conectados como promociones y recarga de saldo. La vuelta a un pedido pendiente mantiene su enlace para reanudar.
- Paquetes grandes: continuación periódica de operaciones pendientes de pedidos ya pagados, usando el mismo motor y plan inmutable; nunca reenvía una operación incierta. Máximo dos pedidos/dos operaciones por pedido en cada ejecución. Las entregas requieren fondos reales del proveedor; no se confunden con saldo del cliente.
- El límite del piloto de saldo proveedor permanece en modo piloto; el modo público permite cotizar el catálogo grande con consentimiento del coste exacto.
- Registro: país obligatorio, estado opcional, región derivada en servidor. Usuario/perfil/país se guardan en una misma transacción. Las cuentas existentes actualizan país en Mi cuenta. No se inventa país ni se sustituye la región real del juego.
- Mapa Natural Earth reconstruido con países de América: elimina polígonos extranjeros, bandas y cuadrícula defectuosa. Puntos solo para países con usuarios registrados, privados al fundador, colores por región y navegación al directorio filtrado.

## Archivos por responsabilidad

- Cuenta: `country-regions.js`, `account-location.js`, `cloudflare/accounts/geography.mjs`, `cloudflare/worker.js`, `index.html`, `profile.html`, `app.js`.
- Pagos/entrega: `cloudflare/services/delivery.mjs`, `cloudflare/services/purchases.mjs`, `cloudflare/diamonds/purchases.mjs`, `cloudflare/wrangler.jsonc`, `app.js`, `header-wallet.js`, `promotions.js`.
- Control/mapa: `control.html`, `control-customers.js`, `customer-regions.css`, `country-map-points.js`, `assets/americas-map.svg`, `scripts/build-americas-map.py`.
- Publicación: `scripts/build-pages.mjs`, `service-worker.js`, versiones de recursos en HTML.
- Pruebas: `tests/wallet-country.test.mjs`, `tests/product-purchase.test.mjs`, `tests/header-wallet.test.mjs`.

## Verificación realizada

164 pruebas automatizadas aprobadas. Incluyen saldo exacto de 35 MXN para un pase sin MP/RA configurados; no doble descuento/envío; rechazo antes de cobrar cuando falta entrega; registro geográfico y filtros; redirección MP; pago aprobado con importe exacto de 30,800 diamantes y continuación más allá de cuatro operaciones. Son pruebas con APIs simuladas, no compras reales.
Build público: 250 archivos; backend, tests y documentación excluidos. Revisión de sintaxis y git diff --check.

## Contraste con el ZIP

| Requisito | Estado comprobado en código |
| --- | --- |
| Mantener tienda, perfil, Editor y Control | Existentes y conservados; cambios localizados |
| Ledger auditable, ajustes autorizados, evitar saldo negativo/doble abono | Implementado y probado |
| Mercado Pago productivo, firma y verificación de importe/moneda/receptor | Integración implementada; falta comprobar transacción real y credenciales activas en esta sesión |
| Pago cliente separado de fondos del proveedor | Implementado |
| OXXO | Recarga manual de saldo, según instrucción posterior; no checkout directo de producto |
| País, región, moneda de presentación | Selector existente y país privado de compra añadido; cobro real sigue en MXN |
| Proveedores y catálogo | Adaptadores RA/SF y asociaciones existentes; disponibilidad real depende del catálogo, región, permisos y fondos |
| Historial y comprobantes | Existentes; comprobante solo con entrega confirmada |
| Passkeys, TOTP, step-up administrativo | Pendiente; permisos de fundador no equivalen a autenticación reforzada |
| Roles administrativos delegados | Pendiente |
| Reembolsos/compensaciones con interfaz completa | Parcial; ledger/estados de revisión existentes, falta flujo administrativo completo |
| Binance Pay/Félix/PayPal | No activos; requieren integración/cuenta/documentación concreta |
| Lunes conversacional y automatizaciones amplias | Pendientes; panel actual de reglas/resúmenes no es esa integración |
| Stock completo y entrega automática de todo el catálogo | No completo; artículos sin adaptador/stock no deben cobrar como si pudieran entregarse automáticamente |

## Bloqueos que no se dan por resueltos

La captura demuestra PRODUCT_DELIVERY_MAPPING_REQUIRED para Pase Booyah. No demuestra falta de saldo del cliente. Sin sesión fundadora en este navegador no se ha consultado el catálogo autenticado actual ni los errores de conexión reales. No se afirma que una compra real ya funcione. Control permite consultar catálogos y guardar asociaciones exactas; nunca se inventa SKU, región o credencial para eliminar el bloqueo.

No se ejecutó ningún cargo real, compra de proveedor ni movimiento manual de saldo durante esta revisión. La tarea periódica solo continúa pedidos cuyo pago ya consta confirmado; la ejecución real del cron requiere el despliegue Worker con su configuración.

Rollback: revertir la entrega en Git y redesplegar Pages y Worker. Cambios de esquema aditivos: la tabla geográfica puede conservarse. No restaurar/borrar ledger ni pedidos para deshacer código. Quitar el cron detiene continuaciones futuras, no revierte entregas realizadas.
