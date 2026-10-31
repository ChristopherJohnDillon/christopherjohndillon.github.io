"""One-time builder for the frozen historical reading baseline.

Reads a full Goodreads library export CSV and writes _data/reading_history.json
with the summary of every book read before CUTOFF_YEAR (plus undated books).
Run this manually when you want to re-freeze history (e.g. after rolling
CUTOFF_YEAR forward); the daily fetch_books.py merges recent reads on top of it
and never rewrites this file.

    python scripts/build_reading_history.py <goodreads_library_export.csv>
"""
import json
import sys
from pathlib import Path

import fetch_books as fb

OUT = Path(__file__).resolve().parent.parent / "_data" / "reading_history.json"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: build_reading_history.py <goodreads_library_export.csv>")
    books = fb.items_from_csv(sys.argv[1])
    # freeze everything except the ongoing (current) years, which fetch_books.py refreshes daily
    historical = [b for b in books if not (b["year"] and b["year"] >= fb.CUTOFF_YEAR)]
    # reuse covers already frozen or shown, so only unseen books hit Open Library
    known = fb.known_covers(OUT) | fb.known_covers()
    fb.add_covers(historical, known)
    summary = fb.summarize(historical)
    OUT.write_text(json.dumps(summary, indent=2) + "\n")
    print(f"Read {len(books)} books; froze {summary['total_books']} historical "
          f"(< {fb.CUTOFF_YEAR}) totalling {summary['total_pages']} pages")
    print(f"Wrote {OUT}")




#
