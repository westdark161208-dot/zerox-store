# RA automatic reseller checkout — implementation status

This is preparatory code, not an enabled production checkout.

Implemented and tested:
- Oracle catalogue adapter consumes the supplied Postman contract, including error responses with order references, asynchronous status polling and different delivery shapes.
- Durable journal prevents repeated purchase submission after concurrent requests, restart or lost response. Unknown outcomes are not automatically retried.
- Internal D1 reservation/dispatch/reconciliation module debits the existing reseller ledger atomically. Access/tier and balance are checked at reservation. Only an explicit NOT_SUBMITTED result from the private service can trigger an automatic refund, once.
- Signed Oracle handler, bounded requests, replay checks and loopback server on port 8791. Installation is disabled by default and contains no provider credentials.

Not connected yet:
- Cloudflare private service bridge for /v1/catalog routes and confidential credentials.
- Published local product to stable RA ID/SKU mapping, authoritative quotes, catalogue field_options semantics and verified Free Fire combination recipes.
- Authenticated HTTP checkout/history/delivery endpoints and portal UI. The internal ledger module must never accept client-provided quotes/prices/plans.
- Delivery credential encryption at rest, authorized delivery access and retention policy before PIN/streaming activation.
- Production activation/verification. First-time-ID products remain excluded.

Limits:
- Exactly one unit per order, including PIN; bulk PIN requests are intentionally not supported yet.
- Products with nonempty field_options are blocked until their actual schema is verified.
- A missing region is not inferred from account_name. The supplied RA validation example does not document a region field.
- Unknown, partial or provider-refunded outcomes retain the reservation for reconciliation; they do not imply a customer refund.
- Existing manual order routes remain unchanged until the new checkout is integrated.

The installer only adds zerox-ra-catalog.service and /home/opc/zerox-ra-catalog-private. It does not edit existing gateway services, Cloudflare bindings, the production database or provider flags.
