# FLARE Public Demo — Design Spec

**Date:** 2026-05-23
**Author:** Chris Dillon (via Claude)
**Status:** Approved for implementation planning
**Lives at:** `/flare/` on christopherdillon.me

## Purpose

A fully interactive, anonymised public showcase of FLARE — the internal BI platform Chris built at Nexus Brands Group. Visitors should leave understanding the breadth and polish of the platform without seeing any real Nexus data, copy, or business identity.

Linked from the main page Experience bullet and the Consultancy page so prospective clients and recruiters can see, not just read about, the work.

## Non-goals

- Real authentication or persistence
- Mobile-first responsive design (desktop-first, like real FLARE; graceful narrow-viewport degradation only)
- Cross-dashboard state (each dashboard is independent except for the global business switcher)
- Live data, server-side anything, build-time data generation. Everything runs in the browser from baked-in fake data.

## Fictional context

- **Parent:** Helios Brands Co. — a fictional PE-backed e-commerce retail rollup
- **Sister brands** (deliberately unrelated to Nexus's real sectors of beauty / tattoo / pet grooming):
  - **Trailcraft** — outdoor & camping gear
  - **Hearthline** — home fragrance & candles
  - **Quill & Press** — premium stationery
  - **Velora** — speciality coffee & accessories
- **Demo session identity:** `demo@flare.ops` — appears in the top-bar user badge

All numbers, SKUs, customer counts, and warehouse layouts are invented and deterministic (same seed, same numbers every visit).

## Visual identity

Mirrors the canonical FLARE design tokens from `GIT_PROJECTS/DASHBOARDS/dashboard_theme/tokens.py`. Core palette:

| Token | Hex | Use |
|---|---|---|
| `VOID` | `#061C2A` | Page edges only |
| `BG` | `#0A2535` | Primary background |
| `SURFACE` | `#133142` | Cards, panels, sidebar |
| `SURFACE_ALT` | `#1C3D50` | Elevated / hover |
| `RULE` | `rgba(232,236,242,0.08)` | Default hairline |
| `INSTRUMENT` | `#E8ECF2` | Headings, KPI values |
| `READ` | `#B8C0D0` | Body |
| `MUTE` | `#8792A6` | Captions, tab labels |
| `DIM` | `#5B657A` | Meta, timestamps |
| `ACCENT` (International Orange) | `#FF4F00` | Links, active states, ≤8% of any surface |
| `POSITIVE` / `WARNING` / `CRITICAL` | `#16a34a` / `#eab308` / `#d4001a` | Traffic-light KPI status |

Font: **IBM Plex Sans** (body) and **IBM Plex Mono** (metrics, meta) — matches the rest of the site and is the FLARE Streamlit font.

The existing flare-mark SVG from the main site is reused as the FLARE wordmark glyph.

## Pages and structure

```
/flare/
  index.html              — public landing
  login/index.html        — fake Entra SSO sign-in mockup
  app/index.html          — single-page dashboard shell (hash-routed)
  flare.css               — shared styles using tokens above
  flare-data.js           — deterministic fake-data generator (seeded RNG)
  flare-charts.js         — Chart.js theming + chart factory wrappers
  flare-app.js            — shell behaviour: nav, business switcher, hash routing
  dashboards/
    exec.js
    sku.js
    stats.js
    warehouse.js
    bundle.js
```

### `/flare/` — public landing

- Hero: FLARE wordmark + flare-mark, one-line positioning ("Self-hosted, zero-per-seat BI for multi-business retail groups"), short prose context (~80 words)
- "What's inside" section: thumbnail / icon row of the six dashboards
- "Behind the scenes" section: short factual block — "Real FLARE is the platform I built at Nexus Brands Group, serving 18 businesses. This demo runs entirely in your browser on invented data."
- Primary CTA: **Launch demo →** (links to `/flare/login/`)
- Secondary CTA: back to consultancy page

### `/flare/login/` — fake Entra sign-in

- Faithful styling of a Microsoft Entra (Azure AD) sign-in screen, but with FLARE branding and obvious "demo" markers (a small `DEMO` chip, the email prefilled as `demo@flare.ops`).
- One **Sign in** button → routes to `/flare/app/`
- A small "this is a static demo — no real auth" disclaimer in DIM text at the bottom
- This page exists to make the SSO/Entra story tangible, not to be functional

### `/flare/app/` — dashboard shell

Single HTML page; hash routing for dashboards:
- `#/exec` (default)
- `#/sku`
- `#/stats`
- `#/warehouse`
- `#/bundle`

**Top bar:**
- Left: FLARE wordmark, then a **business switcher** dropdown (Group rollup / Trailcraft / Hearthline / Quill & Press / Velora)
- Right: search input (cosmetic, no behaviour), notifications bell (cosmetic), user badge `demo@flare.ops` with avatar circle

**Left sidebar:**
- Section label "OBSERVE"
- Items: Exec overview · Per-SKU · Statistical · Warehouse · Bundles
- Active item gets the ACCENT colour and an orange left-edge bar

**Main content area:**
- Each dashboard module exports a `render(businessKey)` function that builds its DOM into the main pane
- Switching business or dashboard re-renders only what changed

## Dashboards

### 1. Executive overview (`#/exec`)

- 4-tile KPI strip (Revenue, GM%, OTIF, Stockouts) with sparkline + delta vs LY
- Row of 4 traffic-light cards per business showing on-target/near/below status
- Time-series chart: revenue and GM% on dual axis, last 24 weeks
- "Top movers" table: 5 SKUs up most, 5 down most in last 4 weeks

### 2. Per-SKU analysis (`#/sku`)

- Filterable text search + category filter chips
- Sortable table: SKU code, name, margin %, velocity (units/week), days cover, last stockout, status pill
- Click row → right-hand drill-down panel with:
  - Sparkline of weekly units (52w)
  - Mini stats grid (revenue YTD, units YTD, avg basket size, return rate)
  - Recent activity log (fake events)

### 3. Statistical analysis (`#/stats`)

- Header card: pick a promo period from a dropdown (e.g., "Trailcraft — May Tent Promo")
- Two-panel comparison: pre-period vs post-period mean basket value, with 95% CI as error bars
- Significance flag (ACCENT chip if p<0.05) and computed p-value
- Bar chart by SKU category showing lift % with CI whiskers
- Methodology footer (small): "Welch's t-test, 95% CI, n shown per bar"

### 4. Warehouse heatmap (`#/warehouse`)

- Grid of warehouse bins (~20×12) rendered as SVG cells, coloured by utilisation %
- Legend strip beneath: 0% → 100%
- Hover a bin: tooltip with bin code, utilisation %, last picked
- Click a bin: right-hand panel lists top SKUs stored there and pick frequency
- Filter row above grid: aisle dropdown, utilisation slider

### 5. Bundle & basket intelligence (`#/bundle`)

- Affinity matrix: ~12×12 SKU-pair heatmap, colour = co-purchase lift
- Click a cell: top 10 co-purchased pairs list updates to show that pair's recent baskets
- Sidebar of top bundle suggestions ranked by lift × frequency

## Technical approach

- **No build step.** Plain HTML, CSS, JS — fits the existing Pascal/Nyquist pattern. Jekyll just serves the files.
- **Charts:** Chart.js v4 via CDN. Themed once at `flare-charts.js` to match tokens.
- **Heatmap (warehouse + bundle matrix):** hand-rolled SVG — Chart.js heatmap support is weak and SVG gives us full styling control.
- **Data:** `flare-data.js` exports a `getData(businessKey)` function. Uses a mulberry32 seeded RNG so numbers are deterministic per (business, dashboard) — visitors see identical numbers on refresh, and the four businesses look meaningfully different.
- **Routing:** vanilla `window.addEventListener('hashchange', ...)`. Default to `#/exec`.
- **State:** `selectedBusiness` lives in a tiny module-level object plus localStorage; a `business-changed` custom event re-renders the active dashboard.
- **No accessibility regressions:** semantic HTML, keyboard-navigable sidebar and switcher.

## Interactivity inventory (the "fully interactive" promise)

| Control | Behaviour |
|---|---|
| Business switcher | Re-renders all charts on the active dashboard |
| Sidebar nav | Switches dashboards via hash |
| SKU table sort | Click column header, toggles asc/desc |
| SKU text/category filter | Filters table rows live |
| SKU row click | Opens drill-down panel |
| Stats promo dropdown | Re-renders comparison + per-category bars |
| Warehouse bin hover | Tooltip with utilisation |
| Warehouse bin click | Opens panel of SKUs in that bin |
| Bundle cell click | Updates top-10 co-purchased list |

## Risks and mitigations

- **Looks "AI-generated" / generic:** countered by faithful copy of real FLARE tokens, distinctive typography, deliberate astrophysics terminology in micro-copy ("Observe", "Instrument", section labels), and seeded data that has plausible variation (not uniform-random noise).
- **Performance on initial load:** Chart.js + data file should stay well under 200KB. No heavy frameworks.
- **Visitors confused about realness:** explicit `DEMO` chips on login, "anonymised demo" notes on landing and in the app footer.
- **Drift from real FLARE tokens:** tokens are copy-pasted into `flare.css` once; if real FLARE changes, this won't auto-update. Acceptable for a portfolio piece.

## Out of scope (explicit)

- Real authentication, real persistence, real data fetching
- Mobile-first design (must not break on phone, but desktop is the design target)
- AI/LLM dashboard (deferred — could be added later if useful)
- Internationalisation / localisation
- Server-side rendering

## Implementation order (rough sketch — full plan to follow)

1. Scaffold `/flare/` directory, shared CSS with tokens, landing page
2. Login page (static mockup, simplest)
3. App shell with top bar, sidebar, hash routing, business switcher event plumbing
4. `flare-data.js` and `flare-charts.js` foundations
5. Exec overview dashboard (proves the data + chart pipeline)
6. Per-SKU dashboard (proves table + drill-down pattern)
7. Statistical, warehouse heatmap, bundle dashboards (in any order)
8. Polish pass: micro-copy, empty states, motion (subtle), favicon
9. Link from main index Experience bullet and consultancy page (already drafted)

A separate implementation plan will break each of these into testable steps.
