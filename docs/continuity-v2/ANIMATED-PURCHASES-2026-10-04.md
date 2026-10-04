# Animated panels and gated diamond purchases — 2026-10-04

Reference videos: 822611.mp4 (electric arcs, 3.31s) and 822630.mp4 (Control provider reads, 41.36s). The latter shows a successful Sixofire catalogue with DIAMONDS_PIN products and an unsuccessful order-access read. It does not establish direct-to-UID delivery, SHOP_ORDER entitlement, supplier funds or an approved real customer payment.

## Delivered code

- Original supplied OXXO and Mercado Pago logos, unchanged aspect ratio, shared payment selection and wallet option for diamonds.
- Animated canvas lightning across shared player cards; stylized rotating globe and neural brain in Control and Pay. Black/blue/green surfaces; reduced-motion support and animation paused offscreen/background. These are decorative system visualizations, not fabricated regional sales or AI operations.
- Founder-triggered Sixofire USD price snapshots and local history graphs. No automatic provider polling, invented FX conversions, profit figures or changes to sale prices.
- Allowlisted Sixofire diagnostics distinguish permission/subscription/quota/key failures without exposing raw responses.
- Server-priced founder purchase pilot: exact UID verification, exact DIAMONDS_DIRECT amount and explicit region match, separate order-access preflight before any customer debit/preference, immutable ledger debit, own-order tracking, signed existing production webhook with authoritative payment reads, one delivery attempt and lookup-only handling for unknown outcomes.
- PINs, inferred bonuses, wrong regions and unverified mappings are refused before charging. Tracking remains readable while the pilot is paused. A ledger debit interrupted before payment-state write is repaired from the existing debit, never charged again.

## Production boundaries — still pending

Product purchases remain OFF. No new enabling vars were set in Wrangler or remotely. The UI reports unavailable delivery and cannot initiate product charges. Existing wallet-funding founder pilot remains separate.

Activation requires verified SHOP_ORDER licence/subscription/quota, an exact direct-to-UID product mapping, funded supplier account, and live validation of the supplier create/lookup contract. Required server gates: DIAMOND_PRODUCTION_ENABLED, SIXOFIRE_DELIVERY_ENABLED, SIXOFIRE_FUNDS_VERIFIED, SIXOFIRE_CONTRACT_VERIFIED, SIXOFIRE_DIRECT_SKUS, plus existing production payment configuration. Setting flags is not verification. SIXOFIRE_DIRECT_SKUS is a JSON amount-to-numeric-SKU map. Never use browser-supplied prices or a test token in production.

The minimal supplier adapter sends uid/product_id to the documented shop order endpoint. Its behavior has been exercised only against fixtures; do not declare the upstream live contract verified. An accepted/unknown response never authorizes a repeat supplier POST. Refunds/chargebacks require operational review; there is no automatic compensation or refund UI. A price preflight confirms exact SKU/availability/region but is not a supplier wallet balance read. API prices are USD; static recipe costs are estimates, not realized margin.

No agent-initiated real payment, supplier purchase, wallet credit or diamond delivery occurred. No actual successful customer end-to-end purchase has been demonstrated. Public purchases remain disabled; pilot limited to active founder and server price <= MXN 200.

## Validation

94 Node tests pass, including new live-evidence rejection, duplicate webhook, own-wallet debit, concurrent/idempotent ledger behavior, lost supplier response, exact product/region/UID validation, existing-debit recovery and real price snapshot checks. Legacy reseller suite passes. Public allowlist build: 220 files; no backend, tests, docs or secrets shipped. Browser review and hosting checks are tracked in the publishing response.

Rollback: revert this increment. Additive provider quote/product-payment tables can remain; never delete or alter financial ledgers as a visual rollback. Pause delivery by disabling product flags, preserving own-order read access and already-paid records.
