# Read-only Mercado Pago account check

Founder-only GET /api/admin/payments/mercadopago/account uses the confirmed production token name to call GET https://api.mercadopago.com/users/me. Requires MP_PRODUCTION_READ_ENABLED=true and configured token and collector. Requires exact collector and site MLM (Mexico). Returns only receiverMatched and site; personal profile, email and credentials never leave the server. No-store, fixed host, no redirects, 12-second timeout. No checkout, money movement, ledger schema or writes.

Control exposes a manual connection check after configuration is ready. Session invalidation clears account results and discards pending responses. Configuration text reflects the real pilot flag instead of always claiming the pilot is disabled. Account matching is connection evidence only; each payment still requires live_mode and exact payment evidence. No flags enabled by this change. Owner-side authenticated connection remains pending.

Official SDK reference: https://pkg.go.dev/github.com/mercadopago/sdk-go/pkg/user . Rollback: revert this commit; no migrations or funds to undo.
