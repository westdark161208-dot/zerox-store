# Resellers unified model — 29 October 2026

Requested target: one reseller level, persistent section discounts based on published storefront prices, one customer wallet shared by storefront/portal/API, common funding methods, scoped user API keys, automatic RA fulfilment, matching artwork and editable Umy Advisor.

## Implemented candidate (not deployed)
- `RESELLERS_SINGLE_LEVEL_ENABLED=true` switches approved accounts to tier 1 without deleting historical tier data. Default remains legacy pending coordinated rollout.
- Single section discount is saved in the reseller draft; publication remains explicit/revision-checked. Discounts apply to future products and are recomputed from source base prices, never compounded. Historical per-item tier overrides do not set the new price.
- Portal hides tier navigation in single-level mode; Control provides one discount/price field. Individual price is read-only in this mode. Old account tier management remains for legacy history and needs cleanup at final cutover.
- Canonical diamond category merges navigation labels without deleting products. Existing main-store crops fill missing fragment/case artwork; diamond amounts appear on artwork.
- Store category captions cover less of the image.
- Floating Umy Advisor shell and editable image target in Zero'X Editor. No AI replies/message submission. Existing support contact retained.

## Still pending (must not claim complete)
- Shared wallet migration and routing. Production has two separate ledgers. Reconcile balances, pending orders/deposits/refunds and payment references before moving any balance. A transfer must debit old/credit new exactly once with immutable audit and prevent old routes from continuing writes. Never show a copied balance as a migration.
- Reseller admission deposit must reuse verified wallet funding without double credit.
- API keys: hash-only storage, one-time display, expiry/revocation, scopes, rate limit, same authoritative wallet/pricing and idempotent orders. No key UI/endpoints exist in this candidate.
- RA full import/publication and checkout mapping/required fields/receipts. PIN/streaming keep actual delivery type; first-time-ID remains pending. Provider credentials, private signed bridge and commerce configuration must be verified before activation.
- Funding UI reuse and server verification of enabled methods. Binance automated settlement is not proven by Mercado Pago support.
- Umy support conversation backend and shared history; browser validation of visual changes.

## Verified infrastructure
Owner obtained HTTP200 through remote VPC service 01a15769-3e76-7e51-9a7e-13a628870a2a to Oracle localhost:8791: healthy true, correct zerox-ra-catalog service, purchasesDisabled true. Use redirect:manual, require HTTP200; redirect:error is unsupported in that runtime. This is connectivity evidence, not purchase evidence.

Last confirmed production: Worker c69a6865-473a-4508-b63d-f2f618dbb198, Pages 66b107b2-faad-4396-9119-9e2f157381ff, commit 5483626795ee0c574b9468551c044535238f04a2. No deployment, balance movement or real purchase in this change.
