"""Fetch recently-read books from Goodreads RSS and write _data/books.json."""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

FEED_URL = "https://www.goodreads.com/review/list_rss/17038700?shelf=read&per_page=200"
OUT = Path(__file__).resolve().parent.parent / "_data" / "books.json"
STATS_OUT = Path(__file__).resolve().parent.parent / "_data" / "reading_stats.json"
N_BOOKS = 5
MIN_YEAR = 2019


def clean(text):
    """Strip CDATA whitespace."""
    return (text or "").strip()


def parse_date(raw):
    """Extract YYYY-MM-DD from Goodreads date string."""
    m = re.search(r"(\d{4})/(\d{2})/(\d{2})", raw or "")
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.search(r"(\d{1,2}) (\w{3}) (\d{4})", raw or "")
    if m:
        from datetime import datetime
        dt = datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    return ""


def fetch_feed():
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        xml = resp.read()
    return ET.fromstring(xml)


def recent_books(root):
    books = []
    for item in root.findall(".//item")[:N_BOOKS]:
        title = clean(item.findtext("title", ""))
        title = re.sub(r"\s*\(.+?\)\s*$", "", title)
        author = clean(item.findtext("author_name", ""))
        rating = int(item.findtext("user_rating", "0") or "0")
        read_at = clean(item.findtext("user_read_at", ""))
        book_id = clean(item.findtext("book_id", ""))
        date_str = ""
        if read_at:
            date_str = parse_date(read_at)
        url = f"https://www.goodreads.com/book/show/{book_id}" if book_id else ""
        books.append({
            "title": title,
            "author": author,
            "rating": rating,
            "read_at": date_str,
            "url": url,
        })
    return books


def yearly_stats(root):
    from collections import Counter
    years = Counter()
    all_books = []
    for item in root.findall(".//item"):
        read_at = clean(item.findtext("user_read_at", ""))
        m = re.search(r"(\d{4})", read_at)
        if m:
            y = int(m.group(1))
            if y >= MIN_YEAR:
                years[y] += 1
        title = clean(item.findtext("title", ""))
        title = re.sub(r"\s*\(.+?\)\s*$", "", title)
        author = clean(item.findtext("author_name", ""))
        pages_el = item.find(".//book/num_pages")
        pages = int(pages_el.text) if pages_el is not None and pages_el.text and pages_el.text != "0" else 0
        if pages >= 100:
            all_books.append({"title": title, "author": author, "pages": pages})
    per_year = [{"year": y, "count": years[y]} for y in sorted(years)]
    all_books.sort(key=lambda b: b["pages"])
    total_pages = sum(b["pages"] for b in all_books)
    fun_stats = {
        "total_books": len(all_books),
        "total_pages": total_pages,
        "avg_pages": total_pages // len(all_books) if all_books else 0,
        "shortest": all_books[0] if all_books else None,
        "longest": all_books[-1] if all_books else None,
    }
    return per_year, fun_stats


if __name__ == "__main__":
    root = fetch_feed()
    books = recent_books(root)
    per_year, fun_stats = yearly_stats(root)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(books, indent=2) + "\n")
    STATS_OUT.write_text(json.dumps({"per_year": per_year, "fun": fun_stats}, indent=2) + "\n")
    print(f"Wrote {len(books)} books to {OUT}")
    print(f"Wrote stats to {STATS_OUT}")
