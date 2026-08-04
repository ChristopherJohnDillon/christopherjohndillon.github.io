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
    assert entry["rating"] == 5
    assert entry["cover"] == "https://i.gr-assets.com/large.jpg"  # prefers large
    assert summary["ratings"] == {"5": 1}
    assert summary["authors"] == {"Claire Keegan": {"count": 1, "pages": 101, "rating_sum": 5, "rated": 1, "fives": 1}}


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


def test_merge_author_boards_and_ratings():
    history = {"total_books": 5, "page_books": 5, "total_pages": 2000,
               "per_year": {"2024": 5}, "timeline": [],
               "ratings": {"4": 2, "5": 2},
               "authors": {"Lee Child": {"count": 4, "pages": 1600, "rating_sum": 13, "rated": 3, "fives": 1},
                           "Claire Keegan": {"count": 1, "pages": 400, "rating_sum": 5, "rated": 1, "fives": 1}}}
    ongoing = {"total_books": 2, "page_books": 2, "total_pages": 600,
               "per_year": {"2026": 2}, "timeline": [],
               "ratings": {"5": 2},
               "authors": {"Claire Keegan": {"count": 2, "pages": 600, "rating_sum": 10, "rated": 2, "fives": 2}}}
    stats = fb.merge(history, ongoing)
    # most read: Lee Child (4) ahead of Claire Keegan (3)
    assert [r["author"] for r in stats["most_read"]] == ["Lee Child", "Claire Keegan"]
    assert stats["most_read"][1] == {"author": "Claire Keegan", "count": 3, "pages": 1000}
    # favourites: score = count + 2*fives; Keegan 3+6=9 beats Child 4+2=6
    assert [r["author"] for r in stats["favourites"]] == ["Claire Keegan", "Lee Child"]
    assert stats["favourites"][0] == {"author": "Claire Keegan", "score": 9, "fives": 3, "count": 3, "avg": 5.0}
    # ratings distribution always covers 1..5
    dist = {r["rating"]: r["count"] for r in stats["ratings_dist"]}
    assert dist == {1: 0, 2: 0, 3: 0, 4: 2, 5: 4}
    assert stats["fun"]["five_star"] == 4
    assert stats["fun"]["avg_rating"] == round(28 / 6, 2)


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all passed")
