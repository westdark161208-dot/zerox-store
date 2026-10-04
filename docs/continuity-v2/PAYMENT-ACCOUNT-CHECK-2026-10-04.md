# Read-only Mercado Pago account check

Founder-only GET /api/admin/payments/mercadopago/account uses the confirmed production token name to call GET https://api.mercadopago.com/users/me. Requires MP_PRODUCTION_READ_ENABLED=true and configured token and collector. Requires exact collector and site MLM (Mexico). Returns only receiverMatched and site; personal profile, email and credentials never leave the server. No-store, fixed host, no redirects, 12-second timeout. No checkout, money movement, ledger schema or writes.

Control exposes a manual connection check after configuration is ready. Session invalidation clears account results and discards pending responses. Configuration text reflects the real pilot flag instead of always claiming the pilot is disabled. Account matching is connection evidence only; each payment still requires live_mode and exact payment evidence. No flags enabled by this change. Owner-side authenticated connection remains pending.

Official SDK reference: https://pkg.go.dev/github.com/mercadopago/sdk-go/pkg/user . Rollback: revert this commit; no migrations or funds to undo.

## Diagnóstico de conexión

La captura de Control confirma consulta habilitada y firma configurada, pero la cuenta aún no fue verificada. Se distinguen rechazo HTTP 401, acceso 403, límite 429, timeout, conexión y discrepancia de cuenta. No se devuelve el cuerpo de error de Mercado Pago ni datos personales. El frontend solo traduce códigos permitidos. La bandera MP_PRODUCTION_READ_ENABLED=true se sincroniza con la configuración que el fundador ya habilitó. El piloto sigue desactivado. Validación: 66 pruebas y compilación pública.

## Compatibilidad del runtime

La captura siguiente reportó CONNECTION_FAILED. El código oficial de workerd (src/workerd/api/http.c++) rechaza redirect:error y exige manual o follow. Se cambia a manual en las consultas y preparación de checkout; las respuestas no exitosas, incluidas redirecciones 3xx, siguen rechazadas sin seguir Location ni reenviar credenciales. Se corrige también el adaptador de consulta de Recargas América. Pilotos y compras siguen con sus banderas existentes, sin activaciones. La cuenta productiva aún requiere comprobación desde la sesión del fundador.
