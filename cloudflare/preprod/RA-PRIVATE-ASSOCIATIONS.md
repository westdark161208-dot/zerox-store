# Asociaciones Free Fire por lector privado — implementación, sin despliegue

## Defecto corregido

El botón `Consultar catálogo de recargas` usa `/api/admin/providers/recargas-america/catalog` y el lector privado independiente. `Cargar catálogo para asociar` usa `/api/admin/providers/recargas-america/associations`, que aún llamaba `readRecargasAmerica` (transporte heredado, potencial origen público). GET y POST de asociaciones ahora releen el catálogo exclusivamente con `readRaCatalogService`, `RA_READ_SERVICE` y `RA_CATALOG_READ_TOKEN`. Sin fallback. La ruta administrativa se permite con la configuración independiente incluso si existen guardas privadas antiguas; sin configuración independiente se conserva el bloqueo antiguo.

No se reimplementa el lector ni se modifica su contrato. Versiones aa62397e/402661ce, lectura real y 213 productos son evidencia reportada por el propietario, no comprobaciones ejecutadas desde este trabajo. No se consulta ni registra el saldo real.

## Funcionalidad

- Solo fundador activo (`isFounder === true`), GET/POST, sin query, respuestas no-store.
- GET no escribe tablas ni asociaciones automáticas. Conserva prioridad de RA_DIAMOND_PACKS externo; si existe, el guardado sigue bloqueado.
- Filtro administrativo exige Free Fire, tipo recharge, diamantes, precio positivo y exactamente un campo manual_id/player_id; excluye PIN, tarjetas, membresías y pases. Reconoce base +10% y base + bonus explícito (520+52). No acepta total ambiguo sin evidencia de base/bonus.
- Se conservan las seis cantidades base ya utilizadas (110,341,572,1166,2398,6160), cantidades públicas, precios y reglas de bonificación. ID/SKU/nombre se verifican contra una lectura fresca al guardar; no se inventan códigos.
- El contrato del lector NO contiene región estructurada. Códigos explícitos en el nombre limitan las regiones seleccionables; sin ellos se exige confirmación y referencia del fundador, y se muestra «Región por confirmar». No se atribuye cobertura US/global por leer diamantes o un precio. La validación real del UID/región sigue pendiente del circuito de compra existente.
- Guardado reutiliza zx_ra_pack_associations y zx_ra_pack_association_history, revisión optimista y batch atómico. No nuevas bases. Rechaza selección cambiada, cantidades incompatibles, duplicados, regiones repetidas/incompatibles y conflictos de revisión.
- Estado por base: configured/pending/incompatible. Si SKU, nombre, campos, cantidad o región dejan de coincidir, no se usa esa asociación en la vista previa.
- Todos los paquetes publicados del catálogo de diamantes existente muestran recetas derivadas de sus bases guardadas. Se respetan ocultaciones y nombres del editor sin modificar el editor. No se crean filas redundantes por cada combinación: la asociación de bases permite una o varias operaciones para cada total exacto.
- Vista previa minimiza número de operaciones por región mediante el planificador existente con coste unitario ficticio uniforme. No es un precio; no se devuelve como coste USD ni sustituye las cotizaciones. Catálogo del proveedor mostrado en USD, sin conversión MXN.
- No se cambia el planificador comercial actual (coste primero), los pedidos/snapshots existentes, la billetera, MP, Sixofire, la API de jugadores ni el transporte comercial. Las recetas nuevas son vista previa administrativa, pendientes de aprobación/integración comercial.

## Límites que importan

Guardar una asociación no realiza compras ni cambia flags. **Las asociaciones persistidas sí son configuración consumida por el flujo comercial existente en solicitudes futuras.** No validar escrituras en D1 productiva durante esta fase; usar una D1 simulada/aislada. No prometer que cambiar una asociación productiva es ajeno al comercio.

El resto de herramientas heredadas (por ejemplo preparación/readiness o comparación de mercado) no se migran incidentalmente aquí. No utilizarlas para probar este cambio: pueden usar adaptadores heredados. El circuito privado FF110 mantiene requisitos propios y no queda habilitado por RA_CATALOG_READ_ENABLED. No reutilizar el token de lectura administrativa para comprar.

## Archivos

- providers/ra-associations.mjs: lecturas privadas, estados, validación fresca y guardado existente.
- providers/ra-association-catalog.mjs: filtro estricto y recetas administrativas puras.
- providers/routes.mjs: enrutamiento de asociaciones independiente de la guarda histórica.
- ../../ra-associations.js, ../../control.html: candidatos normalizados, identidad enviada, estados, errores y vista previa; versión del script incrementada.
- ../../tests/ra-associations.test.mjs: regresiones previas adaptadas al contrato privado; se conserva prueba de transacciones/concurrencia/readiness comercial.
- ../../tests/ra-private-associations.test.mjs: catálogo simulado 213, guardado/recuperación, filtros, exactitud, permisos, duplicados, cambios de catálogo, errores/timeouts, no compras/no red pública, editor intacto.

