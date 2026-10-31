"""Daily Goodreads refresh from a scraped "read" shelf, merged with the frozen
historical baseline in _data/reading_history.json to produce reading_stats.json.

Goodreads retired its RSS feeds in Oct 2026, so yeats scrapes the shelf through
its logged-in Safari (yeats/goodreads_shelf.applescript -> JSON) and runs this
script on the result via yeats/goodreads_sync.sh.

Books read in years < CUTOFF_YEAR are "historical" and frozen — build them once
with build_reading_history.py; this script never rewrites reading_history.json.
Books read in CUTOFF_YEAR or later are "ongoing" and refreshed here every run.
"""
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "_data"
OUT = DATA / "books.json"
STATS_OUT = DATA / "reading_stats.json"
HISTORY = DATA / "reading_history.json"
N_BOOKS = 5
MIN_YEAR = 2015     # earliest year shown in per-year chart / scatter timeline
CUTOFF_YEAR = 2026  # years >= CUTOFF_YEAR are refreshed every run; earlier = frozen


def parse_date(raw):
    """YYYY-MM-DD from a shelf date like "Oct 25, 2026"; month-only dates
    ("Oct 2026") take the 1st, as the old RSS feed did; year-only gives ""."""
    for fmt in ("%b %d, %Y", "%b %Y"):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return ""


def author_name(raw):
    """Shelf pages list authors "Last, First"; flip to "First Last"."""
    last, _, first = raw.partition(", ")
    return f"{first} {last}" if first else last


def parse_row(row):
    """Normalise one scraped shelf row into a plain dict."""
    ym = re.search(r"(\d{4})", row.get("read_at", ""))
    pages = re.search(r"\d+", row.get("pages", "").replace(",", ""))
    return {
        # drop trailing "(Series #n)" style parenthetical
        "title": re.sub(r"\s*\(.+?\)\s*$", "", row.get("title", "").strip()),
        "author": author_name(row.get("author", "").strip()),
        "pages": int(pages.group()) if pages else 0,
        "read_at": parse_date(row.get("read_at", "")),
        "year": int(ym.group(1)) if ym else None,
        # shelf thumbnails are 75px; same image is served at 475px
        "cover": re.sub(r"\._SY\d+_\.", "._SY475_.", row.get("cover", "")),
        "book_id": row.get("book_id", ""),
        "rating": int(row.get("rating") or 0),
    }


def items_from_scrape(path):
    """Every book in a goodreads_shelf.applescript JSON dump."""
    return [parse_row(r) for r in json.loads(Path(path).read_text())]


def stored_ongoing(history, stats_path=STATS_OUT):
    """How many ongoing books the last published stats counted."""
    if not stats_path.exists():
        return 0
    return json.loads(stats_path.read_text())["fun"]["total_books"] - history["total_books"]


def recent_books(books, n=N_BOOKS):
    """The n most-recent reads, shaped for books.json."""
    # feed order follows shelf edits, not reads; undated books sort last
    by_read = sorted(books, key=lambda b: b["read_at"] or "", reverse=True)
    out = []
    for b in by_read[:n]:
        url = f"https://www.goodreads.com/book/show/{b['book_id']}" if b["book_id"] else ""
        out.append({
            "title": b["title"],
            "author": b["author"],
            "rating": b["rating"],
            "read_at": b["read_at"],
            "url": url,
        })
    return out


def summarize(books, min_year=MIN_YEAR):
    """Per-year counts, page totals, author aggregates, ratings, and a dated
    timeline for a set of books.

    total_books, authors, and ratings cover every book (incl. undated /
    pre-min_year), while per_year and timeline only cover dated reads from
    min_year onward. A rating of 0 means unrated and is excluded from ratings.
    """
    years = Counter()
    ratings = Counter()
    authors = {}
    timeline = []
    with_pages = [b for b in books if b["pages"] > 0]
    for b in books:
        rating = b.get("rating", 0)
        if b["author"]:
            a = authors.setdefault(b["author"], {"count": 0, "pages": 0, "rating_sum": 0, "rated": 0, "fives": 0})
            a["count"] += 1
            a["pages"] += b["pages"]
            if rating:
                a["rating_sum"] += rating
                a["rated"] += 1
                if rating == 5:
                    a["fives"] += 1
        if rating:
            ratings[rating] += 1
        if b["year"] and b["year"] >= min_year:
            years[b["year"]] += 1
            if b["read_at"] and b["pages"] > 0:
                timeline.append({
                    "title": b["title"],
                    "author": b["author"],
                    "pages": b["pages"],
                    "rating": rating,
                    "read_at": b["read_at"],
                    "cover": b["cover"],
                })
    timeline.sort(key=lambda b: b["read_at"])
    return {
        "total_books": len(books),
        "page_books": len(with_pages),
        "total_pages": sum(b["pages"] for b in with_pages),
        "per_year": {str(y): c for y, c in years.items()},
        "ratings": {str(r): c for r, c in ratings.items()},
        "authors": authors,
        "timeline": timeline,
    }


