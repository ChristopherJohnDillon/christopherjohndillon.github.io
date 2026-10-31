#!/bin/zsh
# Daily on yeats (launchd): scrape the Goodreads read shelf via Safari, rebuild
# the reading data and push it if anything changed. If Safari has been signed
# out, sign back in with the Keychain item "goodreads-sync" and retry once.
set -euo pipefail
REPO="$HOME/code/christopherjohndillon.github.io"
STATE="$HOME/Library/Application Support/goodreads-sync"
SHELF="$STATE/shelf_17038700.json"
mkdir -p "$STATE"
cd "$REPO"
#
fail() {
  echo "$(date '+%F %T') FAILED: $1" >&2
  osascript -e "display notification \"$1\" with title \"Goodreads sync failed\"" || true
  exit 1
}
scrape() {
  osascript scripts/yeats/goodreads_shelf.applescript 17038700 2026 > "$SHELF.tmp" 2> "$STATE/scrape.err"
}
#
git pull --rebase -q || fail "git pull"
if ! scrape; then
  grep -q "logged out" "$STATE/scrape.err" || fail "$(cat "$STATE/scrape.err")"
  GR_EMAIL=$(security find-generic-password -s goodreads-sync | sed -n 's/.*"acct"<blob>="\(.*\)"/\1/p') \
  GR_PASS=$(security find-generic-password -s goodreads-sync -w) \
    osascript scripts/yeats/goodreads_login.applescript || fail "signed out and auto sign-in failed — sign in to Goodreads in Safari on yeats"
  scrape || fail "$(cat "$STATE/scrape.err")"
fi
mv "$SHELF.tmp" "$SHELF"
#
/usr/bin/python3 scripts/fetch_books.py "$SHELF" || fail "fetch_books.py refused the scrape"
git add _data/books.json _data/reading_stats.json
if git diff --cached --quiet; then
  echo "$(date '+%F %T') no reading changes"
  exit 0
fi
git commit -q -m "Update reading list (yeats) [skip ci]"
# the Actions job may have pushed films data meanwhile
git pull --rebase -q
git push -q || fail "git push"
echo "$(date '+%F %T') pushed reading update"
