# Tarea #49: canal privado FF110 preparado, sin despliegue

Continuación del PR #48, rama `codex/ra-ff110-launch-pilot-20261018`.
No se modificaron main, Oracle activo, túnel, Zerito, sesiones, bases productivas ni secretos.

## Implementado

- Checkout original de diamantes: mantiene wallet MXN, cotización V3, comisiones y preferencias Mercado Pago. El webhook existente autentica la firma y consulta el pago al servidor antes de entregar.
- Nuevo binding propuesto `RA_PURCHASE_SERVICE` al Worker privado de escritura. `RA_READ_SERVICE` continúa exclusivamente con saldo/catálogo; no adquiere permisos de compra.
- Worker de escritura acepta únicamente POST `/v1/ff110/validate`, `/submit`, `/lookup`, autenticados con `RA_PURCHASE_SERVICE_TOKEN`. Firma timestamp, nonce, ruta y cuerpo hacia Oracle con un secreto diferente. No fallback público.
- Gateway propuesto en loopback 127.0.0.1:8791. No reemplaza 8790/8789. Cliente HTTPS fijo a RA, con `localAddress=10.0.1.170`; debe verificarse en Oracle que conserve la salida reservada 163.192.156.177.
- Oracle limita a un mapeo FF100+10 verificado en región US y a un techo USD explícito. Relee catálogo, valida cuenta y saldo antes de comprar. No acepta SKU inferido ni cantidad arbitraria.
- Diario SQLite propio y durable, FULL synchronous/WAL: reserva la operación ANTES de contactar al proveedor. Repetir operación/cuerpo devuelve el resultado guardado; cambiar destino genera conflicto. Una caída después de reservar jamás dispara otra compra.
- HMAC, ventana 30 segundos, nonces persistentes y límite global 30 solicitudes firmadas/minuto. Sin log de tokens, saldo, UID ni respuestas crudas. El diario guarda hash del cuerpo, referencia y resultado reducido.
- Timeout o respuesta parcial posterior a envío queda UNKNOWN, sin reenvío. Sin referencia verificada, revisión manual. Con referencia, solo consulta de orden; el cron ahora puede completar ese caso sin recomprar.

## Configuración preparada, NO activada

La barrera `RA_FF110_PURCHASE_TRANSPORT_PENDING` se conserva cuando falta cualquier requisito. Solo el nuevo adaptador puede superarla; no basta activar los flags heredados.

Backend original, tras revisión y aprobación:
- `RA_FF110_PILOT_ONLY=true`.
- `RA_FF110_PURCHASE_ENABLED=true`, `RA_FF110_CONTRACT_VERIFIED=true`, `RA_FF110_PRODUCT_VERIFIED=true` únicamente después de evidencia real del SKU y del canal.
- Mantener `RA_DELIVERY_ENABLED=false`, `RA_CONTRACT_VERIFIED=false`, `DIAMOND_PRODUCTION_ENABLED=false`; estas banderas heredadas nunca autorizan el nuevo canal.
- Conservar lectura privada previamente validada y agregar `RA_PURCHASE_SERVICE` con su token exclusivo.
- `RA_DIAMOND_PACKS` contiene SOLO 110, producto explícito, SKU/nombre exactos, 100 base/10 bono, región US y evidencia de bono. Ningún ID de prueba sirve como configuración real.

Bridge propuesto:
- `RA_PURCHASE_SERVICE_TOKEN`: mismo secreto que el backend, distinto del token de lectura.
- `RA_PURCHASE_PROXY_SECRET`: solo bridge + Oracle, distinto de los demás secretos.
- `RA_PURCHASE_GATEWAY`: binding VPC al gateway autorizado 127.0.0.1:8791. ID real pendiente; NO sustituir RA_GATEWAY/RA_PRIVATE ni editar túnel activo sin aprobación.
- `RA_FF110_BRIDGE_ENABLED` queda **false** en el manifiesto versionado, sin URL pública ni previews.

