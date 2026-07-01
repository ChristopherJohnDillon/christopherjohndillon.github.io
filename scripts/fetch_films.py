"""Fetch recently-watched films from Letterboxd RSS.

Writes _data/films.json (last 5) and _data/watching_stats.json.
Mirror of fetch_books.py. Stdlib only.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

FEED_URL = "https://letterboxd.com/ChrisDillon/rss/"
OUT = Path(__file__).resolve().parent.parent / "_data" / "films.json"
STATS_OUT = Path(__file__).resolve().parent.parent / "_data" / "watching_stats.json"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
N_FILMS = 5
MIN_YEAR = 2021


def clean(text):
    """Strip whitespace, tolerate None."""
    return (text or "").strip()


def poster_from_description(desc):
    """Pull the poster image URL out of the description CDATA."""
    m = re.search(r'<img src="([^"]+)"', desc or "")
    return m.group(1) if m else ""


def parse_item(item):
    """Parse one <item> into a film dict; rating/year/poster may be missing."""
    title = clean(item.findtext("letterboxd:filmTitle", "", NS))
    year_raw = clean(item.findtext("letterboxd:filmYear", "", NS))
    year = int(year_raw) if year_raw.isdigit() else None
    rating_raw = clean(item.findtext("letterboxd:memberRating", "", NS))
    rating = float(rating_raw) if rating_raw else None
    watched_at = clean(item.findtext("letterboxd:watchedDate", "", NS))
    url = clean(item.findtext("link", ""))
    poster = poster_from_description(item.findtext("description", ""))
    return {
        "title": title,
        "year": year,
        "rating": rating,
        "watched_at": watched_at,
        "poster": poster,
        "url": url,
    }


def recent_films(items):
    """Newest-first (feed order); only entries with a title and watched date."""
    films = []
    for it in items:
        f = parse_item(it)
        if f["title"] and f["watched_at"]:
            films.append(f)
        if len(films) >= N_FILMS:
            break
    return films


def watching_stats(items):
    """Return (per_year, fun, timeline). Timeline holds only rated films."""
    years = Counter()
    timeline = []
    rated = []
    for it in items:
        f = parse_item(it)
        m = re.match(r"(\d{4})", f["watched_at"])
        if not m:
            continue
        y = int(m.group(1))
        if y >= MIN_YEAR:
            years[y] += 1
        if f["rating"] is not None and y >= MIN_YEAR:
            timeline.append({
                "title": f["title"],
                "year": f["year"],
                "rating": f["rating"],
                "watched_at": f["watched_at"],
                "poster": f["poster"],
            })
            rated.append(f["rating"])
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
    films = recent_films(items)
    per_year, fun, timeline = watching_stats(items)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(films, indent=2) + "\n")
    STATS_OUT.write_text(json.dumps({"per_year": per_year, "fun": fun, "timeline": timeline}, indent=2) + "\n")
    print(f"Wrote {len(films)} films to {OUT}")
    print(f"Wrote stats ({len(timeline)} timeline entries) to {STATS_OUT}")




#
