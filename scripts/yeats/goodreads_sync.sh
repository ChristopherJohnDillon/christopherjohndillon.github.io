#!/bin/zsh
# Daily on yeats (launchd): scrape the Goodreads read shelf via Safari, rebuild
# the reading data and push it if anything changed.
set -euo pipefail
REPO="$HOME/code/christopherjohndillon.github.io"
STATE="$HOME/Library/Application Support/goodreads-sync"
SHELF="$STATE/shelf_17038700.json"
mkdir -p "$STATE"
cd "$REPO"
git pull --rebase -q
#
osascript scripts/yeats/goodreads_shelf.applescript 17038700 2026 > "$SHELF.tmp"
mv "$SHELF.tmp" "$SHELF"
#
/usr/bin/python3 scripts/fetch_books.py "$SHELF"
git add _data/books.json _data/reading_stats.json
if git diff --cached --quiet; then
  echo "$(date '+%F %T') no reading changes"
  exit 0
fi
git commit -q -m "Update reading list (yeats) [skip ci]"
# the Actions job may have pushed films data meanwhile
git pull --rebase -q
git push -q
echo "$(date '+%F %T') pushed reading update"
