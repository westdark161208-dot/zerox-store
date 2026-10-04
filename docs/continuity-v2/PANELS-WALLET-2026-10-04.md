# Paneles y fundamentos de wallet — 2026-10-04 UTC

Base publicada: `ad5e52ff09a5759d1f6c604c55d04784e472b95a` (PR #3 fusionado). Rama de propuesta: `work/zerox-panels-wallet-20261004`. Leídos ZIP adjunto y capturas antes de modificar. No se reconstruye la tienda.

## Petición aplicada

Perfil, Control, catálogo administrativo, Seguridad y herramientas del Editor comparten fondo negro y acentos azul/verde desaturados. Burbujas decorativas discretas, sin interceptar controles; animación desactivada con reduced-motion. Espaciado del perfil reducido de 18px/22px a 10px/14px entre secciones. Se conserva el arte y contenido del catálogo.

Retirados únicamente los selectores/galerías de avatares y banners prediseñados que pidió eliminar el usuario. Carga local JPEG/PNG/WebP y guardado existentes conservados, con cancelación del selector tolerada. Imágenes ya guardadas permanecen válidas; no se migra ni borra ningún perfil. Marcos por nivel conservados en el selector existente; eliminada su galería duplicada junto a las galerías retiradas. La firma ahora dice exactamente **Iztapalapa, México** en tienda y perfil público.

## Archivos y propósito

- `panel-theme.css`: identidad compartida con alcance limitado a paneles, perfil y herramientas del Editor; responsive y reduced-motion.
- `index.html`, `app.js`: carga desde dispositivo, retiro de galerías, firma, nueva consulta propia de wallet e invalidación de datos privados al cambiar sesión.
- `profile.html`, `control.html`, `security.html`, `manage.html`: enlazan el tema compartido.
- `scripts/build-pages.mjs`: añade solamente tema y módulo de vista wallet a la allowlist pública.
- `wallet-view.js`: consulta manual propia en MXN; sin datos de prueba o saldo ficticio. Respuestas tardías descartadas tras cierre del perfil, sesión cambiada o página oculta. No persiste saldos ni movimientos.
- `cloudflare/wallet/ledger.mjs`, `routes.mjs`: recuperados de la rama anterior, ledger cerrado inmutable e idempotente; ruta propia exclusivamente GET, desactivada por defecto.
- `cloudflare/providers/recargas-america.mjs`, `routes.mjs`: recuperados de la rama anterior, contrato previamente contrastado con archivos aportados. Lecturas privadas, GET y host fijo; sin compras ni claves añadidas.
- `cloudflare/worker.js`: registra ambos módulos sin cambiar flags, credenciales o flujo financiero previo.
- `tests/wallet.test.mjs`, `provider-read.test.mjs`, `wallet-view.test.mjs`, `session-flow.test.mjs`: concurrencia, idempotencia, inmutabilidad, acceso propio, separación de monedas, rutas reales y descarte de datos privados tardíos.

Las rutas nuevas establecen `Cache-Control: no-store`; se detectó y corrigió esta diferencia al integrar la base preparada con el Worker actual.

## Validación y límites

37 pruebas Node aprobadas, suite revendedores aprobada, sintaxis app/wallet/Worker aprobada y build público correcto (208 archivos). Backend, pruebas y docs excluidos del build. Ningún secreto incorporado ni API de proveedor consultada. Las pruebas de ledger usan SQLite local y respuestas simuladas; no prueban transacciones reales en D1 remoto.

Revisión visual móvil/escritorio y flujo autenticado real pendientes: no hay navegador instalado y la descarga de Chromium volvió a devolver un ZIP inválido. Las reglas responsive y pruebas de DOM no sustituyen esa revisión. El borrador no debe considerarse validado visualmente ni listo para activar pagos.

No se cambiaron precios, recetas, roles, stock ni credenciales. Mercado Pago sigue TEST. Wallet y Recargas América conservan activación deshabilitada por defecto; sin activar `WALLET_READ_ENABLED` no se crea su tabla. No hay escritura pública de saldo, fondeo, compras con wallet, webhooks a ledger o entrega automática nueva.

## Rollback y siguientes módulos

Propuesta en rama y borrador; producción permanece en la base. Se puede descartar sin migraciones remotas. Tras una futura publicación, revertir los commits y redeplegar el Worker anterior. Si se activó lectura posteriormente, conservar el ledger y su historial al revertir código.

Pendientes: validación visual y login/guardado reales; estados/intenciones de pago y webhook verificado, snapshot de pedido y reserva/compensación; consulta de proveedores en Control; passkeys/step-up antes de acciones financieras sensibles. Activación financiera real requiere confirmación explícita y prueba controlada. La moneda mostrada continúa siendo referencia, no moneda contable de la wallet.
