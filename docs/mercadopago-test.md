# Mercado Pago: Checkout Pro de prueba

Implementación aislada del motor de entregas. No habilita pagos públicos ni recargas.

- Página: https://zerox-store.pages.dev/payment-test.html
- Acceso: sesión fundadora existente de la tienda.
- Worker: `zerox-sixofire-api` (desplegar `cloudflare/worker.js` con sus módulos).
- Secreto: `MP_ACCESS_TOKEN_TEST`. Solo se permite una cuenta con etiqueta `test_user`, comprobada con `/users/me`; el prefijo del token no se usa como prueba.
- D1: crea únicamente `zx_mp_test_orders` de forma aditiva. No modifica pedidos reales.
- Webhook: `https://zerox-sixofire-api.westdark161208.workers.dev/api/payments/mercadopago/test/webhook`.
- En Mercado Pago, configurar ese URL en modo prueba para evento **Pagos**. Guardar su clave de firma como `MP_WEBHOOK_SECRET_TEST` en el Worker. No confundir con Access Token.
- Es posible consultar manualmente el resultado sin Webhooks. No se acepta el status de la URL de retorno como evidencia.
- Crear una preferencia no efectúa un pago. Abrir el checkout usando exclusivamente comprador y tarjetas de prueba, nunca datos reales.

## Comprobaciones pendientes en la cuenta

1. Confirmar despliegue Worker y Pages.
2. Abrir página como fundador: debe indicar secreto detectado.
3. Crear checkout. Si `TEST_SELLER_REQUIRED`, usar credenciales de la cuenta vendedora de prueba de Checkout Pro. No sustituir por una cuenta real.
4. Probar aprobado, pendiente y rechazado con cuenta compradora de prueba.
5. Configurar firma y simular Webhook; comprobar estado desde API.
6. Comprobar repetición del webhook sin crear otra fila o entrega.

## Límites

Los intentos incompletos no se reenvían automáticamente al proveedor: crear una nueva prueba. Todos los estados son solo de prueba y no participan en monedas, inventario ni entregas. Pendiente implementar el checkout público y producción después de validar la integración y disponibilidad del proveedor.

Fuentes: documentación oficial de Mercado Pago Checkout Pro vía Preferences: create-payment-preference, integration-test/introduction, integration-test/test-purchases y additional-content/notifications/webhooks.
