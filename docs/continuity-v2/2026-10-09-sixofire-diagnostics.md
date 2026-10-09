# Sixofire read diagnostics — 2026-10-09

The live founder Control orders check still returned a generic unavailable message. The official public docs at https://sixoff.com/docs/ord-list (public asset index-CDz95CpG.js, build 2026-09-29) confirm GET /account/shop/orders with page and limit and X-API-Key, requiring SHOP_ORDER and an active subscription. No endpoint change or permission bypass was made.

Separate network timeout, connection failure, redirect refusal, malformed successful JSON, HTTP error status, and allowlisted license errors. Previously JSON parsing erased the HTTP status for HTML error responses. Only safe enums and numeric HTTP status leave the server, never raw response text or credentials. Control renders these diagnostics. Service checkout retains its existing connection-failure contract; all pre-payment checks remain intact.

Validation: 184 tests pass, including three diagnostic regressions; build 256 files. No order, debit, payment, or arbitrary coupon was created. Coupon creator PR33 is already published. No commission surcharge or catalog price increase was applied.

Live upstream diagnosis after deployment: pending verification.
