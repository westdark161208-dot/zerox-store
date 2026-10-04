# Checkout y abono Wallet: piloto cerrado

Continúa PR #4 desde 5f4226c. El usuario autorizó avanzar hasta necesitar intervención. Código preparado, sin activar flags, configurar secretos, hacer transacciones reales o migrar D1 remoto.

## Flujo implementado

1. Fundador activo solicita intención de saldo de $10 a $200 MXN. El servidor valida centavos enteros, identidad y clave de solicitud.
2. Reserva una creación de checkout antes de contactar Preferences API. Reintentos con la misma solicitud reutilizan el enlace. Cambiar el monto produce conflicto. Una respuesta ambigua requiere revisión, no repetición automática.
3. Checkout usa importe y referencia de la intención, cuenta receptora esperada, URLs de retorno y webhook fijos; valida dominio HTTPS del enlace recibido. No almacena tarjetas.
4. Webhook POST valida firma HMAC del proveedor y consistencia del ID, obtiene el pago nuevamente desde API oficial y valida modo real, MXN, receptor, importe y referencia. No confía en cuerpo o retorno del navegador.
5. Solo pago aprobado, no reembolsado ni bajo revisión, pasa a verificado. La inserción única de abono y confirmación de intención se ejecutan en D1.batch. Si falla la confirmación, se revierte la inserción. Duplicados/concurrencia no abonan dos veces.
6. La pantalla de retorno consulta exclusivamente el estado propio; no escribe saldo ni interpreta `status=approved` como evidencia. Sesión/cambio de visibilidad invalidan respuestas y enlaces tardíos.

## Archivos

- `cloudflare/payments/settlement.mjs`: transacción de abono + confirmación, validación de propietario activo y control de saldo seguro.
- `cloudflare/payments/funding-routes.mjs`: orquestación de checkout, webhook y consulta de intención. Exclusivo fundador para checkout/consulta; webhook autenticado por firma. Ninguna ruta de proveedor/recarga nueva.
- `cloudflare/payments/funding.mjs`: conserva confirmed frente a notificaciones antiguas; revisión permanece bloqueada.
- `cloudflare/payments/mercadopago-production.mjs`: indicador de checkout piloto condicionado a configuración completa.
- `cloudflare/worker.js`: registro del módulo; bypass de sesión solo en webhook firmado.
- `wallet-payment.html/js`: pantalla de pago y consulta exclusiva del piloto, importe limitado y advertencia visible de dinero real.
- `control.html`, `scripts/build-pages.mjs`: enlace de acceso y allowlist pública de los dos nuevos archivos.
- `tests/funding-flow.test.mjs`, `wallet-payment-view.test.mjs`: atomicidad, concurrencia, recuperación, firma, configuración, checkout único, vuelta del navegador y privacidad de UI.

## Requisitos antes de la prueba real

La nueva rama debe publicarse con piloto apagado. Verificar en el Worker los secretos `MP_ACCESS_TOKEN_PRODUCTION` y `MP_WEBHOOK_SECRET_PRODUCTION`, y la cuenta receptora `MP_COLLECTOR_ID_PRODUCTION`. No revelar valores en chat o Git.

Configurar notificaciones de pagos en Mercado Pago para:

`https://zerox-sixofire-api.westdark161208.workers.dev/api/payments/mercadopago/funding/webhook`

Verificar la firma usando el secreto productivo. `MP_PRODUCTION_READ_ENABLED=true` habilita solo la consulta privada. El nuevo `MP_WALLET_PILOT_ENABLED=true` habilita checkout/abono exclusivamente del fundador; NO activarlo hasta revisar la configuración y preparar la prueba. Por defecto, ausente o distinto de true, no ejecuta este flujo ni crea tablas financieras.

La prueba inicial propuesta es $10 MXN, sin compra ni recarga. Abrir wallet-payment.html con sesión fundadora, generar un solo intento, verificar receptor/importe en Mercado Pago antes de pagar, comprobar notificación, movimiento único y saldo; repetir notificación o consulta sin duplicación. La disponibilidad mínima del método concreto debe confirmarse al abrir el checkout, no se da por garantizada aquí.

## Límites pendientes

No habilita depósitos para clientes, compras con Wallet, transferencias o retiros. No entrega artículos ni usa fondos del proveedor. No hay saldo ficticio. Reembolsos/contracargos marcan revisión; si hubo abono anterior no se borra el ledger ni se compensa automáticamente. Debe diseñarse retención/compensación antes de permitir consumo del saldo; el piloto no permite gastarlo.

Un checkout ambiguo necesita revisar la preferencia/pago antes de un nuevo intento; todavía no hay resolución automática de esa ambigüedad. Passkeys, step-up y rate limiting administrativo completos siguen pendientes. No presentar este piloto como integración pública lista para operar.

## Validación y rollback

61 pruebas Node y suite revendedores aprobadas; build público (211 archivos), sintaxis y diff correctos. Evidencia simulada y SQLite local; D1 remoto, firma real, credenciales y UI visual requieren prueba posterior. No se ha generado un cobro real.

Revertir este incremento restaura 5f4226c. Antes de detener un piloto activado con pagos pendientes, deshabilitar nuevos checkouts y resolver las notificaciones pendientes; no borrar intenciones, checkouts o ledger. No cortar recepción de pagos aprobados sin conciliarlos. Código de schema es aditivo; conservar registros para auditoría.

Referencia oficial: [crear preferencia](https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post). Consulta y firma: fuentes del documento PRODUCTION-PAYMENTS-2026-10-04.md.

## Confirmed production configuration

The owner confirmed that the existing `MP_ACCESS_TOKEN` holds production credentials. Production modules now accept this name; `MP_ACCESS_TOKEN_PRODUCTION` remains an optional explicit override. `MP_ACCESS_TOKEN_TEST` is never a fallback. Live mode, receiver, currency and amount checks remain mandatory. The owner saved collector `1404826494` and reported saving `MP_WEBHOOK_SECRET_PRODUCTION` in Cloudflare; secret presence and live connectivity have not been independently verified. Collector is mirrored in Wrangler vars to preserve it on deployment. No activation flags were added and no money was processed.

## Activación del piloto y diseño de Control/Pay

La captura 820879 confirma que la credencial productiva corresponde a la cuenta receptora en México. El usuario pidió conectar pagos reales y mejorar Control/Pay con sus referencias futuristas. Se habilitan en Wrangler MP_WALLET_PILOT_ENABLED=true y WALLET_READ_ENABLED=true, junto a la lectura productiva ya habilitada. Checkout y consultas de intención siguen exclusivos del fundador activo; la consulta de saldo propio permite únicamente GET. No se crean checkouts ni se pagan transacciones desde el agente. El usuario completa el pago en Mercado Pago. Ninguna compra Wallet, recarga, transferencia ni retiro se habilita.

La firma está configurada, pero la recepción de una notificación real y el abono en D1 requieren la prueba real del usuario; no se declaran validados. Una simulación con ID inexistente no prueba un pago aprobado. Las tablas se crean de forma aditiva en la primera consulta Wallet o intención, sin datos ficticios.

Console.css aplica solo a Control y Pay: tarjetas azul/violeta, núcleo orbital decorativo, datos reales existentes, sin gráficas o porcentajes inventados. Se preservan IDs y manejadores. El texto estático anterior de modo de prueba se corrige para separar producción y pruebas.
