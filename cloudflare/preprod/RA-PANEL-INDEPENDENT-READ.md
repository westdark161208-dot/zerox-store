# Lectura privada independiente del Panel Control

Base cbc2f44, rama piloto, PR48. Código preparado; sin despliegue.

## Implementación
ra-admin-service.mjs conserva readRaAdminService y sus guardas para consumidores
comerciales existentes. Añade readRaCatalogService y catalogReadReady para el panel:
RA_READ_SERVICE con GET /admin/ra/wallet o /admin/ra/catalog, Bearer exclusivamente
RA_CATALOG_READ_TOKEN. No escribe D1 ni llama a /buy, validate o un origen RA público.
Reutiliza validación acotada de respuesta, USD, tipos, conteo, IDs/SKUs únicos y no-store
en rutas del backend. No fija220 ni213 como tamaño obligatorio: valida el conteo recibido.

readRaFounderService selecciona el canal nuevo cuando existe su flag o token. Si está
configurado pero deshabilitado, incompleto o inválido, falla sin probar otro token.
Cuando no existe configuración nueva conserva el comportamiento anterior para no
alterar instalaciones existentes. El canal comercial nunca selecciona el token nuevo.
No cambia raPrivateMode, requireLegacyRa, privatePurchaseReady ni configuración de pagos.

Rutas /api/admin/providers/recargas-america/{status,wallet,catalog} exigen fundador
activo; soloGET, sin query. /api/admin/providers/founder-balances usa la misma lectura
paraRA y no acredita saldoZeroX. Status reporta disponibilidad de configuración, no
prueba de conexión. readOnly/purchasesEnabled:false se refieren al endpoint de consulta,
no afirman que la tienda tenga compras apagadas. Se aclara este alcance en el panel.

control-finance.js ya consume status/wallet; providers-panel.js ya consume catálogo y
renderiza con textContent. Se conservan controles actuales y listado dinámico con precios
USD. No se envía token al frontend. No se reconstruye Panel Control ni el checkout.

## Activación posterior mínima, requiere aprobación
1. Verificar versión candidata externa aa62397e de zerox-ra-vpc-test y que acepte el
   token independiente para ambas rutasGET. Sus HTTP200 y213 productos son evidencia
   reportada por el propietario; esta sesión no los reprodujo ni activó esa versión.
2. Aprobar la activación de la candidata en el servicio existente; un binding al nombre
   del Worker usa su despliegue activo, no el identificador de versión candidata.
3. Incorporar RA_CATALOG_READ_TOKEN como secret privado en backend y receptor según
   contrato externo.64hex minúsculas, distinto de RA_READ_ADMIN_TOKEN, RA_PROXY_SECRET,
   RECARGAS_AMERICA_API_KEY, RA_PURCHASE_SERVICE_TOKEN y RA_PURCHASE_PROXY_SECRET.
   Nunca escribir valor en Git, frontend, logs o comandos con argumento visible.
4. Revisar/aplicar ra-panel-read-APPROVAL-REQUIRED.patch contra configuración efectiva:
   añade solo RA_READ_SERVICE→zerox-ra-vpc-test y RA_CATALOG_READ_ENABLED=true,
   RA_CATALOG_READ_CONTRACT_VERIFIED=true. Si ya hay binding, conservarlo/verificar
   destino sin duplicarlo. No aplicar patches ff110-wallet-release de otro objetivo.
5. Desplegar solo tras aprobación con versión revisada, conservando todos los secretos
   existentes. No habilitar RA_ADMIN_READ_ENABLED/transporte legacy como atajo: esas
   variables sí seleccionan transporte comercial y no son parte de este cambio.
6. Fundador: consultar saldo/catálogo desde panel. Usuario ordinario401/403; POST405.
   Confirmar GET, USD, conteo real y errores sanitizados sin registrar saldo o token.
7. Reversión rápida: RA_CATALOG_READ_ENABLED=false bloquea las consultas nuevas sin
   tocar compras. Conservar secreto/binding hasta revisar consumidores compartidos.

El patch NO modifica PUBLIC_COMMERCE_ENABLED, MP, Sixofire, wallet, flagsFF110, flagsRA
heredadas, D1/R2/cron ni Oracle. No introduce infraestructura. Permisos requeridos para
la activación externa: edición del Worker backend y secret/binding, y aprobación de la
versión receptora por su propietario; no se requieren cambios de rutas públicas/VPC.
Los permisos efectivos y disponibilidad de secretos no se comprobaron desde GitHub.

## Pruebas y límites
326/326 pruebas locales completas aprobadas, incluyendo18 nuevas independientes.
Cubren213 productos simulados, saldoUSD ficticio, GET/token correcto, fundador activo,
POST/query rechazados, fallo deauth, JSONinválido, moneda/importe/conteo inválidos,
colisión de secretos, falta de binding y ausencia de fallback. Verifican que las flags
comercialestrue no bloquean el canal administrativo y purchaseConfiguration/raPrivateMode
no cambian. Suite completa conserva pruebasMP, wallet, SF y FF110.

Las29 pruebas externas mencionadas por el propietario son evidencia externa separada.
No se afirma reproducción en GitHub de catálogo real, saldo, conexiónOracle o candidata.
No se desplegó, no se activaron compras y no se usaron credenciales comerciales.

Comando local:
node --test tests/*.test.mjs cloudflare/providers/ra-admin-service.test.mjs cloudflare/staging/*.test.mjs