TOP_AUTHORS = 12      # rows shown in each author leaderboard


def fav_score(a):
    """Favourite-author score: one point per book read, two more per five-star."""
    return a["count"] + 2 * a.get("fives", 0)


def author_boards(history, ongoing):
    """Merge the two author aggregates and rank them for the reading page."""
    authors = {}
    for src in (history.get("authors", {}), ongoing.get("authors", {})):
        for name, a in src.items():
            m = authors.setdefault(name, {"count": 0, "pages": 0, "rating_sum": 0, "rated": 0, "fives": 0})
            for k in m:
                m[k] += a.get(k, 0)
    most_read = [
        {"author": name, "count": a["count"], "pages": a["pages"]}
        for name, a in sorted(authors.items(), key=lambda kv: (-kv[1]["count"], kv[0]))
    ][:TOP_AUTHORS]
    favourites = [
        {"author": name, "score": fav_score(a), "fives": a["fives"], "count": a["count"],
         "avg": round(a["rating_sum"] / a["rated"], 2) if a["rated"] else 0}
        for name, a in sorted(authors.items(), key=lambda kv: (-fav_score(kv[1]), -kv[1]["fives"], kv[0]))
        if a["fives"] > 0
    ][:TOP_AUTHORS]
    return most_read, favourites


def merge(history, ongoing):
    """Combine the frozen historical summary with the fresh ongoing summary."""
    years = Counter()
    for src in (history["per_year"], ongoing["per_year"]):
        for y, c in src.items():
            years[int(y)] += c
    per_year = [{"year": y, "count": years[y]} for y in sorted(years)]
    ratings = Counter()
    for src in (history.get("ratings", {}), ongoing.get("ratings", {})):
        for r, c in src.items():
            ratings[int(r)] += c
    ratings_dist = [{"rating": r, "count": ratings.get(r, 0)} for r in range(1, 6)]
    rated_books = sum(ratings.values())
    rating_total = sum(r * c for r, c in ratings.items())
    most_read, favourites = author_boards(history, ongoing)
    timeline = sorted(history["timeline"] + ongoing["timeline"], key=lambda b: b["read_at"])
    total_books = history["total_books"] + ongoing["total_books"]
    page_books = history["page_books"] + ongoing["page_books"]
    total_pages = history["total_pages"] + ongoing["total_pages"]
    by_pages = sorted(timeline, key=lambda b: b["pages"])
    fun = {
        "total_books": total_books,
        "total_pages": total_pages,
        "avg_pages": total_pages // page_books if page_books else 0,
        "avg_rating": round(rating_total / rated_books, 2) if rated_books else 0,
        "rated_books": rated_books,
        "five_star": ratings.get(5, 0),
        "shortest": {"title": by_pages[0]["title"], "author": by_pages[0]["author"], "pages": by_pages[0]["pages"]} if by_pages else None,
        "longest": {"title": by_pages[-1]["title"], "author": by_pages[-1]["author"], "pages": by_pages[-1]["pages"]} if by_pages else None,
    }
    return {
        "per_year": per_year,
        "fun": fun,
        "most_read": most_read,
        "favourites": favourites,
        "ratings_dist": ratings_dist,
        "timeline": timeline,
    }


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--force"]
    if len(args) != 1:
        raise SystemExit("usage: fetch_books.py <shelf.json> [--force]")
    if not HISTORY.exists():
        raise SystemExit(f"missing {HISTORY} — run build_reading_history.py once to seed it")
    history = json.loads(HISTORY.read_text())
    books = items_from_scrape(args[0])
    ongoing = summarize([b for b in books if b["year"] and b["year"] >= CUTOFF_YEAR])
    # reads only accumulate, so fewer than last time means a broken scrape
    before = stored_ongoing(history)
    if ongoing["total_books"] < before and "--force" not in sys.argv:
        raise SystemExit(f"scrape found {ongoing['total_books']} books since {CUTOFF_YEAR}, "
                         f"fewer than the {before} stored — not overwriting (use --force)")
    stats = merge(history, ongoing)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(recent_books(books), indent=2) + "\n")
    STATS_OUT.write_text(json.dumps(stats, indent=2) + "\n")
    print(f"Wrote {N_BOOKS} recent books to {OUT}")
    print(f"Merged {history['total_books']} historical + {ongoing['total_books']} ongoing "
          f"(was {before}) = {stats['fun']['total_books']} books ({stats['fun']['total_pages']} pages)")




#
