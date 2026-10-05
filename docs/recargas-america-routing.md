# Recargas América / diamantes

Contrato: colección Postman RecargasAmerica_API v1.0.0 proporcionada por el propietario. Host fijo `https://panel.recargasamerica.com/api/v1`.

- Diamantes: Recargas América. No fallback a Sixofire.
- Sixofire: exclusivamente fragmentos, cajas de fragmentos, Booyah y paquetes de nivel disponibles para el UID. El catálogo privado muestra candidatos sin autorizar su compra por coincidencia de nombre.
- Totales de tienda: base + 10%. Ejemplo 520 + 52 = 572. La afirmación comercial no prueba que el proveedor entregue el bonus: se requiere evidencia de proveedor para la asociación de cada paquete.
- `POST /buy/catalog` realiza una recarga por solicitud; `quantity` no multiplica recargas. Cada componente de una combinación tiene operación e Idempotency-Key propios y persistidos.
- `409 DUPLICATE_REQUEST`, timeout, `502 PROVIDER_ERROR`, estado parcial o revisión nunca permiten repetir una compra. Se consulta únicamente una referencia obtenida de la respuesta de esa operación.
- `delivery: []` es válido para recargas. No se aceptan PINs como diamantes entregados al UID.
- Plan de SKU, región, base, bonus, precio USD e identidad de proveedor congelado al crear la orden. Pedidos antiguos sin ese plan permanecen para revisión, sin cambio de proveedor.
- Ledger y pago aprobado: mismas verificaciones existentes (usuario, importe MXN, collector, live_mode, referencia). Ningún retorno del navegador confirma un pago.
- Los costes antiguos en centavos MXN no se reutilizan como costes RA. Los pedidos RA dejan el coste legacy en cero con `providerCostEstimated:false`; el coste cotizado real permanece en el plan USD. No calcular margen usando ese cero ni convertir USD automáticamente.

## Activación pendiente de evidencia viva

`RA_READ_ENABLED=true` habilita solo consultas privadas. La clave es el secreto `RECARGAS_AMERICA_API_KEY`. Control permite leer wallet/catalog y validar UID sin comprar. La documentación de validación indica que algunos productos devuelven `supported:false`; eso no equivale a ID inválido.

Para activar el piloto fundador deben verificarse catálogo real, moneda USD del wallet, saldo, contrato de bonus y regiones. Después se configuran `RA_DIAMOND_PACKS`, `RA_CONTRACT_VERIFIED=true`, `RA_DELIVERY_ENABLED=true`, `DIAMOND_PRODUCTION_ENABLED=true`. Estas banderas financieras no se han habilitado en Wrangler. La presencia de una clave de prueba `ra_test_` rechaza producción.

Formato de RA_DIAMOND_PACKS (ejemplo de estructura, NO SKU real):

```json
{
  "572": {
    "productId": 1,
    "sku": "CODIGO_REAL_DEL_CATALOGO",
    "name": "NOMBRE_EXACTO_DEL_CATALOGO",
    "baseDiamonds": 520,
    "bonusDiamonds": 52,
    "regions": ["US"],
    "bonusEvidence": "Referencia de confirmación del proveedor de entrega 520 + 52 en esta región"
  }
}
```

Se rechazan precio/código/nombre/tipo/campos requeridos o región incompatibles antes de preparar Mercado Pago o debitar Wallet. Se comprueba otra vez inmediatamente antes del POST financiero. Subidas de precio respecto al plan congelado requieren revisión. Monedas distintas de USD requieren verificar/adaptar el contrato primero.

Sixofire servicios usa `SIXOFIRE_SERVICE_SKUS` con SKU real -> `fragment`, `fragment-box`, `booyah`, `level-up`. La consulta level-up requiere ACCOUNT_PACKAGE_LEVELUP y cuota activa y consume una consulta de cuota. El `itemId` del paquete Garena debe relacionarse con `levelUpPackageId` del producto de venta, nunca confundirse con su `product_id`.

No se ha ejecutado un pago o recarga real durante pruebas. Una primera operación real aún requiere completar la sesión privada y revisar el resultado de proveedor/pago/entrega antes de ampliar el piloto.
