#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# audit-typography.sh  —  v5.1 加固脚本
# 检测生成的原型 HTML 在业务区是否手写了 typography 属性
# （font-size / font-weight / font-family / line-height）。
#
# 规则参考：SKILL.md §1.4-11 + AI-USAGE.md § Chrome 自带 class 字号豁免
#
# 用法：
#   bash scripts/audit-typography.sh <prototype.html>
#
# 退出码：
#   0 — clean（0 violations）
#   1 — found violations
#   2 — usage error / file not found
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
# 检查 1: <main> 内 inline style 含 font-* 属性
# 范围：从第一个 <main 到最后一个 </main>
# ──────────────────────────────────────────────────────────────────
INLINE_HITS=$(awk '
  /<main[ >]/    { in_main = 1 }
  /<\/main>/     { in_main = 0 }
  in_main && match($0, /style[ ]*=[ ]*"[^"]*(font-size|font-weight|font-family|line-height)[ ]*:/) {
    printf "L%d (inline): %s\n", NR, substr($0, RSTART, 200)
  }
' "$FILE")

# ──────────────────────────────────────────────────────────────────
# 检查 2: <style> 块内非豁免 CSS class 手写 font-* 属性
# 思路：
#   - 用 awk 追踪当前 CSS 规则的 selector 行
#   - 遇到 font-size/weight/family/line-height 属性行
#   - 若 selector **不在** 豁免清单 + 不是 :root + 不是注释 → 违规
#
# 豁免清单见 AI-USAGE.md § Chrome 自带 class 字号豁免（13 个 chrome class
# + .type-* + Element Plus .el-* + 已知 chrome 内部 hook）
# ──────────────────────────────────────────────────────────────────
CSS_HITS=$(awk '
  BEGIN {
    in_style = 0
    selector = ""
    in_root  = 0
  }

  /<style[ >]/    { in_style = 1; next }
  /<\/style>/     { in_style = 0; selector = ""; next }
  !in_style       { next }

  # 跳过整行注释
  /^[ \t]*\/\*/   { next }

  # selector 块开始：行尾含 {
  /\{[ \t]*$/ {
    selector = $0
    sub(/[ \t]*\{[ \t]*$/, "", selector)
    in_root = (selector ~ /:root/) ? 1 : 0
    next
  }
  # selector 块结束
  /\}/ {
    selector = ""
    in_root  = 0
    next
  }

  # 在某个规则块内
  selector != "" && in_root == 0 {
    if (match($0, /(font-size|font-weight|font-family|line-height)[ ]*:/)) {
      # 判断 selector 是否豁免
      sel = selector
      # 豁免：.type-* / .el-* / chrome class 前缀
      if (sel ~ /\.type-/)              next
      if (sel ~ /\.el-/)                next
      if (sel ~ /\.header-box__/)       next
      if (sel ~ /\.page-header__/)      next
      if (sel ~ /\.hero-band__/)        next
      if (sel ~ /\.kpi-card__/)         next
      if (sel ~ /\.status-badge/)       next
      if (sel ~ /\.tag([^a-zA-Z0-9_-]|$)/)     next
      if (sel ~ /\.empty-state/)        next
      if (sel ~ /\.balance-pill/)       next
      if (sel ~ /\.nav-search/)         next
      if (sel ~ /\.nav-icon-btn/)       next
      if (sel ~ /\.sidebar/)            next
      if (sel ~ /\.demo-mode-chip/)     next
      if (sel ~ /\.demo-banner/)        next
      if (sel ~ /\.scenario-/)          next
      if (sel ~ /\.app-shell/)          next
      if (sel ~ /\.topnav/)             next
      if (sel ~ /\.btn-back/)           next
      if (sel ~ /\.detail-tabs/)        next
      if (sel ~ /\.filter-bar/)         next
      if (sel ~ /\.drawer-/)            next
      if (sel ~ /\.dialog-/)            next
      if (sel ~ /\.toast-/)             next
      if (sel ~ /\.form-modern/)        next
      if (sel ~ /\.form-group/)         next
      if (sel ~ /\.form-helper/)        next
      if (sel ~ /\.form-actions/)       next
      if (sel ~ /\.radio-/)             next
      if (sel ~ /\.checkbox-/)          next
      if (sel ~ /\.i18n-field/)         next
      if (sel ~ /\.upload-/)            next
      if (sel ~ /\.timeline/)           next
      if (sel ~ /\.nav-/)               next
      if (sel ~ /\.main-box/)           next
      if (sel ~ /\.scroll-box/)         next
      if (sel ~ /\.card-box/)           next
      if (sel ~ /\.header-box/)         next
      if (sel ~ /^html|^body|^\*/)      next   # 基础重置
      if (sel ~ /^a\b|^button\b/)       next   # element baseline
      if (sel ~ /\.anim-/)              next   # animation utility
      # 其余 shell-sample chrome / standard 组件 class（稳定，PR 触发时手动同步）
      if (sel ~ /\.stage-/)             next   # HeroBand stage
      if (sel ~ /\.badge([^a-zA-Z0-9_-]|$)/)   next   # 通用 badge
      if (sel ~ /\.alert([^a-zA-Z0-9_-]|$)/)   next   # alert 组件
      if (sel ~ /\.usage-bar/)          next   # 进度条 + 数字
      if (sel ~ /\.kv-card/)            next   # KeyValue 卡
      if (sel ~ /\.detail-section/)     next   # 详情页 section
      if (sel ~ /\.metrics-strip/)      next   # 指标条
      if (sel ~ /\.step-pill/)          next   # 步骤药丸
      if (sel ~ /\.tabs-segmented/)     next   # 分段 tabs
      if (sel ~ /\.avatar([^a-zA-Z0-9_-]|$)/)  next   # 头像
      if (sel ~ /\.breadcrumb/)         next   # 面包屑
      if (sel ~ /\.hero-band/)          next   # HeroBand
      if (sel ~ /\.metric-/)            next   # generic metric
      if (sel ~ /\.divider-/)           next   # divider

      # 余下的是潜在违规
      attr = $0
      sub(/^[ \t]+/, "", attr)
      printf "L%d (css selector \"%s\"): %s\n", NR, sel, attr
    }
  }
' "$FILE")

# ──────────────────────────────────────────────────────────────────
# 输出
# ──────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────────────"
echo "Typography Audit · $(basename "$FILE")"
echo "────────────────────────────────────────────────────"

INLINE_COUNT=0
if [[ -n "$INLINE_HITS" ]]; then
  INLINE_COUNT=$(echo "$INLINE_HITS" | wc -l | tr -d ' ')
fi
CSS_COUNT=0
if [[ -n "$CSS_HITS" ]]; then
  CSS_COUNT=$(echo "$CSS_HITS" | wc -l | tr -d ' ')
fi
TOTAL=$((INLINE_COUNT + CSS_COUNT))

if [[ "$TOTAL" -eq 0 ]]; then
  echo "✅ 0 violations — typography 守规则"
  exit 0
fi

echo "❌ 发现 $TOTAL 处疑似手写字号 / 字重 / 字族 / 行高："
echo

if [[ -n "$INLINE_HITS" ]]; then
  echo "── Inline style 在 <main> 业务区（$INLINE_COUNT 处）──"
  echo "$INLINE_HITS" | head -30
  if [[ "$INLINE_COUNT" -gt 30 ]]; then
    echo "  ...（共 $INLINE_COUNT 处，仅显示前 30）"
  fi
  echo
fi

if [[ -n "$CSS_HITS" ]]; then
  echo "── CSS 自定义 class 内手写（$CSS_COUNT 处）──"
  echo "$CSS_HITS" | head -30
  if [[ "$CSS_COUNT" -gt 30 ]]; then
    echo "  ...（共 $CSS_COUNT 处，仅显示前 30）"
  fi
  echo
fi

echo "修复建议："
echo "  · CSS class 自写字号 → 改用 .type-* utility class"
echo "  · inline style font-size → 改用 class=\"type-xxx\""
echo "  · 业务卡焦点数字 28px → .type-kpi（v5.1 新增）"
echo "  · 详见 design-system/AI-USAGE.md § Typography"
echo "  · 若确属一次性 layout / 特殊场景，走 §0.4 rule-gap"

exit 1
