# Zero'X Resellers Portal V2 — release record

Status: implemented on an isolated branch, not deployed to production.
Base: main 4055189b31ee2440e77836a2e8e09b2bdfa61715.
Branch: codex/resellers-portal-v2-20261025.

## Scope

Existing storefront portal, accounts, authentication, independent reseller ledger,
manual fulfillment and seven commercial levels retained. Added four tabs, real balance,
request states and history, founder review/search, official deposit instructions,
12 CSS color variables, HEX/native palette/HSL controls, five presets and glow levels,
D1 draft/publication/version history, restore published appearance to draft,
15 image slots with upload/gallery/removal/replacement/crop/overlay controls.
Original reference is assets/resellers-reference.png. Colors never rewrite this image.
Image removal detaches a slot; original assets and historical versions are retained.
No invented banking instructions, commissions, sales or balances.

Unchanged: six base diamond packages, discounts/progression, provider modules,
FF110, payment engine, Worker routing/authentication, wrangler production settings.
No changes to Smart Recipes or other branches. Only the reseller modules, Control,
portal markup, build allowlist, PWA cache version and tests are modified.

## Access and publication blockers

No CLOUDFLARE_API_TOKEN or Wrangler OAuth session is configured in the execution
session. No Cloudflare connector was available in the plugin search. GitHub access
is separate from Cloudflare access and does not establish deployment rights.

Required: authorized Cloudflare access scoped to the existing account and resources:
Workers Scripts edit/read, Pages edit/read, D1 edit/read (backup/schema inspection),
R2 object read/write for the existing MEDIA bucket. Use the provider's secure login
or secrets configuration; do not paste tokens into the repository or chat.

The currently deployed Worker source/version/settings must be downloaded and
compared before deployment. The remembered a4aeddb3 version has NOT been independently
verified in this run. main's wrangler.jsonc has commerce flags enabled; DO NOT deploy
that configuration to production merely because the new modules passed local tests.
Preserve current bindings, secrets, vars, cron triggers, routes and provider gates.
If the deployed backend differs from this base, port ONLY the reseller module changes
onto its verified source in an isolated release checkout; do not replace the full
Worker with main or merge the pilot/Smart Recipes branch.

The public Pages URL https://zerox-store.pages.dev/ returned HTTP 200 and its existing
resellers.js matched the base commit byte-for-byte before modifications. This proves
only that public asset, not the complete deployed frontend or backend version.

## Reproducible verification

Node 24:

```sh
node --test tests/*.test.mjs
node cloudflare/resellers.test.mjs
node scripts/build-pages.mjs
```

Local test tooling installed outside the repository:

- esbuild: bundle cloudflare/worker.js with platform browser / ESM; no upload.
- miniflare 5.20261019.2-beta with workerd 1.20261019.1:
  `QA_NODE_MODULES=/path/to/node_modules node tests/resellers-d1-local.mjs`
  (CF metadata fetch is explicitly disabled, local DB and R2 only).
- Playwright with local Chromium: set CODEX_PRIMARY_RUNTIME_NODE_MODULES to the
  Playwright module directory and QA_CHROMIUM to a Chromium executable, then run
  `node tests/resellers-browser.mjs`.

The browser harness uses actual portal/editor markup and scripts with a local-only
backend and test identity. It verifies a 393px touch viewport, no horizontal overflow,
request submission, pending state, manual founder approval, color publication,
image upload/select/remove, Novato access, category filtering and checkout opening.
It does not log in to a production account or certify a physical Android device.
Existing authentication regression tests run in the normal suite.

## Safe release procedure (requires authorized Cloudflare access)

1. Capture current Pages deployment ID, Worker version ID/source/metadata and active
   binding/flag inventory. Download a D1 export and record the restore point. Keep
   backups private; they can contain personal/financial data.
2. Verify production source compatibility as described above. Review the narrow diff.
3. Run all checks on that exact source. Use an independent QA D1 database and R2 bucket.
   No remote QA binding may point at production. Do not use live deposits or providers.
4. Inspect existing reseller tables. New V2 tables are additive and initialized with
   CREATE TABLE IF NOT EXISTS. No old table or ledger row is deleted/rebuilt.
   The existing order-plan compatibility ALTER is retained, not newly introduced.
5. Deploy the verified backend with its preserved effective configuration FIRST.
   Confirm unauthorized admin requests are denied, public appearance is visual-only,
   and existing request/ledger read paths remain compatible.
6. Build frontend with `node scripts/build-pages.mjs`. Publish ONLY dist/ to the
   existing Pages project using its authorized deployment process. Do not publish
   repository root or backend/test/documentation files. Do not merge unrelated work.
7. Confirm the new service-worker cache key `zerox-store-v23-resellers-v2` and changed
   script URLs. Test refresh and an upgrade from the previous installed PWA.
8. Verify the public portal on Android and a founder session on Control, including
   draft isolation, appearance publication/restoration and an uploaded image.
   Use QA for credits; production verification must not create fake money entries.
9. Compare provider/payment flags/bindings and six base package hashes to the backup.
   Record Worker version ID, Pages deployment ID, URLs and verification time here.

## Rollback

- First roll back the Pages deployment to the recorded previous deployment, then
  revert the Worker to the recorded previous version if necessary.
- Do NOT restore an old D1 snapshot over new financial activity. Additive V2 tables
  can remain unused by the old code. Keep all ledgers/topups/orders unchanged.
- Appearance-only rollback: RESTORE LAST PUBLISHED TO DRAFT discards an unpublished
  draft. For an earlier published design, retrieve its stored version and explicitly
  save/publish it through a validated founder workflow. No financial data is involved.
- Images are immutable objects; detaching them never deletes financial history.

## Current limits

- Production deployment/version verification and physical Android check remain pending.
- Admin screens show latest 200 requests/members; user views retain existing bounded
  history (30 orders/movements, 20 deposits). Records are not deleted.
- No commissions view because no approved accounting formula/data source exists.
- Streaming is omitted because the existing reseller backend has no streaming SKU.
- ID coverage remains BR/SG/IND; fulfillment remains the preexisting manual process.
- Media validates format signature, dimensions and size on server; browser additionally
  decodes uploaded files before transfer. Maximum 4 MB, 4096 px/side, 12 megapixels.
