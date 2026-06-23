#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# sync-from-strict.sh  —  v1.0
# 从 agione-ui (strict) 单向同步底层资产到 agione-ui-explore。
#
# 同步内容：
#   - shell-sample.html  (chrome + token + .type-*)
#   - design-system.html (visual reference)
#   - design-system/catalog.md / selection-rules.md / api-cheatsheet.md
#   - design-system/components/ / foundations/ / partials/
#   - scripts/  (audit-typography.sh 等，但不覆盖本脚本自身)
#
# 不同步：
#   - SKILL.md  (explore 独有)
#   - MAINTAINING.md  (explore 独有)
#   - README.md  (explore 独有)
#   - design-system/AI-USAGE.md  (有 explore-specific 章节)
#
# 用法：
#   bash skills/agione-ui-explore/scripts/sync-from-strict.sh
# ──────────────────────────────────────────────────────────────────

set -eu

# 找到 agione-skills 根目录（脚本可能从任意位置运行）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

SRC="$SKILLS_ROOT/skills/agione-ui"
DST="$SKILLS_ROOT/skills/agione-ui-explore"

if [[ ! -d "$SRC" ]]; then
  echo "❌ 找不到 strict skill 源目录: $SRC" >&2
  exit 1
fi
if [[ ! -d "$DST" ]]; then
  echo "❌ 找不到 explore skill 目录: $DST" >&2
  exit 1
fi

echo "──────────────────────────────────────────────"
echo "Sync strict → explore"
echo "  SRC: $SRC"
echo "  DST: $DST"
echo "──────────────────────────────────────────────"

# ── v2.0 重构：explore 只同步 base spec 相关资产 ──
# 不再同步: catalog.md / selection-rules.md / api-cheatsheet.md /
#          components/ / partials/ / index.html / agione-design-system.html
# 这些是 DS 引导文件，存在会让 AI 默认按 DS 选组件，跟 explore 探索精神冲突

# 顶层资产
cp -v "$SRC/agione-console-shell-sample-v1.html" "$DST/"

# scripts/（只同步 AI 用得到的；DS 维护脚本不同步）
# v2.9: 加 audit-borders.sh + check-prototype.sh（v6.8/v6.9 新脚本，之前靠手动 cp 漏过）
mkdir -p "$DST/scripts"
for script in audit-typography.sh audit-borders.sh audit-contrast.sh check-prototype.sh check-dom-template-safety.sh; do
  if [[ -f "$SRC/scripts/$script" ]]; then
    cp -v "$SRC/scripts/$script" "$DST/scripts/$script"
    chmod +x "$DST/scripts/$script"
  fi
done

# design-system/foundations/ — base spec 文档（typography/color/spacing token 展示）
if [[ -d "$SRC/design-system/foundations" ]]; then
  rm -rf "$DST/design-system/foundations"
  cp -R "$SRC/design-system/foundations" "$DST/design-system/foundations"
  echo "  synced dir: design-system/foundations"
fi

echo "──────────────────────────────────────────────"
echo "✅ Sync 完成"

# ──────────────────────────────────────────────
# Drift 检查（v2.9 加）——只提示不自动改
# 历史教训：v6.8 的 SETUP 锚点行 explore AI-USAGE 漏镜像到 v2.8 才补；
# explore MAINTAINING "当前 strict 基线版本" 行从 v5.2 漂到 v6.9 没人发现。
# ──────────────────────────────────────────────
echo
echo "── Drift 检查（手动镜像文件是否落后）──"

# 1a) shell-sample 有、锚点表没提（漏镜像）
SHELL_ANCHORS=$(grep -oE 'AGIONE_EDIT_[A-Z_]+_START' "$DST/agione-console-shell-sample-v1.html" | sed 's/_START$//' | sort -u)
DRIFT=0
while IFS= read -r anchor; do
  if ! grep -q "$anchor" "$DST/design-system/AI-USAGE.md"; then
    echo "  ⚠️  shell-sample 有锚点 ${anchor}_* 但 explore AI-USAGE.md 锚点速查表没提它"
    DRIFT=1
  fi
done <<< "$SHELL_ANCHORS"

# 1b) 锚点表提了、shell-sample 已没有（幽灵行——v6.9 实测 DASHBOARD_DEMO 就这样漂过）
TABLE_ANCHORS=$(grep -oE 'AGIONE_EDIT_[A-Z_]+_\*' "$DST/design-system/AI-USAGE.md" | sed 's/_\*$//' | sort -u)
while IFS= read -r anchor; do
  [[ -z "$anchor" ]] && continue
  if ! grep -q "${anchor}_START" "$DST/agione-console-shell-sample-v1.html"; then
    echo "  ⚠️  explore AI-USAGE.md 锚点表提了 ${anchor}_* 但 shell-sample 里已不存在（幽灵行，删掉）"
    DRIFT=1
  fi
done <<< "$TABLE_ANCHORS"

# 2) MAINTAINING 基线版本 vs strict 实际 version（词边界匹配，防 v6.9 被 v6.9.1 误 pass）
STRICT_VER=$(grep -m1 '^version:' "$SRC/SKILL.md" | awk '{print $2}')
if ! grep -qE "v${STRICT_VER}([^.0-9]|\$)" "$DST/MAINTAINING.md"; then
  echo "  ⚠️  strict 已是 v${STRICT_VER}，但 explore MAINTAINING.md 没出现这个版本号"
  echo "      （检查「当前 strict 基线版本」行 + 是否欠一条 changelog）"
  DRIFT=1
fi

if [[ "$DRIFT" -eq 0 ]]; then
  echo "  ✅ 无 drift（锚点表 + 基线版本号都跟上了）"
fi

echo
echo "未同步（explore 独有，需手动维护）："
echo "  · $DST/SKILL.md"
echo "  · $DST/MAINTAINING.md"
echo "  · $DST/README.md"
echo "  · $DST/design-system/AI-USAGE.md"
echo "  · $DST/design-system/api-cheatsheet.md  (v2.0: explore 版本，只列 chrome-mandatory)"
echo "  · $DST/scripts/sync-from-strict.sh  (本脚本)"
echo "  · $DST/scripts/check-explore-variants.sh"
echo
echo "故意不同步（v2.0 重构后 explore 不再有这些 DS 引导文件）："
echo "  · catalog.md / selection-rules.md / agione-design-system.html / index.html"
echo "  · design-system/components/  (23 DS 组件展示)"
echo "  · design-system/partials/    (4 page layout 模板)"
echo "  · DS 维护脚本: build-catalog.sh / build-cheatsheet.py / extract-components.py"
echo "  · audit-atomic.py / quality-audit.py  (owner-only)"
