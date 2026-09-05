# App Register

| App | Feature | Why Needed | Free? | Performance Impact | SEO Impact | Alternative |
|---|---|---|---|---|---|---|
| Judge.me | Reviews (collection layer only) | Collects review-request emails, verified-purchase badges, and photo/video from real customers off-storefront. The theme never renders Judge.me's widget — the merchant transcribes chosen reviews into the `artwistic_review` metaobject, which is what actually renders. See [FEATURE_REGISTER.md](FEATURE_REGISTER.md) and [docs/METAOBJECTS.md](METAOBJECTS.md). | Yes (free plan covers review collection, verified-purchase badges, and photo/video) | None — its script/CSS is never added to the theme, so it adds zero storefront weight | None — no third-party schema/script touches the storefront | Any other review-collection tool/process would work equally well; Judge.me is recommended for its free photo/video support and verified-purchase detection, not because the theme depends on its specific data format. |

**Every other feature in this build requires no app.** Wishlist and Recently Viewed use guest `localStorage` (see [ARTWISTIC_CHANGELOG.md](../ARTWISTIC_CHANGELOG.md)) rather than the Customer Account API, since cross-device persistence was not a stated requirement. The Instagram/UGC photo strip (`sections/artwistic-social-proof.liquid`) deliberately does **not** use a live Instagram embed/API either — a live embed app was considered and rejected in favor of the same manually-curated-metaobject architecture used for Reviews, so the storefront never loads a third-party widget and every photo shown is one the merchant explicitly chose to feature.

## Backlog features and likely app needs (for future reference)

| Backlog feature | Likely need an app? | Notes |
|---|---|---|

None currently backlogged require an app. Build Your Stack was buildable with theme sections + `/cart/add.js`; no app needed.

No paid app is recommended anywhere in this register. If a future feature genuinely requires one, it will be added to the table above with full justification before being adopted, per the project's app-avoidance principle (spec section 67).
