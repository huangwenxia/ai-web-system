#!/bin/bash
# Explore Core layout-integrity audit.
#
# Keep functional quality hard without enforcing the Product Anchor's visual
# taste: reject accidental nested borders and raw tables that produce doubled
# cell/header lines. Decorative choices such as a scoped accent edge belong to
# the declared Experiment Layer and are intentionally not checked here.

set -u

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "用法: bash $0 <prototype.html>" >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "❌ 文件不存在: $FILE" >&2
  exit 2
fi

SELF_BORDER_COMPONENTS='FilterBox|DataTable|KpiCard|MetricsStrip|KvCard|el-table'
SELF_BORDER_CLASSES='ds-stat-card|ds-ov-card|ds-chart-card'

NESTED_BORDER_HITS=$(awk -v list="$SELF_BORDER_COMPONENTS" -v cls="$SELF_BORDER_CLASSES" '
  BEGIN {
    inMain = 0
    history = ""
    histLines = 0
  }

  /<main[ >]/   { inMain = 1; next }
  /<\/main>/    { inMain = 0; next }
  !inMain       { next }

  {
    history = history "\n[" NR "] " $0
    histLines++
    if (histLines > 2) {
      sub(/^\n\[[0-9]+\] [^\n]*/, "", history)
      histLines--
    }
  }

  {
    line = $0
    isBordered = 0
    if (match(line, "<(" list ")[ />]")) isBordered = 1
    if (match(line, "class=\"[^\"]*(^|[ \"])(" cls ")")) isBordered = 1
    if (line ~ ("class=\"(" cls ")")) isBordered = 1

    if (isBordered) {
      hist = history
      if (hist ~ /style="[^"]*border[^\"]*:[^\"]*[1-9]/ && hist !~ /ds-section-header/) {
        printf "L%d: %s\n   ↑ 父元素带 border style\n", NR, line
      }
      else if (hist ~ /<(div|section|article)[^>]*class="([^"]* )?(card-box|stat-card|filter-card|main-box__card)([ "])/ \
               && hist !~ /ds-(stat|ov|chart)-card/) {
        printf "L%d: %s\n   ↑ 父元素是带边框容器\n", NR, line
      }
    }
  }
' "$FILE")

RAW_TABLE_LINES=$(awk '
  /<main[ >]/ { inMain = 1 }
  /<\/main>/  { inMain = 0 }
  inMain && /<table[ >]/ { printf "L%d: %s\n", NR, $0 }
' "$FILE")

TABLE_FAIL=0
if [[ -n "$RAW_TABLE_LINES" ]] && ! grep -qE 'border-collapse:[[:space:]]*collapse' "$FILE"; then
  TABLE_FAIL=1
fi

echo "────────────────────────────────────────────────────"
echo "Explore Layout Integrity · $(basename "$FILE")"
echo "────────────────────────────────────────────────────"

FAIL=0
if [[ -n "$NESTED_BORDER_HITS" ]]; then
  FAIL=1
  echo "❌ 发现疑似无语义的双层边框："
  echo "$NESTED_BORDER_HITS" | head -30
  echo
fi

if [[ "$TABLE_FAIL" -eq 1 ]]; then
  FAIL=1
  echo "❌ 手写 <table> 缺 border-collapse: collapse："
  echo "$RAW_TABLE_LINES" | head -10
  echo
elif [[ -n "$RAW_TABLE_LINES" ]]; then
  echo "ℹ️  检测到手写 <table>，已声明 border-collapse；仍需目检外框和表头边线。"
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ 0 violations — 无意外双层边框，手写表格边线安全"
  exit 0
fi

echo "修复功能性边界；不要为了过审而删除有明确层级意义的实验表面。"
exit 1
