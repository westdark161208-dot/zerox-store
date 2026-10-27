# Informe — Zero'X Resellers Portal V2

Estado: IMPLEMENTADO Y PROBADO LOCALMENTE; NO PUBLICADO EN LA TIENDA.

## Entrega
- Rama: codex/resellers-portal-v2-20261025.
- PR de revisión, sin fusionar: https://github.com/westdark161208-dot/zerox-store/pull/50
- Implementación: b38c11bdc19f60b6e61722d32a3bc648cb934de6.
- Corrección de quitar/restaurar imagen de cabecera: 0b3de5d1fb4af6b407c6abba75820b7ec32da34a.
- Base: main 4055189b31ee2440e77836a2e8e09b2bdfa61715.
- El árbol inicial subido a GitHub coincidió exactamente con el árbol probado: 73744fa3e8558da1c4488f590cdecc2e89bb5239.

## Funcionamiento implementado
Inicio, Solicitud, Niveles y Mi Panel dentro de la tienda existente.
Autenticación reutilizada, saldo Resellers independiente, solicitudes desde $200 MXN,
pendientes sin acreditar, rechazo y aprobación manual con confirmación de recepción.
Se registra administrador, fecha y referencia bancaria; acreditación atómica única.
Búsqueda de solicitudes por usuario/folio/referencia e historial de revisión en Control.
No se añaden comisiones ficticias, productos Streaming inexistentes ni nuevas regiones.

Siete niveles conservados: Novato ($200 confirmados), Principiante (10/7 días),
Élite (30/7), Maestro (50/7), Titán (100/7), Legendario (500/30),
Zero'X Supreme (1,000/30). Los permisos siguen siendo calculados por el backend.

Editor de colores: 12 variables CSS, selector visual/HEX/HSL, cinco paletas,
cuatro intensidades de neón, vista previa, borrador, publicación explícita y
restauración de la última apariencia publicada al borrador. Versiones en D1.
Editor de imágenes: 15 espacios, JPG/PNG/WebP, subir/seleccionar/reemplazar/quitar,
restaurar original, encuadre, posición, opacidad, oscurecimiento e iluminación.
Servidor valida firma, dimensiones y tamaño; usa el binding MEDIA existente.
Cambiar colores conserva las imágenes. Quitar una imagen no elimina sus versiones.

## Pruebas
- 217 pruebas de Node aprobadas, sin fallos.
- Suite existente de Resellers aprobada: autenticación, precios, saldo,
  referencias duplicadas, compras idempotentes, reembolsos y niveles.
- D1 local/workerd: cuatro solicitudes concurrentes producen una solicitud;
  cuatro aprobaciones acreditan una sola vez; publicación concurrente única.
- Chromium local, pantalla táctil emulada de 393 px: navegación/teclado,
  solicitud, aprobación, Novato, catálogo, apertura de compra, apariencia,
  carga/selección/retirada de imágenes y ausencia de desbordamiento horizontal.
- Compilación de Pages: 272 archivos públicos. Bundle del Worker compilado.
- Corrección final de quitar/restaurar cabecera comprobada separadamente.
- Sin depósitos, compras, recargas ni acreditaciones reales.
- No se verificó en un teléfono Android físico ni con sesión de producción.

## Archivos
Frontend: index.html, resellers.js, resellers-theme.js, resellers-v2.css,
control.html, control-resellers.js, assets/resellers-reference.png.
Backend: cloudflare/resellers.js, cloudflare/resellers-appearance.js.
Build/PWA: scripts/build-pages.mjs, service-worker.js.
Pruebas: cloudflare/resellers.test.mjs, tests/resellers-v2.test.mjs,
tests/resellers-d1-local.mjs, tests/resellers-browser.mjs.
Documentación: docs/resellers-v2/RELEASE.md y este informe.

## Publicación y límites
URL revisada: https://zerox-store.pages.dev/
El resellers.js servido públicamente sigue siendo el anterior, con SHA-256
2228a17562204f79509d4d4be810c384762e19c2419625bc1f4ecfe98a111249.
Versiones nuevas desplegadas: NINGUNA. ID actual del Worker no verificado.

Falta acceso autorizado de Cloudflare: token o sesión segura con permisos
limitados al Worker, Pages, D1 y R2 existentes. No hay token ni sesión Wrangler
configurados en este entorno. No enviar secretos por chat ni guardarlos en Git.
Antes de desplegar hay que obtener la fuente/configuración efectivas del Worker,
respaldar D1 y portar exclusivamente estos cambios sobre esa versión si difiere
de main. No desplegar ciegamente cloudflare/wrangler.jsonc: contiene flags
comerciales que deben compararse con los efectivos antes de cualquier publicación.
El procedimiento de respaldo, publicación y reversión está en RELEASE.md.
No se hizo respaldo de producción porque no hay acceso autorizado a sus datos.

Historial mostrado: últimos 200 registros administrativos; se conservan los límites
previos del usuario (30 pedidos/movimientos y 20 depósitos), sin eliminar registros.
Las imágenes retiradas se conservan para las versiones históricas.
Smart Recipes, FF110, RA, Sixofire, Mercado Pago, seis paquetes originales y
ramas ajenas permanecen sin cambios. main no se fusionó ni modificó.
