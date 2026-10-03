# Zero’X Editor: diamond catalog increment

The founder opens the visual editor from the existing profile, next to the creator panel. This increment supports the 50 unlimited diamond packages: visible name, character label, MXN price, description, image (existing asset or authenticated R2 upload) and availability. Quantities/IDs and provider recipes remain fixed. Other sections, banner editing, delegated roles and Control are not completed by this increment.

Drafts are stored server-side and previewed on the actual storefront; cart actions are blocked while editing. Publishing explicitly confirms the complete saved draft. D1 compare-and-swap revisions reject stale editors; an atomic publish records the author and full published snapshot in zx_store_editor_history. Private responses are no-store. The public endpoint returns only published overrides. Identity is resolved by the Worker; only an active founder can edit or publish.

Prices are integer cents validated on the server. Mercado Pago TEST and diamond draft orders read published prices and reject unavailable products. Existing order retries keep their original price snapshot. Production payments remain disabled as before. Reseller tier prices are a separate catalog and are not changed by this editor.

New additive D1 tables initialize on first access: zx_store_editor, zx_store_editor_history. No keys or provider activation is required for editing. Rollback code to the preceding commit to use the static catalog; retain the tables for recovery.

Validated: draft privacy, non-founder rejection, conflicting revisions, unsafe URLs, integer cents, availability, published prices, historical order snapshots, diamond engine regression and Mercado Pago evidence checks. Browser rendering was not verified in the local environment (no Chromium executable available).

18,480 character confirmed by the owner: Aira Shiratori (Dandadan).


## Storewide expansion — scope correction
The editor now includes all statically defined products (first-ID diamonds, unlimited packages, passes, fragments, boxes, likes and legacy catalog items), managed accounts/clans/honor/streaming products and existing ads. It also exposes fixed commercial content targets for hero text/background, section cards, Free Fire subsection cards, guide copy and footer branding. The same image upload and preview is available across item types.

A target selector provides access to hidden items; selection mode on page content is separate from navigation. Category/region fields are commercial labels, not delivery routing. Provider routing and secrets remain outside this visual editor until the provider integration/step-up phase. Stock, fulfillment recipes and financial destinations are not editable here. Existing managed records publish atomically with editor history and revision checks, preserving stock. Creating new managed products still uses the existing creator panel.

Outstanding specification items: delegated editor roles, provider association with step-up, adding/deleting elements and full real-device UI verification. These are not represented as completed by this expansion.
