#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# audit-borders.sh  —  v6.9.3 加固脚本（v6.7 "外壳克制" 配套验证）
#
# 检测生成的原型 HTML <main> 业务区是否违反 v6.7 第②条约束：
#   "一个区块只允许一层视觉边界 —— sub-container 不要再带 border"
#
# 检测对象（自带边框物，外面再套边框容器 = 违规）：
#   1. Vue 组件标签：<FilterBox> / <DataTable> / <KpiCard> / <MetricsStrip> / <KvCard> / <el-table>
#   2. v6.9 加 class-based dashboard 卡：.ds-stat-card / .ds-ov-card / .ds-chart-card
#
# 白名单（v6.9）：
#   - .ds-section-header 的 border-bottom 是分隔器（dashboard.md §11.3 契约），不算外壳
#   - grid 容器（.ds-stats-row / .ds-overview-grid / .ds-chart-grid）无边框，天然不触发
#   - 父容器类匹配用 [ "] 边界，ds-stat-card 不会误中 stat-card 模式
#
# 规则参考：references/base-spec.md §7 Shared product semantics
#
# 用法：
#   bash scripts/audit-borders.sh <prototype.html>
#
# 退出码：
#   0 — clean（0 violations）
#   1 — found violations
#   2 — usage error
# ──────────────────────────────────────────────────────────────────

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

# ──────────────────────────────────────────────────────────────────
# 扫描思路：
# 1. 找出所有"自带边框物"（组件标签 或 dashboard 卡 class）
# 2. 看最近 2 行（父元素 lookback）是否带 inline border style 或边框容器类
# ──────────────────────────────────────────────────────────────────

SELF_BORDER_COMPONENTS='FilterBox|DataTable|KpiCard|MetricsStrip|KvCard|el-table'
SELF_BORDER_CLASSES='ds-stat-card|ds-ov-card|ds-chart-card'

VIOLATIONS=$(awk -v list="$SELF_BORDER_COMPONENTS" -v cls="$SELF_BORDER_CLASSES" '
  BEGIN {
    inMain = 0
    history = ""
    histLines = 0
  }

  /<main[ >]/   { inMain = 1; next }
  /<\/main>/    { inMain = 0; next }

  !inMain       { next }

  # 缓存最近 2 行用作"父元素 lookback"
  {
    history = history "\n[" NR "] " $0
    histLines++
    if (histLines > 2) {
      sub(/^\n\[[0-9]+\] [^\n]*/, "", history)
      histLines--
    }
  }

  # 找自带边框物出现（组件标签 或 dashboard 卡 class）
  {
    line = $0
    isBordered = 0
    if (match(line, "<(" list ")[ />]"))            isBordered = 1
    if (match(line, "class=\"[^\"]*(^|[ \"])(" cls ")")) isBordered = 1
    if (line ~ ("class=\"(" cls ")"))               isBordered = 1

    if (isBordered) {
      # 父元素 lookback：inline border style（白名单：ds-section-header 是分隔器，不报）
      hist = history
      if (hist ~ /style="[^"]*border[^"]*:[^"]*[1-9]/ && hist !~ /ds-section-header/) {
        printf "L%d: %s\n   ↑ 父元素带 border style\n", NR, line
      }
      # 父元素是边框容器类（[ \"] 边界防 ds-stat-card 误中 stat-card；ds-* grid 容器无边框天然不中）
      else if (hist ~ /<(div|section|article)[^>]*class="[^"]*[ "](card-box|stat-card|filter-card|main-box__card)/ \
               && hist !~ /ds-(stat|ov|chart)-card/) {
        printf "L%d: %s\n   ↑ 父元素是带边框的容器类\n", NR, line
      }
    }
  }
' "$FILE")

