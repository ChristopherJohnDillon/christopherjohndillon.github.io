"""Daily Goodreads refresh from a library CSV export, merged with the frozen
historical baseline in _data/reading_history.json to produce reading_stats.json.

Goodreads retired its RSS feeds in Oct 2026, so the export CSV (My Books ->
Import & Export) is now the source; yeats/goodreads_sync.sh grabs it daily via
Safari and runs this script with its path.

Books read in years < CUTOFF_YEAR are "historical" and frozen — build them once
with build_reading_history.py; this script never rewrites reading_history.json.
Books read in CUTOFF_YEAR or later are "ongoing" and refreshed here every run.
"""
import csv
import json
import re
import sys
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "_data"
OUT = DATA / "books.json"
STATS_OUT = DATA / "reading_stats.json"
HISTORY = DATA / "reading_history.json"
N_BOOKS = 5
MIN_YEAR = 2015     # earliest year shown in per-year chart / scatter timeline
CUTOFF_YEAR = 2026  # years >= CUTOFF_YEAR are refreshed every run; earlier = frozen
COVER_URL = "https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false"


def clean(text):
    """Strip whitespace and the ="..." wrapper Goodreads puts round ISBNs."""
    text = (text or "").strip()
    m = re.fullmatch(r'="(.*)"', text)
    return m.group(1).strip() if m else text


def parse_date(raw):
    """Extract YYYY-MM-DD from a Goodreads YYYY/MM/DD date string."""
    m = re.search(r"(\d{4})/(\d{2})/(\d{2})", raw or "")
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""


def parse_row(row):
    """Flatten one export CSV row into a plain dict."""
    # drop trailing "(Series #n)" style parenthetical
    title = re.sub(r"\s*\(.+?\)\s*$", "", clean(row.get("Title")))
    read_raw = clean(row.get("Date Read"))
    ym = re.search(r"(\d{4})", read_raw)
    pages = clean(row.get("Number of Pages"))
    return {
        "title": title,
        "author": clean(row.get("Author")),
        "pages": int(pages) if pages.isdigit() else 0,
        "read_at": parse_date(read_raw),
        "year": int(ym.group(1)) if ym else None,
        "cover": "",
        "isbn": clean(row.get("ISBN13")) or clean(row.get("ISBN")),
        "book_id": clean(row.get("Book Id")),
        "rating": int(clean(row.get("My Rating")) or "0"),
    }


def items_from_csv(path):
    """Every book on the read shelf of a Goodreads export CSV."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        return [parse_row(r) for r in csv.DictReader(f) if clean(r.get("Exclusive Shelf")) == "read"]


def lookup_cover(isbn):
    """Open Library cover URL for an ISBN, or "" if it has none."""
    if not isbn:
        return ""
    url = COVER_URL.format(isbn=isbn)
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15):
            return url
    except (urllib.error.URLError, TimeoutError):
        return ""


def add_covers(books, known, lookup=lookup_cover):
    """Fill covers from the last stats run (keyed by title + read date), and
    look up only books we haven't seen before — the export carries no images."""
    for b in books:
        b["cover"] = known.get((b["title"], b["read_at"])) or lookup(b["isbn"])


def known_covers(stats_path=STATS_OUT):
    """(title, read_at) -> cover from the previous reading_stats.json."""
    if not stats_path.exists():
        return {}
    timeline = json.loads(stats_path.read_text()).get("timeline", [])
    return {(b["title"], b["read_at"]): b["cover"] for b in timeline if b.get("cover")}


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
    if len(sys.argv) != 2:
        raise SystemExit("usage: fetch_books.py <goodreads_library_export.csv>")
    if not HISTORY.exists():
        raise SystemExit(f"missing {HISTORY} — run build_reading_history.py once to seed it")
    history = json.loads(HISTORY.read_text())
    books = items_from_csv(sys.argv[1])
    ongoing_books = [b for b in books if b["year"] and b["year"] >= CUTOFF_YEAR]
    add_covers(ongoing_books, known_covers())
    ongoing = summarize(ongoing_books)
    stats = merge(history, ongoing)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(recent_books(books), indent=2) + "\n")
    STATS_OUT.write_text(json.dumps(stats, indent=2) + "\n")
    print(f"Wrote {N_BOOKS} recent books to {OUT}")
    print(f"Merged {history['total_books']} historical + {ongoing['total_books']} ongoing "
          f"= {stats['fun']['total_books']} books ({stats['fun']['total_pages']} pages)")




#
