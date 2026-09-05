# Dawn Update Guide

How to safely pull a newer Dawn release into this theme without breaking ARTWISTIC functionality.

## 1. Architecture recap

```
Shopify → Dawn (upstream) → ARTWISTIC customization layer
```

ARTWISTIC code lives almost entirely in files that do not exist in stock Dawn (`artwistic-*.css/js`, `sections/artwistic-*.liquid`, `snippets/artwistic-*.liquid`, `docs/*`, this file, `ARTWISTIC_CHANGELOG.md`). A small, explicitly documented set of stock Dawn files carry minimal, marked edits. Every one of those edits is logged in [ARTWISTIC_CHANGELOG.md](ARTWISTIC_CHANGELOG.md) with the exact diff and why it was unavoidable.

## 2. Files that are ARTWISTIC-only (safe to ignore during a Dawn merge)

Anything matching:
- `assets/artwistic-*`
- `sections/artwistic-*.liquid`
- `snippets/artwistic-*.liquid`
- `docs/**`
- `ARTWISTIC_CHANGELOG.md`, `DAWN_UPDATE_GUIDE.md`

These never exist in upstream Dawn, so a Dawn update cannot conflict with them directly. Just carry them forward untouched.

## 3. Files with deliberate ARTWISTIC modifications (require care during a merge)

Check [ARTWISTIC_CHANGELOG.md](ARTWISTIC_CHANGELOG.md) for the authoritative, up-to-date list. As of this writing:

| Dawn file | What changed | Why |
|---|---|---|
| `layout/theme.liquid` | Added one `<link>`/`stylesheet_tag` line after Dawn's `base.css` tag, and one `<script>` line after Dawn's `global.js` tag, each wrapped in an `{%- comment -%} ARTWISTIC: ... {%- endcomment -%}` marker | Load ARTWISTIC's global design tokens/utilities theme-wide; no section/snippet hook exists for `<head>` or the global script list |

Search any modified Dawn file for the literal string `ARTWISTIC:` to find every marked edit quickly:

```bash
grep -rn "ARTWISTIC:" --include="*.liquid" .
```

## 4. Step-by-step update process

1. **Obtain the new Dawn version.** Download/clone the target Dawn release from Shopify's official [Dawn repository](https://github.com/Shopify/dawn) (match the release tag you want).
2. **Diff upstream Dawn against upstream Dawn**, not against this repo: compare the new Dawn release to the Dawn version this theme was originally forked from, to see what Shopify actually changed.
   ```bash
   git diff dawn-vOLD..dawn-vNEW -- . ':!assets/artwistic-*' ':!sections/artwistic-*' ':!snippets/artwistic-*' ':!docs' ':!ARTWISTIC_CHANGELOG.md' ':!DAWN_UPDATE_GUIDE.md'
   ```
3. **Apply Shopify's upstream changes** to this theme's copy of each affected Dawn file, EXCEPT the files listed in section 3 above.
4. **For files listed in section 3**, apply Shopify's upstream changes manually, then re-insert the ARTWISTIC-marked lines from [ARTWISTIC_CHANGELOG.md](ARTWISTIC_CHANGELOG.md) at the equivalent location. Search for the `ARTWISTIC:` marker in the pre-update file to see exactly where it was.
5. **Leave every ARTWISTIC-only file untouched** (section 2).
6. **Run regression testing** (section 5 below).
7. **Verify performance** (section 6).
8. **Verify SEO** (section 7).
9. **Verify functionality** (section 8).
10. **Roll back if necessary** (section 9).

## 5. Regression testing after a merge

- Load the theme in Theme Editor; add/remove/reorder every ARTWISTIC section; confirm no schema errors.
- Run Shopify Theme Check (`shopify theme check`) and resolve new errors/warnings.
- Manually exercise: homepage, header/mega menu, product page (gallery, trust modules, add to cart), collection page, cart, search — at minimum on mobile (375px) and desktop (1440px).
- Confirm no console errors in the browser.

## 6. Verifying performance after a merge

- Re-run Lighthouse (mobile + desktop) on homepage, a collection page, and a product page. Compare against the numbers in [docs/PERFORMANCE.md](docs/PERFORMANCE.md).
- Check that Dawn's update didn't introduce new render-blocking assets ahead of ARTWISTIC's `artwistic-global.css`/`.js`.

## 7. Verifying SEO after a merge

- Confirm structured data still validates (Google Rich Results Test) on a product page and the homepage.
- Confirm canonical tags, meta descriptions, and heading hierarchy are unchanged from [docs/SEO.md](docs/SEO.md)'s expectations.

## 8. Verifying functionality after a merge

- Walk the QA checklist in [docs/FEATURE_REGISTER.md](docs/FEATURE_REGISTER.md) for every shipped ARTWISTIC feature.

## 9. Rolling back

Because every change is a git commit (see repo history) and ARTWISTIC's own files are isolated:
```bash
git revert <merge-commit-sha>
```
or, if the merge hasn't been pushed, `git reset --hard <pre-merge-sha>`. Since ARTWISTIC files are untouched by Dawn's changes, a revert of the merge commit alone is sufficient to restore the previous working state — it will not remove any ARTWISTIC feature.
