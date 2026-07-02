"""Offline tests for fetch_films.py (stdlib only, no network, no pytest)."""
import xml.etree.ElementTree as ET
from pathlib import Path
import fetch_films as ff

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "letterboxd_sample.xml"


def load_items():
    root = ET.parse(FIXTURE).getroot()
    return root.findall(".//item")


def load_entries():
    return ff.parse_feed(load_items())


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
    assert f["guid"] == "letterboxd-watch-1375941130"


def test_parse_item_missing_rating():
    item = load_items()[2]
    f = ff.parse_item(item)
    assert f["title"] == "Some Old Film"
    assert f["rating"] is None
    assert f["poster"] == ""


def test_recent_films_order_and_limit():
    films = ff.recent_films(load_entries())
    assert len(films) == 3
    assert films[0]["title"] == "Dog Day Afternoon"  # newest by watched date
    assert "guid" not in films[0]  # list entries drop the internal key


def test_watching_stats():
    per_year, fun, timeline = ff.watching_stats(load_entries())
    years = {d["year"]: d["count"] for d in per_year}
    assert years == {2021: 1, 2026: 2}
    # only rated films appear in the timeline, sorted ascending by date
    assert [t["title"] for t in timeline] == ["Ripley's Game", "Dog Day Afternoon"]
    assert timeline[0]["poster"].endswith("crop.jpg")
    assert fun["total_films"] == 3
    assert fun["avg_rating"] == 4.5
    assert fun["highest_rated"]["title"] == "Dog Day Afternoon"


def test_merge_archive_dedup_update_and_keep():
    entries = load_entries()
    # seed an empty archive
    a1 = ff.merge_archive([], entries)
    assert len(a1) == 3
    # sorted ascending by watched_at
    assert [e["watched_at"] for e in a1] == sorted(e["watched_at"] for e in a1)
    # re-merging the same feed does not duplicate
    a2 = ff.merge_archive(a1, entries)
    assert len(a2) == 3
    # an old entry absent from the feed is retained
    old = {"guid": "old-1", "title": "Vintage", "year": 1970, "rating": 3.0,
           "watched_at": "2019-05-01", "poster": "", "url": "u"}
    a3 = ff.merge_archive([old], entries)
    assert len(a3) == 4
    assert any(e["guid"] == "old-1" for e in a3)
    assert a3[0]["guid"] == "old-1"  # oldest sorts first


def test_merge_archive_rerating_updates_in_place():
    entries = load_entries()
    a1 = ff.merge_archive([], entries)
    rerated = dict(entries[0])
    rerated["rating"] = 2.0
    a2 = ff.merge_archive(a1, [rerated])
    match = [e for e in a2 if e["guid"] == entries[0]["guid"]]
    assert len(match) == 1
    assert match[0]["rating"] == 2.0


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all passed")
