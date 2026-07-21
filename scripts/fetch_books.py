"""Daily Goodreads pull: fetch page 1 (recent reads) and merge with the frozen
historical baseline in _data/reading_history.json to produce reading_stats.json.

Books read in years < CUTOFF_YEAR are "historical" and frozen — build them once
with build_reading_history.py; this script never rewrites reading_history.json.
Books read in CUTOFF_YEAR or later are "ongoing" and refreshed here every run.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime
from pathlib import Path

USER_ID = "17038700"
FEED_URL = f"https://www.goodreads.com/review/list_rss/{USER_ID}?shelf=read&per_page=200"
DATA = Path(__file__).resolve().parent.parent / "_data"
OUT = DATA / "books.json"
STATS_OUT = DATA / "reading_stats.json"
HISTORY = DATA / "reading_history.json"
N_BOOKS = 5
MIN_YEAR = 2015     # earliest year shown in per-year chart / scatter timeline
CUTOFF_YEAR = 2026  # years >= CUTOFF_YEAR are pulled fresh daily; earlier = frozen


def clean(text):
    """Strip CDATA whitespace."""
    return (text or "").strip()


def parse_date(raw):
    """Extract YYYY-MM-DD from a Goodreads date string."""
    m = re.search(r"(\d{4})/(\d{2})/(\d{2})", raw or "")
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.search(r"(\d{1,2}) (\w{3}) (\d{4})", raw or "")
    if m:
        dt = datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    return ""


def parse_item(item):
    """Flatten one RSS <item> into a plain dict."""
    title = clean(item.findtext("title", ""))
    # drop trailing "(Series #n)" style parenthetical
    title = re.sub(r"\s*\(.+?\)\s*$", "", title)
    author = clean(item.findtext("author_name", ""))
    read_raw = clean(item.findtext("user_read_at", ""))
    date_str = parse_date(read_raw) if read_raw else ""
    ym = re.search(r"(\d{4})", read_raw)
    year = int(ym.group(1)) if ym else None
    pages_el = item.find(".//book/num_pages")
    pages = int(pages_el.text) if pages_el is not None and pages_el.text and pages_el.text != "0" else 0
    cover = clean(item.findtext("book_large_image_url", "")) or clean(item.findtext("book_image_url", ""))
    return {
        "title": title,
        "author": author,
        "pages": pages,
        "read_at": date_str,
        "year": year,
        "cover": cover,
        "book_id": clean(item.findtext("book_id", "")),
        "rating": int(item.findtext("user_rating", "0") or "0"),
    }


def fetch_page(page):
    """Fetch one RSS page and return its parsed root element."""
    url = f"{FEED_URL}&page={page}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return ET.fromstring(resp.read())


def items_from(root):
    """Parse every <item> in an RSS root into dicts."""
    return [parse_item(it) for it in root.findall(".//item")]


def recent_books(books, n=N_BOOKS):
    """The n most-recent reads, shaped for books.json."""
    out = []
    for b in books[:n]:
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
    """Per-year counts, page totals, and a dated timeline for a set of books.

    total_books counts every book (incl. undated / pre-min_year), while per_year
    and timeline only cover dated reads from min_year onward.
    """
    years = Counter()
    timeline = []
    with_pages = [b for b in books if b["pages"] > 0]
    for b in books:
        if b["year"] and b["year"] >= min_year:
            years[b["year"]] += 1
            if b["read_at"] and b["pages"] > 0:
                timeline.append({
                    "title": b["title"],
                    "author": b["author"],
                    "pages": b["pages"],
                    "read_at": b["read_at"],
                    "cover": b["cover"],
                })
    timeline.sort(key=lambda b: b["read_at"])
    return {
        "total_books": len(books),
        "page_books": len(with_pages),
        "total_pages": sum(b["pages"] for b in with_pages),
        "per_year": {str(y): c for y, c in years.items()},
        "timeline": timeline,
    }


def merge(history, ongoing):
    """Combine the frozen historical summary with the fresh ongoing summary."""
    years = Counter()
    for src in (history["per_year"], ongoing["per_year"]):
        for y, c in src.items():
            years[int(y)] += c
    per_year = [{"year": y, "count": years[y]} for y in sorted(years)]
    timeline = sorted(history["timeline"] + ongoing["timeline"], key=lambda b: b["read_at"])
    total_books = history["total_books"] + ongoing["total_books"]
    page_books = history["page_books"] + ongoing["page_books"]
    total_pages = history["total_pages"] + ongoing["total_pages"]
    by_pages = sorted(timeline, key=lambda b: b["pages"])
    fun = {
        "total_books": total_books,
        "total_pages": total_pages,
        "avg_pages": total_pages // page_books if page_books else 0,
        "shortest": {"title": by_pages[0]["title"], "author": by_pages[0]["author"], "pages": by_pages[0]["pages"]} if by_pages else None,
        "longest": {"title": by_pages[-1]["title"], "author": by_pages[-1]["author"], "pages": by_pages[-1]["pages"]} if by_pages else None,
    }
    return {"per_year": per_year, "fun": fun, "timeline": timeline}


if __name__ == "__main__":
    if not HISTORY.exists():
        raise SystemExit(f"missing {HISTORY} — run build_reading_history.py once to seed it")
    history = json.loads(HISTORY.read_text())
    books = items_from(fetch_page(1))
    ongoing = summarize([b for b in books if b["year"] and b["year"] >= CUTOFF_YEAR])
    stats = merge(history, ongoing)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(recent_books(books), indent=2) + "\n")
    STATS_OUT.write_text(json.dumps(stats, indent=2) + "\n")
    print(f"Wrote {N_BOOKS} recent books to {OUT}")
    print(f"Merged {history['total_books']} historical + {ongoing['total_books']} ongoing "
          f"= {stats['fun']['total_books']} books ({stats['fun']['total_pages']} pages)")




#
