"""Offline test for fetch_books item parsing and summary."""
import xml.etree.ElementTree as ET
from pathlib import Path
import fetch_books as fb

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "goodreads_sample.xml"


def test_summary_has_cover():
    root = ET.parse(FIXTURE).getroot()
    books = fb.items_from(root)
    summary = fb.summarize(books)
    assert summary["total_books"] == 1
    timeline = summary["timeline"]
    assert len(timeline) == 1
    entry = timeline[0]
    assert entry["title"] == "Foster"          # trailing "(Something)" stripped
    assert entry["pages"] == 101
    assert entry["cover"] == "https://i.gr-assets.com/large.jpg"  # prefers large


def test_merge_totals_add_up():
    history = {"total_books": 500, "page_books": 480, "total_pages": 150000,
               "per_year": {"2024": 25}, "timeline": []}
    ongoing = {"total_books": 24, "page_books": 24, "total_pages": 8000,
               "per_year": {"2026": 24}, "timeline": []}
    stats = fb.merge(history, ongoing)
    assert stats["fun"]["total_books"] == 524
    assert stats["fun"]["total_pages"] == 158000
    years = {row["year"]: row["count"] for row in stats["per_year"]}
    assert years == {2024: 25, 2026: 24}


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all passed")
