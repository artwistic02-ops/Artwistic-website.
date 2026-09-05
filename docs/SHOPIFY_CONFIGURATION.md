# Shopify Configuration Register

Consolidated list of everything required outside the theme codebase for ARTWISTIC features to function. This is the single source of truth for "what does a merchant/developer need to set up to recreate this store's configuration from scratch."

## Metafields
See [METAFIELDS.md](METAFIELDS.md) — currently: 12 product metafields under the `artwistic` namespace (material, finish, plating, dimensions, weight, stones, closure, care instructions, water resistance, anti-tarnish, warranty, package contents).

## Metaobjects
See [METAOBJECTS.md](METAOBJECTS.md) — currently: `artwistic_menu_promo` (mega menu promo tiles), `artwistic_look` and `artwistic_look_hotspot` (Shop the Look).

## Collections
No ARTWISTIC-specific collection requirements yet beyond standard product collections referenced by the main navigation menu (see Navigation below). Backlog features (Shop by Mood editorial collections, Best Sellers, New Arrivals) will need dedicated collections — documented here once built, likely via automated collections (e.g. "New Arrivals" = sorted by created date, tagged or date-filtered).

## Navigation / menus
- **Main menu** (Online Store → Navigation): top-level items per product category, nested items per sub-category/style/occasion/price grouping. See [SHOPIFY_ADMIN_SETUP.md](SHOPIFY_ADMIN_SETUP.md#feature-premium-header--mega-menu) for full steps.
- The header section's **Menu** setting (Theme Editor → Header) must point at this menu.
- The header's **"ARTWISTIC: Wishlist page URL"** setting must point at the wishlist page (see Pages below).

## Pages
- A page using the **`page.wishlist`** template (Online Store → Pages → set Theme template to `page.wishlist`) — powers the Wishlist feature. See [SHOPIFY_ADMIN_SETUP.md](SHOPIFY_ADMIN_SETUP.md#feature-wishlist).

## Search & Discovery
No custom Search & Discovery configuration required by this build. Dawn's stock predictive search and standard collection sort/filter behavior is used unmodified. (Filter/sort UI enhancements are a backlog item — see [FEATURE_REGISTER.md](FEATURE_REGISTER.md).)

## Product recommendations
None configured by ARTWISTIC in this build — Dawn's stock `product-recommendations` section (Shopify's native recommendation API) is used as-is where present in `templates/product.json`.

## Theme settings
No new theme settings schema keys were added in this build beyond what individual sections declare in their own `{% schema %}` blocks (documented per-section in [FEATURE_REGISTER.md](FEATURE_REGISTER.md)).

## Policies
Standard Shopify policies (Settings → Policies: Refund, Privacy, Terms of Service, Shipping) should be filled in — the product page's shipping/returns accordion (once built) will link to the storefront's standard policy pages via Dawn's existing policy link mechanism. No new policy infrastructure introduced.

## Customer accounts
Unmodified — uses Shopify's native customer accounts (see spec section 43; no custom auth was built or is planned).

## Markets / currency / language
Not configured or modified by this build. No multi-market changes were made.

## Shipping / payment configuration
Not modified by this build. Standard Shopify shipping and payment settings apply.

## Analytics
Not modified by this build — relies on Shopify's native analytics. No custom event tracking was added (see spec section 55; noted as a backlog consideration for when Feature: Wishlist/Quick Add ship, since those introduce meaningful new customer actions worth tracking).

---

## How to recreate this configuration from scratch

1. Create the metafield definitions in [METAFIELDS.md](METAFIELDS.md).
2. Create the metaobject definition and any entries in [METAOBJECTS.md](METAOBJECTS.md).
3. Build the main navigation menu per [SHOPIFY_ADMIN_SETUP.md](SHOPIFY_ADMIN_SETUP.md).
4. Fill in product metafield values for each product you want the trust module to show rich data for.
5. Publish the theme and verify each feature per its QA checklist in [FEATURE_REGISTER.md](FEATURE_REGISTER.md).

This section will be extended as future features add configuration dependencies.
