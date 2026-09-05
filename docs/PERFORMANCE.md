# Performance Architecture

## Principles (see spec sections 14–16)
- Liquid/HTML → CSS → minimal JS, in that order of preference.
- No SPA framework, no jQuery, no large frontend libraries.
- Feature-specific CSS/JS only loads on pages/sections that use that feature — nothing feature-specific lives in `artwistic-global.*`.

## LCP strategy
- The mega menu and product gallery avoid client-side rendering of above-the-fold content — both render server-side via Liquid; JS only adds interactivity (keyboard nav, focus trap, swipe) on top of already-visible markup.
- Product gallery's first image uses Dawn's existing eager-loading/fetch-priority pattern for the primary product image (not modified by ARTWISTIC); only secondary gallery images are lazy-loaded.

## JS strategy
- `artwistic-global.js` is intentionally tiny (a handful of pure helper functions, no polling, no global state store).
- Every feature-specific script (`artwistic-mega-menu.js`, `artwistic-sticky-cart.js`, `artwistic-wishlist.js`, `artwistic-wishlist-page.js`, `artwistic-recently-viewed.js`, `artwistic-stack-builder.js`) is only enqueued via an asset tag inside the specific section/snippet that uses it, so none load on a page that doesn't render that feature. `artwistic-wishlist.js` is the one exception with sitewide reach (product cards appear almost everywhere) — it's still under 100 lines and does no polling.
- Several features that could have needed JS instead use zero: the material accordion, trust badges, and Shop the Look hotspots all reuse native `<details>`/`<summary>`, and the mega menu's core open/close relies on Dawn's existing `header-menu` custom element — `artwistic-mega-menu.js` only adds an optional hover-intent layer on top.
- Wishlist and Recently Viewed avoid a server round-trip for the common case (toggling/recording) — `localStorage` only. Fetches to `/products/{handle}.js` only fire on the wishlist page and the recently-viewed rail itself, never sitewide.
- Build Your Stack posts one single `/cart/add.js` request for the whole selection, not one per item.
- All ARTWISTIC scripts use `defer` and avoid synchronous DOM thrashing (batch reads/writes where relevant).

## CSS strategy
- Tokens are custom properties, computed once; no runtime CSS-in-JS.
- Feature CSS files are scoped under a single top-level class per feature (`.aw-mega-menu`, `.aw-gallery`, `.aw-trust`) to avoid specificity fights with Dawn and keep each file tree-shakeable if a feature is later removed.

## Third-party scripts
None introduced by this build (see [APP_REGISTER.md](APP_REGISTER.md) — no app required for shipped features).

## Mobile optimization
- Sticky Add to Cart bar and gallery both account for iOS Safari's dynamic viewport (`100dvh` fallback pattern) and safe-area insets.
- Tap targets sized to at least 44×44px (`.aw-tap-target` utility in `artwistic-global.css`).

## CSS-only restyles (no new render cost)
Collection filters, predictive search, and the cart drawer were restyled with CSS only, layered over Dawn's existing stylesheets — no additional DOM nodes, no new JS, no change to Dawn's request pipeline for any of the three.

## Status
Baseline Lighthouse numbers to be captured once this theme is connected to a live Shopify store (this build environment has no Shopify CLI/Node — see the QA note in [FEATURE_REGISTER.md](FEATURE_REGISTER.md)). Every feature above was designed against these principles at write-time; the numbers still need to be measured against a real catalogue and real images, since a placeholder-only build understates real image payload.
