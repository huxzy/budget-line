#!/usr/bin/env bash
# Render the capital-expenditure pages of the budget PDF to WebP for the
# source viewer. Pages 68–101 hold every row in the dataset.
#   PDF="/path/to/budget.pdf" npm run pages
set -euo pipefail
PDF="${PDF:-$HOME/Downloads/dataset_NIGER STATE APPROVED BUDGET FOR THE YEAR 2026.pdf}"
OUT="$(dirname "$0")/../public/pages/niger-2026"
FIRST=68; LAST=101; WIDTH=1600
mkdir -p "$OUT"
tmp="$(mktemp -d)"
pdftoppm -f "$FIRST" -l "$LAST" -scale-to-x "$WIDTH" -scale-to-y -1 -png "$PDF" "$tmp/p"
for png in "$tmp"/p-*.png; do
  n="$(basename "$png" .png)"; n="${n#p-}"; n="$(printf '%03d' "$((10#$n))")"
  cwebp -quiet -q 82 "$png" -o "$OUT/$n.webp"
done
rm -rf "$tmp"
echo "rendered $(ls "$OUT" | wc -l | tr -d ' ') pages to $OUT"
