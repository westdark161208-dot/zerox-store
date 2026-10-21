# Release FF110 wallet — propuesta aplicable, NO aplicada ni desplegada

Base cc4e5e4. Tres patches separados para revisión, ninguno modifica automáticamente
los manifiestos vigentes. No ejecutar deploy ni aplicar en producción sin aprobación.

## Diff exacto
1. backend-prepared.patch añade RA_READ_SERVICE→zerox-ra-vpc-test y
   RA_PURCHASE_SERVICE→zerox-ra-purchase-bridge, mapping ADS005/id5/player_id/100+10/US,
   modo privado y RA_FF110_WALLET_ONLY. Compra/verificaciones quedan false.
2. backend-activation-APPROVAL-REQUIRED.patch, sobre el primero, activa exclusivamente
   los cuatro flags de preparación/compra privados después de verificar sus requisitos.
3. bridge-activation-APPROVAL-REQUIRED.patch activa el bridge manteniendo VPC existente,
   workers_dev:false, preview_urls:false y ninguna ruta pública.

Revisión local de aplicabilidad: git apply --check backend-prepared.patch desde raíz
(usando su ruta completa). Aplicar en checkout aislado, revisar resultado, luego comprobar
segundo patch sobre ese estado. No aplicar los tres a la vez sin revisar requisitos.
No usar manifiesto preprod de lectura como sustituto del backend ni copiar su D1.
Los patches conservan DB, MEDIA, cron, PUBLIC_COMMERCE_ENABLED y todos los valores MP/SF.
Antes de aprobar, comparar contra configuración REMOTA efectiva: estos patches parten
solo de Git y no incluyen modificaciones no versionadas del dashboard.

## Guarda de código
RA_FF110_WALLET_ONLY=true, junto a RA_FF110_PILOT_ONLY=true, permite nuevas solicitudes
RA solo del Fundador y con wallet. Status deshabilita checkout MP/supplier para este
flujo; /checkout, /supplier/* y quote no-wallet devuelven403 antes de tocar proveedor.
No cambia las rutas MP de fondeo, Sixofire, wallet general ni autenticación.
Historial y resume propios permanecen disponibles; pagos MP ya creados continúan
conciliándose para no abandonar una obligación pagada. Esto es una excepción para
pedidos EXISTENTES, no autorización de nuevas compras MP. Antes del piloto revisar
pedidos pendientes: si se requiere cero entregas antiguas durante la ventana, detener
la activación hasta conciliarlos; no esconderlos ni borrar registros.
La guarda de entrega exige regiónUS además de producto110,100+10, cantidad1 yUSD.

## Impacto que NO puede prometerse como nulo
RA legacy se apaga por requisito fail-closed. Otros productos/recetas RA quedan bloqueados
para nuevas entregas; pedidos noFF110 pagados quedan en revisión. No desactivar comercio
público globalmente, pues afectaría MP/SF. Si hoy otros productos RA funcionan en producción,
NO desplegar esta propuesta hasta aprobar esa restricción o preparar un transporte privado
multiproducto compatible. No hay garantía de cero interrupción RA solo cambiando flags.
La nueva restricción solo entra con el flag adicional; fuera de él se conserva comportamiento.
Pruebas existentes MP/SF/wallet pasan, pero no certifican configuración o fondos reales.

## Oracle y secretos: comprobación mínima, sin modificar servicios
- Servicio comercial8791: código revisado, loopback exclusivo, Node>=22.13, Journal durable
  privado0700/0600 separado del harness. No usar SQLite temporal ni borrar operaciones.
- RA_PURCHASE_CONFIG_FILE apunta a JSON0600: enabled, apiKey, proxySecret, journalPath,
  sourceAddress10.0.1.170 y product verificado conID5,ADS005,nombre exacto,player_id,
 100base/10bonus,US, evidencia y techo USD aprobado. No inventar ni fijar costo vigente.
- API Key RA solo upstream autorizado; distinta de proxySecret. Bridge
  RA_PURCHASE_PROXY_SECRET debe coincidir con proxySecret de Oracle.
- Backend/bridge comparten RA_PURCHASE_SERVICE_TOKEN64hex independiente. Backend usa
  RA_READ_ADMIN_TOKEN64hex independiente para lectura; conservar secretos existentesMP/SF/FF.
- RA_PURCHASE_GATEWAY ya apunta VPC01a15769-3e76-7e51-9a7e-13a628870a2a. Verificar destino8791
  sin modificar túnel/8790/8789. RA_READ_SERVICE requiere Worker lectura existente.
- No hay acceso remoto en esta entrega para certificar presencia/sincronización/estado.

## Secuencia controlada propuesta
1. Revisar commit, diff contra remoto, evidencia de staging y cola de pedidos antiguos.
2. Revalidar catálogo5/ADS005, nombre/campo/región/costo, liquidez, configuración Oracle,
   permisos de fundador y secretos/bindings. No compra para estas comprobaciones.
3. Aprobar por separado release coordinado: bridge privado configurado, backend preparado,
   verificación de salud/autorización y finalmente flags de activación. El estado preparado
   pausaRA; programar ventana y no presentarlo como despliegue sin impacto.
4. Autorizar por separado una compra wallet110: UID del propietario, precio venta y techo
   proveedor aprobados. Verificar débito único, referencia, entrega y comprobante.
5. Reversión: cerrar RA_FF110_PURCHASE_ENABLED y nuevas compras; revisar antes de apagar
   bridge si hay lookup pendiente. Conservar Journal/pagos/pedidos y conciliar UNKNOWN.
   No volver a flags legacy true automáticamente ni dejar caer pedidos pagados.

## Validación de esta entrega
308/308 pruebas simuladas completas: éxito wallet founder, rechazo nofundador aun con
comercio público activo, bloqueo de nuevos MP/supplier, conciliación MP preexistente,
regiónUS estricta, protección duplicados/refund/timeout y regresiones existentes.
No infraestructura creada, compras, despliegue, merge/main ni cambios Oracle/Zerito.
