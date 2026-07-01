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
