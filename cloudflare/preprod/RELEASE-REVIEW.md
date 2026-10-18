# RA: preparación de publicación, aún bloqueada

Rama: codex/ra-preprod-safety-audit-20261018. PR #47 conserva base de desarrollo; no fusionar a main.

## Cambios propuestos
- Las rutas administrativas originales conservan sesión activa y permiso Fundador. El saldo combinado ahora usa la misma protección financiera del adaptador; no existe bypass por founder-balances.
- En modo privado, todos los consumidores del adaptador de lectura van por RA_READ_SERVICE. Fallar o desactivar la lectura nunca provoca fallback directo.
- Validación de jugadores, submit y lookup RA se bloquean en modo privado, incluso con flags heredados contradictorios. Los flags contradictorios también bloquean saldo/catálogo.
- Mercado conserva historial, mensaje de regalo, costos y mapeos Sixofire. Refresh consulta solo Sixofire en modo privado, y se rechazan nuevos mapeos RA. No se borran snapshots/mapeos anteriores. Leer un snapshot histórico no autoriza entregas RA.
- Se conservan ID/SKU/nombre/tipo/precio originales. Se rechazan IDs/SKU duplicados, campos vacíos y longitudes inválidas, sin truncar identidades.
- No se modificaron el manifiesto de producción, Oracle, MP, Zerito, datos ni recursos Cloudflare.

## Evidencia y límites
- Fase 2 real: reportada validada por propietario (USD, 220 productos, URL cerrada, sesiones revocadas).
- Pruebas locales: fixtures, sin llamadas financieras. No son evidencia de configuración remota.
- El manifiesto versionado sigue con RA_DELIVERY_ENABLED, RA_CONTRACT_VERIFIED, DIAMOND_PRODUCTION_ENABLED=true. No asumir que producción los tiene apagados.
- Falta acceso autenticado Cloudflare en Work. audit-cloudflare.py consulta solamente metadatos GET y emite flags permitidos, bindings y presencia del secreto; nunca valores secretos. No demuestra conectividad Oracle ni audita rutas/crons/versiones.
- La inconsistencia Age of Empires/Apex Coins sigue pendiente de muestra autenticada ID/SKU/nombre desde la cadena privada. No renombrar ni asociar automáticamente. 220 es la fotografía validada, no un límite fijo del catálogo.

## Configuración candidata (solo después de aprobación)
En el Worker original, conservar TODOS los otros bindings/vars/secrets/rutas/crons:
- Añadir RA_READ_SERVICE -> zerox-ra-vpc-test.
- Inyectar RA_READ_ADMIN_TOKEN por canal secreto, sin copiar RA API Key o RA_PROXY_SECRET.
- RA_ADMIN_READ_ENABLED=true, RA_ADMIN_READ_TRANSPORT=service-binding, RA_ADMIN_READ_CONTRACT_VERIFIED=true.
- RA_READ_ENABLED=false, RA_AUTO_ASSOCIATE_US=false, RA_DELIVERY_ENABLED=false, RA_CONTRACT_VERIFIED=false, DIAMOND_PRODUCTION_ENABLED=false.
- No alterar flags de Sixofire ni Mercado Pago.
Esto detiene RA; identificar pedidos RA pagados/en proceso y acordar su tratamiento ANTES del despliegue. No ejecutar conciliaciones ni reembolsos como parte de esta revisión.

## Compilación aislada
wrangler.jsonc en esta carpeta es SOLO para dry-run del backend original. No contiene DB productiva, secretos, rutas ni crons. No desplegarlo: no es un backend funcional de producción y no autoriza crear el Worker cuyo nombre contiene review-only.
Comando: npx --yes wrangler@4 deploy --config cloudflare/preprod/wrangler.jsonc --dry-run
Staging conserva su configuración independiente en cloudflare/staging/wrangler.jsonc.

## Verificaciones antes de solicitar aprobación final
1. Capturar versión efectiva, porcentaje de tráfico, bindings, flags, rutas, crons y presencia de secretos del Worker original. No volcar valores secretos ni saldos.
2. Revisar configuración candidata contra captura real, incluyendo cualquier override ausente del repositorio.
3. Verificar conexión por service binding/origen Oracle existente mediante GET autenticado: moneda USD, cantidad, identidades únicas; no registrar saldo real. No abrir diagnósticos públicos ni pedir IP de salida a otro entorno.
4. Verificar nombre/moneda del juego de los SKU dudosos con proveedor; no venderlos por heurística.
5. Staging del backend original con identidad/base aisladas: sesión Fundador 200; anónimo 401; cliente/operador 403; revocada 401; GET no-store; POST RA rechazado. Probar catálogo y precios, sin compras.
6. Revisar visualmente el panel original completo; no confundir preview de sección con E2E completo.
7. Confirmar lista de cambios + commit + CI + plan de reversión y obtener aprobación explícita del propietario.

## Publicación y reversión (no ejecutadas)
- Registrar versión/configuración previa en almacenamiento privado de operaciones. No guardar secretos en este repo.
- Publicar únicamente commit aprobado con flags RA apagados y binding privado verificado. No migraciones de datos.
- Verificar endpoints de sesión y lecturas del Fundador, acceso denegado a terceros, catálogos SF, disponibilidad MP sin crear preferencias/pagos ni compras.
- Si falla lectura: apagar RA_ADMIN_READ_ENABLED manteniendo RA_ADMIN_READ_TRANSPORT=service-binding y flags RA financieros=false. Así no hay fallback.
- Si se requiere rollback de código, NO restaurar ciegamente una versión con compras RA activas. Preparar/revisar versión anterior con flags RA apagados antes de revertir; conservar todos los datos y pedidos. No reactivar entregas para resolver incidencias.
- Concluir con versión efectiva y resultado de verificaciones; revocar token temporal.

## Resultado de esta revisión
- 256/256 pruebas locales aprobadas, incluyendo regresiones de Sixofire, Mercado Pago, compras, wallet, permisos y seis casos nuevos de aislamiento privado.
- Compilaciones Wrangler dry-run de staging y del backend original completadas; ningún deploy ejecutado.
- git diff --check sin errores y preview original regenerado sin cambios.
- Sintaxis del diagnóstico Python validada. No ejecutado contra Cloudflare por ausencia de acceso en Work.
- Referencia del endpoint GET utilizado por el diagnóstico: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/get/
