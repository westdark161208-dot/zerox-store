# Seguridad, wallet y proveedor — incremento 2

Estado: preparado en rama, no desplegado. Fecha: 2026-10-03 UTC.
Decisión del usuario: saldo contable inicial MXN; equivalencias de otras monedas posteriormente, USD y USDT separados.

## Cambios disponibles

- `cloudflare/security/permissions.mjs`: matriz central con permisos de la identidad validada por el servidor. Conserva Fundador como único administrador; no permite asignar roles desde solicitudes. Es la base, no un RBAC con delegación terminado.
- `cloudflare/security/sessions.mjs`: listado propio (sin tokens/hashes), cierre individual/todas las sesiones y registro transaccional de revocaciones en `zx_security_events`. No identifica dispositivos por huella ni inventa su ubicación.
- `cloudflare/worker.js`: enruta servicios; rechaza cuentas deshabilitadas en `currentUser`; respuestas JSON no-store; errores internos sin mensajes de base de datos. Permisos centralizados para catálogo y contenido.
- `cloudflare/resellers.js`, `cloudflare/payments/mercadopago-test.mjs`: mismas autorizaciones existentes, ahora mediante matriz común. No se cambian importes ni cobros.
- `service-worker.js`: si se reactiva en el futuro, solo intercepta activos estáticos del mismo origen, sin queries ni Authorization; excluye APIs, no guarda respuestas privadas/no-store, y no devuelve HTML como respuesta a un activo fallido. La desactivación actual de la PWA continúa.
- `cloudflare/wallet/ledger.mjs`: libro append-only MXN separado de revendedores. Movimientos internos positivos/negativos en centavos, saldo anterior/posterior, actor, pedido, referencia e idempotencia. Débitos condicionales atómicos; devolución completa vinculada al mismo usuario/pedido, una sola vez. Triggers bloquean modificación/eliminación de movimientos. No se habilitan ajustes manuales, transferencias ni retiros.
- `cloudflare/wallet/routes.mjs`: lectura exclusiva de la wallet del usuario autenticado. No hay ruta de escritura de saldo.
- `cloudflare/providers/recargas-america.mjs`: GET wallet/catalog sobre host fijo documentado, rechaza redirecciones, oculta errores sensibles y limita campos retornados. No implementa compras.
- `cloudflare/providers/routes.mjs`: consulta privada del Fundador; nunca publica saldo/costos del proveedor a clientes.

## Endpoints

| Ruta | Acceso | Método |
|---|---|---|
| `/api/security/permissions` | Usuario activo | GET |
| `/api/security/sessions` | Usuario activo, solo sus sesiones | GET |
| `/api/security/sessions/revoke` | Usuario activo, body `sessionId` propio | POST |
| `/api/security/sessions/revoke-all` | Usuario activo, body `confirm:true` | POST |
| `/api/wallet/me` | Usuario activo, función habilitada | GET |
| `/api/admin/providers/recargas-america/status` | Fundador | GET |
| `/api/admin/providers/recargas-america/wallet` | Fundador, conexión habilitada | GET |
| `/api/admin/providers/recargas-america/catalog` | Fundador, conexión habilitada | GET |

Listado/revocación usa Bearer actual. La revocación de sesiones es una acción del titular; **no constituye step-up** para operaciones financieras.

## Configuración futura, sin valores de secretos

- `WALLET_READ_ENABLED=true`: habilita exclusivamente lectura wallet y creación aditiva de su tabla. Por defecto responde WALLET_NOT_ACTIVE.
- `RA_READ_ENABLED=true`: habilita exclusivamente lecturas al proveedor.
- `RECARGAS_AMERICA_API_KEY`: secreto en el Worker, nunca frontend/Git. No se ha configurado ni utilizado una clave real.
- Las keys existentes de MP TEST no se cambian; no existe activación de pagos productivos en este incremento.

## Contrato RA confirmado en archivos aportados

Colección Postman v1.0.0 y plugin reseller-catalog suministrados por el usuario:

- Base `https://panel.recargasamerica.com/api/v1`, Bearer.
- GET `/wallet`, GET `/products/catalog`.
- POST `/buy/catalog`, POST `/catalog/validate`, GET `/catalog/orders/{order_id}`: documentados, **aún no implementados en adaptador**.
- El plugin documenta idempotencia de 24 horas: no asumir protección indefinida ni reintentar una compra ambigua fuera de ventana.
- Compras usan saldo prefondeado del proveedor; no se deriva del saldo del cliente.
- Lotes de pines pueden ser PARTIAL/NEEDS_REVIEW; requieren conciliación por lote.
- La validación de cuenta puede responder `supported:false`; no significa cuenta verificada ni cuenta inválida.
- No se documentan en la colección endpoints de fondeo, cancelación/reembolso ni callbacks. No inventarlos.
- USD en ejemplo de wallet; devolver moneda real de respuesta. No tratarlo como USDT.

## Límites concretos antes de activar ventas

`postMovement` es un servicio interno probado, NO verificador de pagos. Un futuro adaptador debe verificar al servidor procesador, coincidir importe/moneda/beneficiario/intención persistida y registrar exclusivamente pagos aprobados. No exponer el servicio a JSON arbitrario. Crear snapshot inmutable de pedido con precio servidor antes del débito; integrar reserva/compensación y estados pending/failed/refunded en pagos/pedidos. Este incremento solo soporta devoluciones completas; parciales y contracargos siguen pendientes.

Todavía faltan passkeys, respaldo/recuperación, step-up, sesión administrativa separada, rate limiting, alertas y delegación de roles. Las acciones administrativas antiguas mantienen su protección actual; no afirmar que ya exigen passkey.

UI de sesiones/wallet/Control, editor visual, selector de países y conversión, webhook productivo y entrega automática siguen pendientes. No se cambia el frontend del perfil en este incremento.

## Pruebas y rollback

Pruebas nuevas: security (2), provider-read (3), wallet (4), worker-security (2). Además pruebas existentes de diamantes (6), Mercado Pago TEST (3) y suite revendedores. Todo local en SQLite/respuestas simuladas; ninguna llamada autenticada al proveedor, saldo real ni compra.

Referencia de atomicidad D1: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

No se ejecutó migración remota. Tablas nuevas solo aditivas; creadas al utilizar nuevas rutas habilitadas. Para rollback del Worker, redeplegar versión previa y deshabilitar flags; conservar tablas/historial nuevos, nunca borrarlos para revertir código. Main permanece en su commit anterior. Revisión visual del incremento 1 continúa pendiente; no está resuelta por estas pruebas backend.
