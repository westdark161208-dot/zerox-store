# Resellers catalogue upgrade — not deployed

Parent: 435e268e060e7c8643d6ec25f1e080992e65a736. Production at preparation: Worker 94a86f8e-97a8-4b82-acaf-3e3efa50f5e1, Pages 19845b08-7381-4df4-9dce-9a17c4b4be52.

Implemented:
- Collapsible search/category/tier controls, horizontally selectable sections and compact gamer cards.
- Own stored profile avatar, including the main store's supported raster data URLs.
- Remove obsolete combo-* catalogue entries; retain six published packs, historical orders, recipes and financial records.
- Resellers-owned manual checkout for priced products, explicit manual fulfilment consent, immutable reseller ledger and server prices. Free Fire checks reuse the existing diamond verifier before debit; client also previews the ID. Existing legacy resale items keep their existing verifier.
- Main-store ID promotions are not transferred to independent manual checkout. They stay unavailable in the portal, preserving their eligibility restrictions.
- Seven per-section percentage discounts use source level-1 prices, do not compound, and only change the reseller draft. Preview before publication.
- Founder-only full RA catalogue importer uses existing private read binding, explicit MXN/USD rate and markup, stable IDs, new editable custom blocks/products. Never replaces existing founder edits or publishes automatically. Costs and private credentials are not exposed in the public catalogue. Additional imports skip existing IDs. Unclassified names go into Recargas América · Otros for founder categorization.
- Main catalogue reseller tiles removed; footer/drawer access retained.

User selected manual fulfilment and WhatsApp Business. Numerical RA exchange rate/markup and Umy number/Meta registration still pending. Umy is NOT connected. Do not migrate/delete the WhatsApp Business account without determining the supported onboarding path.

Verification: 335 Node tests passed before final small edits; updated focused tests (14) passed after them. Existing standalone reseller tests passed. Local Chromium download failed; new browser checks and worker bundling must run on Oracle using the already installed tools. Local scratch lacks binary assets; its 86-file dist MUST NOT be deployed. Oracle full repository must build the complete release.

Use scripts/verify-resellers-pro.mjs on an isolated Oracle worktree with ZEROX_PLAYWRIGHT_MODULE and PLAYWRIGHT_BROWSERS_PATH configured. No production payment tests. Before deployment compare remote bundle and preserve active configuration as in prior release. Record new rollback points for BOTH Pages and Worker. Do not use a D1 restore for rollback.
