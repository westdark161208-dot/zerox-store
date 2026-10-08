# Discount codes / 2026-10-08

- Continues PR32 without changing catalog prices or adding Mercado Pago surcharges.
- Founder-only Control creator: generated ZX code, integer percentage 1–99, future expiry, list and disable. Idempotent creation. Expiry stored UTC and entered/displayed in device timezone.
- Shared server validation and integer-cent discount in service, diamond and promotion checkout. Price evidence/ledger use net retail amount; quantities/provider costs unchanged. One code, non-stackable, no redemption count limit until expiry. Existing orders keep their original price when a code expires or is disabled.
- Supplier funds and wallet funding excluded. Public store manual request form validates code but remains an unpaid manual request (not converted into automatic fulfillment).
- Coupons saved in diamond snapshot, service plan retailPricing, or atomic bundle discount record. Client cannot choose discount percent or lower the trusted total. Reusing request key with a different code is rejected.
- 181 automated tests passed; public build 256 files. No real charge, wallet debit or supplier order executed for testing.
- Prior live review confirmed normal Booyah association: Sixofire 76828 / Pase Booya; saved comparison now five associated products. RA last observed balance 1.5202 USD remains below large-package requirements. No claim of successful end-to-end live MP payment.
- Latest browser session requires founder sign-in again; credentials must use browserAuth, never chat.