## Configuración

No hace falta un nuevo manifiesto ni flags. Conservar RA_READ_SERVICE→zerox-ra-vpc-test, RA_CATALOG_READ_TOKEN secreto y las dos variables de lectura actuales. Conservar DB, demás bindings, variables y secretos. No activar RA_FF110_PURCHASE_ENABLED ni aplicar los parches FF110 históricos. El cambio requiere publicar coordinadamente backend y assets del panel en una fase autorizada; no se desplegó nada aquí.

## Sincronizar código con Oracle sin tocar servicios

Desde Termux conectado por SSH a Oracle, entrar en la copia EXISTENTE de este repositorio (no en /home/opc/zerox-ra-gateway ni en Zerito). Si no existe copia, detenerse: no clonar encima de directorios de runtime.

```sh
git branch --show-current
git status --short
```

Debe estar en `codex/ra-ff110-launch-pilot-20261018`. Si hay cambios locales, detener actualización y conservarlos. Con árbol limpio:

```sh
git fetch origin codex/ra-ff110-launch-pilot-20261018
git merge --ff-only origin/codex/ra-ff110-launch-pilot-20261018
node --test tests/*.test.mjs cloudflare/providers/ra-admin-service.test.mjs cloudflare/staging/*.test.mjs
node --check ra-associations.js
node cloudflare/staging/build-control-preview.mjs
```

Usar Node 22.16.0 existente, que incluye node:sqlite; si `node` no apunta a esa versión, usar su ruta ya instalada. No hacer pull de main, deploy, restart, migraciones remotas ni secret put. Los comandos anteriores solo actualizan la copia Git y prueban con fixtures locales. No modificar la instalación del gateway para sincronizar estos archivos web.

## Validación sin compras

1. Ejecutar suite local con SQLite en memoria y bindings simulados. Fixture 213 no afirma que el catálogo real siga teniendo ese conteo.
2. Preparar preview aislado con la configuración de staging existente y DB exclusiva; revisar separadamente el despliegue antes de ejecutarlo. No copiar D1 de clientes ni sesiones productivas.
3. Fundador: cargar asociación → catálogo privado; verificar USD, total/base/bonus, ID/SKU/campo y región por confirmar donde corresponda.
4. En DB de staging únicamente: guardar base FF110 con referencia y región confirmadas; recargar y comprobar configured, revisión y receta220=2×110. Probar revisión antigua409 y catálogo cambiado incompatible. No presionar comprar ni herramientas heredadas de preparación.
5. No fundador/sin sesión: 403/401. Desconectar binding simulado:503 sin fallback. No órdenes, ledger ni pagos creados. Mantener todos los flags de compras de staging apagados.
6. Publicación futura del backend y script requiere aprobación; el despliegue se compara con configuración efectiva actual, sin reemplazar todo el manifiesto.

## Antes de la primera compra piloto (NO realizado)

- Confirmar producto5/ADS005 actual, nombre exacto, campo UID, 100+10, regiónUS y coste USD del catálogo; coincidencia con contrato del gateway comercial, no solo con esta asociación administrativa.
- Verificar transporte de cotización/preflight comercial privado y sus secretos propios: actualmente el módulo de compra exige el canal RA_READ_ADMIN_TOKEN/flags administrativos heredados, distinto del canal independiente nuevo. No cambiar flags a ciegas: puede bloquear otros productos RA. Resolver ese impacto en una propuesta comercial separada.
- Validar RA_PURCHASE_SERVICE/bridge/VPC/gateway comercial, autenticación, journal durable, idempotencia, lookup y conciliación sin dinero mediante harness existente. No tocar el gateway de lectura8790/8789.
- Revisar operaciones pendientes y mecanismo de reversión, liquidez y precio aprobado. Validar UID real con API existente. Los estados inciertos no deben provocar reintento ni devolución automática; comprobante solo después de confirmación real.
- Aprobación explícita de despliegue y luego de UNA compra FF110 wallet con UID, importe y límite acordados. Otros paquetes y vista previa de combinaciones permanecen pendientes de validación de componentes y aprobación comercial.

## Resultados de esta entrega

Suite completa local: **349/349 aprobadas** (327 anteriores + 22 nuevas). Se incluyen dos pruebas del script del panel con DOM simulado: envío de identidad exacta y descarte de respuestas después de cambio de sesión. `node --check ra-associations.js`, generación del preview existente y `git diff --check` aprobados. No se ejecutaron llamadas financieras ni pruebas sobre D1 productiva, Cloudflare u Oracle. El preview generado no constituye una validación visual con sesión real; esa comprobación queda en staging autorizado.
