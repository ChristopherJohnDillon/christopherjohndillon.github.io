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
