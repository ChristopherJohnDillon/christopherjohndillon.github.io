"""Fetch recently-watched films from Letterboxd RSS and accumulate them.

Letterboxd's RSS only exposes the ~50 most-recent diary entries. Because this
runs daily, we merge each run's window into a growing archive
(_data/films_archive.json) keyed by diary-entry guid, so history builds up
beyond the RSS cap. Stats are then computed from the archive.

Writes:
  _data/films_archive.json  – every diary entry ever seen (source of truth)
  _data/films.json          – last 5 films (for the About-page list)
  _data/watching_stats.json – per_year / fun / timeline, derived from archive

Stdlib only.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

FEED_URL = "https://letterboxd.com/ChrisDillon/rss/"
DATA = Path(__file__).resolve().parent.parent / "_data"
OUT = DATA / "films.json"
STATS_OUT = DATA / "watching_stats.json"
ARCHIVE = DATA / "films_archive.json"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
N_FILMS = 5
MIN_YEAR = 2021
ENTRY_KEYS = ("guid", "title", "year", "rating", "watched_at", "poster", "url")


def clean(text):
    """Strip whitespace, tolerate None."""
    return (text or "").strip()


def poster_from_description(desc):
    """Pull the poster image URL out of the description CDATA."""
    m = re.search(r'<img src="([^"]+)"', desc or "")
    return m.group(1) if m else ""


def parse_item(item):
    """Parse one <item> into a diary entry; rating/year/poster may be missing."""
    year_raw = clean(item.findtext("letterboxd:filmYear", "", NS))
    rating_raw = clean(item.findtext("letterboxd:memberRating", "", NS))
    url = clean(item.findtext("link", ""))
    watched_at = clean(item.findtext("letterboxd:watchedDate", "", NS))
    guid = clean(item.findtext("guid", "")) or (url + "#" + watched_at)
    return {
        "guid": guid,
        "title": clean(item.findtext("letterboxd:filmTitle", "", NS)),
        "year": int(year_raw) if year_raw.isdigit() else None,
        "rating": float(rating_raw) if rating_raw else None,
        "watched_at": watched_at,
        "poster": poster_from_description(item.findtext("description", "")),
        "url": url,
    }


def parse_feed(items):
    """Parse a list of <item> elements into diary entries."""
    return [parse_item(it) for it in items]


def load_archive():
    """Load the persisted archive, or [] if absent/unreadable."""
    if ARCHIVE.exists():
        try:
            data = json.loads(ARCHIVE.read_text())
            return data if isinstance(data, list) else []
        except (ValueError, OSError):
            return []
    return []


def merge_archive(archive, new_entries):
    """Merge new_entries into archive, keyed by guid.

    New or changed entries win (e.g. a later re-rating updates in place); old
    entries not present in the current feed are never dropped. Returns a new
    list sorted ascending by watched_at.
    """
    by_guid = {e["guid"]: e for e in archive if e.get("guid")}
    for e in new_entries:
        if e.get("guid"):
            by_guid[e["guid"]] = e
    merged = list(by_guid.values())
    merged.sort(key=lambda e: e.get("watched_at") or "")
    return merged


def recent_films(archive, n=N_FILMS):
    """Last n diary entries by watched date (newest first); title+date required."""
    valid = [e for e in archive if e.get("title") and e.get("watched_at")]
    valid.sort(key=lambda e: e["watched_at"], reverse=True)
    return [{k: e.get(k) for k in ENTRY_KEYS if k != "guid"} for e in valid[:n]]


def watching_stats(archive):
    """Return (per_year, fun, timeline) computed from the archive."""
    years = Counter()
    timeline = []
    rated = []
    for e in archive:
        m = re.match(r"(\d{4})", e.get("watched_at") or "")
        if not m:
            continue
        y = int(m.group(1))
        if y >= MIN_YEAR:
            years[y] += 1
        if e.get("rating") is not None and y >= MIN_YEAR:
            timeline.append({
                "title": e["title"],
                "year": e.get("year"),
                "rating": e["rating"],
                "watched_at": e["watched_at"],
                "poster": e.get("poster", ""),
            })
            rated.append(e["rating"])
    per_year = [{"year": y, "count": years[y]} for y in sorted(years)]
    timeline.sort(key=lambda x: x["watched_at"])
    highest = max(timeline, key=lambda x: x["rating"], default=None)
    fun = {
        "total_films": sum(years.values()),
        "avg_rating": round(sum(rated) / len(rated), 2) if rated else 0.0,
        "highest_rated": {"title": highest["title"], "rating": highest["rating"]} if highest else None,
    }
    return per_year, fun, timeline


def fetch_feed():
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return ET.fromstring(resp.read())


if __name__ == "__main__":
    root = fetch_feed()
    items = root.findall(".//item")
    archive = merge_archive(load_archive(), parse_feed(items))
    films = recent_films(archive)
    per_year, fun, timeline = watching_stats(archive)
    DATA.mkdir(exist_ok=True)
    ARCHIVE.write_text(json.dumps(archive, indent=2) + "\n")
    OUT.write_text(json.dumps(films, indent=2) + "\n")
    STATS_OUT.write_text(json.dumps({"per_year": per_year, "fun": fun, "timeline": timeline}, indent=2) + "\n")
    print(f"Archive now holds {len(archive)} diary entries")
    print(f"Wrote {len(films)} films to {OUT}")
    print(f"Wrote stats ({len(timeline)} timeline entries) to {STATS_OUT}")




#
