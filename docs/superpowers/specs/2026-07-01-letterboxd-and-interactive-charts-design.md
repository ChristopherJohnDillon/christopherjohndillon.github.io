# Letterboxd Section + Interactive Reading/Watching Charts — Design

**Date:** 2026-07-01
**Status:** Approved (pending spec review)

## Goal

Two related enhancements to the About page (`about/index.html`):

1. **Add a Letterboxd section** mirroring the existing Goodreads books section — a
   last-5 films list plus film charts, fed by the same daily-cron data pattern.
2. **Make the existing charts interactive** — richer hover cards (poster/cover +
   title + rating + date), drag-to-zoom into a date range, and double-click to reset.
   Applies to both the books charts and the new films charts.

## Constraints & Principles

- **Static hosting (GitHub Pages).** No server at request time. Data is pre-computed
  by a scheduled GitHub Action that commits JSON into `_data/`; the browser renders
  from that committed JSON. This is the existing, proven pattern — we extend it.
- **Zero runtime dependencies.** All charts remain hand-rolled inline SVG + vanilla
  JS. No Plotly, no charting library, no CDN. This keeps the site fast and preserves
  the bespoke monospace "instrument" aesthetic (JetBrains Mono, `--nanoflare` orange
  accent `#FF4F00`, muted grays, existing CSS custom properties).
- **Mirror, don't fork.** The films pipeline parallels the books pipeline as closely
  as the data allows, so the two are easy to reason about side by side.

## Architecture Overview

```
Goodreads RSS ──► scripts/fetch_books.py ──► _data/books.json
                                          └─► _data/reading_stats.json
Letterboxd RSS ─► scripts/fetch_films.py ──► _data/films.json
                                          └─► _data/watching_stats.json
                                                       │
GitHub Action (.github/workflows/fetch-books.yml)      │  daily 08:00 UTC
  runs BOTH scripts, commits all four JSON files       │
                                                       ▼
about/index.html (Jekyll) ── renders lists + inline-SVG charts
charts.js (shared vanilla JS) ── hover cards, zoom/pan, reset
```

### Component 1: `scripts/fetch_films.py` (new)

Parallel to `fetch_books.py`. Reads Letterboxd RSS and writes two JSON files.

- **Feed:** `https://letterboxd.com/ChrisDillon/rss/`
- **Fetch:** `urllib.request` with a browser `User-Agent` header (Letterboxd 403s the
  default UA — confirmed; a `Mozilla/5.0` UA works, matching how `fetch_books.py`
  handles Goodreads).
- **Namespaces:** the feed uses `letterboxd:` and `tmdb:` XML namespaces. Parse with
  `ElementTree` and namespace-qualified tag lookups (or a namespace map).

**Available per `<item>`:** `letterboxd:filmTitle`, `letterboxd:filmYear`,
`letterboxd:memberRating` (0.5–5.0, half-star steps), `letterboxd:watchedDate`
(`YYYY-MM-DD`), `letterboxd:rewatch`, `tmdb:movieId`, `link` (film page), and a poster
image URL embedded in the `<description>` CDATA (`<img src="https://a.ltrbxd.com/...">`).

**`_data/films.json`** — last 5 films (most recent by `watchedDate` first):
```json
[
  { "title": "Dog Day Afternoon", "year": 1975, "rating": 5.0,
    "watched_at": "2026-06-30", "poster": "https://a.ltrbxd.com/.../...jpg",
    "url": "https://letterboxd.com/chrisdillon/film/dog-day-afternoon/" }
]
```

**`_data/watching_stats.json`** — mirrors `reading_stats.json`:
```json
{
  "per_year":  [ { "year": 2025, "count": 120 }, ... ],
  "fun":       { "total_films": 0, "avg_rating": 0.0,
                 "highest_rated": { "title": "...", "rating": 5.0 } },
  "timeline":  [ { "title": "...", "year": 1975, "rating": 5.0,
                   "watched_at": "2026-06-30", "poster": "..." }, ... ]
}
```

Notes:
- The scatter's y-axis is **rating (0.5–5)** for films, replacing books' **pages**.
- Poster URLs are included on `timeline` entries so hover cards can show the poster.
- Reuse a shared `MIN_YEAR` cutoff consistent with books (2021) for `per_year`.
- Extract the poster from the description CDATA with a small regex on `<img src="...">`.

### Component 1b: `scripts/fetch_books.py` (extend) — add cover to timeline

For hover-card symmetry, add each book's cover image to the `timeline` entries in
`reading_stats.json`. Goodreads RSS exposes `<book_large_image_url>` (and
`<book_image_url>`); add a `cover` field to timeline items so the books scatter hover
card can show the cover the same way films show a poster. This is the only change to
the books pipeline; the last-5 `books.json` shape stays as-is.

### Component 2: `.github/workflows/fetch-books.yml` (extend)

Add a step to run `python scripts/fetch_films.py` alongside the existing books step.
Broaden the change-check and `git add` to include the two new JSON files
(`_data/films.json`, `_data/watching_stats.json`). Commit message and cron unchanged.
Optionally rename the workflow's display name to "Fetch Reading & Watching" for
clarity (cosmetic; not required).

### Component 3: `about/index.html` (extend)

Add a **Films** block inside the Personal section, immediately after the books block,
following the same Liquid + markup shape:

