# MVP PRIORITARIO — Free Fire 110 diamantes (sin desplegar)

**Decisión del propietario (18 oct 2026):** lanzar **primero** la recarga automática `zx-diamonds-110` (100 base + 10 bono = 110) y después ampliar a los demás paquetes. La prioridad es conectar un ciclo verificable de pago + entrega, sin esperar al catálogo de 220 productos. No hay permiso aún para una compra real ni un despliegue productivo.

## Identidad y precio que YA existen

- Producto público: `zx-diamonds-110`, **110 diamantes**, precio base del catálogo versionado **$18 MXN**. Precios finales por método sujetos a cotización del checkout original; no inventar un importe Mercado Pago ni modificar reglas de comisión.
- Proveedor: Recargas América; el coste real se obtiene de `wallet/catalog` USD y del SKU exacto en el momento de la preflight; **no utilizar precios históricos como autorización**.
- Mapeo obligatorio de proveedor: producto RA con ID entero positivo, SKU exacto, nombre idéntico a catálogo, tipo `recharge`, un campo de jugador `player_id`/`manual_id`, región autorizada y prueba expresa del bono 100 + 10. **El ID/SKU real todavía NO se ha certificado.**
- El paquete 110 no se identifica con una coincidencia vaga de nombre ni por orden en catálogo. Se bloquearán nombres ambiguos `Age of Empires/Apex Coins` hasta verificación del proveedor.

## Cambios preparados en esta rama

1. `RA_FF110_PILOT_ONLY=true` es un **control de alcance adicional** opt-in, no una configuración productiva desplegada. Los endpoints de cotización, checkout, pago con saldo, compra desde fondos RA y reanudación rechazan otros productos cuando está activo.
2. El motor `fulfill` verifica identidad pública, total, un único paquete y bono (100+10) **antes** de enviar una entrega; órdenes ya pagadas de otros productos quedan pendientes para revisión, sin volver a cobrarse ni reasignarse de proveedor.
3. Las compras RA de otros servicios y juegos se bloquean en piloto; **Sixofire no se modifica**.
4. El descubrimiento automático de SKU por nombre queda inactivo durante el piloto: se necesita asociación explicita y verificada; órdenes e histórico D1 existentes se conservan.
5. Pruebas de unidad introducidas y workflow dry-run sin deploy; no se activaron las banderas de producción.

## IMPEDIMENTOS REALES antes de hacer una sola compra

- **Canal privado de escritura Oracle:** el único binding de lectura validado es `RA_READ_SERVICE -> zerox-ra-vpc-test`, y su contrato **prohíbe comprar**. El código actual de entrega utiliza `https://panel.recargasamerica.com/api/v1/buy/catalog` directamente desde Worker con `RECARGAS_AMERICA_API_KEY`, lo que no prueba que funcione desde la IP Oracle autorizada. No basta con activar un flag para volverlo privado. Diseñar e implementar un **nuevo transporte autorizado de compra/validación/consulta de órdenes por Oracle**, separado del binding de lectura, verificando permisos, autenticación servicio-a-servicio, control de idempotencia, contrato exacto, balance, regiones, límites, protección anti-duplicados y ausencia de reintento de `UNKNOWN`.
- **Modo read-only:** `raPrivateMode` bloquea envíos/validaciones RA. No activar lectura privada y flag de compra contradictorios; establecer una configuración coherente que mantenga el acceso administrativo read-only por su propio binding y compras en un canal distinto auditado. NO modificar config de producción hasta auditar ajustes efectivos y pedidos existentes.
- **Cobros existentes:** auditar `reconcileProductPayment` y `spendOrderWallet` con pruebas reales simuladas y revisar estados de órdenes existentes. Mercado Pago solo puede iniciar entrega tras confirmación autenticada del webhook, nunca por captura/callback del cliente.
- **Prueba real:** una única recarga 110 en cuenta/ID del propietario, con coste y riesgo previamente expuestos, consentimiento expreso para esa compra y recepción comprobada; no usar cuentas de clientes para pruebas. Verificar recibo, conciliación y estado ante timeout/UNKNOWN; rollback NO debe reintentar órdenes inciertas.
- **Disponibilidad Cloudflare:** el diagnóstico GET `cloudflare/preprod/audit-cloudflare.py` todavía necesita ejecutarse con autorización. No equivale a auditoría de Oracle ni verifica cron/traffic/routes. Contrastar permisos, binding secreto y valores remotos sin revelar saldos.
- **Staging completo:** probar original panel + checkout y wallet en entorno aislado, **sin cobrar**, no confundir con copia de la sección proveedores.

## Criterios de aceptación para habilitar FF110

- Producto público 110 exacto y único; precio base revisado; contrato de bono, región, precio USD y saldo verdaderos.
- Cliente con sesión activa, ID validado y cuenta confirmada; método de pago elegido y presupuesto aceptado.
- Cotización/checkout MP: comisión mostrada, webhook firmado verificado; wallet: un solo asiento débito atómico o transacción compensatoria al fallar.
- Orden idempotente y **una sola solicitud a proveedor por operación**, recibos verificados; timeout/desconexión -> PROCESSING/REQUIRES_REVIEW y **nunca compra ciega repetida**.
- Bandera restrictiva `RA_FF110_PILOT_ONLY=true` y bloqueo del resto de entregas RA, sin afectar catálogo ni compras de Sixofire.
- Auditoría efectiva Cloudflare/Oracle, pruebas y aprobación para desplegar; rollback probado. Después, autorización separada para una compra real.

## Estado actual

**Implementado:** limitador lógico por producto para endpoints de diamantes, compra con fondos RA, wallet/MP, recuperación, cumplimiento, servicios RA y mapeos. No depende de nuevos productos o de reiniciar el proyecto.

**PENDIENTE:** desarrollo del nuevo transporte de compra por Oracle, pruebas integrales del flujo real de pagos, auditoría efectiva, identificación del SKU correcto, despliegue autorizado y primera compra real autorizada.

**Prohibido por ahora:** merge a `main`, deploy, cambiar banderas productivas, credenciales, D1 productiva, webhook MP, Oracle activo o sesión Zerito Bot. La prioridad del MVP **no es** permiso de cobro o compra de prueba.
