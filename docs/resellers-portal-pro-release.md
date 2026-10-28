# Resellers Portal Pro — release checkpoint

Base: `39d588d1c300b5c8e008e1790197b154992e7a89` on `codex/resellers-v2-production-base-20261027`, preserving the verified commercial backend of active Worker `275581e6-ec73-4e59-9f61-aeb3f37fcec3`.

Implementation:

- Standalone `/resellers-portal` entry, account login/registration, private application receipt (PNG/JPEG, 4 MB), explicit administrative admission.
- One-time retention of existing reseller members. New deposits do not grant admission. Disabling reseller access preserves the main account, ledger and orders.
- Founder tools for creating/linking accounts, reviewing applications, audited one-time credits, name color, avatar frames and manual tier overrides 1–7.
- Control sections open with buttons; existing deposits, orders, history, instructions and appearance tools remain available.
- Separate reseller catalogue drafts/publication and seven server-owned prices; main editor data is read without modification. Legacy Resellers checkout uses the published overrides, its existing player verification and immutable order snapshot.
- Static store products, diamond collection, published main editor entries, managed catalogue/streaming and available game-provider catalogue are mirrored. Products without their own images use a neutral placeholder. A provider catalogue outage can leave its uncached items unavailable.
- Existing provider/stock/promotion purchase flows remain in the main store. They cannot be switched to the new manual fulfilment path. Other mirrored products require an explicit founder choice to enable manual orders. Manual orders use the existing reseller ledger and review/refund queue; they never call automatic purchase services.
- Optional Umy outbox uses a separate WhatsApp Cloud API sender. Missing configuration keeps notifications pending. An API-accepted message is not represented as delivered. Ambiguous send results are not automatically retried.

## Important limitations before production

This is an implementation checkpoint, not a new production deployment. `RESELLERS_PORTAL_PRO_ENABLED` defaults off. The frontend and flag must be deployed together in a controlled release; do not deploy this frontend against a Worker with the flag off.

The local suite passed 330 tests and `node cloudflare/resellers.test.mjs` passed. Syntax checks passed. Browser validation was not executed: Chromium was unavailable and its download failed in the development environment. Run `tests/resellers-pro-browser.mjs` in an environment with Playwright/Chromium. It uses local SQLite and intercepted APIs, never production.

`node scripts/verify-resellers-pro.mjs` runs local tests, syntax checks, a public build and an esbuild Worker bundle using Oracle's existing installation. It does not upload, activate, run migrations against remote D1, or send WhatsApp messages.

The repository retains the compatible commercial frontend from the verified production-base branch, plus the published Resellers V2 interface files and this extension. In particular, private RA association diagnostics in that base remain intact. Do not replace this with a blanket frontend merge from the old V2 branch.

## Umy connection still required

Do not store any of these values in git. Configure privately in Oracle/Cloudflare only after the user's separate number is registered and its template approved:

- Secret `UMY_WHATSAPP_TOKEN`.
- `UMY_PHONE_NUMBER_ID` (Meta identifier, not the telephone number).
- `UMY_GRAPH_VERSION` supported by the registered app.
- `UMY_APPLICATION_TEMPLATE`, with image header and seven text variables in order: application ID, email, username, store, phone, weekly sales, motivation.
- Optional `UMY_TEMPLATE_LANGUAGE` (default `es_MX`).

Recipient is the existing support number `529514754210`. Template wording should clearly introduce Umy, label the fields, and state that the screenshot does not prove payment or credit a balance. Full record and private receipt remain in Control. Approval/rejection replies currently open an explicit admin WhatsApp message; they are not sent automatically.

Official API references consulted:
- https://www.postman.com/meta/whatsapp-business-platform/folder/o48mro7/messages
- https://www.postman.com/meta/whatsapp-business-platform/request/lwtlz1k/send-message-template-interactive
- https://whatsappbusiness.com/blog/media-messages-via-app/

## Release sequence (pending)

1. Run Oracle verification and browser tests; inspect mobile access/application/store and all Control buttons.
2. Build candidate with the preserved private Wrangler config; add only `RESELLERS_PORTAL_PRO_ENABLED=true` for this feature. Preserve commercial bindings, secrets and FF110 gates. Upload a version without traffic.
3. Confirm remote bundle/config and `/api/resellers/portal/status` using store Origin/Referer headers. Do not make test financial operations against its real bindings.
4. Activate candidate with rollback to `275581e6-ec73-4e59-9f61-aeb3f37fcec3`; deploy Pages in existing project `zerox-store` only after backend health checks.
5. Verify domain assets, founder read access, approved login, service worker and main commercial smoke checks. Record exact resulting IDs.

Rollback frontend to Pages `7ec8ce19-1ee3-4def-ae7d-05829b5c5696`, backend to `275581e6-ec73-4e59-9f61-aeb3f37fcec3`. Retain additive tables and financial history. Never restore an old D1 dump over new transactions. The original `a4aeddb3...` remains a historical rollback, not the immediate target for this extension.
