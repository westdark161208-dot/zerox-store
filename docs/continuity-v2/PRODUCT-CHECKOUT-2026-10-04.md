# Profile, shared player verification and product payment selectors

Profile banner removed from the own-account view without deleting stored user artwork. Sections compacted. Player checkout, first-time ID and own-profile query use renderFreeFireCard, escaped provider text and constrained item-image IDs, with local level/rank/likes/region/clan icons. Black and dark-blue electric treatment; decorative rays honor reduced motion.

Four method tiles (card, OXXO, SPEI, Mercado Pago) in diamonds and manual catalog checkout. Method selections are preferences, not guaranteed provider deep links. Diamond checkout remains isolated TEST: selected method recorded against attempt ID; changing method cannot reuse an attempt; no delivery or real balance changes. Manual catalog orders remain manual requests. Production wallet funding pilot is unchanged and distinct from buying diamonds.

Sixofire catalog read now includes availability, type, quantity and supported regions. New founder-only GET /api/admin/providers/sixofire/order-access calls documented GET /account/shop/orders?page=1&limit=1 and returns only read authorization, never customer orders. Read access does not prove write permission or balance.

## Actual first recarga blockers
- cloudflare/diamonds/catalog.mjs providerPacks.sku is null. Existing local plans and cost estimates are not verified supplier product associations.
- Need compare the actual supplier catalog against base packs (including DIAMONDS_DIRECT versus DIAMONDS_PIN, region, amount/bonus).
- Need valid SHOP_ORDER license, active subscription/quota and sufficient supplier funds. No live order or balance confirmed in this increment.
- Need production product-order ledger, authoritative payment reconciliation and durable fulfillment claim, recovery for ambiguous delivery errors and status tracking. Do not substitute a production token into the test checkout.
- No live purchase, transfer, automatic credit or supplier order executed by the agent.

Official reference consulted: https://sixoff.com/docs/ord-items ; https://sixoff.com/docs/ord-get ; https://sixoff.com/docs/ord-list ; https://sixoff.com/docs/getting-started .

Validation: 82 node tests, syntax checks, whitespace check, 215-file public build. Signed-in profile and payment processing require user session/provider testing; no claim of end-to-end live fulfillment.
