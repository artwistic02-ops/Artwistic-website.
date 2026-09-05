# SEO Architecture

## Principle (spec section 44)
Dawn already emits meta tags, canonical URLs, and JSON-LD structured data for products, articles, and breadcrumbs in most stock templates. ARTWISTIC does not duplicate or replace any of this — it only adds what's genuinely missing, after auditing what exists.

## Audit of Dawn's existing SEO output (as shipped in this theme)
- `layout/theme.liquid` includes Dawn's standard `<title>`, meta description, canonical link, and Open Graph tags via `{% include 'meta-tags' %}`-style stock snippets — unmodified by ARTWISTIC.
- Product/collection templates rely on Dawn's stock heading hierarchy and semantic HTML — unmodified.

## ARTWISTIC additions in this build
- **Mega menu:** rendered as a semantic `<nav>` with a real `<ul>/<li>` menu structure (not `<div>` soup), preserving crawlable internal links to every category/collection — this directly supports internal linking (spec section 47) since every category is one real `<a href>` away from the homepage.
- **Product trust/gallery module:** all content (material, care instructions, etc.) renders as real text in the DOM (not image-only), per spec section 54 — nothing meaningful is hidden exclusively inside images. Gallery images use descriptive `alt` text sourced from the product's media alt text (Shopify Admin → product → image → Edit alt text), falling back to the product title if unset.

## Filter/indexing safety (spec section 48)
Not modified in this build — Dawn's stock collection filtering behavior and canonical/query-param handling remain in place unchanged. This is a backlog item (see [FEATURE_REGISTER.md](FEATURE_REGISTER.md)) if a bespoke filter UI is built later; that work must preserve Dawn's existing crawlable-pagination and canonical approach.

## Structured data

**Audit performed:** Dawn already emits, via Shopify's native `| structured_data` filter (not hand-written JSON-LD):
- `Product`/`Offer` (and `AggregateRating`/`Review` automatically, if a reviews metafield/app populates `product.metafields.reviews.rating`) — `sections/main-product.liquid`.
- `Article` — `sections/main-article.liquid`.
- `Organization`, `WebSite`, `SearchAction` — `sections/header.liquid`.

None of this was touched or duplicated, per spec section 44's explicit instruction. The one genuine gap was **`BreadcrumbList`**, which Dawn does not emit at all (it also ships no visible breadcrumb trail) — added in this build via `snippets/artwistic-breadcrumbs.liquid`, rendered on collection, product, and article pages, with the JSON-LD mirroring the visible trail exactly.

**Still open:** `AggregateRating`/`Review` only appear if a reviews data source is connected (see the Reviews/ratings row in [docs/APP_REGISTER.md](APP_REGISTER.md) — this build did not add one, to avoid fabricating review data). `FAQPage` schema is not used anywhere, since no FAQ content exists yet.

## Internal linking (spec section 47)

- **Mega menu** — semantic `<nav>`/`<ul>` (not `<div>` soup), every category/collection one real link from the homepage.
- **Breadcrumbs** — Product → Collection → Home and Article → Blog → Home, both visible and in the `BreadcrumbList` schema.
- **Jewellery Education** (homepage) — links out to guide articles/pages once a merchant fills them in.
- **Shop This Guide** (`sections/artwistic-shop-this-guide.liquid`) — the reverse direction: an article can link back to specific products, completing the Articles ↔ Collections ↔ Products loop. Renders nothing until a merchant picks products for a given guide.

## Status
No changes made to Dawn's existing SEO output (Product/Article/Organization/WebSite schema, meta tags, canonical links) — only additive: breadcrumbs (visible + structured data) and two internal-linking modules.
