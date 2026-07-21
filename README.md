# FIGZ Collect — Custom Shopify Theme

A custom Shopify Online Store 2.0 theme for **FIGZ Collection** — dark, editorial, drop-culture design built for limited-edition action-sports collectibles.

Design direction and full rationale: [`docs/REDESIGN-PROPOSAL.md`](docs/REDESIGN-PROPOSAL.md).
The design-language reference (X Games League SPA capture) is preserved at `reference/xgames-league.html`.

## Structure

Standard Shopify theme layout — `layout/`, `sections/`, `snippets/`, `templates/`, `config/`, `assets/`, `locales/`. Zero frameworks: one CSS file (`assets/base.css`), one JS file (`assets/global.js`, vanilla, ~9 KB gzipped).

## Getting it onto the store

**Option A — GitHub integration (recommended):**
Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → pick this repo + branch. Edits made in the theme editor sync back as commits.

**Option B — Shopify CLI:**
```bash
npm i -g @shopify/cli
shopify theme dev --store figzcollection.myshopify.com   # live preview
shopify theme push --unpublished                          # upload as draft theme
```

Preview as an unpublished theme first. Publish only after checkout test orders pass.

## One-time store setup

### 1. Metafields (Settings → Custom data → Products)

| Definition | Namespace & key | Type | Used for |
|---|---|---|---|
| Edition size | `figz.edition_size` | Integer | "Limited to N worldwide" + remaining-stock bar |
| Signed count | `figz.signed_count` | Integer | "First N hand-signed" + SIGNED EDITION badges |
| Ship note | `figz.ship_note` | Single line text | "Ships Q4 2026" line; auto-switches button to Pre-Order |
| Drop label | `figz.drop_label` | Single line text | Overline on cards + product page (e.g. "FIGZ COLLECTIBLES — VOL. 1") |
| Companions | `figz.companions` | List of products | Curated "Complete the Collection" cross-sells |

Collections also support `figz.overline` (single line text) for the collection-page overline.

### 2. Menus (Online Store → Navigation)
- `main-menu`: Shop, Drops, Riders, Our Story
- `footer`: linked per footer column in the theme editor

### 3. Theme settings (Customize → Theme settings)
- Upload logo + favicon
- Cart: free-shipping threshold + upsell product (e.g. the $4 sticker)
- Social URLs

### 4. Apps
Klaviyo (email/SMS + back-in-stock), Judge.me (reviews), Shopify Search & Discovery (collection filters), Facebook & Instagram, Google & YouTube, TikTok.

### 5. Catalog hygiene (flagged in the proposal)
- Add SKUs to all variants
- Set Product type on every product (Figurine / Apparel / Plush / Sticker)
- Add collection images

## Content model

- **Homepage** — every section (hero, drop strip, product rail, riders, value props, editorial, newsletter) is editable/reorderable in the theme editor.
- **Launching a drop** — update the hero section, drop-status strip (countdown date is an ISO string, e.g. `2026-09-01T09:00:00+10:00`), and mobile-menu drop banner in the header settings. No code.
- **Product storytelling** — add "Story block" and "Accordion" blocks on the product template, or per-product via a template suffix.

## Performance budget

- No JS frameworks, no jQuery, no external CSS
- LCP image gets `fetchpriority="high"`; everything below the fold lazy-loads
- Every added app script must justify its Lighthouse cost — audit quarterly
