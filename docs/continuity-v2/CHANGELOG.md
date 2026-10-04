# Changelog de continuidad v2

## Paneles y wallet — propuesta 2026-10-04 UTC
- Tema compartido negro, burbujas sutiles y azul/verde desaturados; menor separación de perfil.
- Avatares y banners únicamente desde dispositivo; imágenes guardadas y marcos conservados.
- Firma corregida a Iztapalapa, México, sin “hecho”/“creado”.
- Recuperados ledger MXN y adaptador RA de lectura de rama anterior; desactivados por defecto.
- Consulta propia de wallet con protección frente a respuestas tardías; rutas privadas no-store.
- 37 pruebas aprobadas y suite revendedores/build correctos. Revisión visual pendiente por descarga de Chromium inválida.
- No publicado ni activados pagos/proveedores. Detalles: PANELS-WALLET-2026-10-04.md.

## Reanudación — 2026-10-04 UTC
- Releído ZIP adjunto y contrastadas capturas con main 74ffd6a y rama anterior d6d8664.
- Recuperada solo limpieza visual de perfil/footer en nueva rama desde main.
- Añadido selector independiente país/moneda, persistencia y configuración pública de referencia; métodos productivos sin habilitar.
- Corregida actualización de filas del carrito al cambiar moneda; conservados precios base y backend.
- 26 pruebas Node y suite revendedores aprobadas; sintaxis/build aprobados. Validación visual real pendiente por navegador no disponible.
- Mapa, archivos, límites y rollback: RESUME-2026-10-04.md. Propuesta para revisión; sin despliegue productivo.

## Fase 0 — 2026-10-03 UTC
- Leídos paquete v2, base v1 y documento Word.
- Recuperadas fuentes del commit remoto ae23197 mediante GitHub; clonación directa bloqueada por conectividad del proxy.
- Creada rama remota work/zerox-continuidad-v2 desde ae23197.
- Inventariados perfiles, autenticación, administración, ledger revendedor, motor de diamantes y Mercado Pago TEST.
- Conservada especificación en docs/continuity-v2/specification, excluida del build público por la allowlist existente.

## Fase 1 — propuesta, sin publicación productiva
- index.html y profile.html: firma de origen en rojo; actualización de versiones CSS. index.html añade título de niveles.
- responsive.css y profile.css: reducción de tarjetas mediante divisores/espaciado, sin retirar controles ni datos.
- Pruebas base: diamantes 6/6, Mercado Pago TEST 3/3, suite revendedores PASS.
- Pendiente: revisión visual Android/escritorio y E2E autenticado en preview; Chromium no disponible en el entorno.
- No modificados backend, secretos, base de datos, saldos ni main.

- Validación estática: IDs HTML existentes preservados; sintaxis de app.js/profile.js aprobadas. Build local aprobado (22 entradas públicas, sin medios recuperados); docs/backend excluidos.

## Incremento 2 — fundamentos de backend, sin despliegue
- MXN confirmado por usuario. Recibidos y leídos colección Postman y plugin RA.
- Permisos centralizados; sesiones propias consultables y revocables con auditoría.
- Cuentas deshabilitadas bloqueadas, JSON no-store y errores internos sin datos sensibles.
- Service worker preparado para excluir API/datos privados si se reactiva; sigue desactivado.
- Ledger MXN inmutable, atómico e idempotente, separado del saldo revendedor; API solo lectura y desactivada por defecto.
- Recargas América: adaptador solo lectura de saldo/catálogo para Fundador; sin llamadas reales ni compras.
- Pruebas nuevas: 11 casos de seguridad, rutas Worker, proveedor y ledger aprobados. Regresiones previas aprobadas.
- Detalle de archivos, condiciones de activación y pendientes: BACKEND-FOUNDATIONS.md.
- No incluye passkeys/step-up ni sesión administrativa separada; no afirmar que la fase completa de seguridad está terminada.

## Incremento 3 — perfil: wallet y sesiones
- index.html: secciones Saldo Zero’X y sesiones dentro del perfil privado; sin botones de recarga/compra no habilitados.
- account-services.js: consulta autenticada de wallet/historial y sesiones; revocación individual/todas con confirmación; respuestas tardías descartadas al cambiar o cerrar sesión. No persiste datos privados.
- app.js: invalida vistas privadas al cambiar el estado de cuenta; flujo existente de logout conservado.
- responsive.css: listas con divisores, importes legibles en MXN y botones de sesión.
- scripts/build-pages.mjs: incluye el nuevo módulo público; backend/docs/pruebas siguen excluidos.
- tests/account-services.test.mjs: 3 pruebas aprobadas (respuesta tardía, wallet desactivada, marcador de sesión). Regresiones worker-security y wallet aprobadas; sintaxis y compilación correctas.
- Revisión visual móvil/escritorio aún pendiente. No desplegado en producción.


## Definitive diamond artwork — 2026-10-03
- Imported all 50 user-approved images by exact filename quantity, with 320/640px WebP derivatives preserving aspect ratio and alpha. Original upload remains unchanged.
- Corrected character metadata and old cross-package image references. 18,480 uses neutral “Colección rosa” pending exact character name.
- Artwork lookup uses stable product quantity/ID before display name, so a later Editor rename does not detach artwork.
- Prices, quantities, delivery recipes and payment flags unchanged. Editor publishing and production rollout remain separate pending work.


## ZIP compliance review and read-only Control — 2026-10-03
Rechecked the reattached ZIP (text contents unchanged), recorded published versus prepared functionality in REVIEW-2026-10-03.md, and added a founder-only read-only Control dashboard. Queries do not change operational tables or expose secrets. Unavailable metrics remain unavailable. Payments/provider activation remain pending.
