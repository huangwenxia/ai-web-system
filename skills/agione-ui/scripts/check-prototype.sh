#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# check-prototype.sh  —  v6.9 输出前自检总入口（一条命令跑全部）
#
# 把 AI-USAGE.md「✅ 输出前自检」全部脚本化（v6.9.3 起 8 项）：
#   1. 语法纯净（无 React/JSX 残留：className / JSX fragment / ${} 模板串）
#   2. Logo 完整（LOGO_DARK / LOGO_LIGHT 两段 base64 各 ≥ 20000 字符）
#   3. Scenario Switcher 机制完整（demo-mode-chip ≥ 5 / demo-banner ≥ 3，
#      即 chrome 自带量未被删；标准基于 shell-sample v6.9 实测 baseline）
#   4. i18n 双语块存在（zh: { 与 en: { 各 ≥ 1）
#   5. 业务区无硬编码 hex 色（<main> 内 inline style 含 #rgb/#rrggbb → 违规，
#      SVG fill/stroke 也必须走 var(--ui-color-*)）
#   6. Typography 纪律（委托 audit-typography.sh）
#   7. 外壳克制 / 表格双线 / 卡片+标题左色条（委托 audit-borders.sh）
#   8. 副标题禁用（v6.9.3：PageHeader/HeaderBox 不传 subtitle）
#   9. 功能性边框 ≥3:1（v6.9.4 WCAG 1.4.11；委托 audit-contrast.sh）
#  10. 键盘焦点环（v6.9.5 WCAG 2.4.7：全局 :focus-visible + 无裸 outline:none）
#
# 用法：
#   bash scripts/check-prototype.sh <prototype.html>
#
# 退出码：0 全 pass / 1 有 fail / 2 usage error
# ──────────────────────────────────────────────────────────────────

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

check() {  # check <名称> <0=pass|非0=fail> <fail 提示>
  local name="$1" code="$2" hint="${3:-}"
  if [[ "$code" -eq 0 ]]; then
    RESULTS+=("  ✅ $name")
    PASS=$((PASS+1))
  else
    RESULTS+=("  ❌ $name${hint:+ — $hint}")
    FAIL=$((FAIL+1))
  fi
}

# ── 1. 语法纯净 ──
JSX_HITS=$(grep -nE 'className=|<>\s*$|</>' "$FILE" | head -5)
TPL_HITS=$(awk '/<main[ >]/{f=1} /<\/main>/{f=0} f && /\$\{[a-zA-Z_]/' "$FILE" | head -5)
[[ -z "$JSX_HITS" && -z "$TPL_HITS" ]]; check "1 语法纯净（无 className / JSX / \${} 残留）" $? "$(echo "$JSX_HITS$TPL_HITS" | head -2 | tr '\n' ' ')"

# ── 2. Logo 完整 ──
LOGO_OK=1
LOGO_LINES=$(awk '/AGIONE_LOGO_DANGER_START/{f=1;next} /AGIONE_LOGO_DANGER_END/{f=0} f {print length($0)}' "$FILE" | sort -rn | head -2)
BIG_COUNT=$(echo "$LOGO_LINES" | awk '$1 >= 20000' | wc -l | tr -d ' ')
[[ "$BIG_COUNT" -eq 2 ]]; check "2 Logo 完整（2 段 base64 各 ≥ 20000 字符）" $? "实际 ≥20k 行数: $BIG_COUNT"

# ── 3. Scenario Switcher 机制完整 ──
CHIP=$(grep -c 'demo-mode-chip' "$FILE" || true)
BANNER=$(grep -c 'demo-banner' "$FILE" || true)
[[ "$CHIP" -ge 5 && "$BANNER" -ge 3 ]]; check "3 Scenario Switcher（chip ≥ 5 / banner ≥ 3，chrome 未被删）" $? "chip=$CHIP banner=$BANNER"

# ── 4. i18n 双语块 ──
ZH=$(grep -cE 'zh:\s*\{' "$FILE" || true)
EN=$(grep -cE 'en:\s*\{' "$FILE" || true)
[[ "$ZH" -ge 1 && "$EN" -ge 1 ]]; check "4 i18n 双语块（zh/en 各 ≥ 1）" $? "zh=$ZH en=$EN"

# ── 5. 业务区无硬编码 hex 色 ──
HEX_HITS=$(awk '/<main[ >]/{f=1} /<\/main>/{f=0} f' "$FILE" | grep -nE '(style="[^"]*|fill="|stroke=")#[0-9a-fA-F]{3,8}' | head -5)
[[ -z "$HEX_HITS" ]]; check "5 业务区无硬编码 hex 色（含 SVG fill/stroke）" $? "$(echo "$HEX_HITS" | head -1)"

# ── 6. Typography（委托） ──
bash "$SCRIPT_DIR/audit-typography.sh" "$FILE" > /dev/null 2>&1
check "6 Typography 纪律（audit-typography.sh）" $? "跑 bash scripts/audit-typography.sh 看明细"

# ── 7. 外壳克制 + 表格双线 + 卡片/标题左色条（委托 audit-borders）──
bash "$SCRIPT_DIR/audit-borders.sh" "$FILE" > /dev/null 2>&1
check "7 外壳克制 / 表格双线 / 左色条（audit-borders.sh）" $? "跑 bash scripts/audit-borders.sh 看明细"

# ── 8. 副标题禁用（v6.9.3：所有页面不传 subtitle）──
SUB_HITS=$(grep -nE ':?subtitle\s*=|\.page-header__subtitle|\.header-box__subtitle' "$FILE" | grep -v 'v6.9.3\|已移除\|不传副标题' | head -5)
[[ -z "$SUB_HITS" ]]; check "8 无副标题（PageHeader/HeaderBox subtitle 已禁）" $? "$(echo "$SUB_HITS" | head -1)"

# ── 9. 功能性边框对比度（v6.9.4 WCAG 1.4.11；仅当文件含 border-interactive token 时校验）──
if grep -q "ui-border-interactive" "$FILE"; then
  bash "$SCRIPT_DIR/audit-contrast.sh" "$FILE" > /dev/null 2>&1
  check "9 功能性边框 ≥3:1（audit-contrast.sh）" $? "跑 bash scripts/audit-contrast.sh 看明细"
fi

# ── 10. 键盘焦点环（v6.9.5 WCAG 2.4.7）：全局 :focus-visible 规则在 + 业务区无裸 outline:none ──
FOCUS_RULE=$(grep -cE ':focus-visible[^{]*\{[^}]*outline' "$FILE" || true)
# 只看真声明：排除 :focus 选择器（合法 reset）+ 注释/文档行（含 /* 或中文说明）
BARE_OUT=$(grep -nE 'outline:\s*(none|0)([; "]|$)' "$FILE" | grep -v ':focus' | grep -vE '/\*|\*/|禁止|别把|audit|杀掉|替代' | head -3)
[[ "$FOCUS_RULE" -ge 1 && -z "$BARE_OUT" ]]; check "10 键盘焦点环（:focus-visible 在 + 无裸 outline:none）" $? "rule=$FOCUS_RULE bare=$(echo "$BARE_OUT" | head -1)"

# ── 输出 ──
echo "────────────────────────────────────────────────────"
echo "Prototype Check · $(basename "$FILE")  (v6.9.5 · 10 项自检)"
echo "────────────────────────────────────────────────────"
printf '%s\n' "${RESULTS[@]}"
echo "────────────────────────────────────────────────────"
echo "$PASS pass / $FAIL fail"

[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
