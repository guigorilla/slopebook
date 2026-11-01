#!/bin/bash
# promote.sh
# Promotes draft files marked READY in drafts/synthesis-proposed.md to design-docs/
# Run from the slopebook/ root directory
# Usage: bash agents/promote.sh
# Optional: bash agents/promote.sh --dry-run
#
# A file is promoted only if the "Promote These Files" section has exactly one
# entry for it and that entry's status is READY. Anything else is held.
# Nothing is promoted if the synthesis is missing or scores consistency RED.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRAFTS="$ROOT/design-docs/drafts"
DOCS="$ROOT/design-docs"
SYNTHESIS="$DRAFTS/synthesis-proposed.md"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "DRY RUN — no files will be changed"
  echo ""
fi

PROMOTED=0
SKIPPED=0
HELD=0

echo "Slopebook — Draft Promotion"
echo "==========================="
echo ""

if [[ ! -f "$SYNTHESIS" ]]; then
  echo "ERROR  synthesis-proposed.md not found — run pipeline-review first"
  exit 1
fi

# Prints the body of one "## " section of the synthesis.
section() {
  tr -d '\r' < "$SYNTHESIS" | awk -v heading="## $1" '
    $0 == heading { found = 1; next }
    found && /^## / { exit }
    found { print }
  '
}

CONSISTENCY=$(section "Consistency Score" | sed -E '/^[[:space:]]*$/d; /^---/d' | head -n 1)
if [[ "$CONSISTENCY" =~ ^[^A-Za-z]*RED ]]; then
  echo "ERROR  consistency score is RED — nothing promoted"
  exit 1
fi

PROMOTE_SECTION=$(section "Promote These Files")

# Prints READY, or the reason a file must be held.
status_of() {
  local SRC="drafts/$1"
  local DST="design-docs/$2"
  local MATCHES COUNT REMAINDER
  MATCHES=$(printf '%s\n' "$PROMOTE_SECTION" | grep -F "$SRC" | grep -F "$DST")
  COUNT=$(printf '%s' "$MATCHES" | grep -c '^')

  if [[ "$COUNT" -eq 0 ]]; then
    echo "no entry in synthesis"
  elif [[ "$COUNT" -gt 1 ]]; then
    echo "$COUNT entries in synthesis"
  else
    REMAINDER=$(printf '%s' "${MATCHES#*"$DST"}" | sed -E 's/^[^[:alpha:]]*//')
    if [[ "$REMAINDER" =~ ^READY[[:space:]]*/ ]]; then
      echo "status not filled in"
    elif [[ "$REMAINDER" =~ ^READY([^[:alpha:]]|$) ]]; then
      echo "READY"
    elif [[ "$REMAINDER" =~ ^HOLD([^[:alpha:]]|$) ]]; then
      echo "marked HOLD"
    else
      echo "no READY or HOLD status"
    fi
  fi
}

promote() {
  local SRC="$DRAFTS/$1"
  local DST="$DOCS/$2"
  local STATUS

  if [[ ! -f "$SRC" ]]; then
    echo "  SKIP   $1 — not found in drafts/"
    ((SKIPPED++))
    return
  fi

  STATUS=$(status_of "$1" "$2")
  if [[ "$STATUS" != "READY" ]]; then
    echo "  HOLD   $1 — $STATUS"
    ((HELD++))
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
  if [[ $HELD -gt 0 ]]; then
    echo "Held:     $HELD files"
  fi
else
  echo "Promoted: $PROMOTED files"
  if [[ $HELD -gt 0 ]]; then
    echo "Held:     $HELD files"
  fi
  if [[ $SKIPPED -gt 0 ]]; then
    echo "Skipped:  $SKIPPED files (not found in drafts/)"
  fi
  echo ""
  echo "Next step:"
  echo "  git add design-docs/ && git commit -m \"docs: promote run [N] design docs\""
fi
