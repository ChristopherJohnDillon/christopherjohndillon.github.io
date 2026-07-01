# Letterboxd Section + Interactive Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Letterboxd films section to the About page mirroring the Goodreads books section, and make the reading/watching scatter charts interactive (hover cards, drag-to-zoom, reset).

**Architecture:** A new daily-cron Python script fetches Letterboxd RSS into `_data/films.json` + `_data/watching_stats.json`, parallel to the existing Goodreads pipeline. The About page renders a films list + three hand-rolled inline-SVG charts. A shared vanilla-JS module (`assets/js/charts.js`) replaces the inline chart script, serving both books and films and adding hover cards + zoom + reset. Book covers are added to the books timeline for hover-card symmetry.

**Tech Stack:** Python 3.11 stdlib only (`urllib`, `xml.etree.ElementTree`, `json`, `re`) for fetch scripts; vanilla JS + inline SVG for charts; Jekyll/Liquid for templating; plain CSS custom properties. Zero runtime dependencies. Node available for pure-function JS tests.

## Global Constraints

- **Zero runtime dependencies.** No charting library, CDN, build step, or bundler. Charts are hand-rolled inline SVG + vanilla JS in `<script>` tags.
- **Static hosting.** All live data is pre-computed by the GitHub Action into `_data/*.json` and committed; the browser renders from committed JSON only.
- **Python: stdlib only.** Fetch scripts and their tests must run under Python 3.11 with no pip installs (the Action installs nothing). Tests are standalone `assert` scripts run with `python3 <file>`, using committed XML fixtures — no network, no pytest.
- **Design tokens (verbatim):** accent `--nanoflare` `#FF4F00`; `--dim` `#5B657A`; `--mute` `#8792A6`; `--rule` `rgba(232, 236, 242, 0.08)`; `--rule-strong` `rgba(232, 236, 242, 0.18)`; mono font `var(--f-mono)`. Reuse these; do not hardcode new colors.
- **Letterboxd feed:** `https://letterboxd.com/ChrisDillon/rss/` — requires a browser `User-Agent` (default UA gets HTTP 403). Namespaces: `letterboxd="https://letterboxd.com"`, `tmdb="https://themoviedb.org"`.
- **MIN_YEAR = 2021** for per-year aggregation (matches books).
- **Branch:** `gh-pages` (this repo's default/deploy branch).

## File Structure

- Create: `scripts/fetch_films.py` — fetch Letterboxd RSS, write `films.json` + `watching_stats.json`.
- Create: `scripts/fixtures/letterboxd_sample.xml` — saved feed sample for offline tests.
- Create: `scripts/fixtures/goodreads_sample.xml` — saved feed sample for offline tests.
- Create: `scripts/test_fetch_films.py` — assert-based offline tests.
- Create: `scripts/test_fetch_books.py` — assert-based offline test for the cover addition.
- Modify: `scripts/fetch_books.py` — add `cover` to timeline entries; make parsing importable/testable.
- Modify: `.github/workflows/fetch-books.yml` — run `fetch_films.py`; commit new JSON files.
- Create: `assets/js/charts.js` — shared chart + interaction module (extracted from inline script, generalized, interactivity added).
- Modify: `about/index.html` — add Films block; replace inline chart script with `charts.js` calls for both books and films.
- Modify: `css/main.css` — film list classes, hover card, zoom band, `position: relative` on `.reading-chart`.

---

### Task 1: `fetch_films.py` — Letterboxd RSS → films.json + watching_stats.json

**Files:**
- Create: `scripts/fetch_films.py`
- Create: `scripts/fixtures/letterboxd_sample.xml`
- Test: `scripts/test_fetch_films.py`

**Interfaces:**
- Consumes: nothing (entry point).
- Produces (imported by test):
  - `poster_from_description(desc: str) -> str`
  - `parse_item(item: ET.Element) -> dict` with keys `title,year,rating,watched_at,poster,url` (`year: int|None`, `rating: float|None`)
  - `recent_films(items: list[ET.Element]) -> list[dict]` (≤5, feed order = newest first, only items with title+watched_at)
  - `watching_stats(items: list[ET.Element]) -> tuple[list, dict, list]` → `(per_year, fun, timeline)`
  - Module constants `NS`, `N_FILMS`, `MIN_YEAR`, `FEED_URL`.

- [ ] **Step 1: Create the test fixture**

Create `scripts/fixtures/letterboxd_sample.xml` (three items: a rated film, a rated review item, and one **without** a rating — to exercise the missing-rating path):

```xml
<?xml version='1.0' encoding='utf-8'?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:letterboxd="https://letterboxd.com" xmlns:tmdb="https://themoviedb.org">
  <channel>
    <title>Letterboxd - ChrisDillon</title>
    <link>https://letterboxd.com/chrisdillon/</link>
    <item>
      <title>Dog Day Afternoon, 1975 - ★★★★★</title>
      <link>https://letterboxd.com/chrisdillon/film/dog-day-afternoon/</link>
      <guid isPermaLink="false">letterboxd-watch-1375941130</guid>
      <pubDate>Wed, 1 Jul 2026 09:33:40 +1200</pubDate>
      <letterboxd:watchedDate>2026-06-30</letterboxd:watchedDate>
      <letterboxd:rewatch>No</letterboxd:rewatch>
      <letterboxd:filmTitle>Dog Day Afternoon</letterboxd:filmTitle>
      <letterboxd:filmYear>1975</letterboxd:filmYear>
      <letterboxd:memberRating>5.0</letterboxd:memberRating>
      <letterboxd:memberLike>No</letterboxd:memberLike>
      <tmdb:movieId>968</tmdb:movieId>
      <description><![CDATA[ <p><img src="https://a.ltrbxd.com/resized/film-poster/5/1/1/9/5/51195-dog-day-afternoon-0-600-0-900-crop.jpg"/></p> <p>Watched on Tuesday June 30, 2026.</p> ]]></description>
      <dc:creator>ChrisDillon</dc:creator>
    </item>
    <item>
      <title>Ripley's Game, 2002 - ★★★★</title>
      <link>https://letterboxd.com/chrisdillon/film/ripleys-game/</link>
      <guid isPermaLink="false">letterboxd-review-1373083746</guid>
      <pubDate>Mon, 29 Jun 2026 07:46:42 +1200</pubDate>
      <letterboxd:watchedDate>2026-06-28</letterboxd:watchedDate>
      <letterboxd:rewatch>No</letterboxd:rewatch>
      <letterboxd:filmTitle>Ripley's Game</letterboxd:filmTitle>
      <letterboxd:filmYear>2002</letterboxd:filmYear>
      <letterboxd:memberRating>4.0</letterboxd:memberRating>
      <letterboxd:memberLike>Yes</letterboxd:memberLike>
      <tmdb:movieId>10955</tmdb:movieId>
      <description><![CDATA[ <p><img src="https://a.ltrbxd.com/resized/film-poster/4/5/7/3/9/45739-ripley-s-game-0-600-0-900-crop.jpg"/></p> <p>A review body here.</p> ]]></description>
      <dc:creator>ChrisDillon</dc:creator>
    </item>
    <item>
      <title>Some Old Film, 1960</title>
      <link>https://letterboxd.com/chrisdillon/film/some-old-film/</link>
      <guid isPermaLink="false">letterboxd-watch-111</guid>
      <pubDate>Sun, 10 Jan 2021 00:00:00 +1200</pubDate>
      <letterboxd:watchedDate>2021-01-09</letterboxd:watchedDate>
      <letterboxd:rewatch>No</letterboxd:rewatch>
      <letterboxd:filmTitle>Some Old Film</letterboxd:filmTitle>
      <letterboxd:filmYear>1960</letterboxd:filmYear>
      <tmdb:movieId>222</tmdb:movieId>
      <description><![CDATA[ <p>Watched on Saturday January 9, 2021.</p> ]]></description>
      <dc:creator>ChrisDillon</dc:creator>
    </item>
  </channel>
</rss>
```

- [ ] **Step 2: Write the failing test**

Create `scripts/test_fetch_films.py`:

```python
"""Offline tests for fetch_films.py (stdlib only, no network, no pytest)."""
import xml.etree.ElementTree as ET
from pathlib import Path
import fetch_films as ff

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "letterboxd_sample.xml"


def load_items():
    root = ET.parse(FIXTURE).getroot()
    return root.findall(".//item")


def test_poster_from_description():
    desc = ' <p><img src="https://a.ltrbxd.com/x.jpg"/></p> <p>hi</p> '
    assert ff.poster_from_description(desc) == "https://a.ltrbxd.com/x.jpg"
    assert ff.poster_from_description("<p>no image</p>") == ""
    assert ff.poster_from_description("") == ""


def test_parse_item_rated():
    item = load_items()[0]
    f = ff.parse_item(item)
    assert f["title"] == "Dog Day Afternoon"
    assert f["year"] == 1975
    assert f["rating"] == 5.0
    assert f["watched_at"] == "2026-06-30"
    assert f["poster"].endswith("crop.jpg")
    assert f["url"].endswith("/dog-day-afternoon/")


def test_parse_item_missing_rating():
    item = load_items()[2]
    f = ff.parse_item(item)
    assert f["title"] == "Some Old Film"
    assert f["rating"] is None
    assert f["poster"] == ""


def test_recent_films_order_and_limit():
    films = ff.recent_films(load_items())
    assert len(films) == 3
    assert films[0]["title"] == "Dog Day Afternoon"  # feed order preserved


def test_watching_stats():
    per_year, fun, timeline = ff.watching_stats(load_items())
    years = {d["year"]: d["count"] for d in per_year}
    assert years == {2021: 1, 2026: 2}
    # only rated films appear in the timeline, sorted ascending by date
    assert [t["title"] for t in timeline] == ["Ripley's Game", "Dog Day Afternoon"]
    assert timeline[0]["poster"].endswith("crop.jpg")
    assert fun["total_films"] == 3
    assert fun["avg_rating"] == 4.5
    assert fun["highest_rated"]["title"] == "Dog Day Afternoon"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all passed")
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd scripts && python3 test_fetch_films.py`
Expected: FAIL — `ModuleNotFoundError: No module named 'fetch_films'` (or `AttributeError` once the file is stubbed).

- [ ] **Step 4: Implement `fetch_films.py`**

Create `scripts/fetch_films.py`:

```python
"""Fetch recently-watched films from Letterboxd RSS.

Writes _data/films.json (last 5) and _data/watching_stats.json.
Mirror of fetch_books.py. Stdlib only.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

FEED_URL = "https://letterboxd.com/ChrisDillon/rss/"
OUT = Path(__file__).resolve().parent.parent / "_data" / "films.json"
STATS_OUT = Path(__file__).resolve().parent.parent / "_data" / "watching_stats.json"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
N_FILMS = 5
MIN_YEAR = 2021


def clean(text):
    """Strip whitespace, tolerate None."""
    return (text or "").strip()


def poster_from_description(desc):
    """Pull the poster image URL out of the description CDATA."""
    m = re.search(r'<img src="([^"]+)"', desc or "")
    return m.group(1) if m else ""


def parse_item(item):
    """Parse one <item> into a film dict; rating/year/poster may be missing."""
    title = clean(item.findtext("letterboxd:filmTitle", "", NS))
    year_raw = clean(item.findtext("letterboxd:filmYear", "", NS))
    year = int(year_raw) if year_raw.isdigit() else None
    rating_raw = clean(item.findtext("letterboxd:memberRating", "", NS))
    rating = float(rating_raw) if rating_raw else None
    watched_at = clean(item.findtext("letterboxd:watchedDate", "", NS))
    url = clean(item.findtext("link", ""))
    poster = poster_from_description(item.findtext("description", ""))
    return {
        "title": title,
        "year": year,
        "rating": rating,
        "watched_at": watched_at,
        "poster": poster,
        "url": url,
    }


def recent_films(items):
    """Newest-first (feed order); only entries with a title and watched date."""
    films = []
    for it in items:
        f = parse_item(it)
        if f["title"] and f["watched_at"]:
            films.append(f)
        if len(films) >= N_FILMS:
            break
    return films


def watching_stats(items):
    """Return (per_year, fun, timeline). Timeline holds only rated films."""
    years = Counter()
    timeline = []
    rated = []
    for it in items:
        f = parse_item(it)
        m = re.match(r"(\d{4})", f["watched_at"])
        if not m:
            continue
        y = int(m.group(1))
        if y >= MIN_YEAR:
            years[y] += 1
        if f["rating"] is not None and y >= MIN_YEAR:
            timeline.append({
                "title": f["title"],
                "year": f["year"],
                "rating": f["rating"],
                "watched_at": f["watched_at"],
                "poster": f["poster"],
            })
            rated.append(f["rating"])
    per_year = [{"year": y, "count": years[y]} for y in sorted(years)]
    timeline.sort(key=lambda x: x["watched_at"])
    highest = max(timeline, key=lambda x: x["rating"], default=None)
    fun = {
        "total_films": sum(years.values()),
        "avg_rating": round(sum(rated) / len(rated), 2) if rated else 0.0,
        "highest_rated": {"title": highest["title"], "rating": highest["rating"]} if highest else None,
    }
    return per_year, fun, timeline


def fetch_feed():
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return ET.fromstring(resp.read())


if __name__ == "__main__":
    root = fetch_feed()
    items = root.findall(".//item")
    films = recent_films(items)
    per_year, fun, timeline = watching_stats(items)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(films, indent=2) + "\n")
    STATS_OUT.write_text(json.dumps({"per_year": per_year, "fun": fun, "timeline": timeline}, indent=2) + "\n")
    print(f"Wrote {len(films)} films to {OUT}")
    print(f"Wrote stats ({len(timeline)} timeline entries) to {STATS_OUT}")




#
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd scripts && python3 test_fetch_films.py`
Expected: prints `ok test_...` for each test, then `all passed`.

- [ ] **Step 6: Smoke-test against the live feed**

Run: `cd scripts && python3 fetch_films.py`
Expected: prints "Wrote N films..." and "Wrote stats...", and `_data/films.json` + `_data/watching_stats.json` now exist and are valid JSON. Inspect `films.json`: ≤5 entries, newest first.

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch_films.py scripts/fixtures/letterboxd_sample.xml scripts/test_fetch_films.py _data/films.json _data/watching_stats.json
git commit -m "feat(films): fetch Letterboxd RSS into films + watching stats"
```

---

### Task 2: Add book covers to the books timeline

**Files:**
- Modify: `scripts/fetch_books.py:63-96` (the `yearly_stats` function)
- Create: `scripts/fixtures/goodreads_sample.xml`
- Test: `scripts/test_fetch_books.py`

**Interfaces:**
- Consumes: existing `fetch_books.py` functions `clean`, `parse_date`, `yearly_stats`.
- Produces: `yearly_stats(root)` timeline entries now include a `cover` key (string URL, `""` if absent). `books.json` shape unchanged.

- [ ] **Step 1: Create the test fixture**

Create `scripts/fixtures/goodreads_sample.xml` (one item with `num_pages` and a cover URL):

```xml
<?xml version='1.0' encoding='utf-8'?>
<rss version="2.0">
  <channel>
    <title>Chris's bookshelf: read</title>
    <item>
      <title>Foster (Something)</title>
      <book_id>12345</book_id>
      <book_image_url><![CDATA[https://i.gr-assets.com/small.jpg]]></book_image_url>
      <book_large_image_url><![CDATA[https://i.gr-assets.com/large.jpg]]></book_large_image_url>
      <author_name>Claire Keegan</author_name>
      <user_rating>5</user_rating>
      <user_read_at>Mon, 24 Jan 2022 00:00:00 -0800</user_read_at>
      <book id="12345"><num_pages>101</num_pages></book>
    </item>
  </channel>
</rss>
```

- [ ] **Step 2: Write the failing test**

Create `scripts/test_fetch_books.py`:

```python
"""Offline test for the cover field added to fetch_books.yearly_stats."""
import xml.etree.ElementTree as ET
from pathlib import Path
import fetch_books as fb

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "goodreads_sample.xml"


def test_timeline_has_cover():
    root = ET.parse(FIXTURE).getroot()
    _per_year, _fun, timeline = fb.yearly_stats(root)
    assert len(timeline) == 1
    entry = timeline[0]
    assert entry["title"] == "Foster"          # trailing "(Something)" stripped
    assert entry["pages"] == 101
    assert entry["cover"] == "https://i.gr-assets.com/large.jpg"  # prefers large


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all passed")
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd scripts && python3 test_fetch_books.py`
Expected: FAIL — `KeyError: 'cover'`.

- [ ] **Step 4: Add the cover field**

In `scripts/fetch_books.py`, inside `yearly_stats`, locate the timeline append (currently around line 81-82):

```python
        if date_str and pages > 0 and m and int(m.group(1)) >= MIN_YEAR:
            timeline.append({"title": title, "author": author, "pages": pages, "read_at": date_str})
```

Replace with (add cover extraction just before the append, and include it):

```python
        cover = clean(item.findtext("book_large_image_url", "")) or clean(item.findtext("book_image_url", ""))
        if date_str and pages > 0 and m and int(m.group(1)) >= MIN_YEAR:
            timeline.append({"title": title, "author": author, "pages": pages, "read_at": date_str, "cover": cover})
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd scripts && python3 test_fetch_books.py`
Expected: `ok test_timeline_has_cover` then `all passed`.

- [ ] **Step 6: Regenerate books data + confirm no regression**

Run: `cd scripts && python3 fetch_books.py`
Expected: prints "Wrote 5 books..." and stats line; `_data/reading_stats.json` timeline entries now each carry a `cover` URL. Re-run `python3 test_fetch_films.py` to confirm films tests still pass (no cross-contamination).

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch_books.py scripts/fixtures/goodreads_sample.xml scripts/test_fetch_books.py _data/reading_stats.json
git commit -m "feat(books): add cover image to reading timeline for hover cards"
```

---

### Task 3: Extend the GitHub Action to fetch films

**Files:**
- Modify: `.github/workflows/fetch-books.yml`

**Interfaces:**
- Consumes: `scripts/fetch_films.py` (Task 1), `scripts/fetch_books.py` (Task 2).
- Produces: nothing consumed by later tasks (CI only).

- [ ] **Step 1: Add the films fetch step and broaden the commit**

Edit `.github/workflows/fetch-books.yml`. Rename the workflow and add a films step after the books step; broaden the change check and `git add`:

```yaml
name: Fetch Reading & Watching

on:
  schedule:
    - cron: '0 8 * * *'  # daily at 08:00 UTC
  workflow_dispatch:

jobs:
  fetch-books:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: gh-pages

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Fetch books from Goodreads
        run: python scripts/fetch_books.py

      - name: Fetch films from Letterboxd
        run: python scripts/fetch_films.py

      - name: Check for changes
        id: check
        run: |
          git diff --quiet _data/ || echo "changed=true" >> $GITHUB_OUTPUT

      - name: Commit and push
        if: steps.check.outputs.changed == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add _data/books.json _data/reading_stats.json _data/films.json _data/watching_stats.json
          git commit -m "Update reading & watching lists [skip ci]"
          git push
```

- [ ] **Step 2: Validate the YAML**

Run: `cd /Users/chrisdillon/christopherjohndillon.github.io && python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/fetch-books.yml')); print('yaml ok')"`
Expected: `yaml ok`. (If PyYAML is unavailable, instead run `python3 -c "print(open('.github/workflows/fetch-books.yml').read())"` and eyeball indentation.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/fetch-books.yml
git commit -m "ci: fetch Letterboxd films alongside Goodreads books"
```

---

### Task 4: Shared `charts.js` module (extract + generalize + interactivity)

**Files:**
- Create: `assets/js/charts.js`
- Test: `scripts/test_charts.mjs` (Node, pure functions only)

This task extracts the existing chart-drawing logic from the inline `<script>` in `about/index.html:119-253` into a reusable module, generalizes it to serve books (y = pages) and films (y = rating), and adds hover cards, drag-to-zoom, and reset. Pure helper functions are unit-tested with Node; SVG rendering + interaction are verified in the browser in Task 5.

**Interfaces:**
- Consumes: nothing (self-contained module attached to `window.ReadingCharts`).
- Produces (used by `about/index.html` in Task 5):
  - `ReadingCharts.scatter(elId, points, opts)` where `points` is `[{t, y, title, sub, date, img}]` and `opts = {yLabel, yMax, yStep}`. `t` = epoch ms (from date), `y` = numeric value, `img` = poster/cover URL or "".
  - `ReadingCharts.bars(elId, series, opts)` where `series = [{label, count}]`, `opts = {yLabel, yStep}`.
  - `ReadingCharts.histogram(elId, points, opts)` where `opts = {key:'y', edges:[...], xLabels:[...]}`.
  - Pure helpers (also exported for Node test via `if (typeof module...)`): `niceMax(v, step)`, `binCounts(values, edges)`.

- [ ] **Step 1: Write the failing Node test for pure helpers**

Create `scripts/test_charts.mjs`:

```js
// Pure-function tests for charts.js helpers. Run: node scripts/test_charts.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(dir, '..', 'assets', 'js', 'charts.js'), 'utf8');
// Evaluate the module body in a sandbox that exposes helpers on globalThis.
const factory = new Function(src + '\nreturn { niceMax, binCounts };');
const { niceMax, binCounts } = factory();

assert.strictEqual(niceMax(1707, 200), 1800, 'niceMax rounds up to step');
assert.strictEqual(niceMax(46, 10), 50, 'niceMax rounds up to step');
assert.strictEqual(niceMax(0, 10), 10, 'niceMax floors at one step');

const edges = [0, 100, 200, 300];  // bins: [0,100),[100,200),[200,300),[300,inf)
assert.deepStrictEqual(binCounts([50, 150, 150, 999], edges), [1, 2, 0, 1]);

console.log('all passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/chrisdillon/christopherjohndillon.github.io && node scripts/test_charts.mjs`
Expected: FAIL — `ENOENT` (charts.js missing) or `niceMax is not defined`.

- [ ] **Step 3: Implement `charts.js`**

Create `assets/js/charts.js`. This ports the existing scatter/yearly/hist SVG code (same padding, tokens, label style) into functions, adds the hover card + zoom + reset, and exposes pure helpers. Full file:

```js
/* Shared reading/watching charts. Bespoke inline SVG + vanilla interactions.
   Attaches window.ReadingCharts. No dependencies. */
(function () {
  var cs = getComputedStyle(document.documentElement);
  var DIM = cs.getPropertyValue('--dim').trim();
  var MUTE = cs.getPropertyValue('--mute').trim();
  var ACCENT = cs.getPropertyValue('--nanoflare').trim();
  var MONO = 'var(--f-mono)';

  // ---- pure helpers (also used by node test) ----
  function niceMax(v, step) { return Math.max(step, Math.ceil(v / step) * step); }
  function binCounts(values, edges) {
    // edges of length N produce N bins: [e0,e1),[e1,e2),...,[e(N-1), Infinity)
    var counts = edges.map(function () { return 0; });
    values.forEach(function (v) {
      for (var i = 0; i < edges.length; i++) {
        var hi = (i + 1 < edges.length) ? edges[i + 1] : Infinity;
        if (v >= edges[i] && v < hi) { counts[i]++; break; }
      }
    });
    return counts;
  }

  // ---- hover card (singleton) ----
  var card;
  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'chart-hover-card';
    card.style.display = 'none';
    document.body.appendChild(card);
    return card;
  }
  function showCard(pt, clientX, clientY) {
    var c = ensureCard();
    var img = pt.img ? '<img src="' + pt.img + '" alt="" onerror="this.style.display=\'none\'"/>' : '';
    c.innerHTML = img + '<div class="chc-text"><div class="chc-title">' + pt.title +
      '</div><div class="chc-sub">' + (pt.sub || '') + '</div>' +
      '<div class="chc-date">' + (pt.date || '') + '</div></div>';
    c.style.display = 'flex';
    // position, flipping to stay on-screen
    var w = c.offsetWidth, h = c.offsetHeight, pad = 14;
    var x = clientX + pad, y = clientY + pad;
    if (x + w > window.innerWidth) x = clientX - w - pad;
    if (y + h > window.innerHeight) y = clientY - h - pad;
    c.style.left = (x + window.scrollX) + 'px';
    c.style.top = (y + window.scrollY) + 'px';
  }
  function hideCard() { if (card) card.style.display = 'none'; }

  // ---- scatter with hover + drag-to-zoom + reset ----
  function scatter(elId, points, opts) {
    var el = document.getElementById(elId);
    if (!el || !points.length) return;
    opts = opts || {};
    var yMax = opts.yMax || niceMax(Math.max.apply(null, points.map(function (p) { return p.y; })), opts.yStep || 1);
    var fullMin = Math.min.apply(null, points.map(function (p) { return p.t; }));
    var fullMax = Math.max.apply(null, points.map(function (p) { return p.t; }));
    var domain = { min: fullMin, max: fullMax };

    function render() {
      var W = el.offsetWidth || 320, H = 160;
      var pad = { top: 14, right: 12, bottom: 28, left: 38 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var span = (domain.max - domain.min) || 1;
      function xPos(t) { return pad.left + (t - domain.min) / span * pw; }
      function yPos(y) { return pad.top + ph - (y / yMax * ph); }
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      // y gridlines + labels
      for (var t = 0; t <= yMax; t += (opts.yStep || Math.max(1, Math.round(yMax / 5)))) {
        var ty = yPos(t);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 6) + '" y="' + (ty + 3) + '" text-anchor="end" font-size="8" font-family="' + MONO + '" fill="' + DIM + '">' + t + '</text>';
      }
      svg += '<text x="6" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,6,' + (pad.top + ph / 2) + ')">' + (opts.yLabel || '') + '</text>';
      // x-axis year ticks
      var minY = new Date(domain.min).getFullYear(), maxY = new Date(domain.max).getFullYear();
      for (var yr = minY; yr <= maxY; yr++) {
        var xd = xPos(new Date(yr, 0, 1).getTime());
        if (xd >= pad.left && xd <= W - pad.right) {
          svg += '<line x1="' + xd + '" y1="' + pad.top + '" x2="' + xd + '" y2="' + (H - pad.bottom) + '" stroke="' + DIM + '" stroke-opacity="0.25" stroke-width="0.5"/>';
          svg += '<text x="' + xd + '" y="' + (H - pad.bottom + 12) + '" text-anchor="middle" font-size="9" font-family="' + MONO + '" fill="' + DIM + '">' + yr + '</text>';
        }
      }
      // dots (only those in domain)
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (p.t < domain.min || p.t > domain.max) continue;
        var r = 1.5 + Math.sqrt(p.y / yMax) * 3;
        svg += '<circle class="chart-dot" data-i="' + i + '" cx="' + xPos(p.t) + '" cy="' + yPos(p.y) + '" r="' + r + '" fill="' + ACCENT + '" opacity="0.85"/>';
      }
      svg += '<rect class="chart-zoom-band" x="0" y="' + pad.top + '" width="0" height="' + ph + '" style="display:none"/>';
      svg += '</svg>';
      el.innerHTML = svg;
      wire(el.querySelector('svg'), pad, pw, xPos);
    }

    function wire(svgEl, pad, pw, xPos) {
      // hover
      svgEl.querySelectorAll('.chart-dot').forEach(function (dot) {
        dot.addEventListener('mouseenter', function (e) {
          dot.setAttribute('r', parseFloat(dot.getAttribute('r')) + 2);
          dot.setAttribute('opacity', '1');
          var p = points[+dot.getAttribute('data-i')];
          showCard(p, e.clientX, e.clientY);
        });
        dot.addEventListener('mousemove', function (e) {
          showCard(points[+dot.getAttribute('data-i')], e.clientX, e.clientY);
        });
        dot.addEventListener('mouseleave', function () {
          dot.setAttribute('opacity', '0.85'); hideCard(); render();
        });
        // touch: tap shows card
        dot.addEventListener('click', function (e) {
          showCard(points[+dot.getAttribute('data-i')], e.clientX, e.clientY);
        });
      });
      // drag-to-zoom
      var band = svgEl.querySelector('.chart-zoom-band');
      var dragging = false, startX = 0;
      function localX(e) {
        var rect = svgEl.getBoundingClientRect();
        return e.clientX - rect.left;
      }
      svgEl.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('chart-dot')) return;
        dragging = true; startX = localX(e); band.style.display = '';
        band.setAttribute('x', startX); band.setAttribute('width', 0); hideCard();
      });
      svgEl.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var cx = localX(e), x0 = Math.min(startX, cx), w = Math.abs(cx - startX);
        band.setAttribute('x', x0); band.setAttribute('width', w);
      });
      window.addEventListener('mouseup', function (e) {
        if (!dragging) return;
        dragging = false; band.style.display = 'none';
        var cx = localX(e), x0 = Math.min(startX, cx), x1 = Math.max(startX, cx);
        if (x1 - x0 < 6) return; // ignore tiny drags
        function tAt(px) { return domain.min + (px - pad.left) / pw * (domain.max - domain.min); }
        var nMin = Math.max(domain.min, tAt(x0)), nMax = Math.min(domain.max, tAt(x1));
        if (nMax > nMin) { domain.min = nMin; domain.max = nMax; render(); }
      });
      svgEl.addEventListener('dblclick', function () {
        domain.min = fullMin; domain.max = fullMax; render();
      });
    }

    render();
    if (!el._rcResize) {
      el._rcResize = true;
      window.addEventListener('resize', render);
    }
  }

  // ---- bars (books/films per year) ----
  function bars(elId, series, opts) {
    var el = document.getElementById(elId);
    if (!el || !series.length) return;
    opts = opts || {};
    function render() {
      var W = el.offsetWidth || 320, H = 110;
      var pad = { top: 14, right: 12, bottom: 28, left: 38 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var yMax = niceMax(Math.max.apply(null, series.map(function (d) { return d.count; })), opts.yStep || 10);
      var barW = pw / series.length;
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (var t = 0; t <= yMax; t += (opts.yStep || 10)) {
        var ty = pad.top + ph - (t / yMax * ph);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 6) + '" y="' + (ty + 3) + '" text-anchor="end" font-size="8" font-family="' + MONO + '" fill="' + DIM + '">' + t + '</text>';
      }
      svg += '<text x="6" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,6,' + (pad.top + ph / 2) + ')">' + (opts.yLabel || '') + '</text>';
      for (var i = 0; i < series.length; i++) {
        var bx = pad.left + i * barW;
        var bh = series[i].count / yMax * ph, by = pad.top + ph - bh;
        svg += '<rect x="' + (bx + 2) + '" y="' + by + '" width="' + (barW - 4) + '" height="' + bh + '" fill="' + ACCENT + '" opacity="0.75" rx="1"/>';
        svg += '<text x="' + (bx + barW / 2) + '" y="' + (by - 4) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + MUTE + '">' + series[i].count + '</text>';
        svg += '<text x="' + (bx + barW / 2) + '" y="' + (H - pad.bottom + 12) + '" text-anchor="middle" font-size="9" font-family="' + MONO + '" fill="' + DIM + '">' + series[i].label + '</text>';
      }
      svg += '</svg>';
      el.innerHTML = svg;
    }
    render();
    if (!el._rcResize) { el._rcResize = true; window.addEventListener('resize', render); }
  }

  // ---- histogram (page counts / rating distribution) ----
  function histogram(elId, points, opts) {
    var el = document.getElementById(elId);
    if (!el || !points.length) return;
    var values = points.map(function (p) { return p[opts.key]; });
    var counts = binCounts(values, opts.edges);
    var total = values.length || 1;
    function render() {
      var W = el.offsetWidth || 320, H = 110;
      var pad = { top: 14, right: 12, bottom: 28, left: 38 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var barW = pw / counts.length;
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (var t = 0; t <= 1.001; t += 0.2) {
        var ty = pad.top + ph - (t * ph);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 6) + '" y="' + (ty + 3) + '" text-anchor="end" font-size="8" font-family="' + MONO + '" fill="' + DIM + '">' + t.toFixed(1) + '</text>';
      }
      svg += '<text x="6" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,6,' + (pad.top + ph / 2) + ')">density</text>';
      for (var i = 0; i < counts.length; i++) {
        var bx = pad.left + i * barW, bh = (counts[i] / total) * ph, by = pad.top + ph - bh;
        if (counts[i] > 0) svg += '<rect x="' + (bx + 1) + '" y="' + by + '" width="' + (barW - 2) + '" height="' + bh + '" fill="' + ACCENT + '" opacity="0.75" rx="1"/>';
        svg += '<text x="' + (bx + barW / 2) + '" y="' + (H - pad.bottom + 12) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + DIM + '">' + opts.xLabels[i] + '</text>';
      }
      svg += '<text x="' + (pad.left + pw / 2) + '" y="' + (H - 2) + '" text-anchor="middle" font-size="8" font-family="' + MONO + '" fill="' + MUTE + '">' + (opts.xLabel || '') + '</text>';
      svg += '</svg>';
      el.innerHTML = svg;
    }
    render();
    if (!el._rcResize) { el._rcResize = true; window.addEventListener('resize', render); }
  }

  window.ReadingCharts = { scatter: scatter, bars: bars, histogram: histogram, niceMax: niceMax, binCounts: binCounts };
})();
```

- [ ] **Step 4: Run the Node test to verify it passes**

Run: `cd /Users/chrisdillon/christopherjohndillon.github.io && node scripts/test_charts.mjs`
Expected: `all passed`.

Note: the Node test evaluates the module source with the browser-only preamble (`getComputedStyle`, `document`) present. Because `new Function(src + 'return {niceMax, binCounts}')` executes the IIFE, and the IIFE touches `document`, wrap the Node harness to stub them. If the run throws `document is not defined`, prepend stubs in the test factory: `var factory = new Function('document','getComputedStyle', src + '\nreturn { niceMax, binCounts };'); var {niceMax,binCounts}=factory({documentElement:{}},function(){return {getPropertyValue:function(){return ''}}});` — then re-run. (Adjust the test file accordingly and re-run until `all passed`.)

- [ ] **Step 5: Commit**

```bash
git add assets/js/charts.js scripts/test_charts.mjs
git commit -m "feat(charts): shared SVG chart module with hover cards, zoom, reset"
```

---

### Task 5: About page — Films block + wire charts.js for books and films

**Files:**
- Modify: `about/index.html:105-254` (replace the inline chart script; add Films block)

**Interfaces:**
- Consumes: `ReadingCharts.scatter/bars/histogram` (Task 4); `site.data.films`, `site.data.watching_stats`, `site.data.reading_stats`, `site.data.books`.
- Produces: rendered page (verified in browser).

- [ ] **Step 1: Add the Films list block**

In `about/index.html`, immediately after the books `reading-list` block (after the closing `</div>` of `.reading-list`, around line 104, before the `{% if site.data.reading_stats %}`), add:

```liquid
    {% if site.data.films %}
    <p class="experience-description">…and here's what I've been watching:</p>
    <div class="reading-list">
      {% for film in site.data.films %}
      <a href="{{ film.url }}" class="book-item film-item">
        <span class="book-title">{{ film.title }}{% if film.year %} <span class="film-year">{{ film.year }}</span>{% endif %}</span>
        <span class="book-author film-rating">{% if film.rating %}{% assign full = film.rating | floor %}{% for i in (1..full) %}★{% endfor %}{% assign frac = film.rating | minus: full %}{% if frac >= 0.5 %}½{% endif %}{% endif %}</span>
      </a>
      {% endfor %}
      <a href="https://letterboxd.com/ChrisDillon/" class="book-item book-more">
        <span class="book-title">See more on Letterboxd</span>
        <span class="book-author">&rsaquo;</span>
      </a>
    </div>
    {% endif %}
```

- [ ] **Step 2: Add the films charts container + fun stats**

After the existing books `.reading-charts` / `.reading-fun-stats` blocks (i.e. after the books stats, still inside the Personal `<article>`), add a films charts container:

```liquid
    {% if site.data.watching_stats %}
    <div class="reading-charts">
      <div class="reading-chart" id="film-scatter-chart"></div>
      <div class="reading-chart" id="film-yearly-chart"></div>
      <div class="reading-chart" id="film-hist-chart"></div>
    </div>
    {% assign wfun = site.data.watching_stats.fun %}
    {% if wfun %}
    <div class="reading-fun-stats watching-fun-stats">
      <span><strong>{{ wfun.total_films }}</strong> films</span>
      <span><strong>{{ wfun.avg_rating }}</strong> avg rating</span>
      {% if wfun.highest_rated %}<span>top: <strong>{{ wfun.highest_rated.title }}</strong></span>{% endif %}
    </div>
    {% endif %}
    {% endif %}
```

- [ ] **Step 3: Replace the inline chart `<script>` with data + charts.js calls**

Structural note: currently `about/index.html:105` opens `{% if site.data.reading_stats %}` and its matching `{% endif %}` is at line 254, wrapping the books charts, fun-stats, and inline script together. Restructure so the books-charts container + books fun-stats keep their own `{% if site.data.reading_stats %}...{% endif %}` guard (Step 2 of Task 5 added the films container after them). Then **remove** the old inline `<script> (function() { ... })(); </script>` block entirely (was lines 119-253) and the outer wrapper is replaced by per-block guards. Add the following single combined script (guards each chart set independently) as the **last** thing inside the Personal `<article>`, after both fun-stats blocks:

```liquid
    <script src="{{ '/assets/js/charts.js' | relative_url }}"></script>
    <script>
    (function () {
      {% if site.data.reading_stats %}
      var bookTimeline = [{% for b in site.data.reading_stats.timeline %}
        {t:new Date("{{ b.read_at }}").getTime(), y:{{ b.pages }}, title:"{{ b.title | escape }}", sub:"{{ b.pages }}pp · {{ b.author | escape }}", date:"{{ b.read_at }}", img:"{{ b.cover }}"}{% unless forloop.last %},{% endunless %}{% endfor %}
      ];
      var bookPerYear = [{% for s in site.data.reading_stats.per_year %}
        {label:"'{{ s.year | append: '' | slice: 2, 2 }}", count:{{ s.count }}}{% unless forloop.last %},{% endunless %}{% endfor %}
      ];
      ReadingCharts.scatter('scatter-chart', bookTimeline, {yLabel:'pages', yStep:400});
      ReadingCharts.bars('yearly-chart', bookPerYear, {yLabel:'books', yStep:10});
      ReadingCharts.histogram('hist-chart', bookTimeline, {key:'y', edges:[0,100,200,300,400,500,600,700,800,900,1000], xLabels:['0','100','200','300','400','500','600','700','800','900','1000+'], xLabel:'pages'});
      {% endif %}
      {% if site.data.watching_stats %}
      var filmTimeline = [{% for f in site.data.watching_stats.timeline %}
        {t:new Date("{{ f.watched_at }}").getTime(), y:{{ f.rating }}, title:"{{ f.title | escape }}", sub:"{% assign ff = f.rating | floor %}{% for i in (1..ff) %}★{% endfor %}{% assign fr = f.rating | minus: ff %}{% if fr >= 0.5 %}½{% endif %} · {{ f.year }}", date:"{{ f.watched_at }}", img:"{{ f.poster }}"}{% unless forloop.last %},{% endunless %}{% endfor %}
      ];
      var filmPerYear = [{% for s in site.data.watching_stats.per_year %}
        {label:"'{{ s.year | append: '' | slice: 2, 2 }}", count:{{ s.count }}}{% unless forloop.last %},{% endunless %}{% endfor %}
      ];
      ReadingCharts.scatter('film-scatter-chart', filmTimeline, {yLabel:'rating', yMax:5, yStep:1});
      ReadingCharts.bars('film-yearly-chart', filmPerYear, {yLabel:'films', yStep:20});
      ReadingCharts.histogram('film-hist-chart', filmTimeline, {key:'y', edges:[0.5,1.5,2.5,3.5,4.5], xLabels:['1★','2★','3★','4★','5★'], xLabel:'rating'});
      {% endif %}
    })();
    </script>
```

Note on histogram edges for ratings: `edges:[0.5,1.5,2.5,3.5,4.5]` yields 5 bins — [0.5,1.5)→1★, [1.5,2.5)→2★, [2.5,3.5)→3★, [3.5,4.5)→4★, [4.5,∞)→5★. Half-star ratings (e.g. 3.5) fall into the higher bin; acceptable for a compact distribution.

- [ ] **Step 4: Build the site and verify render**

Run: `cd /Users/chrisdillon/christopherjohndillon.github.io && bundle exec jekyll build 2>&1 | tail -5`
Expected: build succeeds ("done in Ns"), no Liquid errors. Then serve: `bundle exec jekyll serve --port 4010` and open `http://localhost:4010/about/`.

Manually verify (browser):
- Books list renders unchanged; new films list renders below it with star ratings + "See more on Letterboxd".
- Three books charts render; three films charts render (scatter y-axis "rating" 0–5, per-year "films" bars, rating histogram).
- **Hover** a scatter dot → card appears with poster/cover thumbnail (film poster / book cover), title, sub (stars·year / pages·author), date; dot highlights.
- **Drag** horizontally across a scatter → zoom band shows; on release the x-range narrows to the selection.
- **Double-click** the scatter → resets to full range.
- Resize the window → all charts reflow.

- [ ] **Step 5: Commit**

```bash
git add about/index.html
git commit -m "feat(about): add Letterboxd films section and interactive charts"
```

---

### Task 6: CSS — film list, hover card, zoom band

**Files:**
- Modify: `css/main.css` (extend the `.reading-*` / `.book-*` block around lines 400-464)

**Interfaces:**
- Consumes: existing tokens (`--nanoflare`, `--mute`, `--dim`, `--rule-strong`, `--f-mono`); classes emitted in Task 5 (`.film-year`, `.film-rating`, `.watching-fun-stats`) and Task 4 (`.chart-hover-card`, `.chc-*`, `.chart-zoom-band`, `.chart-dot`).
- Produces: styling only.

- [ ] **Step 1: Add the styles**

Append to `css/main.css` (near the existing `.reading-chart` rules; keep them grouped):

```css
/* films list */
.film-year {
  font-family: var(--f-mono);
  font-size: 0.7rem;
  color: var(--dim);
}
.film-rating {
  color: var(--nanoflare);
  letter-spacing: 0.05em;
}
/* scatter interactivity */
.reading-chart { position: relative; }
.chart-dot { cursor: pointer; transition: opacity 0.1s; }
.chart-zoom-band { fill: var(--nanoflare); fill-opacity: 0.12; stroke: var(--nanoflare); stroke-opacity: 0.4; stroke-width: 0.5; }
.chart-hover-card {
  position: absolute;
  z-index: 50;
  display: flex;
  gap: 0.5rem;
  max-width: 240px;
  padding: 0.5rem;
  background: var(--observatory);
  border: 1px solid var(--rule-strong);
  border-radius: 4px;
  font-family: var(--f-mono);
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.chart-hover-card img {
  width: 40px;
  height: auto;
  border-radius: 2px;
  flex-shrink: 0;
}
.chc-text { min-width: 0; }
.chc-title { font-size: 0.72rem; color: var(--instrument); line-height: 1.3; }
.chc-sub { font-size: 0.62rem; color: var(--nanoflare); margin-top: 0.15rem; }
.chc-date { font-size: 0.6rem; color: var(--dim); margin-top: 0.1rem; }
```

Note: `var(--observatory)` (#0B0F1A) is the page's base background (see `css/main.css:40`), so the card blends with the site.

- [ ] **Step 2: Verify styling in browser**

Run (if not already serving): `cd /Users/chrisdillon/christopherjohndillon.github.io && bundle exec jekyll serve --port 4010`
Open `http://localhost:4010/about/` and confirm:
- Film titles show a dimmed year and orange stars.
- Hover card is legible, poster sits left of the text, card background matches the site (no jarring color), and the card never overflows off-screen at the edges.
- Zoom band is a faint orange rectangle while dragging.

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "style(charts): film list, hover card, and zoom band styling"
```

---

## Self-Review Notes

- **Spec coverage:** fetch_films.py (Task 1) ↔ spec Component 1; book cover (Task 2) ↔ Component 1b; workflow (Task 3) ↔ Component 2; charts.js interactivity (Task 4) ↔ Component 4; About page films block + wiring (Task 5) ↔ Component 3; CSS (Task 6) ↔ Component 5. Hover/zoom/reset covered in Task 4+5. Error handling (missing rating/poster/cover, feed failure) covered by Task 1 code + Task 2 fallback + `onerror` on `<img>`.
- **Out of scope honored:** no library, no committed posters, no zoom on bars/hist, no reviews.
- **Type consistency:** `points` for scatter/histogram use `{t,y,title,sub,date,img}` consistently across Task 4 (definition) and Task 5 (construction). `series` uses `{label,count}` in both. Histogram consumes `opts.key='y'` and `opts.edges/xLabels`, matching Task 5 calls.
- **Open verification item (flagged for executor):** confirm the exact background-color CSS variable name in `:root` and use it for `.chart-hover-card` background instead of the literal `#0b0e14`.
