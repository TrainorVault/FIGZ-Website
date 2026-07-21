# FIGZ Collection — Premium Ecommerce Redesign Proposal

**Prepared for:** Chris — FIGZ Collection (figzcollection.com)
**Date:** 21 July 2026
**Reference site analysed:** X Games League (React/Vite SPA backed by `xgamesmerch.myshopify.com`)
**Current store:** Shopify Basic · AUD · Australia · 5 active products · drop-based collectibles model

---

## 1. Executive Summary

FIGZ is mid-pivot from an accessories catalog (stickers, griptape, caps) into a **limited-edition action-sports collectibles brand** — the RWilly Vol. 1 figurine (1,000 worldwide, first 150 hand-signed), the OG Plush, Collect Culture™ apparel. That pivot is the single most important input to this redesign, because the reference site you chose — X Games League — is built on exactly the model FIGZ is moving toward: **athletes and moments drive attention; limited merch monetises it.**

The proposal in one paragraph: rebuild figzcollection.com as a **custom Shopify Online Store 2.0 theme** (not headless) with a dark, editorial, drop-culture design language adapted from the reference — athlete/rider hub, drop calendar with countdowns, serial-numbered product presentation, and a collector-first product page. Everything content-managed through Shopify's admin using **metaobjects** (Riders, Drops, Editions) so a non-technical team member can run the entire site — new drops, new riders, new homepage takeovers — without touching code.

What this achieves:

- The **content-commerce flywheel** that makes X Games League work: riders → hype → drops → scarcity → community → repeat.
- Premium visual quality on par with Gymshark/Kith drops pages, at Shopify-theme simplicity.
- A store that stays fast (target 95+ Lighthouse) because it *avoids* the reference's biggest technical mistake (a 541 KB client-rendered React bundle).
- A clean upgrade path: nothing proposed here locks you out of Shopify Plus or headless later.

---

## 2. Technology Recommendation

### Analysis of the reference's stack — and its lesson

The X Games League site is a **client-side React SPA (Vite build) with Shopify as a headless backend**. Decompiling the bundle shows: React 18 production build, all content client-rendered, product images served from `xgamesmerch.myshopify.com/cdn`, a single ~541 KB HTML payload before any content paints.

That architecture produces its polish — and also its weaknesses: blank first paint, poor SEO (no server-rendered content), and every content change requiring a developer. **We should copy its design language, not its architecture.**

### Options compared

| | Shopify Theme (off-the-shelf) | **Shopify + Custom Theme (OS 2.0)** ✅ | Shopify Headless (Hydrogen) | Shopify + Next.js |
|---|---|---|---|---|
| Design ceiling | Medium — always looks "like a theme" | **High — pixel-level control** | Highest | Highest |
| Admin simplicity | High | **High — full drag-and-drop sections** | Low (dev required for content) | Low |
| Performance | Varies (often bloated) | **Excellent if built lean** | Excellent (if done well) | Excellent (if done well) |
| SEO | Good | **Excellent (server-rendered Liquid)** | Good (needs care) | Good (needs care) |
| Checkout | Native | **Native (Shop Pay, full trust)** | Native via redirect | Native via redirect |
| App ecosystem | Full | **Full** | Partial (many apps assume a theme) | Partial |
| Build cost/time | Days | **3–6 weeks** | 2–4 months | 2–4 months |
| Ongoing cost | Theme licence | **None after build** | Developer on retainer | Developer on retainer |
| Fits "no developer for everyday tasks" | Yes | **Yes** | No | No |

### Recommendation: **Shopify + Custom OS 2.0 Theme**

