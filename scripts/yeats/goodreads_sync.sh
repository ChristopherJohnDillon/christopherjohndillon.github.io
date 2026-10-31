#!/bin/zsh
# Daily on yeats (launchd): export the Goodreads library via Safari, rebuild the
# reading data and push it. The raw CSV stays on yeats — it holds private notes.
set -euo pipefail
REPO="$HOME/code/christopherjohndillon.github.io"
STATE="$HOME/Library/Application Support/goodreads-sync"
CSV="$STATE/goodreads_library_export.csv"
mkdir -p "$STATE"
cd "$REPO"
git pull --rebase -q
#
osascript scripts/yeats/goodreads_export.applescript > "$CSV.tmp"
head -1 "$CSV.tmp" | grep -q '^Book Id,' || { echo "export is not a Goodreads CSV" >&2; exit 1; }
mv "$CSV.tmp" "$CSV"
#
/usr/bin/python3 scripts/fetch_books.py "$CSV"
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
