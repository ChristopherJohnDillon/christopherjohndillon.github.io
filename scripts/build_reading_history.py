"""One-time builder for the frozen historical reading baseline.

Paginates the full Goodreads "read" shelf and writes _data/reading_history.json
with the summary of every book read before CUTOFF_YEAR (plus undated books).
Run this manually when you want to re-freeze history; the daily fetch_books.py
merges recent reads on top of it and never rewrites this file.

    python scripts/build_reading_history.py
"""
import json
from pathlib import Path

import fetch_books as fb

OUT = Path(__file__).resolve().parent.parent / "_data" / "reading_history.json"
MAX_PAGES = 20  # safety stop; the shelf is a few hundred books


def fetch_all():
    """Every book on the read shelf, walking pages until one comes back empty."""
    books = []
    for page in range(1, MAX_PAGES + 1):
        page_books = fb.items_from(fb.fetch_page(page))
        if not page_books:
            break
        books += page_books
    return books


if __name__ == "__main__":
    books = fetch_all()
    # freeze everything except the ongoing (current) years, which fetch_books.py pulls daily
    historical = [b for b in books if not (b["year"] and b["year"] >= fb.CUTOFF_YEAR)]
    summary = fb.summarize(historical)
    OUT.write_text(json.dumps(summary, indent=2) + "\n")
    print(f"Fetched {len(books)} books; froze {summary['total_books']} historical "
          f"(< {fb.CUTOFF_YEAR}) totalling {summary['total_pages']} pages")
    print(f"Wrote {OUT}")




#
