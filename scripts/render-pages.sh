#!/usr/bin/env bash
# Render each live state's source pages to WebP for the source viewer.
# Page ranges come from data/states.json (sourcePages: first and last page
# carrying a dataset row); documents from $DOCS, named <slug>-<year>-approved.pdf.
#   DOCS=~/Downloads/budgetline-budgets/documents npm run pages [slug]
set -euo pipefail
DOCS="${DOCS:-$HOME/Downloads/budgetline-budgets/documents}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ONLY="${1:-}"
WIDTH=1600

node -e '
  const r = require(process.argv[1]);
  for (const s of r) if (s.status === "live" && s.sourcePages) console.log(s.slug, s.year, s.sourcePages[0], s.sourcePages[1]);
' "$ROOT/data/states.json" | while read -r slug year first last; do
  if [ -n "$ONLY" ] && [ "$ONLY" != "$slug" ]; then continue; fi
  pdf="$DOCS/$slug-$year-approved.pdf"
  if [ ! -f "$pdf" ]; then echo "$slug: no PDF at $pdf, skipping"; continue; fi
  out="$ROOT/public/pages/$slug-$year"
  mkdir -p "$out"
  tmp="$(mktemp -d)"
  pdftoppm -f "$first" -l "$last" -scale-to-x "$WIDTH" -scale-to-y -1 -png "$pdf" "$tmp/p"
  for png in "$tmp"/p-*.png; do
    n="$(basename "$png" .png)"; n="${n#p-}"; n="$(printf '%03d' "$((10#$n))")"
    cwebp -quiet -q 80 "$png" -o "$out/$n.webp"
  done
  rm -rf "$tmp"
  echo "$slug: rendered pages $first-$last to public/pages/$slug-$year ($(ls "$out" | wc -l | tr -d ' ') files)"
done