- Intro line (e.g. "…and here's what I've been watching:").
- Films list: `{% for film in site.data.films %}` → `.film-item` rows
  (title + year + star rating), plus a `.film-more` "See more on Letterboxd" link to
  `https://letterboxd.com/ChrisDillon/`.
- Films charts container with three `.reading-chart` divs (per-year bars, rating
  distribution, watched-timeline scatter) driven by `site.data.watching_stats`.
- A `.watching-fun-stats` line mirroring `.reading-fun-stats`.

The inline `<script>` that currently builds the three book charts is **extracted** into
a shared file (Component 4) so both books and films reuse the same chart + interaction
code. The page passes each chart its data (timeline / per_year) and a config describing
axes and hover-card fields.

### Component 4: `assets/js/charts.js` (new) — shared chart + interaction module

Extract the existing `buildScatter` / `buildYearly` / `buildHist` logic from the inline
script into a small reusable module, generalized to serve both books and films, and add
the interactivity. Plain IIFE / global function — no build step, no modules loader, just
a `<script>` tag (consistent with the site).

Public shape (illustrative):
```js
ReadingCharts.scatter(elId, points, {
  yKey: 'pages' | 'rating', yLabel, yMax, hover: point => ({poster, title, sub, date})
});
ReadingCharts.bars(elId, series, { yLabel });
ReadingCharts.histogram(elId, points, { key, bins, xLabel });
```

**Interactivity added (all bespoke, applies to scatter primarily):**

- **Hover card.** On `mousemove` over a dot, show an absolutely-positioned HTML card
  near the cursor containing: poster/cover thumbnail (film poster or book cover — see Component 1b),
  title, rating (★) / pages, and date. Highlight the hovered dot
  (enlarge + full opacity). Card follows the cursor and flips to stay on-screen. This
  replaces the plain native `<title>` tooltip. Hidden on `mouseleave`.
- **Drag-to-zoom.** Mouse-drag horizontally over the scatter draws a selection band;
  on release, the x-domain (date range) rescales to the selection and the chart
  re-renders. Y stays fixed to full range.
- **Double-click reset.** Restores the full date domain.
- **Touch/no-hover fallback.** On touch devices, tap a dot shows its card (no drag-zoom
  required); native behavior degrades gracefully.

Rendering stays SVG; the hover card and zoom band are DOM overlays positioned over the
chart container. The container gets `position: relative`.

### Component 5: `css/main.css` (extend)

- Add `.film-item`, `.film-title`, `.film-year`, `.film-rating`, `.film-more`,
  `.watching-fun-stats` mirroring the existing `.book-item` family (reuse the same
  visual tokens; ideally share rules by adding the film classes to existing selectors).
- Add `.chart-hover-card` (poster thumb + text, bordered like `.reading-fun-stats`,
  `--rule-strong` border, mono, small), `.chart-zoom-band` (translucent `--nanoflare`
  selection rectangle), and `position: relative` on `.reading-chart`.
- Star rating rendered as filled/half/empty ★ glyphs in `--nanoflare`.

## Data Flow

1. Daily cron (08:00 UTC) → Action checks out `gh-pages`, runs both fetch scripts.
2. Scripts write the four JSON files; Action commits them if changed (`[skip ci]`).
3. GitHub Pages rebuilds Jekyll; `about/index.html` renders lists + SVG charts from the
   committed `site.data.*`.
4. In the browser, `charts.js` renders SVG and wires hover/zoom/reset.

## Error Handling

- **Feed fetch fails / 403 / timeout:** script exits non-zero; the Action step fails
  and no bad data is committed. Existing JSON stays in place, page still renders. (Same
  failure posture as the current books script — acceptable.)
- **Missing fields:** rating/poster/year may be absent for some items (e.g. a film
  logged without a rating). Scripts must tolerate missing `memberRating` (skip from
  rating-distribution and scatter, or omit rating in the list) and missing poster
  (hover card omits the thumbnail). No crashes on partial items.
- **Empty data:** if a stats section is empty, the corresponding `{% if %}` block does
  not render (mirrors existing books guards).
- **Poster hotlinking:** posters are hotlinked from `a.ltrbxd.com` at render time. If a
  poster 404s, the card shows text only (img `onerror` hides the thumb). No poster
  images are committed to the repo.

## Testing / Verification

- **Scripts (local):** run `python scripts/fetch_films.py`; assert both JSON files are
  valid JSON, `films.json` has ≤5 entries newest-first with expected keys, and
  `watching_stats.json` has `per_year` sorted ascending, `timeline` sorted by date, and
  sane `fun` values. Re-run `fetch_books.py` to confirm no regression.
- **Namespace parse:** unit-check that `letterboxd:memberRating` / `filmTitle` /
  `watchedDate` and the poster regex extract correctly from a saved sample feed item.
- **Page render (local Jekyll):** `bundle exec jekyll serve`; visit `/about/`, confirm
  the films list + three film charts render, and the books section is unchanged.
- **Interaction (manual):** hover a scatter dot → card with poster/title/rating/date;
  drag → zoom to range; double-click → reset; resize window → charts reflow; touch tap
  shows card. Verify on both books and films scatters.

## Out of Scope (YAGNI)

- No reviews/quotes rendering from Letterboxd (feed has them, but not needed here).
- No committing poster images to the repo (hotlink only).
- No zoom on the bar/histogram charts (scatter only — that's where a date range matters).
- No new charting library, build step, or bundler.
- No changes to unrelated pages.
