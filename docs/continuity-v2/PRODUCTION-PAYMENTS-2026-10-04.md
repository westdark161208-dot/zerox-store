# Preparación de pagos productivos

Continuación del PR #4 desde ee99042. El propietario autorizó avanzar en pagos reales y aclaró que no tiene saldo en los proveedores. No se inventaron fondos ni se intentó ejecutar recargas. Esta etapa no realizó una transacción ni una consulta externa autenticada real.

## Implementado

- `cloudflare/payments/mercadopago-production.mjs`: consultas GET de pagos existentes desde la API oficial, desactivadas por defecto. Cuenta receptora fijada en servidor, modo real, MXN e ID coincidentes. Conversión exacta de importes a centavos; cantidades con más de dos decimales rechazadas. Nunca usa el token TEST como respaldo.
- Ruta privada `/api/admin/payments/mercadopago/status`: muestra únicamente indicadores de configuración. `/payments/:id`: consulta un pago existente si el servidor habilita lectura. Fundador activo obligatorio; escrituras rechazadas; no-store; respuesta reducida sin datos de tarjetas ni datos personales del pagador.
- `cloudflare/payments/funding.mjs`: modelo interno de intenciones MXN y evaluación de evidencia contra importe/referencia/receptor registrados. Idempotencia por usuario/solicitud, un pago por intención y un pago externo sin reutilización entre intenciones. Estado pendiente/verificado/fallido/cancelado/revisión. Eventos tardíos no degradan verificado; revisión por reembolso/contracargo permanece bloqueada. No escribe el ledger ni tiene rutas públicas.
- `cloudflare/worker.js`: registra solo la consulta privada de producción. El módulo interno de intenciones no se ejecuta automáticamente ni crea tablas remotas.
- `control.html`, `control-finance.js`: revisión de configuración e inspección de un pago existente; acción bloqueada hasta confirmar configuración. Sin abonos ni entregas. Datos borrados y respuestas tardías descartadas al cambiar sesión.
- Tests de evidencia, importes, permisos, lookup GET sin red real, idempotencia, estados, respuestas tardías y configuración ausente.

## Configuración necesaria, fuera de Git

En el Worker existente, mediante Variables/Secrets de Cloudflare:

| Nombre | Uso |
| --- | --- |
| MP_ACCESS_TOKEN_PRODUCTION | Secreto productivo, solo backend |
| MP_COLLECTOR_ID_PRODUCTION | ID de la cuenta receptora esperada; validarlo al configurar |
| MP_PRODUCTION_READ_ENABLED | `true` habilita solamente consultas GET privadas |
| MP_WEBHOOK_SECRET_PRODUCTION | Secreto futuro de webhook; su presencia no significa webhook conectado |

No pegar tokens en el chat, frontend o repositorio. Estos nombres son los requeridos por el nuevo módulo; no se afirma que ya existan en Cloudflare. No se inspeccionó el almacén remoto de secretos. Las credenciales TEST permanecen separadas.

## Estado y pendientes

Lectura preparada, no activada remotamente. Checkout productivo, webhook productivo verificado, conexión atómica de estados/intención/ledger, antifraude y tratamiento de devoluciones/contracargos siguen pendientes. `verified` significa evidencia coincidente, NO saldo abonado. No usar la función interna con JSON del navegador; el futuro orquestador deberá obtener evidencia desde la API y validar firma antes de procesar notificaciones.

El dinero recibido del cliente y los fondos del proveedor siguen separados. Una prueba real de cobro/abono puede diseñarse sin recargar un juego; una entrega real necesita fondos suficientes en el proveedor y reglas de recuperación. No se habilita una venta automática que dependa de saldo desconocido.

Documentación contrastada: [notificaciones oficiales](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/additional-settings/optional-notifications) y [consulta oficial de pago](https://www.mercadopago.com.mx/developers/es/reference/online-payments/subscriptions/get-payment/get). El checkout TEST anterior permanece intacto; no se sustituyó su implementación.

## Verificación y reversión

51 pruebas Node y suite revendedores aprobadas; sintaxis y build público aprobados. Tests usan SQLite local y respuestas simuladas. No equivalen a una prueba real de pago, de D1 remoto ni a validación visual.

Revertir este incremento restaura ee99042. No hay migración remota ni saldo modificado que revertir. La siguiente etapa es el orquestador de checkout/webhook y abono con reintentos, seguido de prueba controlada con credenciales configuradas en servidor.
