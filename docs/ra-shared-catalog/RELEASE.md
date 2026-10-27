# Catálogo RA compartido con Control — 27 octubre 2026

Consulta autenticada de Control verificada: 203 productos. La ruta privada
`/api/admin/providers/recargas-america/catalog` usa `readRaFounderService`.
La ruta pública de juegos ahora reutiliza ese mismo lector de service binding;
no llama directamente al proveedor ni vuelve a la API anterior si falla.
Solo publica campos de producto permitidos: no costes, saldo ni credenciales.

## Distribución observada

193 referencias corresponden a juegos/códigos y se clasifican por prefijo exacto.
Se reutilizan los bloques existentes de PUBG (6), Blood Strike (10), Delta Force
PC (14), Arena Breakout (12), Crossfire (13), Minecraft (2) y Roblox (1).
Los juegos restantes tienen secciones con sus nombres propios. Mobile Legends
US permanece separado. BLEACH no tiene referencias en esta consulta; no se
inventa stock. Tampoco se inventan productos de Call of Duty ni Streaming.

Las otras 10 referencias son los seis paquetes originales de Free Fire y cuatro
pases/membresías: sus identificadores y rutas comerciales existentes se conservan.
Esta modificación no sustituye sus asociaciones financieras ni completa una
activación de ventas de membresías que estuviera pendiente.

PINs y productos con servidor/zona conservan su modalidad y campos. Mostrar un
producto no habilita la compra. Los nuevos juegos no amplían la lista de juegos
admitida por gameDelivery. El piloto FF110 sigue bloqueando otras compras RA.
Los precios públicos deben publicarse desde el Editor; no se convierte USD a MXN
ni se calcula un margen sin configuración comercial aprobada.

## Validación

334 pruebas Node aprobadas, incluidas 4 nuevas para transporte compartido,
fallo sin fallback, no exposición de costes y permisos de compra.
Build Pages correcto: 268 archivos. git diff --check correcto.
Pendiente compilar el bundle Worker y comprobar la interfaz modificada en
navegador/Android. La consulta del Control publicado sí se verificó en navegador.

## Publicación y reversión

NO DESPLEGADO. Rama independiente del piloto, sin fusionar main ni Resellers.
No hay migraciones D1 ni cambios de flags, credenciales o configuración Wrangler.
Antes de desplegar, obtener la versión efectiva del Worker publicado y aplicar
solo este diff sobre esa versión, preservando sus bindings y variables. No
publicar todo el piloto ni su configuración por suposición.
Publicar primero backend compatible, después Pages; la caché PWA cambia a
zerox-store-v24-ra-shared-catalog. Verificar lectura pública sin costes y consultas
privadas del fundador; no ejecutar compras. Conservar versiones anteriores de
Worker/Pages para rollback. El estado de acceso a Cloudflare no está verificado.
