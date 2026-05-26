# FLARE Public Demo v2 — Design

**Date:** 2026-05-26
**Goal:** Make the public FLARE demo at `/flare/` Perfect — clean, professional, sensible numbers, working filters, more faithful to the real FLARE.

## Asks

1. Subtle CV framing — the work speaks; no per-dashboard "about" cards.
2. Drop the "Cross-Industry" sidebar group (OEE / Grid Load / Clinical Trial / Fleet) — not in real FLARE.
3. Add two real-FLARE pages: **Open Order Pipeline**, **Sales Tracker**.
4. Numbers audit — every dashboard reconciles against a coherent Helios Brands Co. P&L (£77M group, 4 brands).
5. Working filters reflected in the URL as query params (shareable links).
6. Guided tour overlay walking visitors through FLARE's capabilities and architecture, claims-light (no invented specifics).
7. Three small UI anchors for the tour: Export menu, version chip with recent "commits", user badge.

## Sidebar (final, 12 pages)

| Group | Pages |
|---|---|
| Home | Home |
| Sales | Product Margin · Pricing & Shipping · Sales Tracker *(new)* |
| Operations | OTIF Tracker · Open Order Pipeline *(new)* · Warehouse Heatmap |
| Customer | Customer Intelligence · Delighted NPS |
| L10 EOS Scorecards | Executive Scorecard |
| AI | Ask FLARE · Document Intelligence |

## Numbers anchor (Helios Brands Co.)

- Group annual revenue: £77M
- Per-brand: Trailcraft £22M · Velora £24M · Hearthline £17M · Quill £14M
- ~3,200 orders/day group-wide
- SKU counts: Trailcraft 380 · Velora 290 · Hearthline 240 · Quill 310
- AOV: Trailcraft £85 · Velora £42 · Hearthline £55 · Quill £38
- Deltas: revenue ±8% WoW, OTIF ±3pp, NPS ±5pts, stockouts ±30%

All dashboards derive from these — Sales Tracker × 52 ≈ Exec annual; Open Order Pipeline daily ≈ Sales daily; Warehouse SKU count matches brand totals.

## Query params

Format: `#/route?biz=x&filter=y&...` parsed by a single `FlareUrl` module. Filters write back via `history.replaceState`; back/forward replay; `hashchange` listener re-renders. Business switcher participates so any link includes the brand.

Per-dashboard filters:
- **Product Margin:** category, status, search, sort
- **OTIF:** business, window (4w/12w/24w), channel
- **Open Order Pipeline:** business, stage, aging bucket
- **Warehouse:** business, aisle, utilisation threshold
- **Sales Tracker:** business, period (today/yesterday/WTD/MTD), channel
- **Customer Intelligence:** business, min lift, min frequency

## Guided tour

"Take the tour" pill in topbar. Spotlight overlay + callout cards. Tour state in URL (`?tour=onboarding&step=N`). Dismissed state in localStorage. 10 steps walking Home → Switcher → User badge → Sources → Exec → SKU drill → Pricing → Export → Version chip → Ask FLARE. Claims-light: only assertions grounded in landing copy or visible real-FLARE repo evidence; TBD placeholders for specifics Chris will fill in.

## UI additions

- **Export dropdown** on each dashboard header (CSV / XLSX / Email / Slack / PDF — non-functional placeholders, real-looking)
- **Version chip** in sidebar foot expanded to hover card showing recent "commits"
- Topbar user badge becomes a tour anchor (no UI change)

## Out of scope

- Per-dashboard "about" panels
- Real user tracking dashboard (deferred — overreach)
- Drop the existing in-data salt-shuffling or change RNG approach
