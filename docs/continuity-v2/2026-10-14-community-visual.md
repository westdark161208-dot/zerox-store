# Community cards and compact profile

Adapted the supplied 932838.mp4 reference with black/violet cards, subtle controls and tighter profile spacing. Existing account functions and founder styling remain.

- New homepage-bottom purchase cards use the existing completed/paid public activity feed, with avatar visibility preserved by the server. No seeded/fake purchases.
- Product artwork is resolved from an exact local product/diamond match when possible; otherwise a product icon. No internal order/player IDs added.
- Horizontal cards advance every five seconds while visible. Pause/previous/next controls, interaction pauses and reduced-motion support.
- IntersectionObserver suppresses floating notices while the section is visible. Queued notices resume afterwards. Muting notices does not prevent loading the lower cards.
- No checkout/payment/backend changes in this release.

Validation: syntax and diff checks; 13 existing history/community tests passed. Browser-based visual validation still unavailable locally. Production payments remain a separate unresolved validation task.
