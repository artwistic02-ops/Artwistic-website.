# ARTWISTIC Changelog

Every meaningful ARTWISTIC change to this theme is recorded here. See [DAWN_UPDATE_GUIDE.md](DAWN_UPDATE_GUIDE.md) for how this log is used when merging future Dawn updates, and [docs/FEATURE_REGISTER.md](docs/FEATURE_REGISTER.md) for the full feature-by-feature status.

---

## 2026-08-30 — Foundation layer

**Feature/change:** Established the isolated ARTWISTIC customization layer on top of the stock Dawn theme.

**Files added:**
- `assets/artwistic-global.css` — design tokens (color, type scale, spacing, radius, motion, z-index registry) and shared utility classes.
- `assets/artwistic-global.js` — shared helpers (`debounce`, `prefersReducedMotion`, `trapFocus`, `emit`) exposed as `window.Artwistic`.
- `.gitignore`
- `docs/*` (documentation skeleton — see individual files)

**Dawn files modified:**
- `layout/theme.liquid` — two one-line additions:
  1. `{{ 'artwistic-global.css' | asset_url | stylesheet_tag }}` immediately after Dawn's `base.css` tag.
  2. `<script src="{{ 'artwistic-global.js' | asset_url }}" defer="defer"></script>` immediately after Dawn's `global.js` tag.
  
  **Reason:** every ARTWISTIC feature depends on the design tokens and shared JS helpers being loaded theme-wide; there is no snippet/section hook that can inject into `<head>` or the global script list, so a direct (minimal, clearly commented) edit was unavoidable. Both additions are marked with `{%- comment -%} ARTWISTIC: ... {%- endcomment -%}` inline.
  
  **Reapplying after a Dawn update:** if a new Dawn version changes these two lines' surrounding context, re-add the same two lines immediately after Dawn's own `base.css` and `global.js` tags respectively. See [DAWN_UPDATE_GUIDE.md](DAWN_UPDATE_GUIDE.md).

**Reason:** protects Dawn core from having ARTWISTIC-specific rules/logic scattered through it, per the project's architecture rule (Dawn core → ARTWISTIC customization layer).

**Shopify dependencies:** none.
**Metafield dependencies:** none.
**Metaobject dependencies:** none.
**Admin setup requirements:** none.
**Migration notes:** none — additive only, no visual change yet (tokens are not consumed by any component until the flagship features below land).

---

## 2026-08-30 — Premium Header & Mega Menu

**Feature/change:** Layered editorial visual refinement, hover-intent opening, and a merchant-configurable promo tile onto Dawn's existing mega menu, instead of replacing it. Dawn's mega menu was already accessible (native `<details>/<summary>`, keyboard support via the `header-menu` custom element) and functionally complete, so per the modification rule (spec section 60) this is an extension, not a rewrite.

**Files added:**
- `assets/artwistic-header.css` — header chrome refinements (border color, logo spacing, scroll elevation).
- `assets/artwistic-mega-menu.css` — editorial menu-item styling, underline hover state, promo tile styling, promo-aware grid column.
- `assets/artwistic-mega-menu.js` — progressive-enhancement hover-intent open/close for pointer:fine desktop devices; native click/keyboard behavior is preserved as the fallback if this script fails to load.
- `snippets/artwistic-mega-menu-promo.liquid` — renders an optional editorial tile inside a mega menu column, sourced from the `artwistic_menu_promo` metaobject (see [docs/METAOBJECTS.md](docs/METAOBJECTS.md)).

**Dawn files modified:**
- `sections/header.liquid` — added two marked blocks: (1) `artwistic-header.css` link tag (loads unconditionally, small file); (2) `artwistic-mega-menu.css`/`.js` tags inside the existing `menu_type_desktop == 'mega'` conditional, so they never load when the merchant uses drawer/dropdown nav. Both marked with `{%- comment -%} ARTWISTIC: ... {%- endcomment -%}`.
- `snippets/header-mega-menu.liquid` — added: (1) a Liquid lookup for a matching `artwistic_menu_promo` metaobject entry by `menu_handle`; (2) a conditional `mega-menu__list--has-promo` class; (3) one extra `<li>` rendering the promo snippet after the stock child-link loop. **Reason this couldn't be a pure extension:** Dawn's mega menu snippet has no block/hook system for injecting extra list items, so the smallest safe change was a direct, clearly marked insertion inside the existing loop structure — no existing Dawn logic was altered, only added to.
  **Reapplying after a Dawn update:** search the new `header-mega-menu.liquid` for `ARTWISTIC:` and re-insert the same three blocks at the equivalent locations if Dawn's structure shifts.

**Reason:** sections 20–24 of the spec call the category/nav architecture a major differentiator; extending Dawn's already-solid, accessible mega menu with editorial promo tiles and hover-intent was higher-value than rebuilding navigation from scratch, and it keeps Dawn's accessibility guarantees intact.

**Shopify dependencies:** a configured navigation menu (Online Store → Navigation) assigned to the header section — see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Metafield dependencies:** none.

**Metaobject dependencies:** `artwistic_menu_promo` (optional) — see [docs/METAOBJECTS.md](docs/METAOBJECTS.md).

