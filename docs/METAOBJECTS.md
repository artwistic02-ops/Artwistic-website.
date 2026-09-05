# Metaobject Register

## `artwistic_menu_promo`

**Purpose:** lets a merchant attach an editorial promo tile (image + copy + link) to a column of the mega menu, without editing theme code, e.g. "New: The Layering Edit" inside the Necklaces menu column.

**Used by:** Premium Header & Mega Menu (`sections/artwistic-mega-menu.liquid`).

### Fields

| Field name | Key | Type | Validation | Required | Purpose | Example |
|---|---|---|---|---|---|---|
| Title | `title` | Single line text | Max 60 chars | Yes | Tile heading | `New: The Layering Edit` |
| Subtitle | `subtitle` | Single line text | Max 100 chars | No | Supporting line | `5 pieces designed to stack` |
| Image | `image` | File (image) | — | Yes | Tile image, 4:5 recommended | — |
| Link | `link` | URL | — | Yes | Where the tile links to | `/collections/layering-edit` |
| Menu handle | `menu_handle` | Single line text | — | Yes | Which menu item this tile attaches to — must match the exact handle of the top-level menu link it belongs under | `necklaces` |

### Admin setup steps

1. Open **Shopify Admin**.
2. Go to **Settings → Custom data → Metaobjects**.
3. Click **Add definition**.
4. **Name:** `Menu Promo Tile` (this generates the type `artwistic_menu_promo` — click into the type field to confirm/set it explicitly).
5. Add each field above with the exact **Key**, **Type**, and validation listed.
6. Click **Save**.
7. Go to **Content → Metaobjects → Menu Promo Tile → Add entry**.
8. Fill in Title, Subtitle, Image, Link, and Menu handle (must exactly match the handle of the top-level menu item you want the promo to appear under — see step 9 in [SHOPIFY_CONFIGURATION.md](SHOPIFY_CONFIGURATION.md) for how menu handles are set).
9. Save.
10. In **Online Store → Themes → Customize**, open the header section and confirm the promo tile appears in the corresponding mega menu column. If it does not appear, double check the `menu_handle` value matches exactly (case-sensitive).

### Notes

- If no `artwistic_menu_promo` entry exists for a given menu handle, that mega menu column simply renders without a promo tile — this is a graceful, no-error fallback, not a broken state.
- One promo tile per top-level menu item is supported in this build. Supporting more than one is a backlog item (see [FEATURE_REGISTER.md](FEATURE_REGISTER.md)) — document here if extended.

---

## `artwistic_look_hotspot`

**Purpose:** one clickable point on a Shop the Look image, linking to the product shown at that spot.

**Used by:** Shop the Look (`sections/artwistic-shop-the-look.liquid`), always referenced from an `artwistic_look` entry — not used standalone.

### Fields

| Field name | Key | Type | Validation | Required | Purpose | Example |
|---|---|---|---|---|---|---|
| Horizontal position | `x_position` | Decimal | 0–100 | Yes | Hotspot's horizontal position as a percentage of the image width, left to right | `62.5` |
| Vertical position | `y_position` | Decimal | 0–100 | Yes | Hotspot's vertical position as a percentage of the image height, top to bottom | `34` |
| Product | `product` | Product reference | — | Yes | The product this hotspot links to | — |

### Admin setup steps

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**.
2. **Name:** `Look Hotspot` (generates type `artwistic_look_hotspot` — confirm the type explicitly).
3. Add the three fields above with the exact keys/types/validation shown.
4. Save.

You won't add entries here directly in most cases — hotspots are created inline while building an `artwistic_look` entry (see below), since Shopify's metaobject editor lets you create a referenced entry on the fly from within the list-of-metaobjects field.

### Notes

- Getting a hotspot's exact `x_position`/`y_position` is trial and error: save the parent Look, preview it in the Theme Editor, and nudge the numbers until the dot sits where you want it. There's no visual picker for this in Admin.

---

## `artwistic_look`

**Purpose:** one "Shop the Look" scene — a styled photo with one or more hotspots, each linking a product, so a shopper can shop everything visible in the image (spec section 35).

