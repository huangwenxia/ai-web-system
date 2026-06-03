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
mkdir -p "$DST/scripts"
for script in audit-typography.sh check-dom-template-safety.sh; do
  if [[ -f "$SRC/scripts/$script" ]]; then
    cp -v "$SRC/scripts/$script" "$DST/scripts/$script"
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
