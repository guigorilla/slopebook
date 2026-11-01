#!/bin/bash
# promote.test.sh
# Checks that promote.sh only copies drafts marked READY.
# Usage: bash agents/tests/promote.test.sh

SOURCE="$(cd "$(dirname "$0")/.." && pwd)/promote.sh"
FAILURES=0

check() {
  if [[ "$2" == "$3" ]]; then
    echo "  ok    $1"
  else
    echo "  FAIL  $1 — expected '$3', got '$2'"
    ((FAILURES++))
  fi
}

# Creates a temporary repo with one published doc and one draft per target.
setup() {
  WORK=$(mktemp -d)
  mkdir -p "$WORK/agents" "$WORK/design-docs/drafts"
  cp "$SOURCE" "$WORK/agents/promote.sh"
  for NAME in use-cases-p0 use-cases-p1 tech-requirements api-design asset-list data-model open-questions; do
    echo old > "$WORK/design-docs/$NAME.md"
    echo new > "$WORK/design-docs/drafts/$NAME-proposed.md"
  done
}

synthesis() {
  printf '%b' "$1" > "$WORK/design-docs/drafts/synthesis-proposed.md"
}

run() {
  OUTPUT=$(bash "$WORK/agents/promote.sh" "$@")
  EXIT=$?
}

doc() {
  cat "$WORK/design-docs/$1.md"
}

SCORE='## Consistency Score\n\n**AMBER** — fine\n\n---\n\n'
API='drafts/api-design-proposed.md'
API_TARGET='design-docs/api-design.md'

echo "table format: READY and HOLD"
setup
synthesis "$SCORE## Promote These Files\n\n| Draft | Target | Status |\n|---|---|---|\n| drafts/use-cases-p0-proposed.md | design-docs/use-cases-p0.md | **READY** — mentions HOLD later |\n| $API | $API_TARGET | **HOLD** — blocked, READY after fix |\n\n## Next\n"
run
check "READY file promoted" "$(doc use-cases-p0)" new
check "HOLD file not promoted" "$(doc api-design)" old
check "file with no entry not promoted" "$(doc data-model)" old
check "exit code" "$EXIT" 0

echo "list format: READY and HOLD"
setup
synthesis "$SCORE## Promote These Files\n- drafts/use-cases-p0-proposed.md      → design-docs/use-cases-p0.md      [READY]\n- $API        → $API_TARGET        [HOLD]\n"
run
check "READY file promoted" "$(doc use-cases-p0)" new
check "HOLD file not promoted" "$(doc api-design)" old

echo "unfilled template is held"
setup
synthesis "$SCORE## Promote These Files\n- $API → $API_TARGET [READY / HOLD]\n"
run
check "not promoted" "$(doc api-design)" old

echo "duplicate entries are held"
setup
synthesis "$SCORE## Promote These Files\n- $API → $API_TARGET [READY]\n- $API → $API_TARGET [HOLD]\n"
run
check "not promoted" "$(doc api-design)" old

echo "READY outside the promote section is ignored"
setup
synthesis "$SCORE## Promote These Files\n\n## Notes\n- $API → $API_TARGET [READY]\n"
run
check "not promoted" "$(doc api-design)" old

echo "Windows line endings"
setup
synthesis "$SCORE## Promote These Files\r\n- $API → $API_TARGET [READY]\r\n"
run
check "READY file promoted" "$(doc api-design)" new

echo "RED consistency blocks everything"
setup
synthesis "## Consistency Score\n\n**RED** — contradictions\n\n## Promote These Files\n- $API → $API_TARGET [READY]\n"
run
check "not promoted" "$(doc api-design)" old
check "exit code" "$EXIT" 1

echo "missing synthesis blocks everything"
setup
run
check "not promoted" "$(doc api-design)" old
check "exit code" "$EXIT" 1

echo "dry run changes nothing"
setup
synthesis "$SCORE## Promote These Files\n- $API → $API_TARGET [READY]\n"
run --dry-run
check "not promoted" "$(doc api-design)" old

echo ""
if [[ $FAILURES -gt 0 ]]; then
  echo "$FAILURES failed"
  exit 1
fi
echo "All passed"