Oracle propuesto: Node >=22.13 con node:sqlite, configuración 0600 externa al repo, directorio del diario 0700, almacenamiento persistente. Variables del archivo: enabled, proxySecret, apiKey, sourceAddress, journalPath, product. `product` requiere verified, productId, sku, name, field, baseDiamonds=100, bonusDiamonds=10, region=US, bonusEvidence, maxPriceUsd. NO crear ejemplos con credenciales ni reutilizar bases actuales. `server.mjs` no se ejecutó ni instaló.

## Pruebas sin dinero real

13 pruebas nuevas conectan el checkout original -> adaptador -> Worker -> firmas -> gateway -> SQLite durable -> proveedor simulado:
- Wallet V3 debita exactamente $18 MXN una vez y genera comprobante tras entrega.
- Tarjeta/SPEI/MP respetan la cotización y comisión originales; no entregan antes del webhook firmado y de consulta server-to-server.
- Firma inválida, pago rechazado o importe falso no entregan; webhook repetido no duplica.
- Caída Oracle antes de checkout: no débito ni preferencia MP.
- Timeout/resultado parcial: revisión, sin recompra después de reiniciar diario/gateway.
- Referencia conocida: cron consulta hasta completar, sin segundo POST.
- Concurrencia, replay, cambio de UID, firma forjada, timestamp vencido, SKU/región distintos y rate limit.

Toda red está sustituida por fixtures en estas pruebas. El ID 999001/SKU FIXTURE-ONLY-100 son ficticios, jamás candidatos comerciales. No son pruebas contra Oracle ni contra Mercado Pago reales.

## Pendientes indispensables (no repetir auditoría de lecturas)

1. Obtener evidencia del ÚNICO SKU FF100+10 real: ID, SKU, nombre exacto, tipo, campo UID, precio actual USD, región US y bono confirmado. No se accedió a catálogo autenticado en esta sesión por falta de credenciales; no se inventó el mapeo.
2. Inspeccionar código/configuración no secreta del gateway Oracle actual y versión Node para validar instalación lateral, persistencia y binding VPC de escritura. No hubo acceso SSH/Cloudflare en Work; no afirmar que este canal ya existe.
3. Validar en staging integral el canal nuevo con upstream simulado, sin compra RA y sin habilitar una URL pública por defecto. La compilación local no sustituye esa instalación.
4. Comprobar solo el delta efectivo de producción necesario: bindings nuevos, flags RA, versión activa, cron, pedidos ya pagados/pendientes. Conservar MP/SF y no repetir auditorías de lectura completadas.
5. Aprobar release exacto y configuración. Hasta entonces #49 sigue abierta por bloqueos externos, y PR #48 sigue borrador.

## Una ventana de publicación coordinada (no ejecutada)

Revisar/aprobar una única entrega que incluya gateway lateral, binding privado/bridge y backend original, con flags nuevos inicialmente apagados. No tocar Oracle read-only ni Zerito. Verificar autenticación y contrato con compras deshabilitadas, después habilitar exclusivamente FF110 según autorización. Conservar instantánea privada de versión/configuración anterior, nunca secretos en Git.

Reversión: apagar RA_FF110_PURCHASE_ENABLED y RA_FF110_BRIDGE_ENABLED, mantener flags heredados RA apagados y lecturas existentes. NO borrar el diario, órdenes ni pagos; NO volver a ejecutar operaciones UNKNOWN ni restaurar versiones con entrega legacy habilitada. Revisar pedidos pagados antes de revertir código. SF/MP conservan su configuración.

Después del despliegue aprobado se necesita autorización SEPARADA para una única compra real, UID del propietario, coste y total previamente aceptados. Ninguna de esas autorizaciones se presume aquí.

## Resultado verificable de esta revisión
- 276/276 pruebas locales aprobadas (263 existentes + 13 nuevas).
- Wrangler dry-run: staging de lectura, backend original y bridge privado de compra compilan; no publicación.
- Sintaxis del servidor/gateway Oracle validada, sin iniciar el proceso.
- El cron conserva revisión manual para UNKNOWN sin referencia: no lo selecciona para consultas automáticas.
- No se repitió ninguna consulta autenticada de lectura en la infraestructura real.

Protección adicional de recibos: una referencia RA solo puede pertenecer a una operación del diario. Reutilizarla para otra orden deja la segunda en UNKNOWN, nunca COMPLETED.

