# Founder supplier funds

Founder-only RA/SF indicators now appear below the normal wallet in the private account profile. RA reads current provider funds; the MXN estimate uses the owner's internal 16.99 rate. SF remains BALANCE_CONTRACT_PENDING: screenshot 833466 shows 21.62 MXN / 1.19 USD available and a separate pending 10 USD payment, but is not an API balance contract. No snapshot credit or pending credit is created.

Founder diamond checkout adds Saldo RA. POST /api/diamonds/purchase/supplier/quote checks published product, verified UID/region, exact live catalog recipe and current provider balance without buying. A second explicit confirmation calls supplier/buy with a UUID key and maximum USD micro cost. Price increases or insufficient balance block before funding. Only the active founder can use these endpoints, with existing delivery flags enabled and a retail pilot maximum of 200 MXN.

Owner-provider orders retain retail reference price, freeze USD fulfillment cost and record zero customer revenue with payment method ra-funds. They consume actual RA funds directly, never credit/debit the internal customer wallet and never call Mercado Pago. MP evidence cannot pay such orders; wallet/checkout cannot switch their billing mode. Frozen cost/region are checked during recovery after an interrupted funding write. Persisted keys and provider operation claims prevent duplicate purchases; unknown provider responses remain under review and are not automatically resent.

Real production delivery still needs the founder to select product and UID, consult cost, and explicitly confirm. No real supplier buy was submitted during implementation. SF-funded buying awaits a documented monetary wallet endpoint. Public customer product payments remain outside the founder pilot.

Validation: 127 tests pass; public build contains 224 files and excludes backend/config/docs/tests.
