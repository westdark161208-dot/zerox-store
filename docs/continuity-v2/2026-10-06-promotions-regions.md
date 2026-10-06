# Promotions, regional users and delivery — 2026-10-06

## User-facing changes
- Carousel buttons open promotions.html; promotions never enter the main catalog. Ad prices can now be published in Editor.
- Explicit combo descriptions are parsed on the server. `6160 diamantes + 21 cajas de fragmentos + 3 pases Booyah` creates sequential destinations, including a separate confirmed UID for each pass. Evo boxes are a separate product; generic `cajas` is deliberately not executable.
- A first verified UID checks availability before any charge. After one wallet debit or authoritative MP approval, each delivery destination is confirmed in sequence. The initial UID can be reused for boxes; passes require their own confirmation. Orders resume through their own link/history. Partial or uncertain dispatches are never submitted twice.
- Original Spin OXXO QR asset, number 2242170100323890, copy button and support WhatsApp 529514754210. Manual credit timing is visible.
- Fixed legacy verification click handler catching the new checkout's button. Added neon platform styling around real account data, not a fabricated equipped character.
- Binance Pay remains explicitly disabled. RA/SF funds are exposed only to the founder and independently checked server-side. Only products actually available via the selected API can be delivered.
- Control map uses actual Natural Earth country boundaries, with region/country navigation. Customer location is private and self-reported in Profile. Existing users without a location remain under Unknown; no location is inferred from game region/currency.
- Administrative balance adjustments generate an idempotent reference automatically. OXXO credits still require the ticket folio to prevent duplicate deposits.
- Dark browser theme replaces the red manifest color.

## Delivery and payment details
- New exact-name discovery for known membership/pass/token variants; ambiguous matches are rejected. Saved creator SKU/region mappings remain supported.
- New RA associations need a positive provider account validation, not a guessed region.
- Sixofire shop order contract reviewed at https://sixoff.com/docs/ord-new and its publicly served docs bundle: POST /account/shop/order with uid, product_id and amount; successful creation returns 201. GET /account/shop/orders/{id} is used to verify completion. No Garena JWT gift endpoint is used.
- Store prices stay authoritative in D1 Editor. Browser prices cannot authorize a different amount. A signed MP webhook still fetches the actual payment and checks collector, external reference, currency and exact amount.
- Receipts are emitted only after complete verified delivery. Internal provider identifiers and combination plans stay private.
- Geographic source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson (public-domain Natural Earth, 1:50m). The local SVG projects its real coordinates; boundaries are not drawn by approximation. Central America navigation includes Caribbean territories.

## Validation and remaining operational requirements
- Full automated test suite and public build run before publication; tests cover exact MP evidence, duplicate events, sequential destinations, lost responses, 201 responses, owner isolation, founder-only funds and private regional filtering.
- No live payment or supplier purchase was made during development. Merchant credentials, quota, stock, supported region and funds must pass live API checks. No claim that all upstream SKUs are available.
- Promotion prices must be published in Editor (previous ad price fields were hidden). Price is never read from an advertising image. Unsupported or ambiguous descriptions/products cannot charge.
- No monetary wallet-read endpoint was documented for Sixofire; its displayed balance can remain unavailable even with order access.
- Discounts/coupon configuration is a later feature as requested. This release does not silently apply a coupon.
- No automated browser screenshot run was available in this environment.
