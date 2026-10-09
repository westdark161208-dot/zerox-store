# Published retail pricing

The owner requested recovery of Mercado Pago processing costs before expanding games.
Base editor values and historical orders are unchanged. New retail quotes publish a single
all-method price: ceil((base + 400 cents * 1.16) / (1 - .0349 * 1.16)).
This is a merchant pricing reference, not a statement of actual processor deductions.
Reference: owner's 3.49% + MXN 4 screenshot; IVA on processing at 16%.
No additional method-specific surcharge; wallet funding and supplier-cost purchases unchanged.
Retail coupons discount the published price. Quantity products gross up the whole package once.
Examples: base MXN 18 -> 23.60; 35 -> 41.32; 70 -> 77.79.
Frontend cards, cart, checkout, promotions and backend diamond/service/promotion orders agree.
Editor labels base price and previews resulting public price. Historical order retries retain snapshots.
Existing automated tests updated to the new actual payment amounts, preserving checks for wrong
amounts, duplicate debits, uncertain deliveries and immutable coupons. New tests cover arithmetic,
quantity pricing and unchanged editable values. This does not assert an actual paid live transaction.

Next: new games returned by RA need editable retail prices before accepting customer payments.
Arena Breakout catalog does not explicitly identify Infinite; do not assume platform equivalence.
