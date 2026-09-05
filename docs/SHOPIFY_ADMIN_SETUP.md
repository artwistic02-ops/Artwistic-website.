# Shopify Admin Setup Manual

Step-by-step instructions for everything a merchant must configure in Shopify Admin for the ARTWISTIC features in this build to work. Organized by feature. See [METAFIELDS.md](METAFIELDS.md) and [METAOBJECTS.md](METAOBJECTS.md) for the full field-level detail referenced from here, and [SHOPIFY_CONFIGURATION.md](SHOPIFY_CONFIGURATION.md) for the consolidated register of every non-code dependency.

---

## Feature: Header navigation — "Shop by Collection" dropdown

### What
The header uses Dawn's **dropdown** menu type (`menu_type_desktop: dropdown`), not the grid-based mega menu. Most top-level items (Home, All Jewellery, Earrings, Necklaces, Bracelets, Rings, Gifting, Need Help) are flat links with no dropdown. Exactly one top-level item, **"Shop by Collection"**, opens a vertical dropdown listing its child links — restyled with Artwistic's own panel (background, border, radius, shadow, spacing, typography — see `assets/artwistic-header.css`). The same parent/child structure renders as an accordion in the mobile drawer automatically; no separate mobile configuration is needed.

This entirely reuses Dawn's stock navigation menu — no custom code drives the menu structure, so the exact subsections shown are whatever the merchant builds below.

### Where
**Online Store → Navigation**.

### Steps

1. Open **Shopify Admin → Online Store → Navigation**, and open the menu assigned to the header (default: "Main menu").
2. Add top-level items for every flat nav link you want (e.g. "Home", "All Jewellery", "Earrings", "Necklaces", "Bracelets", "Rings", "Gifting", "Need Help") — link each directly to its page/collection. Leave these with **no nested items** so they render as plain links, matching the flat items in the reference layout.
3. Add one top-level item titled exactly **"Shop by Collection"**.
4. Under "Shop by Collection", add nested menu items — one per subsection you want to feature (e.g. by style, material, occasion, or price band), each linking to the relevant real collection. **Placeholder subsection names have not been chosen yet** — until you decide on them, add nested items with working titles (e.g. "Subsection 1", "Subsection 2") pointed at real collections, then rename the menu item titles later; renaming a navigation item never requires a theme code change.
5. Save the menu.
6. In **Online Store → Themes → Customize**, select the header section, confirm the correct menu is selected in the section's **Menu** setting, and confirm **Menu type on desktop** is set to **Dropdown**.
7. Preview the "Shop by Collection" dropdown on desktop (hover) and on mobile (tap, in the drawer menu) before publishing.

### Required?
Yes for "Shop by Collection" to show subsections — without nested items under it, it renders as a flat link like the others (no error, just no dropdown).

### Example value
Menu: "Main menu" with flat top-level items "Home", "All Jewellery", "Earrings", "Necklaces", "Bracelets", "Rings", "Gifting", "Need Help", plus "Shop by Collection" containing nested links to real collections.

---

## Feature: Product Page Trust & Gallery System

### What
Material/care/dimensions transparency module and trust badges on the product page, driven by product metafields.

### Where
**Settings → Custom data → Products**, then per-product **Metafields** section.

### Steps

See [METAFIELDS.md](METAFIELDS.md) for the exact namespace/key/type for every field (`artwistic.material`, `artwistic.care_instructions`, etc.) and the general creation steps.

Summary:
1. Create each metafield definition once (Settings → Custom data → Products → Add definition).
2. For every product, open the product in **Products**, scroll to **Metafields**, fill in the values that apply, and **Save**.
3. Fields left blank are simply omitted from the storefront trust module (no placeholder text, no error).

