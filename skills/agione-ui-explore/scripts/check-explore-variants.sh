#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# check-explore-variants.sh  —  v1.1 加固脚本（explore-only）
#
# 检查同一个 explore 会话产出的 2-3 个 variant 是否合规：
#   1) 每个 variant 顶部 <!--AI-NOTES--> 块完整
#      含 variant / approach / ds-status / tradeoff 四个字段
#   2) 不同 variant 之间结构真的不同
#      （不是只换色 / 只换字号 / 只 layout shuffle）
#
# 用法：
#   bash scripts/check-explore-variants.sh <slug-v1.html> <slug-v2.html> [slug-v3.html]
#
# 退出码：
#   0 — 全部 variant 合规
#   1 — 有违规（AI-NOTES 缺失 / variant 太像）
#   2 — usage error / file not found
# ──────────────────────────────────────────────────────────────────

set -u

if [[ $# -lt 2 || $# -gt 3 ]]; then
  cat <<EOF >&2
用法: bash $0 <variant-1.html> <variant-2.html> [variant-3.html]

explore 必须 2-3 个 variant，多了用户挑不动，少了就不算 explore。
EOF
  exit 2
fi

VARIANTS=("$@")
N=$#

for f in "${VARIANTS[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "❌ 文件不存在: $f" >&2
    exit 2
  fi
done

echo "────────────────────────────────────────────────────"
echo "Explore Variant Check · $N 个 variant"
echo "────────────────────────────────────────────────────"
for f in "${VARIANTS[@]}"; do echo "  · $(basename "$f")"; done
echo

ERRORS=0

# ──────────────────────────────────────────────────────────────────
# 检查 1: 每个 variant 顶部 <!--AI-NOTES--> 块完整
# ──────────────────────────────────────────────────────────────────
echo "── 检查 1: AI-NOTES 块完整性 ──"
for f in "${VARIANTS[@]}"; do
  name=$(basename "$f")
  NOTES=$(awk '/<!--AI-NOTES/,/AI-NOTES-->/' "$f")

  if [[ -z "$NOTES" ]]; then
    echo "  ❌ $name : 缺失 <!--AI-NOTES--> 块"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  MISSING=()
  echo "$NOTES" | grep -q "variant:"   || MISSING+=("variant:")
  echo "$NOTES" | grep -q "approach:"  || MISSING+=("approach:")
  echo "$NOTES" | grep -q "ds-status:" || MISSING+=("ds-status:")
  echo "$NOTES" | grep -q "tradeoff:"  || MISSING+=("tradeoff:")

  if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo "  ❌ $name : AI-NOTES 缺字段：${MISSING[*]}"
    ERRORS=$((ERRORS + 1))
  else
    echo "  ✅ $name : AI-NOTES 完整"
  fi
done
echo

# ──────────────────────────────────────────────────────────────────
# 检查 2: variant 之间结构差异度
# 启发式：提取每个 variant <main> 区域内的"主组件" data-component 标记
# 比较所有 variant 的主组件集合 —— 若高度重叠（≥ 80% 一致），说明只换了
# 视觉/字号/数据，没改构图，属于"假 explore"。
# ──────────────────────────────────────────────────────────────────
echo "── 检查 2: variant 构图差异度 ──"

extract_components() {
  awk '/<main[ >]/,/<\/main>/' "$1" \
    | grep -oE 'data-component="[^"]+"' \
    | sort -u \
    | tr '\n' '|' \
    | sed 's/|$//'
}

declare -a COMP_SETS
for f in "${VARIANTS[@]}"; do
  COMP_SETS+=("$(extract_components "$f")")
done

# 输出每个 variant 的组件集合
for i in "${!VARIANTS[@]}"; do
  name=$(basename "${VARIANTS[$i]}")
  comps="${COMP_SETS[$i]}"
  echo "  $name 主组件: $(echo "$comps" | tr '|' '\n' | wc -l | tr -d ' ') 个"
  echo "    [${comps//|/, }]"
done

# 两两比较，计算 jaccard 相似度
similarity() {
  local set_a="$1"
  local set_b="$2"
  local tmp_a=$(mktemp)
  local tmp_b=$(mktemp)
  echo "$set_a" | tr '|' '\n' | sort -u > "$tmp_a"
  echo "$set_b" | tr '|' '\n' | sort -u > "$tmp_b"
  local intersection=$(comm -12 "$tmp_a" "$tmp_b" | wc -l | tr -d ' ')
  local union=$(cat "$tmp_a" "$tmp_b" | sort -u | wc -l | tr -d ' ')
  rm -f "$tmp_a" "$tmp_b"
  if [[ "$union" -eq 0 ]]; then echo "0"; else
    awk -v i="$intersection" -v u="$union" 'BEGIN { printf "%.2f", i/u }'
  fi
}

echo
echo "  Jaccard 相似度（>0.80 视为构图过近）："
for ((i=0; i<N; i++)); do
  for ((j=i+1; j<N; j++)); do
    sim=$(similarity "${COMP_SETS[$i]}" "${COMP_SETS[$j]}")
    name_i=$(basename "${VARIANTS[$i]}")
    name_j=$(basename "${VARIANTS[$j]}")
    flag=""
    awk -v s="$sim" 'BEGIN { exit (s > 0.80) ? 0 : 1 }' && flag=" ⚠️ 过近"
    echo "    $name_i vs $name_j : $sim$flag"
    if [[ -n "$flag" ]]; then
      ERRORS=$((ERRORS + 1))
    fi
  done
done
echo

# ──────────────────────────────────────────────────────────────────
# 输出总结
# ──────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────────────"
if [[ "$ERRORS" -eq 0 ]]; then
  echo "✅ 全部 variant 合规"
  exit 0
else
  echo "❌ 发现 $ERRORS 处问题"
  echo
  echo "修复建议："
  echo "  · AI-NOTES 缺字段 → 在每个 variant 顶部补完整 4 字段"
  echo "  · 构图过近 → 改信息架构 / 主组件类型，不是只换色/字号"
  echo "  · 详见 SKILL.md §2.5 好 explore vs 坏 explore"
  exit 1
fi
