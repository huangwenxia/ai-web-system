#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# check-mamba-drift.sh  —  v6.9.9 mamba token 漂移探测器（owner 维护用）
#
# 背景：v6.9.9 把 skill 的 radius / space / shadow token 对齐到 mamba-layout
# 0.51.8（shadow 改三档语义 xs/card/pop；补 --ui-color-info-subtle）。mamba 是
# 活包——它加 token / 改值，skill 不会自动知道。本脚本把"等出事才发现"变成
# "每次发版跑一下"。
#
# 做什么：
#   1. curl mamba-layout@latest 的 package.json（报当前版本）
#   2. curl dist/layout.css + dist/theme.css，抽 --ui-radius/space/shadow-* 定义
#   3. 把 mamba 的 var(--ui-x) 值解析成字面量再跟 skill 比（消除 var-ref 假阳性）
#   4. 对比 shell-sample :root 的同名 token：mamba 有而 skill 没有 / 值不一致
#
# 用法：
#   bash scripts/check-mamba-drift.sh            # 默认对比 strict shell-sample
#
# 退出码：0 无漂移或网络不可用（不 fail）/ 1 发现漂移
#
# ⚠️ 局限（手动检查项）：
#   - element-plus 版本对齐（shell-sample 钉 2.11.5）要人工对 mamba peerDeps
#   - tailwindcss：mamba 用 v4（@theme inline），原型用 v3 play-CDN（构建期工具，
#     非 token，刻意不追——原型的 Tailwind 是一次性的，落生产再用 mamba 的 v4）
#   - 测 radius/space/shadow；color token 命名两边体系不同（skill 用 --ui-color-*）
#   - skill 独有前向 token（border-interactive / *-hover/-active / duration/ease/
#     icon/z）mamba 尚未收录——本脚本不报这些（是 skill 领先 mamba，非漂移）
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
echo "Mamba Token Drift Check  (v6.10.1)"
echo "────────────────────────────────────────────────────"

# ── 1. mamba 版本 ──
PKG=$(curl -s --max-time 10 "$CDN/package.json" 2>/dev/null)
if [[ -z "$PKG" ]]; then
  echo "⚠️  网络不可用 / CDN 超时——跳过检查（不算失败）"
  exit 0
fi
MAMBA_VER=$(echo "$PKG" | grep -m1 '"version"' | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "mamba-layout@latest = v${MAMBA_VER}（skill v6.10.1 对齐基线 = 0.51.9）"
echo

# ── 2. 抽 mamba token（用解析出的确切版本号，不用 @latest——@latest 边缘缓存偶发返回缺 --ui 的构建）──
CDN_VER="https://cdn.jsdelivr.net/npm/mamba-layout@${MAMBA_VER}"
# layout.css 是 ~395KB 单行 minified，--ui-* token 排在 --el-* base 之后；超时太短会
# 截断成只剩前半段（EP 变量）导致抽空 → 给 45s 让整行下完
MAMBA_CSS=$(curl -s --max-time 45 "$CDN_VER/dist/layout.css" 2>/dev/null; curl -s --max-time 45 "$CDN_VER/dist/theme.css" 2>/dev/null)
MAMBA_TOKENS=$(echo "$MAMBA_CSS" | grep -oE '\-\-ui-(radius|space|shadow)-[a-z0-9-]+:[^;}]+' | sed 's/ *: */:/; s/ *$//' | sort -u)

if [[ -z "$MAMBA_TOKENS" ]]; then
  echo "⚠️  mamba CSS 里没抽到 --ui-radius/space/shadow token（CDN 结构可能变了，人工核查）"
  exit 0
fi

# ── 把 mamba 的 var(--ui-x) 值解析成 mamba 自己 token 集里的字面量 ──
# （mamba 写 --ui-space-card: var(--ui-space-lg)，skill 写字面量 20px；不解析会假阳性）
resolve_mamba_ref() {
  local v="$1"
  case "$v" in
    var\(--ui-*\))
      local ref="${v#var(}"; ref="${ref%)}"
      local r
      r=$(printf '%s\n' "$MAMBA_TOKENS" | grep "^${ref}:" | head -1)
      if [[ -n "$r" ]]; then echo "${r#*:}"; else echo "$v"; fi
      ;;
    *) echo "$v" ;;
  esac
}

# ── 3. 抽 shell-sample :root token（取每个 token 首次定义） ──
SKILL_TOKENS=$(grep -oE '\-\-ui-(radius|space|shadow)-[a-z0-9-]+: *[^;]+' "$SHELL_SAMPLE" | sed 's/ *: */:/; s/ *\/\*.*//; s/ *$//' | awk -F: '!seen[$1]++' | sort -u)

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
echo "── 同名 token 值不一致（mamba var() 已解析成字面量再比）──"
DIFF=0
while IFS= read -r line; do
  name="${line%%:*}"; mval="${line#*:}"
  sline=$(echo "$SKILL_TOKENS" | grep "^${name}:" || true)
  if [[ -n "$sline" ]]; then
    sval="${sline#*:}"
    rmval=$(resolve_mamba_ref "$mval")
    # skill 侧也可能是 alias（如 shadow-sm: var(--ui-shadow-xs)）；alias 不参与值比
    case "$sval" in var\(--ui-*\)) continue ;; esac
    # normalize：去空格统一比
    if [[ "$(echo "$rmval" | tr -d ' ')" != "$(echo "$sval" | tr -d ' ')" ]]; then
      if [[ "$mval" != "$rmval" ]]; then
        echo "  ⚠️  $name: mamba=「$mval」(解析后「$rmval」) vs skill=「$sval」"
      else
        echo "  ⚠️  $name: mamba=「$mval」 vs skill=「$sval」"
      fi
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
  echo "❌ 发现漂移 — 按对齐策略处理："
  echo "   chrome 内部 size scale 不动；:root 加/改 mamba semantic alias；"
  echo "   改完跑 audit + 更新 MAINTAINING changelog"
  exit 1
fi
