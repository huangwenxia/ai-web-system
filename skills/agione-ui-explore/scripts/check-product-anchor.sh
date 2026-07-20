#!/bin/bash
# Product Anchor overlay gate.
#
# Run Explore Core first, then enforce strict-near typography, surface/border,
# subtitle, and token boundaries for the single product-anchor variant.

set -u

FILE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "$FILE" ]]; then
  echo "用法: bash $0 <anchor.html>" >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "❌ 文件不存在: $FILE" >&2
  exit 2
fi

PASS=0
FAIL=0
declare -a RESULTS

record() {
  local name="$1" code="$2" hint="${3:-}"
  if [[ "$code" -eq 0 ]]; then
    RESULTS+=("  ✅ $name")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  ❌ $name${hint:+ — $hint}")
    FAIL=$((FAIL + 1))
  fi
}

CORE_OUTPUT=$(bash "$SCRIPT_DIR/check-prototype.sh" "$FILE" 2>&1)
CORE_CODE=$?
record "1 Explore Core" "$CORE_CODE" "跑 check-prototype.sh 看明细"

TYPO_OUTPUT=$(bash "$SCRIPT_DIR/audit-typography.sh" "$FILE" 2>&1)
TYPO_CODE=$?
record "2 Product Anchor typography" "$TYPO_CODE" "跑 audit-typography.sh 看明细"

BORDER_OUTPUT=$(bash "$SCRIPT_DIR/audit-borders.sh" "$FILE" 2>&1)
BORDER_CODE=$?
record "3 Product Anchor surfaces / borders" "$BORDER_CODE" "跑 audit-borders.sh 看明细"

SUB_HITS=$(grep -nE ':?subtitle[[:space:]]*=|\.page-header__subtitle|\.header-box__subtitle' "$FILE" | grep -v '已移除\|不传副标题' | head -5)
[[ -z "$SUB_HITS" ]]
record "4 Product Anchor 无副标题" $? "$(echo "$SUB_HITS" | head -1)"

EXP_HITS=$(grep -n -- '--exp-' "$FILE" | head -5)
[[ -z "$EXP_HITS" ]]
record "5 Product Anchor 无实验 token" $? "$(echo "$EXP_HITS" | head -1)"

echo "────────────────────────────────────────────────────"
echo "Product Anchor Check · $(basename "$FILE")"
echo "────────────────────────────────────────────────────"
printf '%s\n' "${RESULTS[@]}"
echo "────────────────────────────────────────────────────"
echo "$PASS pass / $FAIL fail"

if [[ "$FAIL" -ne 0 ]]; then
  if [[ "$CORE_CODE" -ne 0 ]]; then
    echo
    echo "$CORE_OUTPUT"
  fi
  if [[ "$TYPO_CODE" -ne 0 ]]; then
    echo
    echo "$TYPO_OUTPUT"
  fi
  if [[ "$BORDER_CODE" -ne 0 ]]; then
    echo
    echo "$BORDER_OUTPUT"
  fi
  exit 1
fi

exit 0