**Used by:** Shop the Look (`sections/artwistic-shop-the-look.liquid`), picked per section block via a metaobject setting. Also used by the "Complete the Look" product-page cross-link (`snippets/artwistic-complete-the-look.liquid`) — see [the Storefront pages section below](#enabling-storefront-pages-for-artwistic_look-for-featured-in-links) for the extra one-time setup that link needs.

### Fields

| Field name | Key | Type | Validation | Required | Purpose | Example |
|---|---|---|---|---|---|---|
| Title | `title` | Single line text | Max 60 chars | Yes | Look name shown on the section | `The Golden Hour Stack` |
| Subtitle | `subtitle` | Single line text | Max 120 chars | No | Supporting line | `Layered for evening` |
| Image | `image` | File (image) | — | Yes | The styled scene photo hotspots are positioned over | — |
| Hotspots | `hotspots` | List of metaobjects | Metaobject type: `artwistic_look_hotspot` | Yes | The clickable points on the image | 2–4 hotspots |

### Admin setup steps

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**.
2. **Name:** `Shop the Look` (generates type `artwistic_look` — confirm the type explicitly).
3. Add `title`, `subtitle`, `image` as above.
4. Add the `hotspots` field: type **List of metaobjects**, and set its metaobject type to `Look Hotspot` (the definition created above — create `Look Hotspot` first if it doesn't exist yet).
5. Save.
6. Go to **Content → Metaobjects → Shop the Look → Add entry**.
7. Fill in Title, Subtitle, and Image.
8. In the Hotspots field, click **Add**, then either pick an existing Look Hotspot entry or create a new one inline: set its horizontal/vertical position and pick the Product it should link to. Repeat for each point on the image you want clickable.
9. Save.
10. In **Online Store → Themes → Customize**, add a "Shop the Look" section to the homepage (or wherever), add a block, and pick this Look entry from the block's metaobject setting.

### Notes

- If a Look entry has no hotspots, the section renders the image with no clickable points — no error.
- If a hotspot's linked product is unavailable/deleted, that hotspot is skipped silently rather than linking to a broken page.

---

## `artwistic_review`

**Purpose:** a single curated, verified customer review — for the homepage reviews section and/or a specific product's review list. Reviews are entered by the merchant, not synced live from any app: a review app (e.g. Judge.me, free plan) is used to *collect and verify* reviews off-storefront, and the merchant transcribes the ones they choose to feature into this metaobject, faithfully copying the real rating and review text. This is a deliberate architecture choice — see [FEATURE_REGISTER.md](FEATURE_REGISTER.md) and [ARTWISTIC_CHANGELOG.md](../ARTWISTIC_CHANGELOG.md) for why — so the storefront never loads a third-party review widget's script/CSS/branding, and the merchant has full, explicit control over which reviews (especially photo/video ones) go live.

**Used by:** `sections/artwistic-reviews.liquid` (homepage, curated via blocks) and `snippets/artwistic-product-reviews.liquid` (product page, auto-scoped via the `product` field).

### Fields

| Field name | Key | Type | Validation | Required | Purpose | Example |
|---|---|---|---|---|---|---|
| Reviewer name | `reviewer_name` | Single line text | Max 60 chars | Yes | Displayed name | `Ananya R.` |
| Rating | `rating` | Integer | Min 1, Max 5 | Yes | Must exactly match the real rating the reviewer gave — never rounded up/invented | `5` |
| Review text | `review_text` | Multi-line text | Max 600 chars | Yes | The review itself, copied verbatim (light typo fixes only) | `Wear this every day, hasn't tarnished once.` |
| Verified purchase | `verified_purchase` | True or false | — | Yes | Only check this if the source app actually marked it verified — never set true on an unverified review | `true` |
| Photos | `photos` | List of files | Images only | No | One or more customer photos, supports multiple | — |
| Video | `video` | File | Video only | No | One customer video, if the merchant chooses to feature it | — |
| Product | `product` | Product reference | — | No | Scopes this review to a specific product's page. Leave blank for a general/brand review usable only on the homepage | — |
| Reviewed on | `reviewed_date` | Date | — | No | Shown as "Reviewed on ..." if set | `2026-07-14` |
| Source note | `source_note` | Single line text | — | No | Internal-only note on where this came from (e.g. "Judge.me #4021") — never rendered on the storefront, just for the merchant's own reference | `Judge.me` |

### Admin setup steps

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**.
2. **Name:** `Review` (generates type `artwistic_review` — confirm the type explicitly).
3. Add each field above with the exact **Key**, **Type**, and validation listed.
4. Save.
5. Go to **Content → Metaobjects → Review → Add entry** for each review you want to feature.
6. Fill in the reviewer name, the **exact** rating and text as given (see the collection workflow below for where this comes from), whether it was verified, and optionally attach photos/video and link it to a product.
7. Save.
8. To feature it on the homepage: see [SHOPIFY_ADMIN_SETUP.md](SHOPIFY_ADMIN_SETUP.md#feature-reviews) — add a block to the "ARTWISTIC: Reviews" homepage section and pick this entry.
9. To show it on a product page: just set the entry's **Product** field — it appears automatically, no separate block/step needed.

### Collection workflow (how a review gets here)

1. A review app (Judge.me recommended, free plan — handles review-request emails, verified-purchase badges, and photo/video collection) collects real reviews off-storefront.
2. In the app's own dashboard, the merchant reads incoming reviews and decides which to feature.
3. For each one chosen, the merchant creates an `artwistic_review` entry here, copying the rating and text faithfully and re-uploading any photo/video they want to keep.
4. The review app's widget is never installed on the storefront — this metaobject is the only thing that renders.

### Notes

- A review with no `product` set only ever appears on the homepage (if featured via a block) — it will not appear on any product page.
- A review with a `product` set appears automatically on that product's page; it does not need to also be added as a homepage block (though it can be, for both).
- Ratings shown in aggregate (e.g. "4.8 · 32 reviews") on a product page are computed live from that product's `artwistic_review` entries — never from a separate, potentially-inconsistent source.

---

## `artwistic_social_post`

**Purpose:** one manually-curated Instagram/UGC photo for the Social Proof section — same architecture reasoning as `artwistic_review`: the merchant uploads a real photo from their real Instagram account rather than a live third-party embed, so nothing is fabricated and no third-party widget/script ever loads on the storefront.

**Used by:** `sections/artwistic-social-proof.liquid`, picked per block (same block-per-metaobject pattern as Shop the Look and Reviews).

### Fields

| Field name | Key | Type | Validation | Required | Purpose | Example |
|---|---|---|---|---|---|---|
| Image | `image` | File (image) | — | Yes | The photo itself | — |
| Instagram URL | `instagram_url` | URL | — | No | Links out to the real post on Instagram | `https://instagram.com/p/...` |
| Featured product | `featured_product` | Product reference | — | No | Shows a small product tag on the photo | — |

### Admin setup steps

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**.
2. **Name:** `Social Post` (confirm the generated type is `artwistic_social_post`).
3. Add the three fields above.
4. Save.
5. Go to **Content → Metaobjects → Social Post → Add entry** for each photo, uploading the real image and optionally linking the real Instagram post URL and a featured product.
6. Add a "ARTWISTIC: Social proof" section (homepage or elsewhere), add a block per photo, and pick the entry.

### Notes

- Only use photos you have the right to display (your own posts, or reposts with permission).
- No live Instagram API connection exists or is needed — a photo won't update if the original Instagram post is deleted; refresh it manually here if that happens.

---

## Enabling storefront pages for `artwistic_look` (for "Featured in" links)

`snippets/artwistic-complete-the-look.liquid` links a product to the Shop the Look scene it's featured in. For that link to go somewhere real (not a dead anchor), the `artwistic_look` metaobject definition needs **Storefront pages** enabled:

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Shop the Look** (the `artwistic_look` definition created earlier).
2. Find the **Storefront pages** setting and enable it.
3. Save. Shopify will auto-generate a URL for every existing and future `artwistic_look` entry.
4. The theme already ships the page template (`templates/metaobject.artwistic_look.json`) and its rendering section (`sections/metaobject-artwistic-look.liquid`) — no further setup needed; each look's page reuses the exact same hotspot rendering as the homepage Shop the Look rail.

## Status

No other metaobjects are required by shipped ARTWISTIC features yet.