Built from a lean base (fork of Dawn/Skeleton — Shopify's reference themes — stripped and reskinned), because:

1. **Your hard requirement is admin simplicity.** Headless breaks it — every homepage change becomes a deploy. OS 2.0 sections + metaobjects give a non-technical person full control of every page.
2. **Your catalog is small and drop-based** (5 active products today). Headless's benefits (app-like navigation at massive scale) don't apply; its costs (SEO work, retainer developer, app incompatibility) all do.
3. **Server-rendered Liquid beats the reference's SPA on the metrics that matter**: first paint, SEO, Core Web Vitals. The premium *feel* comes from design tokens, typography, imagery, and small amounts of well-placed JavaScript — not from a framework.
4. **Native checkout** keeps Shop Pay, Apple Pay/Google Pay, Afterpay (available in AU), fraud analysis, and PCI compliance with zero work.
5. **Basic plan is fine to launch.** Upgrade to Shopify ($) or Plus only when volume justifies it — the theme carries over untouched.

---

## 3. Website Architecture (Sitemap)

```
figzcollection.com
├── Home
├── Shop
│   ├── All Products            /collections/all
│   ├── Collectibles            /collections/collectibles      (figurines, plush)
│   ├── Apparel                 /collections/apparel           (tees, hoodies)
│   ├── Stickers & Accessories  /collections/stickers-accessories
│   └── Sale                    /collections/sale
├── Drops                       /pages/drops        ← drop calendar (metaobject-driven)
│   └── [Drop detail]           /pages/drops#vol-1  (or per-drop landing pages)
├── Riders                      /pages/riders       ← team hub (metaobject-driven)
│   └── [Rider profile]         e.g. /pages/ryan-williams
├── Collect Culture™            /blogs/news         ← editorial: behind the drops, rider stories
├── About / Our Story           /pages/about        (2017 origins, athlete royalty model)
├── Support
│   ├── FAQ                     /pages/faq
│   ├── Shipping & Delivery     /pages/shipping
│   ├── Returns & Exchanges     /pages/returns
│   ├── Contact                 /pages/contact
│   └── Authenticity Guarantee  /pages/authenticity  ← collector trust page
├── Account                     /account  (login, orders, addresses, wishlist)
├── Cart (drawer, not page)     /cart as fallback
└── Legal: Privacy · Terms · Refund Policy · Cookie Policy
```

**Navigation (desktop):** `Shop ▾ · Drops · Riders · Our Story` + logo centre + `Search · Account · Cart` right. Max 4 top-level items — the reference keeps nav ruthlessly short and so should we.

**Navigation (mobile):** sticky top bar (burger · logo · cart), full-screen overlay menu with large Archivo type, and the current/next drop pinned at the top of the menu ("VOL. 1 — LIVE NOW ●" in gold).

---

## 4. Homepage Wireframe

Design tokens adapted from the reference: layered near-blacks (`#050506` base, `#0A0A0B`/`#131318`/`#15151B` surfaces), **gold accent `#F5C518`** (FIGZ's premium/collector colour), live-red `#FF3B3B` for urgency states, muted greys for secondary text. Type: **Archivo 700–900 uppercase** for display, **Barlow 400–600** for body. Generous spacing, 12-col grid, max-width ~1440px.

| # | Section | Content & behaviour |
|---|---------|--------------------|
| 0 | **Announcement bar** | Rotating: "Free AU shipping over $X" / "First 150 hand-signed" / "Riders earn royalties on every sale". Dismissible. |
| 1 | **Hero — current drop** | Full-viewport image/video of the live drop (RWilly Vol. 1). Overline in gold: `VOL. 1 — LIVE NOW ●` (red pulse dot, borrowed from the reference's LIVE NOW pattern). H1 in Archivo 900. Two CTAs: "Shop the Drop" (gold, solid) + "The Story" (ghost). Subtle slow Ken Burns zoom on the image. |
| 2 | **Drop status strip** | Horizontal band: edition counter ("__ of 1,000 remaining"), signed-edition badge, ship window ("Ships Q4 2026"), countdown when a drop is upcoming. This is the scarcity engine — dynamic, metafield-driven. |
| 3 | **Featured product rail** | 3–4 product cards, large imagery on dark surface cards, hover swaps to lifestyle shot, "Add to Cart"/"Choose Options"/"Sold Out" states exactly as the reference does them. |
| 4 | **Riders to Watch** | Adapted from the reference's "Athletes to Watch": horizontal scroll of rider cards (portrait, name in Archivo, discipline tag, gold accent line). Click → rider profile with their signature products. |
| 5 | **The Model** (trust/story) | Three-column: "Limited worldwide" / "Athlete royalties on every sale" / "Authenticity guaranteed". Icons minimal, line-weight, gold. |
| 6 | **Drop calendar teaser** | "Next drop" card with countdown + "Set Reminder" (Klaviyo email/SMS capture — the reference's Set Reminder pattern turned into list growth). |
| 7 | **Collect Culture™ editorial** | 2–3 latest blog/video tiles: behind-the-scenes, rider clips, unboxings. Full-bleed imagery, minimal text. |
| 8 | **UGC / community strip** | Instagram-style grid of collector photos (tagged #FIGZ), each shoppable. |
| 9 | **Email/SMS capture** | "Join the List — early access to every drop." Klaviyo embedded form, one field, gold button. |
| 10 | **Footer** | 4 columns (Shop / Drops / Support / Company), payment icons (Shop Pay, Apple Pay, PayPal, Afterpay), AUD selector, socials, ABN, policies. Dark surface `#0A0A0B`, hairline dividers. |

**Motion language:** fade-up on scroll (IntersectionObserver, CSS transforms only, `prefers-reduced-motion` respected), 150–250 ms ease-out hovers, no scroll-jacking, no parallax libraries.

---

## 5. Collection Page

**Layout:** editorial header (collection title in Archivo 900 + 1-line description + optional full-bleed banner), then product grid — 2-up mobile, 4-up desktop, generous gutters.

**Functionality:**
- **Filtering** via Shopify's native Search & Discovery app (free): availability, price, product type, rider (via tags/metafields). Filter drawer on mobile, sidebar-less pill row on desktop — keep it minimal; you have a small catalog.
- **Sort:** Featured (manual — you curate), Newest, Price.
- **Product cards:** image (4:5), hover second image, title, price, and *state badges*: `SIGNED EDITION` (gold), `LOW STOCK` (red, when < threshold), `SOLD OUT` (grey, card stays visible — sold-out proof is social proof in drop culture; the reference does this deliberately).
- **Quick add** for single-variant products; "Choose Options" opens a variant drawer for apparel (no full page reload needed to add).
- Server-rendered, paginated (not infinite scroll — better for SEO and footer access at your catalog size).

---

## 6. Product Page (the money page)

Top-to-bottom, mobile-first:

1. **Gallery** — swipeable, edge-to-edge on mobile; sticky left column on desktop. Mix of studio shots on dark, lifestyle, detail macro (signature close-up), and a short auto-muted video loop. Pinch/tap zoom.
2. **Buy box** (sticky right column desktop):
   - Overline: `FIGZ COLLECTIBLES — VOL. 1` (gold, uppercase, letterspaced)
   - Title (Archivo 800) + price in AUD
   - **Edition block** (collectible products): "Limited to 1,000 worldwide · First 150 hand-signed · Ships Q4 2026" with a live remaining-stock bar when below 25%. Metafield-driven.
   - Variant selector (size pills for apparel, with a size-guide modal link)
   - **Add to Cart** — full-width gold button; secondary "Buy with Shop Pay" beneath
   - Afterpay/Klarna instalment line ("or 4 × $12.50 with Afterpay")
   - **Back in stock** — inline notify form on sold-out variants (Klaviyo)
3. **Trust row** — 3 micro-icons: Authenticity guaranteed · Tracked shipping worldwide · Rider royalties on every sale.
4. **Story section** — long-form editorial: the rider, the artwork, the making-of. This is where collectibles earn their price. Rich metafield content, images alternate left/right.
5. **Specs accordion** — materials, dimensions, edition details, care.
6. **Reviews** — Judge.me (photo reviews). Seed with early collector reviews; show star summary near title once ≥ 5 reviews.
7. **"Complete the collection" (cross-sell)** — the RWilly figurine page shows the RWilly sticker + tee ("Collectors also bought"). Metafield-curated, not algorithmic — you control the pairing.
8. **FAQ accordion** — pre-order timing, signed-edition allocation, shipping, returns. Answers objections *on the page*, cuts support tickets.
9. **Recently viewed** rail.
10. **Sticky Add-to-Cart bar** — appears on scroll past the buy box (mobile + desktop): thumbnail, title, price, variant, ATC button. This is consistently one of the highest-ROI CRO features on mobile.

**Pre-order handling** (RWilly ships Q4 2026): "Pre-order" replaces "Add to Cart" label, ship window stated at the button, again in cart, again on the order confirmation. Clarity here prevents chargebacks.

---

## 7. Cart & Checkout

**Cart = slide-out drawer** (never a page navigation mid-flow):
- Line items with edition badges, variant, quantity steppers
- **Free-shipping progress bar** ("You're $18 away from free AU shipping") — top AOV lever
- One curated **cart upsell** slot (sticker/keychain — low-price impulse add, metafield-controlled)
- Shipping reassurance line + payment icons
- Single gold "Checkout" button → straight to Shopify checkout. No "view cart" detour, no gimmicks.

**Checkout — native Shopify:**
- Shopify Payments (AUD) + PayPal + Apple Pay + Google Pay + **Shop Pay** (highest-converting accelerated wallet) + **Afterpay** (essential for AU youth demographic)
- Branding: logo, Archivo headings, gold accent buttons — configured in checkout editor (available on Basic)
- Express wallets shown first on mobile
- Post-purchase: order-status page with tracking; for pre-orders, a "what happens next" block
- Note: deeper checkout customisation (custom fields, one-page upsell apps at checkout) is Plus-gated — not needed at launch; revisit at scale.

---

## 8. Admin Experience

Everything below is doable by a non-technical person in Shopify admin:

| Task | How |
|---|---|
| Add/edit/remove products, pricing, images | Products — as today |
| Change homepage hero, reorder sections, launch a drop takeover | Theme editor — drag-and-drop OS 2.0 sections, all text/images/links exposed as settings |
| Add a rider | **Metaobject: Rider** (name, photo, discipline, bio, socials, linked products) → appears on Riders page + their product pages automatically |
| Schedule a drop | **Metaobject: Drop** (title, hero media, launch datetime, linked products, story) → drop calendar, countdowns, homepage strip all update automatically |
| Edition details on a product | Product **metafields**: edition size, signed count, ship window, "complete the collection" links |
| Menus, pages, blogs | Navigation / Pages / Blog posts — native |
| Discounts, gift cards | Discounts — native (gift cards included on all plans) |
| Orders, fulfilment, labels, tracking, refunds | Orders — native; buy AusPost/Sendle labels via app |
| Email/SMS campaigns & flows | Klaviyo dashboard |
| Theme changes with safety | Duplicate theme → edit → preview → publish. Code never required for content. |

The metaobject architecture is the heart of the admin story: **Riders and Drops become first-class content types** you manage like products, and the theme renders them everywhere automatically.

---

## 9. Integrations

| Purpose | Tool | Notes |
|---|---|---|
| Email + SMS + flows | **Klaviyo** | Welcome, abandoned cart/checkout, back-in-stock, drop reminders, post-purchase, win-back |
| Reviews | **Judge.me** | Photo reviews, structured-data stars, cheaper than Okendo at this stage |
| Meta Pixel + Conversions API | **Facebook & Instagram app** | Server-side CAPI included — critical for iOS attribution |
| GA4 + Google Ads | **Google & YouTube app** | Plus Google Search Console verification |
| Tag management | GTM via theme setting | Keep tags minimal — every tag costs Lighthouse points |
| TikTok Pixel | **TikTok app** | Your demographic lives here |
| Pinterest | Pinterest app | Lower priority |
| Filtering & search | **Shopify Search & Discovery** | Free, native |
| Back in stock | Klaviyo native BIS triggers | One less app |
| Wishlist | Swym Wishlist Plus (or defer) | Nice-to-have, not launch-blocking |
| Shipping labels (AU) | Sendle / Australia Post via app | Compare rates for figurine-sized parcels |
| Cookie consent / GDPR | Shopify native Customer Privacy | Free, geo-targeted banner |
| Loyalty (Phase 3) | Smile.io or Rivo | "Collector points" — fits the brand perfectly |
| Bundles (Phase 3) | Shopify Bundles app | Figurine + sticker + tee "Collector Pack" |

**Deliberately excluded:** page-builder apps (Shogun/GemPages — bloat; sections cover it), countdown-timer apps (built into theme), review-widget scripts loaded globally (load on PDP only).

---

## 10. Performance & SEO

**Performance budget (enforced, not aspirational):**
- ≤ 50 KB JS (gzipped) sitewide, zero JS frameworks, no jQuery
- LCP < 1.8 s mobile / CLS < 0.05 / INP < 200 ms
- Hero image: AVIF/WebP via Shopify CDN, `fetchpriority="high"`, explicit dimensions; everything below the fold lazy-loaded
- Fonts: self-hosted WOFF2 Archivo + Barlow, `font-display: swap`, preloaded, subset
- Apps audited quarterly — every app script must justify its Lighthouse cost

**SEO:**
- Server-rendered Liquid = fully crawlable (the reference's SPA fails this)
- JSON-LD: `Organization`, `Product` (with `offers`, review stars), `BreadcrumbList`, `FAQPage` on PDP FAQs
- Unique meta titles/descriptions per product/collection (template + per-item override)
- Canonicals, sitemap.xml, robots.txt — Shopify native
- **Content moat:** Collect Culture™ blog + rider profile pages target "ryan williams collectible", "scooter collectibles", "figz vol 1" — searches you can own outright
- 301-map any changed URLs from the current site at launch (Shopify URL redirects)

---

## 11. Conversion Optimisation

**Conversion rate:**
- Scarcity engine: edition counters, LOW STOCK / SIGNED EDITION badges, visible sold-out cards
- Sticky ATC (mobile especially), express wallets first, Afterpay messaging at price
- FAQ + trust row on PDP; Authenticity Guarantee page linked from every buy box
- Drop countdowns + "Set Reminder" → arrive-warm traffic on launch day

**Average order value:**
- Free-shipping threshold bar in cart (set ~1.4× current AOV)
- "Complete the collection" curated cross-sells (sticker at $4 is a frictionless add to a $50 figurine)
- Collector Packs (bundles) — Phase 3
- Post-purchase email flow with a 14-day companion-product offer

**Lifetime value:**
- The volume model itself: Vol. 1 → Vol. 2 → Vol. 3 creates a built-in repeat-purchase engine — the site must make "collect them all" legible (volume numbering everywhere, a "your collection" concept later)
- Klaviyo flows: drop announcements to past buyers first ("Collectors get 24-hour early access")
- Collector points loyalty (Phase 3); rider content keeps non-buying visits valuable

**Measurement:** GA4 funnels + Shopify analytics; establish baseline CVR/AOV pre-launch; A/B via theme duplicate tests for big swings.

---

## 12. Development Roadmap

**Phase 0 — Foundations (Week 1)**
Design tokens locked (colours, type scale, spacing), Figma or coded style-tile of homepage + PDP, metaobject schema defined (Rider, Drop), app shortlist installed on a dev store copy.

**Phase 1 — Core theme (Weeks 2–4)**
Fork lean base theme → strip → reskin. Build: header/nav/mobile menu, footer, homepage sections (hero, drop strip, product rail, riders rail, editorial, capture), collection template, PDP with edition block + sticky ATC, cart drawer with shipping bar + upsell slot. Klaviyo, Judge.me, pixels wired.

**Phase 2 — Content types & pages (Weeks 4–5)**
Riders hub + profile template, Drops calendar page with countdown, About/Authenticity/FAQ/Support pages, blog templates, structured data, redirects mapped.

**Phase 3 — QA & launch (Week 6)**
Device lab pass (iPhone SE→Pro Max, Android, iPad), Lighthouse ≥ 95 on home/collection/PDP, checkout test orders (all payment methods incl. Afterpay), Klaviyo flow tests, pixel event validation (Meta Events Manager, GA4 DebugView), accessibility pass (WCAG AA contrast on dark UI), launch with theme rollback ready.

**Phase 4 — Post-launch (ongoing)**
Vol. 2 drop runs entirely through admin (the real test of the metaobject system), loyalty + bundles, "My Collection" account feature, quarterly app/performance audit, plan upgrade when volume warrants.

---

## Appendix A — What the reference does well (and what we're *not* copying)

**Adopting:** dark layered surfaces with a single gold accent; heavy uppercase display type over photography; LIVE/UPCOMING state language; athlete cards as first-class content; sold-out-as-social-proof; ruthless nav brevity; "Set Reminder" as list capture.

**Rejecting:** client-rendered React SPA (blank first paint, no SEO); 541 KB initial payload; content changes requiring developers; event-results complexity that doesn't map to a merch brand.

## Appendix B — Current-state notes (from the live store)

- Shopify Basic, AUD, single location, 2 collections, 5 active products
- Variant SKUs missing on apparel/plush/sticker products — fill before launch (fulfilment + analytics depend on them)
- `productType` empty on all products — set (Figurine / Apparel / Plush / Sticker) to power filtering and reporting
- Collection imagery not set — needed for the new collection headers
- Tag-based smart collection (`FIGZ`) works but will need the category tags above as the catalog grows
