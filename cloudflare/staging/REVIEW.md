# Staging privado RA — propuesta, sin despliegue

Base revisada: 6f088e2, rama codex/ra-founder-private-bridge-20261017.
Las 24 pruebas originales pasan; 6 pruebas adicionales verifican el perímetro aislado.
Los resultados V5 (HTTP 200, 220 productos) son confirmaciones del propietario, no consultas ejecutadas desde este entorno.

## Estado preparado (actualización)

Worker propuesto: zerox-ra-founder-staging. Base nueva propuesta: zerox-ra-founder-staging-auth.
34 pruebas locales aprobadas (24 originales + 10 de staging/autenticación); esquema SQL y caducidad de grants verificados también con SQLite local.
No se han creado recursos Cloudflare ni emitido credenciales reales.

## Aislamiento y acceso

Usar exclusivamente staging/wrangler.jsonc. No importa el Worker principal, cron, checkout ni entrega.
El panel independiente está en /panel, protegido por sesión; / muestra únicamente el formulario de acceso.
Las únicas consultas de proveedor son GET founder-balances, recargas-america/wallet y recargas-america/catalog bajo /api/admin/providers/.
Login/logout escriben exclusivamente en la nueva base de sesiones. No existe acceso a pedidos, wallets de clientes ni base productiva.
Sin CORS. Panel y API comparten origen. CSP restringida a scripts/estilos locales; sin analítica, logs de aplicación ni almacenamiento del navegador.
workers_dev y preview_urls permanecen desactivados hasta aprobación de publicación. Falta el UUID de la nueva base, que no existe todavía.

## Identidad aislada

schema.sql crea zx_users, zx_sessions y zx_login_grants. La identidad del Fundador se conserva como identificador, pero no se copia ninguna sesión ni contraseña productiva.
prepare-login.mjs genera LOCALMENTE un código aleatorio de 256 bits, válido 15 minutos, y grant.sql con su hash. Escribe archivos privados fuera del repositorio; nunca imprime el código. No ejecutar antes de preparar la base, pues caduca.
POST /auth/login consume el grant atómicamente y emite sesión de una hora en cookie Secure/HttpOnly/SameSite=Strict; solo el hash queda en D1. /auth/logout revoca la sesión. No hay registro público ni recuperación de contraseña.
La sesión exige cuenta activa, ID del Fundador, vigencia y ausencia de revocación. El código administrativo RA no se utiliza para iniciar sesión.
El panel muestra saldo real únicamente al Fundador que lo consulta; no lo registra, persiste ni incluye en resultados de pruebas. Los productos se renderizan con textContent, no HTML del proveedor. El número 220 es la referencia verificada, no un límite fijo del catálogo.

## Binding y secreto

- RA_READ_SERVICE: service binding a zerox-ra-vpc-test.
- STAGING_AUTH_DB: nueva D1 zerox-ra-founder-staging-auth, nunca zerox-store-db.
- RA_READ_ADMIN_TOKEN: único secreto de configuración de este backend; mismo token V5 de 64 caracteres hexadecimales minúsculos. Introducir mediante entrada segura, no Git/chat/frontend/logs.
- RECARGAS_AMERICA_API_KEY y RA_PROXY_SECRET permanecen donde están; no copiarlos aquí.

## Auditoría heredada

- providers/recargas-america.mjs: origen directo /wallet, /products/catalog, validación; conserva modo heredado.
- providers/ra-associations.mjs, market.mjs, readiness.mjs: consumidores administrativos de catálogo/validación heredados.
- services/games.mjs y delivery.mjs: consultas de catálogo, validación y saldo. delivery también contiene POST /buy/catalog y consulta /catalog/orders/.
- diamonds/recargas-america.mjs: cotización, validación, compra y consulta de pedidos.
- services/purchases.mjs: participa en el flujo de compras existente.

No se declara migrado el backend principal. Esas rutas quedan fuera del grafo de imports del Worker staging. La configuración productiva mantiene sus flags originales; no se comprobó su estado desplegado.
La autorización providers.read actual se limita al fundador por permissionsFor; staging añade comparación directa contra la identidad autorizada.

## Despliegue propuesto: REQUIERE APROBACIÓN

1. Crear solo D1 zerox-ra-founder-staging-auth, anotar su UUID no secreto en d1_databases del manifiesto exclusivo con binding STAGING_AUTH_DB.
2. Aplicar schema.sql exclusivamente a esa base. Verificar nombre/UUID diferentes de producción.
3. Crear/publicar solo zerox-ra-founder-staging con este manifiesto y RA_READ_SERVICE. No usar cloudflare/wrangler.jsonc ni copiar sus bindings, triggers o secretos.
4. Cargar RA_READ_ADMIN_TOKEN mediante entrada segura. Revisar ajustes efectivos y redacción de logs de plataforma antes de consultas financieras.
5. Con aprobación, habilitar la URL workers.dev SOLO de staging para el formulario de acceso (panel y datos siguen autenticados); alternativamente definir un dominio privado separado. No tocar rutas de zeroxstore.com.
6. Generar localmente el código y aplicar grant.sql a staging. Entregar el archivo de código solo al propietario por su entorno seguro; no chat. Acceder desde el navegador personal. No reenviar el código ni inspeccionar respuestas con saldo desde Work.
7. Verificar 401 anónimo, 403 usuario ajeno, sesiones revocadas/caducadas rechazadas, compras false y lectura autorizada. Reportar solo estados, USD y número de productos, nunca cuerpos/saldos.

Reversión: deshabilitar STAGING_READ_ONLY o acceso al Worker staging; revocar sus sesiones. No afecta infraestructura existente.
Acceso Cloudflare no disponible actualmente en Work; no se reintentarán inicios bloqueados ni se reutilizará el token de edición revocado. Para ejecutar tras aprobación hará falta acceso autorizado o ejecución guiada desde tu entorno.