### Required?
Recommended, not required — the product page renders correctly with zero metafields filled in (the trust module and care accordion simply don't render sections with no data), but the feature's entire value proposition depends on merchants filling these in.

### Example value
`artwistic.material` = `18K Gold Vermeil`, `artwistic.care_instructions` = `Avoid contact with water, perfume, and lotion.`

---

## Feature: Wishlist

### What
A page where shoppers can view everything they've saved, plus a header icon linking to it.

### Where
**Online Store → Pages**, then **Online Store → Themes → Customize → Header** section settings.

### Steps

1. Open **Shopify Admin → Online Store → Pages → Add page**.
2. Title it "Wishlist" (any title works — the URL/handle is what matters).
3. In the right-hand **Template** dropdown (under "Theme template"), select **`page.wishlist`**.
4. Save.
5. Note the page's URL (e.g. `/pages/wishlist`).
6. Open **Online Store → Themes → Customize**, select the **Header** section, and confirm the **"ARTWISTIC: Wishlist page URL"** setting matches that URL (it defaults to `/pages/wishlist`, so no change is needed if you used that exact page).
7. Save. The heart icon appears in the header automatically; leaving the URL setting blank hides the icon entirely.

### Required?
Recommended — without a wishlist page, tapping a heart button still saves the product (the toggle state persists), but shoppers have nowhere to review their saved items.

### Example value
Header setting "ARTWISTIC: Wishlist page URL" = `/pages/wishlist`.

---

## Feature: Shop by Category (homepage)

### What
The homepage's visual category grid.

### Where
**Online Store → Themes → Customize**, on the homepage.

### Steps

1. Open **Online Store → Themes → Customize** with the homepage selected.
2. Find the **"ARTWISTIC: Shop by Category"** section (added by default between the hero and featured products).
3. Click into each **Category tile** block and set: an **Image**, optionally a **Hover image**, a **Title**, an optional **Subtitle**, and a **Link** (to a collection, product, or any URL).
4. Optionally enable **"Show product count"** and pick a **Collection** to pull a live count from.
5. Add, remove, reorder, or duplicate tiles like any other block; adjust desktop/mobile column count and aspect ratio in the section settings.
6. Save.

### Required?
No — the section renders with a neutral placeholder pattern in place of any tile missing an image, so it's safe to publish before real photography is ready.

### Example value
Tile: Image = a studio photo of an earring, Title = "Earrings", Link = the "Earrings" collection.

---

## Feature: Shop by Intent (homepage)

### What
The homepage's purpose-based tile grid (Everyday, Gifting, price points, Stackable).

### Where
**Online Store → Themes → Customize**, on the homepage.

### Steps
Same as [Shop by Category](#feature-shop-by-category-homepage) above — find the **"ARTWISTIC: Shop by Intent"** section, edit each **Intent tile** block's image/title/subtitle/link, add/remove/reorder blocks as needed.

### Required?
No — renders a neutral placeholder for any tile missing an image.

---

## Feature: Shop the Look

### What
A styled scene photo with clickable hotspots, each linking a product.

### Where
**Settings → Custom data → Metaobjects**, then **Content → Metaobjects**, then **Online Store → Themes → Customize**.

### Steps

1. Create the `Look Hotspot` and `Shop the Look` metaobject definitions — full field-by-field steps in [docs/METAOBJECTS.md](METAOBJECTS.md#artwistic_look_hotspot) and [docs/METAOBJECTS.md](METAOBJECTS.md#artwistic_look).
2. Go to **Content → Metaobjects → Shop the Look → Add entry**.
3. Fill in **Title**, **Subtitle**, and upload the scene **Image**.
4. In the **Hotspots** field, click **Add** for each clickable point: create a new Look Hotspot entry inline, set its horizontal/vertical position (0–100, as a percentage of the image), and pick the **Product**.
5. Save.
6. Preview the image at the size it'll actually render and check each hotspot lands where expected; adjust the position numbers and re-save if needed (there's no visual drag-to-position picker — it's numeric trial and error).
7. Open **Online Store → Themes → Customize**, add the **"ARTWISTIC: Shop the Look"** section wherever you want it, add a block, and in the block's **Look** setting pick the entry you just created.
8. Save.

### Required?
Yes, for this feature specifically to show anything — unlike Shop by Category/Intent, Shop the Look has no useful placeholder state without at least one configured Look entry, since the whole feature is the metaobject data. The section is safe to add before that data exists (it simply renders nothing).

### Example value
Look: Title = "The Golden Hour Stack", Image = a styled flat-lay photo, 3 hotspots each pointing at a different piece of jewellery in the photo.

---

## Feature: Homepage completion (Shop by Mood, Editorial Story, Why ARTWISTIC, Jewellery Education, Newsletter, Best Sellers, New Arrivals)

### What
The remaining homepage sections, added by default with placeholder copy/links.

### Where
**Online Store → Themes → Customize**, homepage.

### Steps

1. **Best Sellers / New Arrivals:** both currently point at the "All products" collection as a placeholder. Create real "Best Sellers" and "New Arrivals" collections (manual or automated — e.g. New Arrivals as an automated collection sorted by "Date, new to old") and repoint each section's **Collection** setting at the correct one.
2. **Shop by Mood:** edit each "Editorial edit" block's image, eyebrow, title, description, and link (point it at a real curated collection).
3. **Editorial Story:** replace the placeholder heading/text with real brand story copy, and add a real image via the section's **Image** setting.
4. **Why ARTWISTIC:** the four value-prop columns ship with honest, generic placeholder copy ("Thoughtful craftsmanship", "Made to last", "Fast dispatch", "Secure checkout") — replace with specific, truthful claims about your actual materials/policies. Do not claim returns, exchanges, or COD — Artwistic's real policy is final sale, no COD, dispatch within 24–48 working hours, free standard shipping above ₹1,499.
5. **Jewellery Education:** each block's **Link to article or page** setting is blank by default. Write the actual guide content as Pages or Blog articles first, then link each block to the real page/article. A block with no link renders a dead `#` link — fill these in before publishing.
6. **Newsletter:** uses Shopify's native customer email signup — no additional setup required; submissions go to your existing Shopify customer list.
7. Save.

### Required?
The sections render safely with placeholder content, but **Jewellery Education links must be filled in before launch** — an unfilled link is a real dead link, not a graceful empty state.

---

## Feature: Build Your Stack

### What
A curated multi-select bundle: pick products meant to be worn together, shopper toggles which to buy, adds them all in one action.

### Where
**Online Store → Themes → Customize** (add the section wherever you want it — homepage, a landing page, etc.).

### Steps

1. Add the **"ARTWISTIC: Build Your Stack"** section.
2. Add a block per product you want in the curated set, and use each block's **Product** picker to choose it.
3. Optionally check **"Selected by default"** on any block to pre-check that item for shoppers.
4. Save.

### Required?
No app or extra Shopify configuration required. If you want an actual bundle discount (not just the sum of individual prices), create a real **Automatic discount** (Discounts → Create discount → Amount off products, or a Shopify Function-based bundle discount) — this theme feature never calculates or displays a discount itself.

### Example value
Block: Product = "Meridian Pendant Necklace", Selected by default = on.

---

## Feature: Shop This Guide (blog articles)

### What
Product recommendations shown at the bottom of a blog article.

### Where
**Online Store → Themes → Customize**, with a blog article open in preview.

### Steps

1. Open **Online Store → Themes → Customize**, and navigate preview to any blog article (the section is already added to the article template, but renders nothing until it has product blocks).
2. Select the **"ARTWISTIC: Shop This Guide"** section.
3. Add a block per product relevant to that article, using each block's **Product** picker.
4. Save.

### Required?
No — renders nothing (not even an empty heading) until at least one product block is added, so it's safe on articles that don't need it.

### Example value
On a "How to layer necklaces" article: 3 product blocks pointing at chain necklaces suited for layering.

---

## Breadcrumbs

Breadcrumbs (collection, product, and article pages) require no setup — they render automatically from existing navigation/collection/blog structure. Nothing to configure.

---

## Feature: Reviews

### What
Verified customer reviews, curated by you, shown on the homepage and on individual product pages — with support for multiple photos and one video per review.

### Where
Judge.me app (collection) → **Settings → Custom data → Metaobjects** (curation) → **Online Store → Themes → Customize** (display).

### Steps

**Part 1 — collect real, verified reviews:**
1. Go to the Shopify App Store and install **Judge.me: Product Reviews App** (free plan).
2. In Judge.me's settings, enable automatic review-request emails (sent after an order is fulfilled/delivered) and enable photo/video review requests.
3. As orders come in and reviews arrive, they show up in Judge.me's own dashboard, each marked verified if it came from an actual order.

**Part 2 — create the Review content type (one-time setup):**
4. Open **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**.
5. **Name:** `Review` (confirm the generated type is `artwistic_review`).
6. Add these fields exactly as specified in [docs/METAOBJECTS.md](METAOBJECTS.md#artwistic_review): Reviewer name, Rating, Review text, Verified purchase, Photos (list of files), Video (file), Product (product reference), Reviewed on (date), Source note.
7. Save.

**Part 3 — curate a review onto your site (repeat per review):**
8. In Judge.me's dashboard, pick a review you want to feature.
9. Go to **Content → Metaobjects → Review → Add entry**.
10. Fill in the reviewer's name, the **exact** star rating they gave (never round up), and the review text (copy it faithfully — light typo fixes are fine, don't rewrite their opinion).
11. Check **Verified purchase** only if Judge.me marked it verified.
12. If the review had photos, download them from Judge.me and upload them to the **Photos** field (you can add more than one). If it had a video you want to keep, upload it to the **Video** field.
13. Set the **Product** field to the product this review is about (leave blank if it's a general brand review, in which case it will only ever be usable on the homepage).
14. Optionally set **Reviewed on** to the original review date, and jot the source (e.g. "Judge.me") in **Source note** for your own reference — this note never appears on the storefront.
15. Save.

**Part 4 — show it on the product page:** nothing further needed — it appears automatically on that product's page the moment step 13 sets the Product field, in both the compact rating chip near the title and the full review list further down.

**Part 5 — feature it on the homepage:**
16. Open **Online Store → Themes → Customize**, go to the homepage, and find the **"ARTWISTIC: Reviews"** section.
17. Add a block, and in its **Review** setting pick the entry you just created.
18. Reorder blocks by dragging to control the order reviews appear in the carousel.
19. Save.

### Required?
Recommended, not required — every reviews component renders nothing (not an empty state, literally nothing) until at least one review exists, so it's safe to launch without this filled in and add reviews as they come in.

### A note on trust
Never set a rating higher than what the reviewer actually gave, never mark "Verified purchase" on a review that wasn't, and never feature a photo/video without the reviewer's content actually being theirs. This system gives you full curation control specifically so you decide *which* real reviews to show — not license to alter what a real review says.

### Example value
Entry: Reviewer name = "Ananya R.", Rating = 5, Review text = "Wear this every day, hasn't tarnished once.", Verified purchase = true, Product = "Meridian Pendant Necklace".

---

## Feature: Purchase confidence strip (product page)

### What
The three reassurance lines (dispatch, exchange policy, checkout security) shown directly under Add to Cart.

### Where
**Online Store → Themes → Customize**, with a product page open in preview.

### Steps

1. Open **Online Store → Themes → Customize**, preview any product.
2. Select the **"ARTWISTIC: Purchase confidence"** block (under Add to Cart in the block list).
3. Edit the three text fields — **Dispatch/delivery line**, **Exchange/return line**, **Checkout reassurance line** — to say exactly what's true for this store. The shipped defaults ("Usually dispatched in 1–2 business days", "7-day exchange", "Secure checkout") are placeholders, not verified claims — replace them before launch.
4. Leave **"Show trust badges"** on if you've filled in the water-resistant/anti-tarnish/warranty metafields (see [docs/METAFIELDS.md](METAFIELDS.md)); otherwise no badges show regardless of this toggle, since each badge only renders when its metafield has a value.
5. Save.

### Required?
**Yes, before launch** — unlike most ARTWISTIC blocks, this one ships with plausible-sounding placeholder text rather than blank fields, precisely so the page isn't empty by default. That means it's the one block in this build where "leave it as-is" is not a safe default; verify every line matches this store's real policy.

---

## Feature: Product page trust blocks (contact link, payment icons, low stock, gift option, FAQ)

### What
Five independent blocks under Add to Cart / Details & care.

### Where
**Online Store → Themes → Customize**, product page.

### Steps

1. **Contact link:** select the "ARTWISTIC: Contact link" block, set **Link** to your WhatsApp link (format: `https://wa.me/91XXXXXXXXXX`, replacing with your real number, no spaces/dashes) or a `mailto:` address, and edit the label if you want.
2. **Payment icons:** nothing to do — it shows whatever's enabled in **Settings → Payments**.
3. **Low stock indicator:** adjust the **threshold** (default 5) to whatever "running low" means for your catalogue. It only shows for variants with Shopify inventory tracking on.
4. **Gift option:** edit the checkbox/textarea labels. If you want to charge for gift wrapping rather than offer it free, this needs a follow-up build (a real priced product/variant added to the cart) — the current version is informational-only (a note the fulfiller sees on the order), not a paid add-on.
5. **FAQ:** the "ARTWISTIC: FAQ item" block ships with two generic example Q&As ("Will this tarnish?", "How do I find my size?") — **replace these with real answers specific to each product**, or delete the blocks if not ready. Add more FAQ item blocks as needed; each is independent.

### Required?
Contact link needs your real number/email to do anything. Everything else works safely with its shipped defaults, but the FAQ answers are generic placeholders and should be reviewed before launch.

---

## Feature: Complete the Look (product page cross-link)

### What
Shows "Featured in: [Look name]" on a product's page if it's used in a Shop the Look scene, linking to that look's own page.

### Where
**Settings → Custom data → Metaobjects → Shop the Look**, then Theme Editor.

### Steps

1. Open **Shopify Admin → Settings → Custom data → Metaobjects → Shop the Look** (the `artwistic_look` definition — see [docs/METAOBJECTS.md](METAOBJECTS.md#artwistic_look)).
2. Enable **Storefront pages** for this definition and save.
3. That's it — every product referenced in any look's hotspots will automatically show the cross-link; every look automatically gets a real page at the URL Shopify generates.
4. The "ARTWISTIC: Complete the Look" block is already in the default product template; no per-product setup needed.

### Required?
No — the cross-link simply doesn't appear for products not featured in any look, and doesn't appear at all (safely) if Storefront pages isn't enabled (the link would 404, so enable this before any look entries go live).

---

## Feature: Social proof (Instagram/UGC photos)

### What
A manually curated grid of real customer/brand photos.

### Where
**Settings → Custom data → Metaobjects**, then **Content → Metaobjects**, then Theme Editor.

### Steps

1. Create the `Social Post` metaobject definition (see [docs/METAOBJECTS.md](METAOBJECTS.md#artwistic_social_post)).
2. Add an entry per photo: upload the real image, optionally link the real Instagram post URL, optionally tag a featured product.
3. Add the **"ARTWISTIC: Social proof"** section (homepage or wherever), add a block per photo, pick the entry.
4. Optionally set the section's **Instagram handle** field so the header links to your real profile.

### Required?
No — the section renders nothing until at least one photo is added.

---

## Feature: Delivery estimate calculator

### What
A state-based, no-API delivery date estimate on the product page.

### Where
**Online Store → Themes → Customize**, the "ARTWISTIC: Delivery estimate" block on the product page.

### Steps

1. Open the block's settings.
2. Confirm or adjust the **dispatch** business-day range (default 1–2) — this should match how long it actually takes you to pack and hand off an order.
3. Confirm or adjust the **transit** ranges: Gujarat/Maharashtra (default 2–3 business days) and all other states (default 3–5 business days) — these were set exactly as specified, adjust only if your actual courier performance differs.
4. **Review the holiday list** (`Non-business days` field). It's pre-filled with 2026's major nationally-observed gazetted holidays, sourced and cross-checked from official/near-official calendars at build time:
   `2026-01-26 (Republic Day), 2026-03-03 (Holi), 2026-03-21 (Id-ul-Fitr), 2026-03-31 (Mahavir Jayanti), 2026-04-03 (Good Friday), 2026-05-01 (Buddha Purnima), 2026-05-27 (Bakrid), 2026-06-26 (Muharram), 2026-08-15 (Independence Day), 2026-08-26 (Milad-un-Nabi), 2026-10-02 (Gandhi Jayanti), 2026-10-20 (Dussehra), 2026-11-08 (Diwali), 2026-11-24 (Guru Nanak's Birthday), 2026-12-25 (Christmas)`.
   **Important:** a couple of these (notably Holi, which spans two observance days) vary by a day depending on the source — cross-check against your actual courier partner's operating calendar and the [official India holiday calendar](https://www.india.gov.in/calendar) before launch, and add any regional holidays specific to your dispatch city that affect your courier's pickup schedule.
5. Save.

### Required?
**Yes, review before launch** — this is the second block in the whole build (after Purchase Confidence) that ships with specific numbers rather than blank/safe defaults, precisely because a delivery estimate needs to say something to be useful. Verify the numbers match reality.

### How it works (for reference)
Purely client-side JavaScript (`assets/artwistic-delivery-estimate.js`) — no server calls, no courier API. It takes "today," adds the dispatch business-day range, then adds the transit business-day range for whichever state group the shopper selects, skipping Sundays and every date in the holiday list at each step, and displays the resulting date range.

---

## Feature: Order confirmation email

### What
A branded HTML order confirmation email matching the ARTWISTIC visual identity.

### Where
**Settings → Notifications** (this is a separate system from the theme — not a theme file, so it wasn't included in the theme zip).

### Steps

1. Open the file `docs/emails/order-confirmation.liquid` in this project.
2. In Shopify Admin, go to **Settings → Notifications**.
3. Under **Customer notifications**, click **Order confirmation**.
4. Click **Edit code** (bottom of the page).
5. Select all the existing content in the code editor and replace it with the full contents of `docs/emails/order-confirmation.liquid`.
6. Click **Preview** (top right) to see it rendered with sample order data.
7. Click **Send test email** and check it in an actual inbox — Gmail, Outlook, and Apple Mail can all render email HTML slightly differently, so a real send is the only reliable check.
8. If a field looks blank that shouldn't be (e.g. shipping cost not showing), compare against Shopify's original default template content (visible via version history in the same code editor, or by creating a fresh test store) to confirm the exact variable name Shopify expects — the variables used here (`shop`, `order_name`, `customer`, `line_items`, `shipping_address`, `subtotal_price`, `total_price`, `total_tax`, `shipping_price`) are Shopify's standard, long-documented notification Liquid objects, but this was written without a live store to test against, so a real send-test is the verification step, not optional polish.
9. Once you're happy with it, it's live immediately — no publish step separate from saving.

### Optional: add your real logo
The template currently shows your shop name as text (email clients can't read theme settings, so it can't reference your theme's logo automatically). To use an image instead:
1. Upload your logo to **Content → Files** in Admin.
2. Copy its file URL.
3. In the email code, find the commented-out `<img>` line near the top and uncomment it with your real URL, removing the text-wordmark line above it.

### Required?
Optional, but recommended before launch — Shopify's own default template works fine as a fallback if you'd rather skip this.

---

## General notes

- Always **Save** after each Admin change, then reload the storefront preview to confirm.
- If a feature "does nothing" after setup, first check the exact Namespace/Key match (case-sensitive) against [METAFIELDS.md](METAFIELDS.md)/[METAOBJECTS.md](METAOBJECTS.md) before assuming a code issue.
- This file grows as new features ship. Every future ARTWISTIC feature that depends on any Admin-side configuration must add a section here before it is considered complete (see [FEATURE_REGISTER.md](FEATURE_REGISTER.md)).
