# Diamantes Ilimitados — integración 2026-09-28

## Estado de esta entrega

El catálogo público tiene exactamente 50 productos con los precios y personajes solicitados. `diamond-catalog.js` es la fuente pública única. Los identificadores `zx-diamonds-*` son internos de Zero’X, nunca SKU del proveedor. `diamonds.js` sigue siendo el catálogo heredado de revendedores; se conserva para no alterar sus precios, niveles y pedidos existentes.

Las fichas conservan el diseño existente. Se reasignaron seis retratos existentes a personajes coincidentes: Megumi, Levi, Ace, Yuta + Rika, Zoro y Luffy Zero’X Edition. Los otros 44 retratos están pendientes: se muestra el cristal provisional y la asignación textual correcta, sin confundirlos con arte de otro personaje. Supreme tiene un marco dorado, aura y etiqueta propios. Ninguna imagen forma parte de una receta.

El botón Comprar de este catálogo abre confirmación de ID y explica que verificación, pago y entrega aún no están activos. No crea una compra pagada, no simula un nickname, no llama al proveedor ni cobra. Las demás categorías mantienen su checkout.

## Backend preparado, no activado

- `cloudflare/diamonds/catalog.mjs`: costos en centavos y optimizador exacto de menor costo; usa menos operaciones en empate. Incluye los seis paquetes, con SKU nulos. Recetas y costos no se incluyen en respuestas públicas.
- `recipes.json`: snapshot generado de las 50 recetas, costos y precios. Regenerar tras cambiar costos; las órdenes existentes conservan su snapshot.
- `schema.sql`: tablas nuevas independientes para pedidos, operaciones y eventos. Aplicar como migración D1, sin reemplazar tablas existentes.
- `engine.mjs`: creación idempotente transaccional; snapshot de venta y costo; validación de pago mediante verificador confiable; bloqueo de pedido y operación; ejecución secuencial; consulta después de timeout; reintentos solo después de confirmar que NO se aceptó la recarga. `maxOperations` limita envíos por invocación; no hay paralelismo. Los costos reales confirmados por el adaptador se registran por separado; null significa desconocido y no debe presentarse como utilidad real.
- `provider.mjs`: adaptador desactivado. No contiene endpoints, claves ni SKU inventados.
- `routes.mjs`: catálogo y preview públicos; pedidos borrador y estado propios requieren autenticación y la variable `DIAMOND_ORDER_DRAFTS_ENABLED=true`. Por defecto esos endpoints responden 503. No hay endpoint público para confirmar pagos ni ejecutar recargas.

## Activación futura

1. Revisar documentación real: autenticación, regiones, verificación de ID, SKU, saldo, creación/consulta de órdenes, límites, callbacks e idempotencia.
2. Mapear los seis SKU y comprobar que cantidades/regiones corresponden. Preservar proveedor y SKU de cada operación iniciada.
3. Implementar y probar el adaptador en sandbox. `NOT_ACCEPTED` requiere certeza de que no hubo cargo/entrega; timeout, 5xx o estado desconocido no califican.
4. Aplicar schema.sql en D1 y desplegar Worker. Estas acciones no se realizan automáticamente con la publicación del frontend.
5. Integrar pagos del lado servidor. `confirmPayment` exige referencia única, importe, moneda, pedido y confirmación verificados; nunca confiar en parámetros del navegador.
6. Conectar el formulario al endpoint autenticado de borradores, mantener una clave de idempotencia por intento de compra y mostrar nickname solo si fue verificado.
7. Añadir el disparador de ejecución (cola/cron autenticado) y las consultas periódicas de estado. No existe disparador automático en esta entrega.
8. Activar únicamente después de probar reintentos, timeout, doble callback y entrega parcial. Una operación SUCCESS jamás se reenvía. PROCESSING es consulta solamente. Si el proveedor no ofrece una consulta fiable, requiere revisión manual.

El bloqueo por pedido tiene vencimiento. Una operación persistida como PROCESSING no se reenvía aunque el proceso anterior se interrumpa. Al recuperar un proceso, el adaptador consulta la referencia/clave estable. Un cambio de proveedor no permite retomar operaciones iniciadas con otro proveedor.

No se supone que los descuentos heredados de revendedor sean rentables para este nuevo catálogo. Su integración comercial queda separada.

## Verificación

`node --test tests/diamonds.test.mjs cloudflare/resellers.test.mjs`

Comprueba costo mínimo de las 50 recetas mediante una implementación independiente, sumas, precios enteros y margen positivo; creación repetida, pago inválido, proveedor desactivado, timeout después de cuatro recargas, reconciliación, ejecución concurrente y límite de reintentos. Las pruebas usan SQLite en memoria y un adaptador de pruebas; nunca realizan recargas.
