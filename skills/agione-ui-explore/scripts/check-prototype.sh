#!/bin/bash
# Explore Core hard gate.
#
# This gate protects runnable output, shell integrity, bilingual behavior,
# accessibility, and functional layout quality. It intentionally does not
# enforce Product Anchor typography, subtitle, surface, or decorative rules.

set -u

FILE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "$FILE" ]]; then
  echo "用法: bash $0 <prototype.html>" >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "❌ 文件不存在: $FILE" >&2
  exit 2
fi

PASS=0
FAIL=0
declare -a RESULTS

check() {
  local name="$1" code="$2" hint="${3:-}"
  if [[ "$code" -eq 0 ]]; then
    RESULTS+=("  ✅ $name")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  ❌ $name${hint:+ — $hint}")
    FAIL=$((FAIL + 1))
  fi
}

# 1. Vue/template syntax purity.
JSX_HITS=$(grep -nE 'className=|<>[[:space:]]*$|</>' "$FILE" | head -5)
TPL_HITS=$(awk '/<main[ >]/{f=1} /<\/main>/{f=0} f && /\$\{[a-zA-Z_]/' "$FILE" | head -5)
[[ -z "$JSX_HITS" && -z "$TPL_HITS" ]]
check "1 语法纯净（无 JSX / className / 模板串残留）" $? "$(echo "$JSX_HITS$TPL_HITS" | head -2 | tr '\n' ' ')"

# 2. Embedded Logo integrity.
LOGO_LINES=$(awk '/AGIONE_LOGO_DANGER_START/{f=1;next} /AGIONE_LOGO_DANGER_END/{f=0} f {print length($0)}' "$FILE" | sort -rn | head -2)
BIG_COUNT=$(echo "$LOGO_LINES" | awk '$1 >= 20000' | wc -l | tr -d ' ')
[[ "$BIG_COUNT" -eq 2 ]]
check "2 Logo 完整（2 段 base64 各 ≥ 20000 字符）" $? "实际 ≥20k 行数: $BIG_COUNT"

# 3. Shared prototype state-machine control remains operational.
STATE_MARKERS=0
STATE_MARKERS_EXPECTED=15
for marker in \
  'position: fixed; right: 24px; bottom: 24px' \
  'class="state-machine-control"' \
  'class="state-machine-trigger"' \
  'html.dark .state-machine-trigger' \
  'data-lucide="circle-help"' \
  'data-prototype-control="state-machine"' \
  'v-if="hasScenarios && !mobileNavOpen"' \
  'stateMachineOpen = ref(false)' \
  'aria-controls="prototype-state-machine-panel"' \
  'v-if="stateMachineOpen"' \
  'handleStateMachineEscape' \
  'class="state-machine-switcher"' \
  'class="state-machine-switcher__close"' \
  'v-model="activeScenario"' \
  'v-for="(state, key) in scenarios"'; do
  grep -Fq "$marker" "$FILE" && STATE_MARKERS=$((STATE_MARKERS + 1))
done
LEGACY_SCENARIO_UI=$(grep -cE 'demo-mode-chip|demo-banner' "$FILE" || true)
[[ "$STATE_MARKERS" -eq "$STATE_MARKERS_EXPECTED" && "$LEGACY_SCENARIO_UI" -eq 0 ]]
check "3 右下角悬浮状态入口与面板完整" $? "markers=$STATE_MARKERS/$STATE_MARKERS_EXPECTED legacy=$LEGACY_SCENARIO_UI"

# 4. Bilingual dictionaries remain present.
ZH=$(grep -cE 'zh:[[:space:]]*\{' "$FILE" || true)
EN=$(grep -cE 'en:[[:space:]]*\{' "$FILE" || true)
[[ "$ZH" -ge 1 && "$EN" -ge 1 ]]
check "4 i18n 双语块（zh/en 各 ≥ 1）" $? "zh=$ZH en=$EN"

# 5. Keep experimental colors semantic and themeable instead of inline hex.
HEX_HITS=$(awk '/<main[ >]/{f=1} /<\/main>/{f=0} f' "$FILE" | grep -nE '(style="[^"]*|fill="|stroke=")#[0-9a-fA-F]{3,8}' | head -5)
[[ -z "$HEX_HITS" ]]
check "5 业务区无 inline hex（使用 --biz-* / --exp-*）" $? "$(echo "$HEX_HITS" | head -1)"

# 6. Functional layout integrity, without Product Anchor aesthetic rules.
bash "$SCRIPT_DIR/audit-layout-integrity.sh" "$FILE" > /dev/null 2>&1
check "6 功能性边界 / 表格边线完整" $? "跑 audit-layout-integrity.sh 看明细"

# 7. Functional-control contrast when the shared token is present.
if grep -q 'ui-border-interactive' "$FILE"; then
  bash "$SCRIPT_DIR/audit-contrast.sh" "$FILE" > /dev/null 2>&1
  check "7 功能性边框 ≥3:1" $? "跑 audit-contrast.sh 看明细"
fi

# 8. Global keyboard focus ring remains; no bare outline removal.
FOCUS_RULE=$(grep -cE ':focus-visible[^{]*\{[^}]*outline' "$FILE" || true)
BARE_OUT=$(grep -nE 'outline:[[:space:]]*(none|0)([; "]|$)' "$FILE" | grep -v ':focus' | grep -vE '/\*|\*/|禁止|audit|替代' | head -3)
[[ "$FOCUS_RULE" -ge 1 && -z "$BARE_OUT" ]]
check "8 键盘焦点环" $? "rule=$FOCUS_RULE bare=$(echo "$BARE_OUT" | head -1)"

# 9. Shared reduced-motion protection remains available to experiments.
REDUCED_MOTION=$(grep -c 'prefers-reduced-motion:[[:space:]]*reduce' "$FILE" || true)
[[ "$REDUCED_MOTION" -ge 1 ]]
check "9 Reduced motion 保护" $? "rule=$REDUCED_MOTION"

# 10. DOM-template and CDN safety.
bash "$SCRIPT_DIR/check-dom-template-safety.sh" "$FILE" > /dev/null 2>&1
check "10 DOM template / CDN safety" $? "跑 check-dom-template-safety.sh 看明细"

# 11. Inline JavaScript syntax.
if command -v node > /dev/null 2>&1; then
  JS_SYNTAX=$(sed -n '/<script>/,/<\/script>/p' "$FILE" | sed '1d;$d' | node --check 2>&1)
  check "11 Inline JavaScript syntax（node --check）" $? "$(echo "$JS_SYNTAX" | head -1)"
else
  check "11 Inline JavaScript syntax（node --check）" 1 "node 不可用"
fi

echo "────────────────────────────────────────────────────"
echo "Prototype Check · $(basename "$FILE")  (Explore Core)"
echo "────────────────────────────────────────────────────"
printf '%s\n' "${RESULTS[@]}"
echo "────────────────────────────────────────────────────"
echo "$PASS pass / $FAIL fail"

[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
