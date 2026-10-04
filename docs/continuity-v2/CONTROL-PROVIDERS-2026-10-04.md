# Control, proveedores y métodos de Pay

Actualización incremental sobre d4d281e. Se conserva la tienda y el Editor.

- Control/Pay: fondo negro, azul/verde neón, núcleo orbital, esquema holográfico decorativo y gráfica de pedidos por canal basada en datos del panel. Sin series temporales, ingresos ni métricas inventadas.
- Lunes: resumen local de los registros. IA conversacional, credencial de modelo y acciones administrativas pendientes.
- Proveedores: Recargas América conservado; registro privado de Sixofire y Free Fire Community; consultas manuales del catálogo y jugador, con timeout, origen fijo, respuesta limitada y claves solo en servidor. El catálogo admite listas directas, items, data.items y data; si cambia el formato se requiere adaptar. Saldo Sixofire pendiente de documentar endpoint; no se inventa un endpoint ni un saldo.
- Pay: selección tarjeta/OXXO/SPEI/todos antes del intento. Checkout Pro admite default_payment_method_id; OXXO y CLABE son preferencias, no un enlace directo garantizado. Tarjeta excluye los tipos no correspondientes conocidos. Mercado Pago decide disponibilidad. El checkout existente se conserva y no se regenera al volver o cambiar la página. Firmas, importes, receptor y abono único sin cambios.
- Binance no conectado: no hay credenciales de Binance Pay disponibles. No se necesita sustituir Mercado Pago para presentar opciones propias.

Validación: 73 pruebas unitarias, suite de revendedores, build público y diff-check. Ningún cobro, recarga, saldo externo ni consulta de jugador real se ejecutó en estas pruebas.

Pendiente: comprobar un pago aprobado real y su abono único; el intento del fundador desde la misma cuenta del receptor no acredita un pago. Integración interna Checkout API/Bricks para generar directamente referencias OXXO/SPEI y capturar tarjeta requerirá un cambio de flujo con validación adicional, no parámetros añadidos al enlace. No se ha realizado ese cambio en esta entrega.
