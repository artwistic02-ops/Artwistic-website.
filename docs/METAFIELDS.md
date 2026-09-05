# Metafield Register

Every metafield ARTWISTIC theme code reads. Create each one in Shopify Admin **before** the dependent feature will work correctly (features degrade gracefully — see each feature's "Used By" section — but will show placeholder/empty states without real data).

## How to create a metafield definition (general steps, referenced by every entry below)

1. Open **Shopify Admin**.
2. Go to **Settings → Custom data**.
3. Select the owner resource (**Products**, **Variants**, **Collections**, etc. — specified per metafield below).
4. Select **Add definition**.
5. Enter the exact **Name** and **Namespace and key** shown below (Shopify auto-generates the key from the name if you don't set it manually — always click "Edit" next to the namespace/key field to set it explicitly to the value listed here, so theme code can find it).
6. Choose the exact **Type** listed below.
7. Configure any **Validation** listed below.
8. Set whether it applies to **all products** or only certain ones (leave default: all).
9. Click **Save**.
10. Open the relevant product/variant/collection, scroll to the **Metafields** section, enter a value, and **Save**.
11. Verify the value renders on the storefront (each entry below says where).

---

## Product metafields

| Namespace | Key | Name | Type | Validation | Required | Purpose | Used By | Example |
|---|---|---|---|---|---|---|---|---|
| `artwistic` | `material` | Material | Single line text | — | Recommended | Primary material (e.g. "925 Sterling Silver") | Product page trust/material module | `18K Gold Vermeil` |
| `artwistic` | `finish` | Finish | Single line text | — | Optional | Surface finish/plating | Product page trust/material module | `High Polish` |
| `artwistic` | `plating` | Plating | Single line text | — | Optional | Plating detail, if applicable | Product page trust/material module | `2 micron gold plating` |
| `artwistic` | `dimensions` | Dimensions | Single line text | — | Optional | Physical size | Product page trust/material module | `Length: 16" + 2" extender` |
| `artwistic` | `weight_grams` | Weight (g) | Decimal | — | Optional | Weight in grams | Product page trust/material module | `3.2` |
| `artwistic` | `stones` | Stones | Single line text | — | Optional | Stone type(s), if any | Product page trust/material module | `Cubic Zirconia` |
| `artwistic` | `closure` | Closure Type | Single line text | — | Optional | How the piece fastens | Product page trust/material module | `Lobster clasp` |
| `artwistic` | `care_instructions` | Care Instructions | Multi-line text | — | Recommended | Jewellery-specific care guidance | Product page care accordion | `Avoid contact with water, perfume, and lotion. Store in the provided pouch.` |
| `artwistic` | `water_resistant` | Water Resistant | True or false | — | Optional | Whether the piece is safe for incidental water contact | Product page trust badges | `true` |
| `artwistic` | `anti_tarnish` | Anti-Tarnish | True or false | — | Optional | Whether the piece is treated to resist tarnishing | Product page trust badges | `true` |
| `artwistic` | `warranty` | Warranty | Single line text | — | Optional | Warranty terms, if offered | Product page trust module | `6-month manufacturing defect warranty` |
| `artwistic` | `package_contents` | Package Contents | Single line text | — | Optional | What ships in the box | Product page trust module | `1x necklace, branded pouch, care card` |

**Owner for all rows above:** Products.

---

## Navigation / menu metaobject fields

See [METAOBJECTS.md](METAOBJECTS.md) for the `artwistic_menu_promo` metaobject used by the mega menu feature — it is a metaobject, not a metafield, but is registered there for completeness.

---

## Status

This register will grow as each flagship feature lands. Only metafields actually read by shipped theme code are listed above — do not pre-create metafields for backlog features until they are implemented (see [FEATURE_REGISTER.md](FEATURE_REGISTER.md)).
