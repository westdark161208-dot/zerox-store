# Wallet and account continuity — 2026-10-08 UTC

- Wallet funding minimum is 20 MXN. Existing balance is not capped at 200; reseller activation remains 200 MXN. Funding operation limit is 100,000 MXN, matching the existing funding-intent validation; accumulated wallet balance remains separately tracked.
- Public diamond checkout and readiness now agree with the published catalog price ceiling; former 10,000 MXN checkout ceiling incorrectly excluded the largest catalog package. Provider funds/region/exact recipe checks remain mandatory.
- Footer Portal Resellers uses the existing reseller view, with no public Control link.
- Creator can filter 30-day inactivity, delete (reversible closure) or restore accounts. Confirmation requires username and checkbox. Founder self-removal is blocked; balance/pending work prevents closure. Sessions are revoked; financial records retained. Activity tracking starts with this release and does not fabricate historic activity.
- Dedicated wallet payment page uses public wallet availability and redirects directly to MP; manual OXXO remains in store wallet.
- Commission surcharge is NOT enabled. User supplied 3.49% + 4 MXN; Profeco says card surcharges violate LFPC. A change to published prices needs a separate agreed pricing decision. No fees silently applied.
- Validation: 176 Node tests passed, Pages build passed. No live purchase, wallet debit, customer deletion, or surcharge executed.
- Remaining: verify whether Sixofire Booya association saved (last UI save outcome was interrupted); confirm live checkout and delivery without assuming completed purchase. Last RA provider balance 1.5202 USD is insufficient for large orders. Current browser lost founder session after interruption.
