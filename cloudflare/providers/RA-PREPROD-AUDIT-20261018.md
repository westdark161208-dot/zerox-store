# ZERO'X RA — auditoría previa a producción (18/oct/2026)

**Estado: NO APTO PARA DESPLIEGUE A PRODUCCIÓN.** Este documento no autoriza compras, conciliación, cambios de flags, bindings, secretos ni despliegues. Los datos de staging fueron verificados por el propietario: GET protegido, USD, 220 productos y acceso temporal revocado. Eso NO valida el Worker productivo.

## Hallazgos confirmados en el repositorio

1. **Manifiesto productivo incompatible con asumir lectura sin compras.** `cloudflare/wrangler.jsonc` apunta a `zerox-sixofire-api` y define `RA_READ_ENABLED=true`, `RA_AUTO_ASSOCIATE_US=true`, `RA_CONTRACT_VERIFIED=true`, `RA_DELIVERY_ENABLED=true`, `DIAMOND_PRODUCTION_ENABLED=true`. Esos valores son del archivo versionado, no confirmación del estado remoto de producción. Activar `RA_ADMIN_READ_ENABLED` en ese ambiente SIN aislar el resto sería engañoso. La rama de auditoría añade un guard que responde HTTP 503 para status/wallet/catalog privados si cualquiera de esos tres flags financieros está en true. No revierte flags productivos existentes.
2. **Falta wiring privado en manifiesto de producción.** `RA_READ_SERVICE` hacia `zerox-ra-vpc-test` existe solo en `cloudflare/staging/wrangler.jsonc`; el manifiesto productivo no lo configura. Tampoco declara `RA_ADMIN_READ_ENABLED`, `RA_ADMIN_READ_TRANSPORT`, `RA_ADMIN_READ_CONTRACT_VERIFIED`. El secreto `RA_READ_ADMIN_TOKEN` requiere gestión segura independiente, nunca guardarlo en Git.
3. **Rutas heredadas directas activas en el código.** `cloudflare/providers/recargas-america.mjs` consulta directamente `panel.recargasamerica.com` con `RECARGAS_AMERICA_API_KEY`. Lo usan `cloudflare/diamonds/recargas-america.mjs`, `cloudflare/services/games.mjs`, `cloudflare/services/delivery.mjs`, `cloudflare/providers/market.mjs`, `cloudflare/providers/ra-associations.mjs`, `cloudflare/providers/readiness.mjs` y flujos de compras relacionados. Su ejecución productiva **no fue migrada ni comprobada** con la IP autorizada de Oracle.
4. **Interacción con el mercado administrativo.** En modo `RA_ADMIN_READ_ENABLED=true`, `cloudflare/providers/routes.mjs` bloquea `/api/admin/providers/market*` para evitar consultas RA directas y escrituras de snapshots D1; esto también afectaría vistas o acciones Sixofire compartidas. Requiere separar explícitamente operaciones antes del merge.
5. **Calidad del catálogo: identificación pendiente.** En la prueba del propietario se vieron rótulos `Age of Empires Mobile - 1999 Apex Coins` y otros con `Empire Coins`. No se puede determinar desde la interfaz si el problema proviene de la API, del gateway Oracle, del Worker RA de pruebas o del campo `name` del proveedor. Conservar ID, SKU, nombre y tipo **sin reemplazos heurísticos**, revisar con una muestra fuente autenticada y documentada; **no autopublicar ni vincular para entregas** esos SKU hasta validarlos por juego/moneda/región.
6. **Alcance de las pruebas.** Staging sólo importó vista de proveedores y rutas read-only, no el backend productivo, checkout, fondos de clientes, carrito ni entregas. Tampoco las pruebas de navegador sustituyen una validación del deployment productivo.

## Protección incluida en esta rama de auditoría

- `cloudflare/providers/ra-founder-read.mjs`: falla cerrado con `RA_PRIVATE_READ_PRODUCTION_GUARD` (503) cuando `RA_DELIVERY_ENABLED=true`, `RA_CONTRACT_VERIFIED=true` o `DIAMOND_PRODUCTION_ENABLED=true`, sin ejecutar consultas RA.
- `tests/ra-founder-phase2.test.mjs`: casos para cada uno de los tres flags en status/wallet/catalog, sin llamadas al proveedor.
- El flujo GitHub Actions de **dry-run únicamente** incluye la rama de auditoría; no hay scripts de despliegue a producción.

## Secuencia requerida antes de una eventual aprobación de producción

1. Confirmar **estado remoto efectivo** del Worker principal con autorización independiente y **sin revelar saldos/secretos**. Contrastar flags, endpoints, D1, crons, rutas, service bindings y versiones.
2. Decidir integración mínima del panel: mantener marketplace/admin heredados funcionales o aislar funcionalidades RA sin afectar Sixofire; pruebas de regresión para las dos condiciones.
3. Auditar y migrar consumidores de RA hacia conectividad privada autorizada sin modificar pagos ni crear escrituras; probar que cualquier error de proveedor no produce cobros/entregas ambiguos.
4. Auditar ID, SKU, moneda, variante, región, bonus y precios de la muestra real del catálogo; no asumir equivalencias por nombre. Separar nombres de proveedor vs nombres comerciales.
5. Definir rollback y test end-to-end del panel original y cuentas no Fundador; preparar manifiesto productivo revisado con lecturas bajo permisos mínimos. Ningún cambio a main/despliegue sin aprobación explícita.
6. Verificar que el token temporal de edición Cloudflare usado en la prueba previa fue revocado; conservar los secretos permanentes existentes.

**Ramas:** base staging validada `codex/ra-founder-private-bridge-20261017`; desarrollo de auditoría `codex/ra-preprod-safety-audit-20261018`. La rama de auditoría NO altera el staging desplegado, el Worker productivo, D1, Oracle, pagos, Zerito Bot ni main.

## Revisión incremental en PR #47
Las correcciones de transporte heredado, guard de saldo combinado y separación del marketplace están propuestas en esta misma rama. Véase `cloudflare/preprod/RELEASE-REVIEW.md` para alcance, plan de reversión y bloqueos externos que permanecen. El estado continúa **NO APTO PARA PRODUCCIÓN** hasta auditoría remota y aprobación; los hallazgos anteriores describen el punto de partida.
