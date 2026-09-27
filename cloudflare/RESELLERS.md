# Revendedores Zero’X

Los siete paneles usan permisos y precios calculados por el Worker. La cuenta Fundador puede consultar todos, pero necesita saldo real para comprar. El catálogo minorista no se altera.

## Operación inicial
1. El cliente solicita instrucciones de pago por soporte y registra su depósito desde Revendedores.
2. En `manage.html`, el Fundador compara el importe declarado con el pago realmente recibido. Introduce la referencia bancaria única y confirma para acreditar el saldo completo.
3. Un total de ingresos confirmados de 200 MXN activa Novato. La solicitud sola no otorga acceso ni saldo.
4. La compra valida nivel, precio, cantidad, ID de Free Fire y saldo en el servidor. Genera un pedido pendiente de entrega manual y descuenta el total una sola vez.
5. El Fundador entrega por su procedimiento habitual y marca Entregado. Si no puede entregar un pedido pendiente, Cancelar devuelve íntegramente el saldo una sola vez.

BR, SG e IND son las regiones disponibles para verificar IDs. No hay entrega automática con Sixofire ni confirmación bancaria automática en este módulo.

## Niveles
Los objetivos existentes en la tienda se aplican a pedidos completados: Principiante 10 en 7 días, Élite 30, Maestro 50, Titán 100, Legendario 500 en 30 días y Supreme 1,000. Novato se activa por ingreso. Se conserva el mayor nivel alcanzado. Estos niveles son independientes de XP/perfil. Cada pedido cuenta una venta, no cada unidad.

Solo se configuraron las tarifas existentes de pases, fragmentos y cajas. Diamantes y Streaming muestran una categoría pendiente hasta definir precios específicos.

## Verificación
`node cloudflare/resellers.test.mjs` usa SQLite en memoria y una API de jugador simulada. No toca cuentas ni dinero real. Cubre acceso, confirmación de saldo, referencias duplicadas, precios alterados, ID inválido, compras repetidas y concurrentes, reembolsos y niveles.

La contabilidad usa centavos enteros y un libro de movimientos. Débito y pedido, y reembolso y cancelación, se ejecutan como un batch transaccional D1. Documentación: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

## Diamantes y combos
`diamonds.js` comparte el catálogo entre navegador y servidor. Los 44 combos usan las cantidades facilitadas por el fundador y calculan una combinación exacta con el menor número de recargas. El paquete 341 corresponde al proveedor 27107: 310 + 31 de bono, comprobado en el catálogo.

Los precios de referencia son precios de venta del fundador, no costos. Los combos al público añaden 15% y redondean hacia arriba al peso. Los siete niveles descuentan 2%, 4%, 6%, 8%, 10%, 12% y 13% del precio público; los importes se calculan en centavos. Los paquetes individuales conservan su tarifa pública previa. Estos descuentos no garantizan margen sobre costos del proveedor.

La composición se guarda en el pedido de saldo y se muestra al fundador para entregar todas las recargas al mismo ID. El cálculo es automático; el cobro bancario y la entrega al proveedor siguen siendo manuales. No hay llamadas a endpoints de compra del proveedor. La consulta actual de ID mantiene sus regiones BR, SG e IND; no se amplía a otras regiones sin integración compatible.