## Continuación 2026-10-19: confirmación y origen de autenticación

Se conservó el preflight incorporado en 7c864ce. El gateway propuesto rechaza
como confirmación una bandera needs_review mal tipada o activa, cantidad distinta
de 1, UID/región contradictorios y estados distintos de COMPLETED. Un resultado
ambiguo conserva la referencia para consulta, nunca para repetir la compra.
Una consulta posterior coherente puede resolver la operación; no se genera
comprobante mientras persista la contradicción.

Validación local: 288/288 pruebas aprobadas (12 casos nuevos de contradicciones
persistentes en submit y lookup). Todos los proveedores/pagos son simulados.
El diagnóstico de autenticación pasó una comprobación con secretos centinela:
no devuelve valores, nombres de variables ni fragmentos del código.

### Paso indispensable en Oracle (solo lectura)

Desde una copia revisada de esta rama en Oracle, ejecutar:

```bash
sudo python3 oracle/ra-purchase/auth-source-check.py
```

No ejecutarlo en Termux local: debe correr dentro de la sesión SSH de Oracle.
Compartir únicamente su JSON. No imprime el entorno, archivos de configuración,
argumentos del proceso ni errores internos. No llama a RA ni reinicia servicios.
La detección estática es orientativa: no resuelve imports, alias ni configuración
dinámica. `inspection_incomplete` requiere revisar permisos/acceso; no significa
que falten credenciales. La ausencia de proxy.secret y un 401 sin autenticación
no demuestran una avería.

### Sincronización pendiente, sin rotación automática

1. Identificar la fuente efectiva a partir del diagnóstico; si es indirecta,
   inspeccionar localmente únicamente su procedencia, sin copiar valores.
2. Confirmar que RA_PROXY_SECRET en el Worker de lectura corresponde a la fuente
   efectiva del encabezado x-zerox-proxy-key en el gateway. Cloudflare no permite
   recuperar el valor del secreto: su presencia por sí sola no prueba igualdad.
3. Validar mediante /gateway-ready autenticado ya existente. No abrir /wallet
   públicamente, no deshabilitar autenticación, no rotar ni reiniciar Oracle con
   la autorización actual. Si el valor no puede recuperarse de forma privada,
   preparar una rotación coordinada y solicitar autorización específica.
4. El canal de compras propuesto utiliza secretos NUEVOS y separados para
   Store→bridge y bridge→Oracle. No reutiliza tokens administrativos de lectura.

Siguen bloqueando producción: identificador/SKU real y evidencia 100+10/región;
instalación autorizada del canal privado de escritura y su binding efectivo;
configuración privada de secretos; validación del despliegue y aprobación final.
No se ha modificado Oracle, producción, main, Zerito ni saldos reales.

## Prioridad saldo Zero'X — 2026-10-20 UTC

Botón existente: app.js, selección wallet → /api/diamonds/purchase/wallet,
con cotización e Idempotency-Key; no se sustituyó el verificador Free Fire.
Fallo corregido: NOT_ACCEPTED previo al envío podía dejar el débito sin reversión.
El piloto de una operación FF110 devuelve exactamente el débito original mediante
el ledger existente (reverses_id único). Repetir checkout, resume o conciliación no
reacredita ni restaura un pago refunded a paid. Cron recupera el fallo entre la
reversión y la actualización del estado. UNKNOWN permanece en revisión con débito;
no se devuelve dinero basándose en timeout ni se vuelve a enviar la recarga.
El comprobante de entrega continúa bloqueado para FAILED/refunded. El checkout y
la página de seguimiento explican la devolución. El movimiento permanece visible
en el historial del saldo. Recetas y Mercado Pago conservados sin activar paquetes.

292 pruebas backend aprobadas, incluidas cuatro nuevas: devolución única/concurrente,
recuperación de bookkeeping, timeout sin devolución y wallet sin credenciales MP.
Primer lanzamiento: priorizar wallet; no se requiere habilitar MP para probarlo.
Pendientes: diagnóstico VPC autorizado, canal real autenticado/configurado, revisión
final de configuración y autorización de despliegue. Después autorización separada
para una compra controlada de ADS005/id 5. No se hizo ninguna operación real.