**Admin setup requirements:** menu configuration (required); promo tile metaobject entries (optional, per column). Full steps in [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Migration notes:** requires `section.settings.menu_type_desktop` set to `mega` in the Theme Editor for the promo tile and hover-intent behavior to activate (Dawn's dropdown/drawer nav types are unaffected and unmodified).

---

## 2026-08-30 — Product Page Trust & Gallery System

**Feature/change:** Added a metafield-driven material-transparency accordion, trust badges, gallery visual polish, and a mobile sticky Add to Cart bar to the product page. Dawn's media gallery already had swipe/zoom/keyboard support and a native `<details>` accordion pattern, so both were extended rather than replaced.

**Files added:**
- `assets/artwistic-product-gallery.css` — visual refinement of Dawn's stock gallery/thumbnail markup (no new JS — Dawn's `media-gallery.js` is reused unmodified).
- `assets/artwistic-trust.css` — styling for trust badges and the material-information definition list (the accordion shell reuses Dawn's `.product__accordion`/`.accordion` classes and native `<details>`, so no new accordion JS was written).
- `assets/artwistic-sticky-cart.css` / `assets/artwistic-sticky-cart.js` — the mobile sticky Add to Cart bar (spec section 36). Mirrors the real price block (`#price-{{ section.id }}`) and submit button (`#ProductSubmitButton-{{ section.id }}`) via `MutationObserver`, and its button triggers a `.click()` on the real submit button rather than reimplementing cart logic, so Dawn's variant validation and AJAX-cart handling apply unmodified.
- `snippets/artwistic-trust-signals.liquid` — trust badges (water resistant / anti-tarnish / warranty), each rendering only if the corresponding metafield has a value — no fabricated claims.
- `snippets/artwistic-product-information.liquid` — material/finish/plating/dimensions/weight/stones/closure/package-contents/care, from metafields.
- `snippets/artwistic-sticky-add-to-cart.liquid` — markup for the sticky bar.

**Dawn files modified:**
- `sections/main-product.liquid`:
  1. Added two stylesheet tags (`artwistic-trust.css`, `artwistic-product-gallery.css`) next to Dawn's own component CSS tags at the top of the section.
  2. Added a new block type `artwistic_trust` to the block `{%- case block.type -%}` switch (rendering the trust badges + material accordion) and to the section's `"blocks"` schema array — this makes it a normal, theme-editor-addable/removable/reorderable block like any stock Dawn block, per spec section 78.
  3. Added a new section-level checkbox setting `artwistic_sticky_add_to_cart` (default on) next to Dawn's existing `enable_sticky_info` setting.
  4. Added one conditional render call for `artwistic-sticky-add-to-cart` after Dawn's `product-media-modal` render, before the popup-modal loop.
  
  **Reason each was unavoidable as a direct edit:** Dawn's block schema and settings array live inside this one section file with no external extension point; a genuinely new block type and a genuinely new toggle both require editing this file's schema JSON. All four edits are marked `ARTWISTIC:` inline and are purely additive — no existing Dawn block/setting/logic was changed.
  **Reapplying after a Dawn update:** search `main-product.liquid` for `ARTWISTIC:` to find all four insertion points; re-add the same block/schema/render additions at the equivalent locations if Dawn's structure shifts.
- `templates/product.json` — added the `artwistic_trust` block (with default settings) to the `main` section's `blocks`/`block_order`, and set `artwistic_sticky_add_to_cart: true` in the section's settings, so the feature is visible out of the box on a fresh install rather than requiring merchant setup before it can be seen.

**Reason:** spec sections 26–34 identify the product page as the primary trust-building surface; sections 29/54 call for structured (not image-only) product data; section 36 explicitly calls for a sticky mobile Add to Cart bar, which Dawn does not ship.

**Shopify dependencies:** none required for the bar/gallery; the trust module needs a configured `artwistic_trust` block (present by default in `templates/product.json`).

**Metafield dependencies:** 12 product metafields under the `artwistic` namespace — see [docs/METAFIELDS.md](docs/METAFIELDS.md). All optional; each renders only if filled in.

**Metaobject dependencies:** none.

**Admin setup requirements:** metafield definitions + per-product values — see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Migration notes:** the feature degrades gracefully with zero metafields filled in (trust badges and the material accordion simply don't render); the sticky bar and gallery polish work regardless of metafield data.

---

## 2026-08-30 — Shop by Category (homepage)

**Feature/change:** New homepage section for visual category discovery (spec section 22) — merchant-configurable tiles with image, optional hover image, title, subtitle, link, and an optional live product count. Pure section/block configuration; no metafields or metaobjects required.

**Files added:**
- `sections/artwistic-shop-by-category.liquid` — new section, `category` block type, configurable columns (desktop/mobile) and aspect ratio.
- `assets/artwistic-shop-by-category.css` — tile grid, hover-image crossfade (respects `prefers-reduced-motion`).

**Dawn files modified:**
- `templates/index.json` — added an instance of the new section (4 example category tiles) between the hero and featured collection, so the homepage isn't empty on first install.

**Reason:** spec section 22 calls Shop by Category a major differentiator; this is a wholly new section (Dawn's own `collection-list` section was not extended, since the hover-image/subtitle/count requirements and layout control go beyond what it offers) added without touching any existing Dawn file's logic — only the homepage's JSON template composition.

**Shopify dependencies:** none required to render (falls back to a placeholder block per tile with no image); optionally, a linked collection per tile if "Show product count" is enabled.

**Metafield/metaobject dependencies:** none.

**Admin setup requirements:** none beyond normal Theme Editor block configuration — add/edit/reorder category tiles from Customize → Shop by Category.

---

## 2026-08-30 — Wishlist

**Feature/change:** Native guest wishlist (spec section 41) — heart toggle on every product card and the product page, a header entry point with a live count bubble, and a dedicated wishlist page. Guest persistence via a namespaced `localStorage` key (`aw_wishlist`); no app, no account requirement, no server-side storage.

**Files added:**
- `assets/artwistic-wishlist.css` / `assets/artwistic-wishlist.js` — button styling/state and the core wishlist module (`window.ArtwisticWishlist`: `list()`, `has()`, `toggle()`), wired via event delegation so it works on dynamically-inserted cards (quick add, infinite scroll) without re-binding.
- `assets/artwistic-wishlist-page.js` — fetches each saved product live from `/products/{handle}.js` (Shopify's Storefront AJAX API) and renders the wishlist grid, so price/availability are never stale.
- `snippets/artwistic-wishlist-button.liquid` — the heart toggle, rendered on cards and the product page.
- `sections/artwistic-wishlist.liquid` — the wishlist page section (server-rendered empty state + client-populated grid).
- `templates/page.wishlist.json` — page template a merchant assigns to their "Wishlist" page.

**Dawn files modified:**
- `snippets/card-product.liquid` — one render call for the wishlist button inside `.card__media` (only when the card has a featured image), plus the wishlist CSS/JS asset tags added to the existing `unless skip_styles` block. **Reason:** the button needs the product id/handle from the loop scope; there is no per-card hook to inject markup without a small direct edit.
- `sections/main-product.liquid` — one render call for a large wishlist button over the product gallery, with its own CSS/JS asset tags.
- `sections/header.liquid` — a new wishlist icon link (with count bubble) added next to the cart icon, gated behind a new `artwistic_wishlist_url` URL setting (default `/pages/wishlist`, blank hides the icon).

  **Reapplying after a Dawn update:** search each file for `ARTWISTIC:` to find the exact insertion points.

**Reason:** spec section 41 explicitly recommends a native, app-free implementation; guest `localStorage` was chosen over the Customer Account API per [docs/APP_REGISTER.md](docs/APP_REGISTER.md)'s backlog note, since cross-device persistence was not a stated requirement.

**Shopify dependencies:** a page created with the "Wishlist" template (see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md)); the header's wishlist URL setting pointed at that page.

**Metafield/metaobject dependencies:** none.

**Admin setup requirements:** create the wishlist page; set the header's wishlist URL. Full steps in [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Migration notes:** if `localStorage` is unavailable (private browsing, storage blocked), buttons remain visually functional per page view but nothing persists across reloads — this fails silently by design rather than throwing.

---

## 2026-08-30 — Recently Viewed

**Feature/change:** A "Recently viewed" rail on the product page (spec section 42), reusing the wishlist's storage/fetch pattern. Records the current product handle into a capped, namespaced `localStorage` list (`aw_recently_viewed`, max 12) on every product view, and renders up to 8 other recently viewed products by fetching them live from `/products/{handle}.js`.

**Files added:**
- `assets/artwistic-recently-viewed.css` / `assets/artwistic-recently-viewed.js`
- `snippets/artwistic-recently-viewed.liquid`

**Dawn files modified:**
- `sections/main-product.liquid` — one conditional render call after the sticky Add to Cart block, and a new `artwistic_show_recently_viewed` checkbox setting (default on).
- `templates/product.json` — enabled the new setting by default.

**Reason:** spec section 42 calls for an efficient, no-extra-server-request implementation; this only makes network requests on the product page itself (one per rail item, capped at 8), never sitewide.

**Shopify dependencies:** none.

**Metafield/metaobject dependencies:** none.

**Admin setup requirements:** none — on by default, toggleable per product page via the section's checkbox setting.

---

## 2026-08-30 — Shop by Intent (homepage)

**Feature/change:** A second homepage tile grid for purpose-based discovery (Everyday, Gifting, Under a price point, Stackable — spec section 23), sitting alongside Shop by Category.

**Files added:**
- `sections/artwistic-shop-by-intent.liquid` — new section, `intent` block type. Deliberately reuses `assets/artwistic-shop-by-category.css`'s tile classes (`.aw-category-tile`, `.aw-shop-by-category__grid`) rather than duplicating that CSS, since both modules share the same "Shop by X" tile visual language. Kept as a separate section file (not merged into Shop by Category) so it appears as its own clearly-labelled entry in the Theme Editor.

**Dawn files modified:**
- `templates/index.json` — added an instance (4 example intent tiles) after Shop by Category.

**Reason:** spec section 23; a second, differently-purposed entry point into the catalogue alongside category-based browsing.

**Shopify dependencies / metafield / metaobject dependencies:** none.

**Admin setup requirements:** none beyond Theme Editor block configuration, same as Shop by Category.

---

## 2026-08-30 — Shop the Look

**Feature/change:** A hotspot-driven "Shop the Look" module (spec section 35) — a styled scene photo with clickable points, each opening a small popover card linking a specific product. Hotspots are native `<details>/<summary>` elements positioned via inline percentage coordinates, so the feature needs zero JavaScript and is keyboard/screen-reader accessible the same way Dawn's own accordions are.

**Files added:**
- `sections/artwistic-shop-the-look.liquid` — new section; a `look` block picks one `artwistic_look` metaobject entry via a metaobject-type block setting.
- `assets/artwistic-shop-the-look.css`.

**Dawn files modified:** none — this feature required no Dawn file edits at all, since it's entirely new markup driven by new metaobjects.

**Reason:** spec section 35 and the reference sites studied (Miso by Sonia, Miso Radesigns, Wild Child Jewels) all use a shop-the-look pattern to help shoppers picture themselves wearing multiple pieces together — a real "IMAGINE" step in the customer journey (spec section 83).

**Shopify dependencies:** none beyond the metaobjects below.

**Metafield dependencies:** none.

**Metaobject dependencies:** `artwistic_look` and `artwistic_look_hotspot` — see [docs/METAOBJECTS.md](docs/METAOBJECTS.md) for full field definitions and setup steps.

**Admin setup requirements:** create both metaobject definitions, then one `artwistic_look` entry per scene with its hotspots, then add a "Shop the Look" section/block in the Theme Editor and pick that entry. Not added to `templates/index.json` by default — it renders nothing useful until at least one Look entry exists, so a merchant adds the section themselves once their first Look is set up (see step 10 in [docs/METAOBJECTS.md](docs/METAOBJECTS.md)).

**Migration notes:** a hotspot whose linked product is unavailable/deleted, or a Look with zero hotspots, both render gracefully (skipped hotspot / image-only, respectively) — never a broken link or error.

---

## 2026-08-30 — Homepage completion: Shop by Mood, Editorial Story, Why ARTWISTIC, Jewellery Education, Newsletter

**Feature/change:** Completed the homepage structure from spec section 21. Two genuinely new sections; three homepage modules deliberately reuse Dawn's own native sections (configured, not rebuilt) since Dawn already implements them well — rebuilding would have violated the project's core "don't replace Dawn components unnecessarily" rule (spec section 6/60).

**New sections:**
- `sections/artwistic-shop-by-mood.liquid` / `assets/artwistic-shop-by-mood.css` — large-format, alternating-side editorial cards for curated collections ("The Everyday Edit", "Golden Hour"), distinct from the small Shop by Category/Intent tiles since these carry real editorial copy via `richtext` blocks.
- `sections/artwistic-jewellery-education.liquid` / `assets/artwistic-jewellery-education.css` — a guide/link grid pointing at care, sizing, and styling content. Deliberately just a link grid, not a content generator — real guide content is the merchant's to write via Pages or the Blog; this only surfaces it, and doubles as internal linking for SEO (spec section 47).

**Reused Dawn sections (configured via `templates/index.json`, zero new code):**
- "Editorial Story" → Dawn's stock `image-with-text` section.
- "Why ARTWISTIC" → Dawn's stock `multicolumn` section (4 value-prop columns: craftsmanship, materials, returns, checkout — generic, non-fabricated placeholder copy, since no real brand facts were supplied).
- "Newsletter" → Dawn's stock `email-signup-banner` section.
- "Best Sellers" / "New Arrivals" → two instances of Dawn's stock `featured-collection` section, both currently pointed at the `all` collection as a placeholder — a merchant should repoint each at real best-seller/new-arrival collections once the catalogue is live (see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md)).

**Dawn files modified:** none — only `templates/index.json` composition changed (adding instances of existing Dawn sections + the two new ARTWISTIC sections). No Dawn `.liquid` file was touched for this batch.

**Reason:** spec section 21's homepage structure, balanced against the "protect Dawn" architecture rule — sections Dawn already does well were configured, not reimplemented.

**Shopify dependencies:** none for the new sections. The reused sections need real content (brand story copy, best-seller/new-arrival collections) before launch — currently placeholder.

**Metafield/metaobject dependencies:** none.

**Admin setup requirements:** point "Best Sellers"/"New Arrivals" at real collections; add real Editorial Story copy/image; add real guide links to Jewellery Education blocks (or remove the section until guide content exists). See [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

---

## 2026-08-30 — Build Your Stack

**Feature/change:** A curated multi-select bundle builder (spec section 40). A merchant picks a set of products meant to be worn together; the shopper toggles which ones they want, sees a running total, and adds every selected item's default variant to the cart in one action. The combined total is always the literal sum of the selected products' real prices — no discount is calculated or claimed by this feature; a merchant wanting an actual bundle discount configures a real Shopify automatic discount, which then simply applies at checkout as normal.

**Files added:**
- `sections/artwistic-build-your-stack.liquid` — new section, `product` block type (product picker + "selected by default" toggle).
- `assets/artwistic-stack-builder.css`.
- `assets/artwistic-stack-builder.js` — a `<aw-stack-builder>` custom element: tracks selection, computes the running total client-side (a compact port of Shopify's classic money-format algorithm, since no bundled formatter is available), and adds selected items via `POST /cart/add.js`, tagging each line with a hidden `_artwistic_stack` property (leading underscore hides it from customer-facing checkout per Shopify convention) so merchants can see which stack an order came from.

**Dawn files modified:** none.

**Known limitation:** each product's `selected_or_first_available_variant` is what gets added — this build does not support per-item variant selection within the stack. Documented rather than silently wrong; a future iteration could add a variant picker per stack item.

**After adding to cart:** navigates to the cart page rather than opening Dawn's cart drawer/notification directly, since that works correctly regardless of which cart type (page/drawer/notification) the merchant has selected in Theme Editor, without this feature needing to reach into Dawn's cart-rendering internals.

**Reason:** spec section 40 explicitly warns against fabricated discounts; this implementation is a literal sum, full stop.

**Shopify dependencies:** none required to render; needs curated products picked per block.

**Metafield/metaobject dependencies:** none.

**Admin setup requirements:** add the section, add a block per product, optionally mark some "selected by default". Not added to `templates/index.json` by default — like Shop the Look, it needs real curated products chosen first. See [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

---

## 2026-08-30 — Breadcrumbs, structured data audit, collection/search/cart polish, Shop This Guide

**Feature/change:** Closed out the remaining spec-section backlog items that were polish/infrastructure on top of Dawn's already-functional systems, plus the one genuine SEO gap (breadcrumbs).

**Files added:**
- `snippets/artwistic-breadcrumbs.liquid` — visible breadcrumb trail + matching `BreadcrumbList` JSON-LD. Dawn ships neither; this is new functionality, not a restyle. Infers the trail from whichever global objects (`collection`, `product`, `blog`, `article`) are available for the current template.
- `assets/artwistic-collection.css` — breadcrumb styling + a CSS-only restyle of Dawn's existing facets/filter system (`snippets/facets.liquid`). No filter logic, JS, or canonical/query-param handling touched — spec section 48's crawlable-pagination requirement is entirely preserved since nothing about how filtering works changed, only how it looks.
- `assets/artwistic-search.css` — CSS-only restyle of Dawn's existing predictive search (`sections/predictive-search.liquid`, `assets/predictive-search.js`). No data-flow changes.
- `assets/artwistic-cart.css` — CSS-only restyle of Dawn's existing cart drawer (`snippets/cart-drawer.liquid`, `assets/cart-drawer.js`). No AJAX-cart logic changes.
- `sections/artwistic-shop-this-guide.liquid` — a product-recommendation section for blog articles (spec section 47's Articles → Products direction), reusing `snippets/card-product.liquid` rather than reimplementing a card.

**Dawn files modified:**
- `sections/main-collection-banner.liquid`, `sections/main-product.liquid`, `sections/main-article.liquid` — one breadcrumb render call each, plus the `artwistic-collection.css` tag.
- `sections/main-collection-product-grid.liquid` — one `artwistic-collection.css` tag (facets restyle).
- `sections/header.liquid` — one `artwistic-search.css` tag, inside the existing `settings.predictive_search_enabled` conditional so it never loads when predictive search is off.
- `layout/theme.liquid` — one `artwistic-cart.css` tag, inside the existing `settings.cart_type == 'drawer'` conditional so it never loads for page/notification cart types.
- `templates/article.json` — added a (currently empty, zero-block) instance of Shop This Guide after the main article content; renders nothing until a merchant adds product blocks.

  All edits marked `ARTWISTIC:` inline; every one is a single asset-tag or render-call addition, no existing Dawn logic altered.

**Reason:** these were the remaining spec items (37, 38, 39, 44, 47, 48) not yet addressed; per the project's core rule, each was implemented as a CSS-only restyle or a wholly new addition rather than rewriting any of Dawn's already-functional filter/search/cart systems.

**Shopify dependencies / metafield / metaobject dependencies:** none for any of these.

**Admin setup requirements:** Shop This Guide needs product blocks added per article (see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md)); everything else works automatically with no setup.

---

## 2026-08-31 — Apple-style motion system

**Feature/change:** Replaced the generic Material-style easing curve used by every ARTWISTIC transition with a single Apple-product-page-style deceleration curve (`cubic-bezier(0.16, 1, 0.3, 1)`), plus companion `--aw-ease-in`/`--aw-ease-in-out` tokens for future targeted use. Durations widened slightly (250ms→300ms base, 400ms→500ms slow) to let the curve read as a glide rather than a snap. No spring/bounce/elastic easing is used anywhere in ARTWISTIC code, and none should be added — per the user's explicit request for smooth, non-jittery, non-bouncy motion throughout.

**Files modified:** `assets/artwistic-global.css` only (the `--aw-ease` token definition). Because every ARTWISTIC feature's CSS already references `var(--aw-ease)` rather than hardcoding a curve, this one token change upgrades every hover, accordion, drawer, and reveal animation sitewide simultaneously — exactly the payoff of having a shared token system from the start.

**Reason:** user asked for smooth, fluid, Apple-website-like animation uniformly across the site, explicitly ruling out jitter and bounce.

**Dependencies:** none.

---

## 2026-08-31 — Reviews (homepage + product page)

**Feature/change:** A fully custom-styled, merchant-curated verified-reviews system (spec sections 30 & 45). Deliberately architected so a third-party review app's widget is never rendered on the storefront:

1. **Collection layer (off-storefront):** a review app — **Judge.me (free plan) recommended** — handles review-request emails, verified-purchase badges, and photo/video collection from real customers. Its dashboard is where the merchant reads incoming reviews.
2. **Curation layer (this build):** the merchant transcribes the reviews they choose to feature into a new `artwistic_review` metaobject entry, copying the rating and text faithfully (never rounding up or inventing a number) and re-uploading any photo/video they want to keep. This is the only mechanism that puts a review on the storefront — nothing syncs automatically, which is exactly the manual, "it's up to me" curation control the user asked for, especially for photo/video reviews.
3. **Display layer:** 100% ARTWISTIC markup and CSS reading only this metaobject — no app script, no app CSS, no app branding ever loads on the site.

**Files added:**
- `snippets/artwistic-star-rating.liquid` — reusable 5-star display supporting partial ratings (e.g. 4.5) via a clipped fill overlay.
- `snippets/artwistic-rating-summary.liquid` — compact glanceable rating chip ("4.8 · 32 reviews") for near the product title, computed live from that product's reviews; renders nothing for a product with zero reviews rather than showing a "0 reviews" placeholder.
- `snippets/artwistic-product-reviews.liquid` — full review list for a product, with photos (lightbox), video, verified-purchase badge, and a live-computed average.
- `sections/artwistic-reviews.liquid` — homepage curated carousel; each block picks one `artwistic_review` entry (same metaobject-per-block pattern as Shop the Look), giving the merchant explicit order/selection control. Deliberately shows no aggregate "overall rating" here, since a curated homepage selection isn't a statistically honest full picture — that number only appears on each product's own page, computed from that product's actual reviews.
- `assets/artwistic-reviews.css` — star rating, review cards, full list, and the photo lightbox, all using the new Apple-style easing tokens.
- `assets/artwistic-reviews.js` — homepage carousel prev/next controls, and a shared photo lightbox (used by both the homepage cards and the product page list) that reuses `window.Artwistic.trapFocus` from the global helper module rather than reimplementing focus management.

**Dawn files modified:**
- `sections/main-product.liquid` — two new block types, `artwistic_rating_summary` (placed near the title by default) and `artwistic_reviews` (placed near the end of the info column by default) — both independently positionable/removable via the Theme Editor like any Dawn block.
- `templates/product.json` — both new blocks added to the default block order.
- `templates/index.json` — a zero-block instance of the new Reviews section added (renders nothing until the merchant adds review blocks — same safe-by-default pattern as Shop the Look and Build Your Stack).

**Reason:** sections 30 & 45 of the spec, and the user's explicit requirement that reviews be verified, that rating be true to the reviewer, that the merchant retain full curation control (especially for photo/video), and that the result look like ARTWISTIC, not a bolted-on app widget.

**Shopify dependencies:** none required to render (safe with zero reviews); Judge.me (or any review-collection app/process) is recommended for actually gathering verified reviews off-storefront, but is never a storefront dependency.

**Metafield dependencies:** none.

**Metaobject dependencies:** `artwistic_review` — see [docs/METAOBJECTS.md](docs/METAOBJECTS.md).

**Admin setup requirements:** install and configure Judge.me (or equivalent) to collect reviews; create the `artwistic_review` metaobject definition; transcribe chosen reviews as entries; feature them via homepage blocks and/or their `Product` field. Full steps in [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Migration notes:** the photo/video field types (list of files, single video file) are built against Shopify's documented metaobject file-reference behavior; exact rendering (`image_url`/`.url`/`.mime_type`) should be spot-checked once the metaobject definition is live in Admin, per the standing QA note in [docs/FEATURE_REGISTER.md](docs/FEATURE_REGISTER.md) about this environment having no connected store to verify against.

---

## 2026-08-31 — Product page conversion pass

**Feature/change:** A focused rework of the product page's information hierarchy and layout rhythm, aimed squarely at conversion — per the user's explicit direction that the product page "should do the selling," not just look premium. Three concrete changes:

1. **A glanceable purchase-confidence strip directly under Add to Cart** — the exact point where a hesitant shopper is deciding. New `artwistic_purchase_confidence` block: per-product trust badges (reused from the existing `artwistic-trust-signals` snippet) plus three merchant-written reassurance lines (dispatch/delivery, exchange policy, checkout security). Every line is **block text the merchant writes themselves** — nothing is a hardcoded assumption about this store's real policy, so there is no risk of an unverified claim shipping to production. To avoid showing trust badges twice, the older `artwistic_trust` block's `show_badges` default flipped to `false` (badges now live in the confidence strip; the material accordion no longer duplicates them).
2. **Glanceable spec rows** — `snippets/artwistic-product-information.liquid` now gives Material, Stones, Dimensions, Closure, and Package Contents each a small icon (reused theme icons: price-tag, star, ruler, lock, box), so the accordion reads as a scannable spec sheet rather than a dense definition list. Secondary fields (Finish, Plating, Weight) stay icon-free and indent to match, avoiding icon repetition fatigue.
3. **Tighter above-the-fold rhythm** — new `assets/artwistic-product-page.css` closes the gap between title → rating chip → price (Dawn's defaults leave generous, disconnected spacing between every block; a jewellery PDP reads more confidently when these read as one unit) and governs the confidence strip's own spacing. Deliberately its own file, separate from `artwistic-trust.css`/`artwistic-product-gallery.css`, since it's about page-level rhythm, not any one component's internals.

**Also fixed:** Dawn's gallery slider scrolls to a clicked thumbnail via a plain `scrollTo()` with no `behavior: 'smooth'` specified, so it was jumping instantly instead of gliding — that's now a CSS `scroll-behavior: smooth` on `.product__media-list`, respecting `prefers-reduced-motion`.

**Files added:**
- `snippets/artwistic-purchase-confidence.liquid`
- `assets/artwistic-product-page.css`

**Dawn files modified:**
- `sections/main-product.liquid` — new `artwistic_purchase_confidence` block type/case (placed after Buy Buttons by default), `show_badges` default flipped on the existing `artwistic_trust` block, one new stylesheet tag.
- `assets/artwistic-product-gallery.css` — the `scroll-behavior: smooth` fix.
- `assets/artwistic-trust.css` — icon-row layout for `artwistic-product-information.liquid`'s spec rows.
- `templates/product.json` — added the new block to the default order with sensible starter copy for its three text settings.

**Reason:** direct user request — the product page is "the most important page on the entire website" and must actively convert, not just look elegant.

**Shopify dependencies:** none new. Trust badges still read the same `artwistic` namespace product metafields as before (see [docs/METAFIELDS.md](docs/METAFIELDS.md)).

**Metafield/metaobject dependencies:** none new.

**Admin setup requirements:** the three confidence-strip text lines ship with plausible starter copy (e.g. "Usually dispatched in 1–2 business days") — **these must be reviewed and edited to match this store's actual policies before launch**; see [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

---

## 2026-08-31 — Product page trust/meaning features (8 items, user-selected)

**Feature/change:** Eight product-page additions the user selected from a curated menu, each aimed at building trust in ARTWISTIC as a business (not just the product) and helping the page actively convert. All are new blocks on `sections/main-product.liquid`, independently addable/removable/reorderable like every other ARTWISTIC block.

1. **Direct contact link** (`artwistic_contact_link`) — a WhatsApp/contact link near the buy button. Block text/URL, no data dependency.
2. **Payment method icons** (`artwistic_payment_icons`) — reuses Shopify's native `shop.enabled_payment_types` + `payment_type_svg_tag`, the exact mechanism Dawn's own footer already uses. Always reflects real enabled payment methods; zero fabrication risk, zero new icon assets.
3. **Genuine low-stock indicator** (`artwistic_stock_indicator`) — "Only N left," shown only when `inventory_management == 'shopify'`, inventory policy isn't "continue" (oversell), and real quantity is at/below a merchant threshold. Never an invented number.
4. **Gift note / gift wrapping** (`artwistic_gift_option`) — a checkbox + textarea submitting as cart line-item properties (`properties[Gift Wrap]`, `properties[Gift Note]`), using `form="{{ product_form_id }}"` — the same pattern `quantity_selector` already uses to attach inputs to the product form without nesting inside it. **`snippets/buy-buttons.liquid` was never touched.**
5. **Product-specific FAQ accordion** (`artwistic_faq_item`, repeatable block) — each block is its own independent native `<details>` accordion entry (question + richtext answer), same zero-JS pattern as the material accordion and Dawn's own `collapsible_tab`.
6. **"Complete the Look" cross-link** (`artwistic_complete_the_look`) — checks whether the current product appears as a hotspot in any `artwistic_look` scene and, if so, links to that look's own page. Required enabling Shopify's native **Storefront pages** for the `artwistic_look` metaobject definition + a new minimal template/section (see below) so the link goes somewhere real instead of a dead anchor.
7. **Instagram/UGC photo strip** (Group B selection) — new `artwistic_social_post` metaobject + `sections/artwistic-social-proof.liquid`. Same manual-curation architecture as Reviews: the merchant uploads real photos from their real account; no live Instagram embed, no third-party script.
8. **Delivery estimate calculator** (`artwistic_delivery_estimate`, Group C selection) — manual, no-API. Full rules below.

### Delivery estimate — exact rules (per user specification)

- Business day = Monday–Saturday, **excluding Sunday** and **every date in a merchant-maintained holiday list**.
- Dispatch: configurable min–max business-day range (default 1–2, i.e. "24–48 business hours" expressed as whole business days, since a static calculator has no order-cutoff-time data to do intra-day hour math).
- Transit: **Gujarat and Maharashtra** get a faster range (default 2–3 business days); **every other state/UT** gets a slower range (default 3–5 business days) — exactly as specified.
- The shopper picks their state from a dropdown (all 28 states + 8 UTs); `assets/artwistic-delivery-estimate.js` computes an estimated delivery date range client-side, skipping non-business-days at every step of both the dispatch and transit calculation.
- **Holiday list, sourced from the official 2026 Government of India gazetted holiday calendar** (verified via web search against the Kendriya Vidyalaya 2026 school holiday circular, which mirrors the Central Government list, cross-checked against multiple sources for the festival dates): Republic Day (26 Jan), Holi (3 Mar), Id-ul-Fitr (21 Mar), Mahavir Jayanti (31 Mar), Good Friday (3 Apr), Buddha Purnima (1 May), Id-ul-Zuha/Bakrid (27 May), Muharram (26 Jun), Independence Day (15 Aug), Milad-un-Nabi (26 Aug), Gandhi Jayanti (2 Oct), Dussehra (20 Oct), Diwali (8 Nov), Guru Nanak's Birthday (24 Nov), Christmas (25 Dec). Pre-filled as a merchant-editable block setting (`holiday_dates`), **not hardcoded** — a couple of these dates vary slightly between sources (e.g. Holi is reported as either 3 or 4 March depending on source, since it spans two observance days), so the admin setup doc explicitly tells the merchant to verify against their actual courier's calendar before launch, per the project's no-fabrication standard.

**Files added:**
- Snippets: `artwistic-contact-link.liquid`, `artwistic-payment-icons.liquid`, `artwistic-stock-indicator.liquid`, `artwistic-gift-option.liquid`, `artwistic-faq-item.liquid`, `artwistic-complete-the-look.liquid`, `artwistic-delivery-estimate.liquid`, `artwistic-look-media.liquid` (extracted from Shop the Look for reuse — see below).
- Sections: `artwistic-social-proof.liquid`, `metaobject-artwistic-look.liquid` (the standalone Look page).
- Assets: `artwistic-delivery-estimate.css/js`, `artwistic-social-proof.css`; new rules added to `artwistic-product-page.css` for the smaller inline elements (contact link, stock indicator, gift option, payment icons, complete-the-look).
- Template: `templates/metaobject.artwistic_look.json`.

**Dawn files modified:**
- `sections/main-product.liquid` — six new block types/cases added, following the exact same pattern as every prior ARTWISTIC block (`artwistic_trust`, `artwistic_purchase_confidence`, etc.). No existing block/case logic altered.
- `sections/artwistic-shop-the-look.liquid` (an ARTWISTIC file, not Dawn) — refactored to call the new shared `artwistic-look-media` snippet instead of inlining the hotspot markup, so the standalone Look page doesn't duplicate it.
- `templates/product.json` — all eight features added to the default block order with sensible starter settings (FAQ ships with two generic, non-fabricated example Q&As).

**Reason:** direct user selection from a curated menu of trust/meaning-adding features, refined across two rounds of feedback — see conversation for the full menu and the Group A/B/C selection.

**Shopify dependencies:** none beyond what's documented per item above.

**Metafield dependencies:** none new.

**Metaobject dependencies:** `artwistic_social_post` (new); `artwistic_look` now also needs Storefront pages enabled (see [docs/METAOBJECTS.md](docs/METAOBJECTS.md)).

**Admin setup requirements:** WhatsApp/contact link URL, gift wrap fee decision (currently framed as free), FAQ answers reviewed, Instagram photos uploaded, delivery estimate holiday list verified against the real courier calendar, `artwistic_look` Storefront pages toggle enabled. Full steps in [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md).

**Migration notes:** every item here renders nothing (not a placeholder, literally nothing) until configured, except the delivery estimate calculator and FAQ, which ship with default numbers/example copy specifically flagged for merchant review before launch.

---

## 2026-09-02 — Order confirmation email template

**Feature/change:** A branded order confirmation email matching the ARTWISTIC visual identity. **This is not a theme file** — Shopify's transactional notification emails are a separate system (Settings → Notifications) with their own Liquid context (no access to theme `settings.*`, sections, or `artwistic-global.css`), so it isn't deployed via the theme zip and required its own build: table-based HTML layout with fully inline CSS (no CSS custom properties, no Grid/Flexbox — email client support for those is unreliable, Outlook especially) and web-safe font stacks only (no custom Google Font loading, which silently fails in most inboxes).

**Files added:** `docs/emails/order-confirmation.liquid` — paste-into-Admin HTML+Liquid, not part of the theme package.

**Reason:** direct user request.

**Shopify dependencies:** none beyond pasting the code into Settings → Notifications → Order confirmation → Edit code.

**Admin setup requirements:** full paste-and-test steps in [docs/SHOPIFY_ADMIN_SETUP.md](docs/SHOPIFY_ADMIN_SETUP.md), including using Shopify's built-in Preview and Send test email to verify before relying on it — this was written using Shopify's standard, long-documented notification Liquid variables (`shop`, `order_name`, `customer`, `line_items`, `shipping_address`, `subtotal_price`, `total_price`, `total_tax`, `shipping_price`) without a live store to test against, so a real send-test is the verification step, not optional polish.

---

## 2026-09-05 — Artwistic redesign: design system + cart free-shipping progress

**Feature/change:** First two slices of the full storefront redesign (visual rebuild while preserving Shopify functionality, per the approved plan). (1) Replaced Dawn's generic default color palette (white/black/navy/blue across all 5 color schemes), radius scale, and missing typography/button/icon roles with a considered Artwistic system — see the tokens and rationale comments in `assets/artwistic-global.css` and `config/settings_data.json`. (2) Removed a fabricated "Easy returns" claim from the homepage's "Why Artwistic" section (`templates/index.json`) — Artwistic's real policy is final sale, no COD, no returns. (3) Added a real-cart-data free-shipping progress bar (Artwistic's actual ₹1,499 threshold, no fabricated math) to both the cart drawer and the full cart page, and switched `cart_type` from `notification` to `drawer` so the theme's existing (and expanded) cart-drawer restyle work is actually the live experience rather than dormant code.

**Files added:** `snippets/artwistic-shipping-progress.liquid`, `assets/artwistic-shipping-progress.css`.

**Files modified:** `assets/artwistic-global.css` (design tokens), `config/settings_data.json` (color schemes, `buttons_radius`/`inputs_radius`/`popup_corner_radius`, `cart_type`), `assets/artwistic-social-proof.css`/`artwistic-wishlist.css` (literal `999px` radii replaced with the `--aw-radius-full` token), `templates/index.json` (returns→dispatch copy fix), `snippets/cart-drawer.liquid` and `sections/main-cart-footer.liquid` (shipping-progress render call), `layout/theme.liquid` (loads `artwistic-cart.css`/`artwistic-shipping-progress.css` on the full cart page too, not only when `cart_type` was `drawer`).

**Reason:** direct user request to rebuild the visual identity while keeping the underlying Shopify functionality, plus a specific request for functional cart/shipping features that reuse the same design language.

**Shopify dependencies:** none new — `cart.total_price` is native.

**Admin setup requirements:** none for this slice; if the real free-shipping threshold ever changes from ₹1,499, update `aw_shipping_threshold` in `snippets/artwistic-shipping-progress.liquid` (documented inline).

**Migration notes:** switching `cart_type` to `drawer` changes what shoppers see on Add to Cart (a full drawer instead of a small notification popup) — call this out to the merchant before launch in case they prefer the notification style.

---

## 2026-09-05 — Quick view / quick add enabled on product grids

**Feature/change:** Enabled Dawn's existing "standard" quick-add (`quick_add: "standard"`) on the collection product grid and both homepage product rails (Best Sellers, New Arrivals), previously set to `none`. This is Dawn's built-in mini product page in a modal — real gallery, variant picker, add-to-cart form — not a custom-built quick view, matching the "don't rebuild what Dawn already solved" principle. Restyled the trigger button and modal panel (radius, shadow, open/close motion using the Artwistic ease curve) to match the design system.

**Files added:** `assets/artwistic-quick-add.css`.

**Files modified:** `templates/collection.json`, `templates/index.json` (`quick_add: "none"` → `"standard"`), `sections/main-collection-product-grid.liquid`, `sections/featured-collection.liquid` (load the new stylesheet whenever quick add is enabled).

**Reason:** recommended enhancement — faster product discovery from the grid without a full page navigation, reusing functionality Dawn already had.

**Shopify dependencies:** none.

**Admin setup requirements:** none — works with existing product/variant data.

---

## 2026-09-06 — Homepage rebuilt to the approved narrative + a real padding bug fixed sitewide

**Feature/change:** Ported the approved homepage-narrative mockup into real Liquid. New order: hero slideshow → Shop by Category → Shop by Intent → UGC marquee → Shop by Mood (now 3 edits) → Best Sellers → New Arrivals → Shop the Look → Reviews → Why Artwistic → Jewellery Education → Newsletter. Removed "Made to be worn, not just owned" as a standalone `image-with-text` section since that message now opens the hero slideshow instead — kept in one place instead of repeated twice.

(1) **Hero slideshow**: uses Dawn's own native `slideshow` section (real autoplay, loop, keyboard/touch nav, reduced-motion handling — unmodified JS) rather than a new custom section, restyled via `assets/artwistic-hero-slideshow.css`: a bottom gradient scrim, progress-bar-shaped slider dots, and a restrained scale-only Ken Burns override replacing Dawn's default orbital "ambient" pan.

(2) **UGC marquee**: `sections/artwistic-social-proof.liquid` converted from a static 5-column grid into the infinite masonry marquee designed in the mockup — see the entry above this one for the mechanics. Still 100% merchant-curated `artwistic_social_post` metaobject data, no third-party embed.

(3) **Real bug fixed while touching every homepage section**: none of the 10 `artwistic-*.liquid` sections (`shop-by-category`, `shop-by-intent`, `shop-by-mood`, `reviews`, `jewellery-education`, `social-proof`, `wishlist`, `build-your-stack`, `shop-this-guide`, `shop-the-look`) ever defined the `{% style %}` block that turns their `padding_top`/`padding_bottom` theme-editor settings into actual CSS — unlike every stock Dawn section, which does. The padding sliders in the theme editor have been silently doing nothing on all of them since they were built. Added `snippets/artwistic-section-padding.liquid` (Dawn's exact mobile/desktop formula) and rendered it from all 10 files.

**Files added:** `assets/artwistic-hero-slideshow.css`, `snippets/artwistic-section-padding.liquid`.

**Files modified:** `templates/index.json` (full reorder + new `hero_slideshow`/`artwistic_shop_the_look`/`artwistic_social_proof` instances), `layout/theme.liquid` (conditional hero-slideshow CSS load on `request.page_type == 'index'`), `assets/artwistic-social-proof.css` + `sections/artwistic-social-proof.liquid` (marquee conversion), the 9 other `artwistic-*.liquid` sections listed above (padding fix only).

**Reason:** direct user request to fully revamp the homepage; the padding fix was discovered as a byproduct of reviewing every section this pass touched.

**Shopify dependencies:** none new.

**Admin setup requirements:** `artwistic_social_post` metaobject entries for the marquee to render anything (same requirement as before, just more visually prominent now); `artwistic_look` metaobject for the newly re-added Shop the Look section. Both already documented in `docs/SHOPIFY_ADMIN_SETUP.md`.

**Migration notes:** the removed `editorial_story` section's copy ("Made to be worn, not just owned") now lives in the hero slideshow's first slide — if a merchant had customized that section's text in the theme editor, it won't carry over automatically since the section instance was removed from `index.json`.

---

## 2026-09-06 — 404 page rebuilt

**Feature/change:** `sections/main-404.liquid` was 100% untouched stock Dawn (a title, a subtext, one "Continue shopping" button — no search, no recovery path). Rebuilt with real Artwistic styling: an inline predictive-search box reusing the exact same `<main-search>`/`<predictive-search>` mechanism `sections/main-search.liquid` already uses (no new JS), and up to 3 merchant-picked "suggested collection" blocks rendered via the existing `card-collection` snippet. Zero blocks configured by default — no fabricated collection suggestions.

**Files added:** `assets/artwistic-404.css`.

**Files modified:** `sections/main-404.liquid` (full rewrite, same section name/tag).

**Reason:** direct user request; this was the one page in the theme genuinely untouched all session.

**Shopify dependencies:** `settings.predictive_search_enabled` (native).

**Admin setup requirements:** optionally add up to 3 "Suggested collection" blocks in Theme Editor → 404 page.

---

## 2026-09-06 — Collection/search filter & sort drawer + uniform product cards

**Feature/change:** Implements the approved "Filter & Sort Drawer" mockup by switching Dawn's native `filter_type` setting from `horizontal` to `drawer` on both the collection and search templates. Dawn already builds this exact mode using the same `<menu-drawer>` component that handles mobile filters on every filter_type — selecting `drawer` simply stops hiding it above mobile widths, so it becomes the filter/sort experience on all screen sizes. Restyled the resulting panel with Artwistic tokens (radius, shadow, motion curve, typography) — no changes to Dawn's actual filter logic, URL query params, or pagination.

Also fixed product cards sitewide (collection grid, search results, and everywhere else `card-product`/`component-card.css` is used): `.card__heading` now clamps to 2 lines with a fixed minimum height, so a short product name and a long one produce identically sized cards, with prices lining up across a row — the same fix already applied in the homepage mockup work, now on the real card component.

**Files modified:** `templates/collection.json`, `templates/search.json` (`filter_type`), `assets/artwistic-collection.css` (drawer + card rules), `sections/main-search.liquid` (added the stylesheet load it was missing).

**Reason:** direct user request to implement the approved collection-page mockup.

**Shopify dependencies:** none — Dawn's own `filter_type` setting and facet logic.

**Admin setup requirements:** none.

**Migration notes:** the filter/sort drawer now opens from the right edge (Dawn's native drawer direction) rather than the mockup's left-panel-desktop/bottom-sheet-mobile split — reusing Dawn's real, tested component was judged safer than rebuilding the positioning logic to match the mockup exactly.

---

## 2026-09-06 — Full cart page restyle

**Feature/change:** The cart drawer was restyled earlier this session; the full `/cart` **page** was confirmed 100% stock Dawn — same underlying classes, zero Artwistic CSS applied. Added a `.aw-cart-page` marker class to `sections/main-cart-items.liquid` and `sections/main-cart-footer.liquid`, and generalized `assets/artwistic-cart.css`'s rules to target both `.cart-drawer` and `.aw-cart-page` wherever Dawn reuses the same class names (item name/price typography, checkout button, totals). Added page-specific rules for table/row spacing and a real editorial empty-cart state (centered, generous spacing, a properly-styled CTA button) replacing Dawn's bare heading + button.

**Files modified:** `assets/artwistic-cart.css`, `sections/main-cart-items.liquid`, `sections/main-cart-footer.liquid`.

**Reason:** direct user request for "a robust cart page" — this was the confirmed gap between the drawer and the page.

**Shopify dependencies:** none — no changes to Dawn's cart AJAX/JS.

**Not done this pass:** a "you might also like" cross-sell rail on the cart page (mentioned in the plan) — no existing Dawn section covers cart-page recommendations, so this would be a genuinely new build rather than a restyle, and was deferred to keep this pass CSS-only and low-risk. Worth a follow-up.

---

## Backlog (not yet implemented)

What remains is content, not code: writing the actual buying-guide/care articles (spec section 46), real brand-story and product photography, and a reviews data source if the merchant wants `AggregateRating`/`Review` structured data (no app was added for this — see [docs/APP_REGISTER.md](docs/APP_REGISTER.md)). See [docs/FEATURE_REGISTER.md](docs/FEATURE_REGISTER.md) for details.
