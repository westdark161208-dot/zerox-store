# Compact storefront and manual transfers — 12 October 2026

- Main purchase guide is collapsed by default with an accessible native details/summary control. Free Fire guide also collapses.
- Streaming opens its own availability/contact dialog, without a player ID. This retains manual fulfillment; it does not claim automated streaming payments are integrated.
- Purchase notices use content-sized widths and preserve the continuous linear sweep and neon frame.
- Section cards gain cyan/violet/green outlines. Removed the original oversized middle Zerito placeholder; retained the published custom bottom block.
- Editor selection starts enabled. Tapping built-in/custom section cards or products opens editing/removal; the same dialog can add a block or open the section. Server authorization, draft/revision and publication remain intact.
- OXXO and manual transfer have separate image buttons. Transfer opens WhatsApp instructions and receipt submission. It does not automatically send a receipt or credit balance.
- Founder Control supports transfer credits with required bank tracking reference, confirmation, audit and idempotency. Existing adjustment amount limits remain unchanged.
- The V3 handoff explicitly leaves bank ownership/current account details unconfirmed. Until the owner confirms the account ending 8570 and Alexander Hernández, the public modal requests current bank details through the existing official WhatsApp. Do not invent confirmation.

Validation: 40 automated tests passed (public commerce, product purchases, editor), including a new test of founder-only manual transfer credit, duplicate reference rejection, retries and debit prohibition. JS syntax and diff whitespace checks passed. Local visual browser test could not run: no browser executable; browser download returned an invalid archive. No real payment or manual balance mutation performed.

Pending: production Mercado Pago CHECKOUT_RECONCILIATION_REQUIRED still needs the actual upstream rejection/log evidence. Do not reset uncertain attempts or report this as fixed. Bank details confirmation and a mobile visual review remain pending.
