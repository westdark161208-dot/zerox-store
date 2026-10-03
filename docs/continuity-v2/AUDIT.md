# Continuidad Zero’X Store v2 — auditoría y estado

Fecha: 2026-10-03 UTC / 2026-10-02 México.
Actualización: ver BACKEND-FOUNDATIONS.md para el incremento 2; esta auditoría describe la base inicial. MXN ya confirmado y documentación RA recibida.

Fuente: ZIP v2 ZEROX PAY adjunto. Se leyeron todos los textos, el documento Word y el inventario del ZIP original incluido. Los textos de especificación se conservan en `specification/`.
Base remota: `ae23197da28f73765f177653448ba29f0356e1ec`.
Rama de trabajo: `work/zerox-continuidad-v2`. No se ha actualizado main, desplegado el Worker ni migrado D1.

## Mapa verificado en código

| Área | Archivos | Estado |
|---|---|---|
| Tienda | index.html, app.js, styles.css, responsive.css | HTML/JS sin framework; catálogo, carrito, consulta de ID y diálogo de confirmación |
| Perfil privado | index.html, app.js | Cuenta, foto/banner, marcos, insignia fundador, XP/nivel, contacto privado, visibilidad, favoritos, consulta FF |
| Perfil público | profile.html, profile.css, profile.js | Consulta por usuario; respeta publicación en backend |
| Editor actual | manage.html, manage.js, manage.css | Panel separado con productos accounts/clans/honor, streaming, anuncios y medios; NO editor visual sobre tienda |
| Autenticación | cloudflare/worker.js | PBKDF2, tokens Bearer, sesiones D1, fundador por ID fijo; falta RBAC, passkeys, step-up y recuperación reforzada |
| Persistencia | cloudflare/wrangler.jsonc, worker.js | Worker zerox-sixofire-api; D1 DB; R2 MEDIA |
| Revendedores | cloudflare/resellers.js, resellers.js, resellers-admin.js | Ledger zx_r_ledger, depósitos pendientes con revisión, niveles y pedidos; conservar separado de nueva wallet |
| Diamantes | cloudflare/diamonds/*, diamond-catalog.js, diamond-collection.* | Catálogo, recetas, snapshots, motor e idempotencia; habilitación productiva no demostrada |
| Pagos | cloudflare/payments/mercadopago-test.mjs, payment-test.*, payments-config.js | Checkout TEST fundador; ledger separado zx_mp_test_orders; NO abona wallet ni entrega |
| Hosting | scripts/build-pages.mjs, docs/cloudflare-pages.md | Allowlist pública dist; main documentada como rama de despliegue; backend separado |
| PWA | service-worker.js | Caché network-first genérica en archivo; index.html desregistra service workers y purga cachés al cargar. Revisar antes de reactivar PWA |

## Mercado Pago: constatado vs. pendiente

Código usa exclusivamente MP_ACCESS_TOKEN_TEST y MP_WEBHOOK_SECRET_TEST. Verifica cuenta de prueba, importe, moneda MXN, collector y referencia. La firma se comprueba y el pago se consulta al servidor. No existe un adaptador productivo ni acreditación wallet. URLs de retorno apuntan a pages.dev. No se inspeccionaron secretos de Cloudflare; no se puede certificar configuración productiva o recepción real de webhooks. No cambiar credenciales TEST ni activarlas como productivas.

## Riesgos y decisiones previas a las siguientes fases

1. service-worker.js contiene caché GET genérica sin excluir API ni Authorization, pero index.html actualmente desregistra workers y purga cachés. Riesgo latente si se reactiva PWA: excluir datos privados antes de reactivarla; no afirmar que hoy está interceptando peticiones.
2. Sesión en localStorage y sesión administrativa no separada. No presentar ocultación de botones como control de acceso; extender autorizaciones backend con denegación por defecto.
3. Ledger de revendedores existente: no fusionar ni convertir balances automáticamente. La wallet universal debe tener tablas y referencias propias.
4. Moneda contable, conversión, redondeo y límites de depósitos no definidos por el ZIP. Resolver antes de ofrecer conversiones o cobros reales. Propuesta: wallet MXN inicialmente, otras monedas solo presentación explícita.
5. Recargas América: ZIP no incluye documentación técnica, catálogo ni contratos API. Solicitar documentación sin secretos; no inventar rutas ni garantías de reembolso.
6. Binance Pay, Felix Pago, SPEI/OXXO y transferencias requieren disponibilidad de cuenta y conciliación verificadas. No añadir logos como métodos activos basándose en la lista prevista.
7. Host de producción y estado actual del dominio no verificados en esta revisión. Passkeys requieren fijar RP ID y orígenes definitivos.
8. admin.html es una entrada antigua que referencia admin.js ausente. Se conserva; no confundir con manage.html ni eliminar sin revisión.
9. La copia local contiene los archivos fuente recuperados con el conector GitHub; no incluye todos los medios. Los commits se construyen sobre el árbol remoto completo para conservar imágenes y demás archivos.

## Primera fase implementada

- index.html: firma de origen, título Nivel y beneficios, versión de responsive.css.
- responsive.css: secciones continuas en el perfil privado; conserva campos, IDs, botones, marcos y banner; foco visible.
- profile.html: firma de origen y versión de profile.css.
- profile.css: presentación pública más continua; conserva identidad y marcos.
- docs/continuity-v2/: auditoría, changelog y especificación original en texto.

No se agregan saldos ficticios, promesas de XP por compra ni métodos de pago no habilitados.

## Validación

- Pruebas originales ejecutadas individualmente: 6 casos diamantes, 3 Mercado Pago TEST; suite revendedores aprobada (permisos, saldo, concurrencia, duplicados, devoluciones y precios).
- Comparación de IDs HTML y sintaxis JS se registran en CHANGELOG.
- Revisión visual móvil/escritorio pendiente: Playwright instalado, pero Chromium no está disponible. No afirmar validación visual ni E2E real de login/pago.
- No se cargaron balances reales ni se emitieron pedidos/cobros.
- La compilación de fuente local no certifica la integridad visual de los medios remotos; validar preview completo antes de publicar.

## Rollback y publicación

La rama parte de ae23197. Mantener main intacta hasta aprobación del cambio productivo, como exige el ZIP. El PR conservará el árbol remoto por base_tree_sha, modificando solo los archivos listados. Si se publica después, revertir el commit de esta fase y redesplegar frontend. No hay migraciones de base de datos que deshacer en esta fase.

## Matriz de continuidad (no equivale a implementación)

| Fase | Estado / condición de salida |
|---|---|
| 0 Auditoría y respaldo | Terminada; pruebas base aprobadas, rama remota creada |
| 1 Perfil y footer | Implementada, revisión visual pendiente antes de publicar |
| 2 Roles y frontera de seguridad | Pendiente: sesiones, caché privada, RBAC backend y pruebas de acceso |
| 3 Editor visual | Pendiente: empezar por contenido no crítico, borradores, publicación auditada |
| 4 Control de solo lectura | Pendiente: métricas reales, finanzas/proveedores sin datos ficticios |
| 5 Wallet universal | Pendiente: moneda decidida, ledger atómico/idempotente separado, servicio y auditoría |
| 6 Administración sensible | Pendiente: step-up antes de activar acciones financieras |
| 7 Passkeys/Security Center | Pendiente: RP ID/orígenes, recuperación, sesiones administrativas y auditoría |
| 8 Proveedores/automatización | Pendiente: documentación RA, adaptadores independientes, compensación y E2E |
| 9 Lunes | Solo futura integración, sin permisos ni secretos automáticos |
| ZeroX Pay | Pendiente: topups, compra directa/wallet, webhooks verificados; métodos adicionales sujetos a documentación |
| País/moneda y footer pagos | Pendiente: configuración de métodos reales por región; no inferir ubicación de moneda |

La instrucción del ZIP pide comenzar únicamente por la primera etapa segura y cerrar sus pruebas antes de continuar. El pedido general de implementar todo se conserva como objetivo, con las dependencias anteriores explícitas.
