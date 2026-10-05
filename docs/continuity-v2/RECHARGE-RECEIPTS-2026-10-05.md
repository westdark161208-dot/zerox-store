# Confirmed recharge receipts and home balances

User screenshots show the first real 110-diamond RA-funded order completed in the store and in RA (UID 612418245, RA order 867338, charge 0.6690 USD, remaining balance 1.0172 USD). These screenshots are evidence reported by the user, not a fresh authenticated API query by the agent.

Private founder RA/SF cards now appear below the home header, inside the header wallet island and below the profile wallet. A single current API result updates all copies. They clear on logout/session change/hidden page; SF still requires a documented monetary balance endpoint. Customer wallet funds remain separate.

The purchase dialog reports confirmed delivery immediately when the server returns COMPLETED, with a link to the recharge receipt. The order page fetches GET /api/diamonds/purchase/orders/:id/receipt: a read-only owner-scoped endpoint, available while fulfillment is paused, deriving a receipt from persisted fully paid and completed orders and matching successful operations. Partial, uncertain, wrong UID or unreferenced operations do not issue a success receipt. The receipt shows folio, product, player UID, region, confirmed diamonds, confirmation date, method and supplier references. Founder supplier costs are labelled as quoted costs, not verified actual charges. Download as TXT or print/save PDF via browser. Not a fiscal invoice. No supplier purchase is submitted by receipt generation.

Fixed an undefined `o` reference in the order-page clear handler. Added lifecycle tests for hidden-page receipt clearing and delayed responses. All 131 tests pass; public build remains 224 files with backend excluded. Local browser render was unavailable because the runtime browser executable is not installed; frontend lifecycle and receipt content were verified in automated tests.

## Neon receipt follow-up

Adapted the existing confirmed receipt to the user's cyan/violet and metallic-type reference using scoped CSS and live text. Added a prominent amount and payment/delivery badges. RA-funded orders explicitly show authorized supplier funds and quoted USD cost, never an invented MXN payment. Customer payments show the persisted paid amount. TXT export and print/PDF remain available. Printing uses a legible white background. New private fields clear when the session/page is hidden.

Files: product-payment.html, product-payment.js, purchase-receipt.css, scripts/build-pages.mjs and receipt view tests. No backend, payment execution, provider request, database, catalog or balance changes. Existing main efcfa40 is the rollback baseline. Automated suite baseline: 132 passing; added one passing payment/amount/privacy regression test. Public build includes the stylesheet and excludes backend files. Mobile/desktop browser visual inspection remains pending: Chromium is absent and its download failed in this environment. This branch is prepared for review, not deployed.
