#!/bin/bash
# promote.sh
# Promotes all ready draft files to design-docs/
# Run from the slopebook/ root directory
# Usage: bash agents/promote.sh
# Optional: bash agents/promote.sh --dry-run

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRAFTS="$ROOT/design-docs/drafts"
DOCS="$ROOT/design-docs"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "DRY RUN — no files will be changed"
  echo ""
fi

PROMOTED=0
SKIPPED=0

echo "Slopebook — Draft Promotion"
echo "==========================="
echo ""

promote() {
  local SRC="$DRAFTS/$1"
  local DST="$DOCS/$2"

  if [[ ! -f "$SRC" ]]; then
    echo "  SKIP   $1 — not found in drafts/"
    ((SKIPPED++))
    return
  fi

  SIZE=$(wc -c < "$SRC" | tr -d ' ')
  SIZE_KB=$(awk "BEGIN {printf \"%.1f\", $SIZE/1024}")

  if $DRY_RUN; then
    echo "  WOULD  $1 → $2 (${SIZE_KB}KB)"
  else
    cp "$SRC" "$DST"
    echo "  OK     $1 → $2 (${SIZE_KB}KB)"
    ((PROMOTED++))
  fi
}

promote "use-cases-p0-proposed.md"      "use-cases-p0.md"
promote "use-cases-p1-proposed.md"      "use-cases-p1.md"
promote "tech-requirements-proposed.md" "tech-requirements.md"
promote "api-design-proposed.md"        "api-design.md"
promote "asset-list-proposed.md"        "asset-list.md"
promote "data-model-proposed.md"        "data-model.md"
promote "open-questions-proposed.md"    "open-questions.md"

echo ""
echo "==========================="

if $DRY_RUN; then
  echo "Dry run complete — no files changed"
else
  echo "Promoted: $PROMOTED files"
  if [[ $SKIPPED -gt 0 ]]; then
    echo "Skipped:  $SKIPPED files (not found in drafts/)"
  fi
  echo ""
  echo "Next step:"
  echo "  git add design-docs/ && git commit -m \"docs: promote run [N] design docs\""
fi