# ──────────────────────────────────────────────────────────────────
# 检查 2（v6.9.1）：手搓 <table> 的「表头/外框双线重合」隐患
#   <main> 内有裸 <table>（非 .data-table / DataTable 包裹）时：
#   - 缺 border-collapse: collapse → 单元格/表头边线翻倍重合（硬伤，必报）
#   - 提示优先用 DataTable/.data-table（内置 overflow:hidden + 防双线配方）
#   规则参考：references/base-spec.md §7
# ──────────────────────────────────────────────────────────────────
TABLE_VIOLATION=""
RAW_TABLE_LINES=$(awk '
  /<main[ >]/ { inMain = 1 }
  /<\/main>/  { inMain = 0 }
  inMain && /<table[ >]/ { printf "L%d: %s\n", NR, $0 }
' "$FILE")

if [[ -n "$RAW_TABLE_LINES" ]]; then
  # 整文件是否声明了 border-collapse: collapse（手搓 table 必须有）
  if ! grep -qE "border-collapse:\s*collapse" "$FILE"; then
    TABLE_VIOLATION="missing-collapse"
  fi
fi

# ──────────────────────────────────────────────────────────────────
# 检查 3（v6.9.2）：业务卡「左侧色条」装饰 anti-pattern
#   border-left: ≥2px solid <带色> 用在业务卡 = 廉价状态色条，禁。
#   状态走 StatusBadge/dot/Tag，不进卡的边。
#   豁免：仅 .alert（severity 条是 alert 语义）。
#   v6.9.3: 标题 accent 条（detail-section）也禁了 → 去掉 detail-section 豁免。
#   规则参考：references/base-spec.md §7
#   命中源：① <style> 内非豁免 selector 的 border-left ≥2px solid 带色
#           ② <main> 内 inline style 的 border-left ≥2px
# ──────────────────────────────────────────────────────────────────
# 带色左条正则（≥2px，带 var/hex/rgb 色；1px 与 transparent 不算）
# 注：用 var|#|rgb（不写 \( 字面括号）避开 awk -v 的反斜杠转义吞噬
STRIPE_RE="border-left:[ ]*[2-9][0-9]?px[^;}]*(var|#|rgb)"
STRIPE_HITS=$(awk -v re="$STRIPE_RE" '
  BEGIN { in_style = 0; selector = "" }
  /<style[ >]/ { in_style = 1 }
  /<\/style>/  { in_style = 0; selector = "" }

  # 内联：任意 style="...border-left 色条..."（兼容单行 <main>…</main>）
  match($0, "style=\"[^\"]*" re) {
    printf "L%d (inline): %s\n", NR, substr($0, RSTART, 90)
  }

  # CSS 规则块：兼容单行 `sel { … }` 与多行
  in_style {
    line = $0
    if (line ~ /^[ \t]*\/\*/) next
    # 行内若有 {，把 { 前文本设为当前 selector（单行/多行都适用）
    if (line ~ /\{/) {
      s = line; sub(/\{.*/, "", s); gsub(/^[ \t]+|[ \t]+$/, "", s)
      if (s != "") selector = s
    }
    # 检测左色条（属性可能跟 selector 同一行）
    if (line ~ re) {
      sel = selector
      if (sel !~ /:root/ && sel !~ /alert/) {   # v6.9.3: 仅 alert 豁免（标题左条也禁）
        attr = line; sub(/^[ \t]+/, "", attr)
        printf "L%d (css \"%s\"): %s\n", NR, sel, substr(attr, 1, 90)
      }
    }
    if (line ~ /\}/) selector = ""
  }
' "$FILE")

# ──────────────────────────────────────────────────────────────────
# 输出
# ──────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────────────"
echo "Border Audit · $(basename "$FILE")  (v6.9.3)"
echo "────────────────────────────────────────────────────"

FAIL=0

if [[ -n "$VIOLATIONS" ]]; then
  FAIL=1
  COUNT=$(echo "$VIOLATIONS" | grep -c '^L')
  echo "❌ 发现 $COUNT 处疑似双层边框（外层 container 套住自带边框物）："
  echo
  echo "$VIOLATIONS" | head -30
  echo
  echo "修复建议："
  echo "  · 自带边框物（FilterBox / DataTable / KpiCard / ds-stat-card / ds-ov-card /"
  echo "    ds-chart-card 等）外面不要再套带 border 的容器，二选一即可。"
  echo "  · .ds-section-header 的 border-bottom 是分隔器豁免（dashboard.md §11.3）"
  echo "  · 详见 references/base-spec.md §7"
  echo "  · 自检：沿任一区数 border 必须 = 1"
  echo
fi

if [[ "$TABLE_VIOLATION" == "missing-collapse" ]]; then
  FAIL=1
  echo "❌ 手搓 <table> 缺 border-collapse: collapse（表头/单元格边线会翻倍重合）："
  echo
  echo "$RAW_TABLE_LINES" | head -10
  echo
  echo "修复建议（references/base-spec.md §7）："
  echo "  · 首选用 <DataTable> / .data-table（已内置 overflow:hidden + 防双线配方）"
  echo "  · 必须手搓时三件套：卡片 overflow:hidden + 表格 border:none + border-collapse:collapse"
  echo "  · 表头只留一条 thead th border-bottom；别让卡片外框跟表头线贴成双线"
  echo
elif [[ -n "$RAW_TABLE_LINES" ]]; then
  echo "ℹ️  检测到手搓 <table>（已含 border-collapse）。仍建议数据表优先走 DataTable/.data-table，"
  echo "    并确认卡片 overflow:hidden + 表格 border:none（见 references/base-spec.md §7）。"
  echo
fi

if [[ -n "$STRIPE_HITS" ]]; then
  FAIL=1
  SCOUNT=$(echo "$STRIPE_HITS" | grep -c '^L')
  echo "❌ 发现 $SCOUNT 处「左侧色条」装饰（border-left 色条当状态/装饰，禁 · 卡片 + 标题都禁）："
  echo
  echo "$STRIPE_HITS" | head -20
  echo
  echo "修复建议（references/base-spec.md §7）："
  echo "  · 状态 → <StatusBadge> / .status-badge（药丸 + dot）；分类 → <Tag>；强调 → 标题色 / bg subtle"
  echo "  · 卡片只留四边等框 border + radius；section 标题靠字重/字号强调，不靠左色条"
  echo "  · 唯一例外：.alert severity 条（那是 alert 语义，不是卡片/标题装饰）"
  echo
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ 0 violations — 外壳克制 (沿边 ≤ 1 条 border) + 表格无双线 + 卡片无左色条"
  exit 0
fi

exit 1
