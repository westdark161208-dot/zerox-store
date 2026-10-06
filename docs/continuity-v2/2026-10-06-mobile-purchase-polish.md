# Mobile purchase refinements

- Activity rotates actual completed purchases every four seconds, retaining actual dates. Uses account username, not display name/email/player ID. Public profile avatars render; private avatars remain hidden with initials fallback. Mute, dialog and background pause preserved.
- Unlimited checkout adopts dark/red checkout style and existing payment tiles. Verification remains a separate dialog; confirmed identity renders compact banner/avatar/name/UID. Existing payment consent, idempotency, and receipt polling unchanged.
- Receipt screen removes duplicated total and region/delivered rows, shrinks typography/spacing/emblem, and fits typical mobile viewports. Full text download retains all receipt fields. Tiny screens/accessibility zoom retain scroll fallback.
- Footer links: Referencias, Pedidos, Soporte. Published carousel ads open dedicated promotions modal, excluded from catalog. Orders for promotions start as a WhatsApp inquiry; no unverified bundle price or automatic delivery is invented.
- Zerito Bot catalog tile prepared as disabled Próximamente. Channel invitation is dormant until owner supplies actual channel URL/artwork; window.ZX_WHATSAPP_CHANNEL controls activation.
- Validation: 144 tests, public build, syntax/diff checks. No interactive browser QA available. Both Worker and Pages require deployment.
