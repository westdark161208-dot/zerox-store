# Fase 2 — Panel original, lecturas privadas

Base: c52cf82. La fase 1 y el cierre de su acceso temporal fueron confirmados por el propietario. No se han reactivado sus sesiones, códigos ni token de edición.

Cambios:
- ra-founder-read.mjs comparte wallet/catalog/status entre backend administrativo original y staging. Solo fundador activo; GET sin parámetros; no-store por ambos llamadores; errores saneados; service binding sin fallback.
- providers/routes.mjs intercepta todas las rutas RA en modo RA_ADMIN_READ_ENABLED=true: asociaciones, readiness y validación quedan rechazadas. Market combinado también queda bloqueado en ese modo porque puede consultar RA directamente y guardar snapshots. Las funciones se conservan en código, no se eliminan.
- Panel original: conserva scripts y controles; comunica modo privado y cantidad real del catálogo con precios USD.
- Staging: reutiliza la sección providers y estilos del panel original mediante build-control-preview.mjs; excluye todos los scripts productivos. Controles no RA inertes en esta copia. Solo D1 staging; no acceso a clientes ni pagos.
- 39 pruebas locales simuladas aprobadas. No equivalen a una validación real en Cloudflare de esta revisión.

Manifiesto staging existente sin cambios: zerox-ra-founder-staging, D1 a54b8020-71a4-4d4d-a576-800ee112a5cf, RA_READ_SERVICE -> zerox-ra-vpc-test; workers_dev=false, preview_urls=false, flags financieros false.
Secreto: RA_READ_ADMIN_TOKEN solamente en backend. No API key RA ni proxy secret en navegador/backend de staging.

Antes de producción:
1. Compilar esta revisión mediante workflow build-only y verificar artefacto.
2. Obtener acceso Cloudflare autorizado, auditar bindings/flags efectivos y cargar versión de staging con secreto existente sin exponerlo.
3. Autorizar por separado cualquier reapertura web, emitir NUEVO código/sesión y probar la vista autenticada. Registrar solo estado/moneda/conteo, nunca saldo.
4. Revisar configuración final del Worker principal y aprobar despliegue/main explícitamente. Su configuración actual NO se ha modificado ni se afirma que sus compras estén desactivadas. El readOnly de status describe exclusivamente este puente; no cambia los sistemas de pago.
5. Las rutas de servicios/diamantes fuera del backend administrativo siguen pendientes de auditoría/migración antes de habilitar compras RA. No se importan en staging.

Esta revisión no despliega, no modifica main ni Oracle/Zerito/pagos; no habilita compras ni URL pública.
