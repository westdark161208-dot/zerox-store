# FF110 wallet — revisión de preparación, sin despliegue

Base revisada: 3708221bc7e87ab975c6f43c8faa8704431c904e, rama
codex/ra-ff110-launch-pilot-20261018. PR48 abierto/borrador, tarea49 abierta.
Referencia: ZIP financiero entregado por el propietario, contrastado con código.

## Resultado
305/305 pruebas locales aprobadas con tres nuevos casos de preparación. Incluyen
29 E2E privados existentes, harness7, runner remoto3 y regresiones MP/wallet/SF.
Comando: node --test tests/*.test.mjs cloudflare/providers/ra-admin-service.test.mjs cloudflare/staging/*.test.mjs
Sin credenciales comerciales, llamadas RA, operaciones financieras, cambios Oracle,
despliegue ni modificación main. git diff --check sin errores.
No se demostró un defecto nuevo del flujo comercial que justifique reescribirlo.
Se añaden pruebas y esta revisión; se conservan las barreras.

## Continuidad corregida respecto al ZIP
El ZIP describe04949bb y runner local sin commit. GitHub ya avanzó a3708221 con runner
publicado en la rama: staging/ff110/runner.mjs, runner.wrangler.jsonc, RUNNER-PLAN.md.
Se actualizó por fast-forward. Trabajo local anterior preservado fuera del checkout;
no se mezcló un segundo runner. No repetir diagnósticos Oracle ni staging ya reportados
por el propietario; incorporar su evidencia de ejecución/retirada a la revisión final.
La suite305 corresponde a302 del HEAD remoto y3 nuevos casos, no a la variante local
anterior que también tenía305. El número por sí solo no identifica una versión.

## Flujo localizado
app.js selecciona /api/diamonds/purchase y wallet; worker.js enruta purchaseRoute.
purchases.mjs resuelve precio/mapeo, verifica cuenta mediante FF_INFO_API_KEY, realiza
preflight y registra pedido. spendOrderWallet usa postMovement del ledger, clave única
por pedido y recuperación del débito ya registrado. Wallet excluye únicamente el bloqueo
PRODUCTION_PAYMENT_CONFIG_MISSING, conservando los de proveedor/UID/mapeo.
Motor engine.mjs ejecuta solo pedidos pagados con bloqueo, snapshot y operaciones.
ra-private-purchase.mjs usa RA_PURCHASE_SERVICE; bridge firma hacia RA_PURCHASE_GATEWAY;
gateway8791 reclama Journal antes del upstream. UNKNOWN no dispara recompra automática.
NOT_ACCEPTED confirmado permite refund único; receipt.mjs exige pago y entrega completa.
MP funding/webhook sigue usando firma + consulta servidor y reconcileProductPayment;
no se reconstruye ni se requiere MP para comprar mediante wallet en el piloto.

## Bloqueos confirmados en archivos (NO diagnóstico de producción remota)
| Componente | Hallazgo | Requisito previo a autorización |
|---|---|---|
| cloudflare/wrangler.jsonc | RA legacy true, comercio público true; sin services RA_READ_SERVICE/RA_PURCHASE_SERVICE | Preparar diff de release exacto que configure privado y desactive únicamente RA legacy, preservando SF/MP; no desplegar este manifiesto sin revisión |
| cloudflare/preprod/wrangler.jsonc | Lectura privada únicamente, sin RA_PURCHASE_SERVICE ni DB de checkout | Es configuración de revisión, no entorno de compra integral ni archivo de producción |
| cloudflare/ra-purchase/wrangler.jsonc | RA_FF110_BRIDGE_ENABLED=false, VPC ya identificado, sin URLs públicas | Confirmar existencia/configuración efectiva y aprobación antes de habilitar |
| purchaseConfiguration/privatePurchaseReady | Requieren flags piloto, mapping exclusivo110US, verificador, dos bindings y tokens separados | Evidencia de presencia/coherencia; no revelar valores ni activar por esta revisión |
| Oracle gateway propuesto | Config externa privada, API Key y proxy separados, sourceAddress10.0.1.170, Journal durable | Verificar configuración comercial8791 y estado sin modificar servicios; staging no sustituye este requisito |

Los flags legacy RA_DELIVERY_ENABLED, RA_CONTRACT_VERIFIED y
DIAMOND_PRODUCTION_ENABLED deben ser 'false' en piloto privado. Añadir service bindings
sin resolver ese conflicto bloquea por diseño. Desactivar PUBLIC_COMMERCE_ENABLED puede
afectar otros checkouts: no hacerlo globalmente sin analizar impacto SF/MP; el alcance
Fundador debe diseñarse en el diff de release y probarse, no asumirse por nombre 'pilot'.

## Configuración remota NO verificada aquí
No se dispone de sesión/token Cloudflare ni SSH Oracle en esta revisión. No se puede
certificar versiones desplegadas, secretos presentes/sincronizados, permisos efectivos,
DB/migraciones, proceso comercial8791, fondos disponibles ni catálogo actual.
401 sin token y ausencia del antiguo proxy.secret no prueban avería; no rotar secretos
por esas observaciones. Se acepta la conectividad VPC histórica reportada, sin repetirla.
GitHub devolvió visibility=public para el repositorio, aunque la solicitud lo denomina
privado: confirmar visibilidad en la cuenta. No se publican secretos ni balances en este
cambio ni se modifica esa visibilidad.

## Producto y contrato
Evidencia histórica autenticada del propietario: RA id5, ADS005, nombre
Recarga Free Fire - 100 Diamantes + 10% Bono, type recharge, required_fields player_id,
USD, precio observado0.67; no es una cotización vigente. Tienda zx-diamonds-110.
Prueba nueva reproduce ese contrato sin red y rechaza pin, id11/ADS011, campo equivocado,
nombre distinto y regiónBR. El catálogo real actual, bono entregado y región siguen
requiriendo evidencia vigente para primera compra. No fijar precio proveedor0.67 como
permanente. La asociación puede venir de RA_DIAMOND_PACKS o D1; no se inspeccionó D1 real.

## Lista mínima para primera recarga controlada
1. Seleccionar commit exacto y aprobar diff de configuración/release; no main/merge ahora.
2. Confirmar backend→RA_PURCHASE_SERVICE→bridge→RA_PURCHASE_GATEWAY→Oracle8791 comercial,
   autenticación separada y Journal persistente. No crear nuevo túnel/instancia.
3. Confirmar tokens por metadatos/presencia y sincronización privada, flags coherentes,
   permisos Fundador y alcance efectivo110US sin alterar disponibilidad SF/MP.
4. Revalidar producto5/ADS005, campo UID, costo/límite aprobado, región y liquidez; precio
   venta servidor y saldo wallet suficientes. No usar fixture999001.
5. Aprobar despliegue por separado. Luego autorizar explícitamente UNA operación con
   UID y techo de gasto del propietario; esta revisión no concede esa autorización.
6. Verificar débito único, pedido, referencia, entrega110 y comprobante; si incierto,
   detener nuevas compras y conciliar, no repetir submit ni borrar Journal.
Reversión debe cerrar nuevas compras y conservar datos/conciliación de pedidos pagados.

## Habilitar más productos sin repetir infraestructura
Reutilizar lectura privada, bridge/VPC, Oracle/IP, ledger, pagos y estados existentes.
No basta añadir tarjetas al catálogo ni quitar RA_FF110_PILOT_ONLY: gateway.identity
actualmente admite un solo producto100+10US y rutas /v1/ff110. Será necesario ampliar
allowlist/contrato de gateway y guardas de backend de forma explícita, con mapeos exactos
por SKU/tipo/campo/región/costo y pruebas de concurrencia/recetas/entrega parcial.
Las recetas conservadas pueden combinar componentes validados; otros juegos/campos o
pines precisan adaptadores de contrato. No requieren otra instancia ni otro túnel,
pero sí validación de producto, sin repetir auditoría de conectividad ya resuelta.
