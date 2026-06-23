#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# check-mamba-drift.sh  —  v6.9 mamba token 漂移探测器（owner 维护用）
#
# 背景：v6.8 把 skill 的 radius / space token 对齐到 mamba-layout 0.50.0
# 快照（semantic 命名 alias）。mamba 是活包——它加 token / 改值，skill
# 不会自动知道。本脚本把"等出事才发现"变成"每次发版跑一下"。
#
# 做什么：
#   1. curl mamba-layout@latest 的 package.json（报当前版本）
#   2. curl dist/layout.css + dist/theme.css，抽 --ui-radius-* / --ui-space-* 定义
#   3. 对比 shell-sample :root 的同名 token
#   4. 报告：mamba 有而 skill 没有 / 两边值不一致
#
# 用法：
#   bash scripts/check-mamba-drift.sh            # 默认对比 strict shell-sample
#
# 退出码：0 无漂移或网络不可用（不 fail）/ 1 发现漂移
#
# ⚠️ 局限（手动检查项）：
#   - element-plus 版本对齐（shell-sample 钉 2.9.1）要人工对 mamba peerDeps
#   - 只测 radius/space；color token 命名两边体系不同（skill 用 --ui-color-*）
# ──────────────────────────────────────────────────────────────────

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHELL_SAMPLE="${1:-$SCRIPT_DIR/../agione-console-shell-sample-v1.html}"
CDN="https://cdn.jsdelivr.net/npm/mamba-layout@latest"

if [[ ! -f "$SHELL_SAMPLE" ]]; then
  echo "❌ shell-sample 不存在: $SHELL_SAMPLE" >&2
  exit 2
fi

echo "────────────────────────────────────────────────────"
echo "Mamba Token Drift Check  (v6.9)"
echo "────────────────────────────────────────────────────"

# ── 1. mamba 版本 ──
PKG=$(curl -s --max-time 10 "$CDN/package.json" 2>/dev/null)
if [[ -z "$PKG" ]]; then
  echo "⚠️  网络不可用 / CDN 超时——跳过检查（不算失败）"
  exit 0
fi
MAMBA_VER=$(echo "$PKG" | grep -m1 '"version"' | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "mamba-layout@latest = v${MAMBA_VER}（skill v6.8 对齐基线 = 0.50.0）"
echo

# ── 2. 抽 mamba token ──
MAMBA_CSS=$(curl -s --max-time 15 "$CDN/dist/layout.css" 2>/dev/null; curl -s --max-time 15 "$CDN/dist/theme.css" 2>/dev/null)
MAMBA_TOKENS=$(echo "$MAMBA_CSS" | grep -oE '\-\-ui-(radius|space)-[a-z0-9-]+:[^;}]+' | sed 's/ *: */:/; s/ *$//' | sort -u)

if [[ -z "$MAMBA_TOKENS" ]]; then
  echo "⚠️  mamba CSS 里没抽到 --ui-radius/space token（CDN 结构可能变了，人工核查）"
  exit 0
fi

# ── 3. 抽 shell-sample :root token（取每个 token 首次定义） ──
SKILL_TOKENS=$(grep -oE '\-\-ui-(radius|space)-[a-z0-9-]+: *[^;]+' "$SHELL_SAMPLE" | sed 's/ *: */:/; s/ *\/\*.*//; s/ *$//' | awk -F: '!seen[$1]++' | sort -u)

# ── 4. 对比 ──
DRIFT=0
echo "── mamba 有、skill 缺的 token ──"
MISSING=0
while IFS= read -r line; do
  name="${line%%:*}"
  if ! echo "$SKILL_TOKENS" | grep -q "^${name}:"; then
    echo "  ⚠️  $line   ← skill shell-sample 没定义"
    MISSING=1; DRIFT=1
  fi
done <<< "$MAMBA_TOKENS"
[[ "$MISSING" -eq 0 ]] && echo "  ✅ 无缺失"

echo
echo "── 同名 token 值不一致 ──"
DIFF=0
while IFS= read -r line; do
  name="${line%%:*}"; mval="${line#*:}"
  sline=$(echo "$SKILL_TOKENS" | grep "^${name}:" || true)
  if [[ -n "$sline" ]]; then
    sval="${sline#*:}"
    # normalize：去空格统一比
    if [[ "$(echo "$mval" | tr -d ' ')" != "$(echo "$sval" | tr -d ' ')" ]]; then
      echo "  ⚠️  $name: mamba=「$mval」 vs skill=「$sval」"
      DIFF=1; DRIFT=1
    fi
  fi
done <<< "$MAMBA_TOKENS"
[[ "$DIFF" -eq 0 ]] && echo "  ✅ 无不一致"

echo
echo "────────────────────────────────────────────────────"
if [[ "$DRIFT" -eq 0 ]]; then
  echo "✅ 无漂移 — skill token 跟 mamba v${MAMBA_VER} 对齐"
  exit 0
else
  echo "❌ 发现漂移 — 按 v6.8 的对齐策略处理："
  echo "   chrome 内部 size scale 不动；:root 加/改 mamba semantic alias；"
  echo "   改完跑 audit + 更新 MAINTAINING changelog"
  exit 1
fi
