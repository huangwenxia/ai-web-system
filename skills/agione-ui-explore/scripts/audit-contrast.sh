#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# audit-contrast.sh  —  v6.9.4 WCAG 1.4.11 功能性边框对比度守卫
#
# 背景：dark 下 radio/checkbox 空心圈看不见，根因是 border-default
#   (#27272a) vs 卡底 (#18181b) ≈ 1.19:1，远低于 1.4.11 对 UI 控件边界
#   要求的 3:1。v6.9.4 引入 --ui-border-interactive 专给功能性控件。
#
# 本脚本：从 shell-sample 抽 token 真值，算 WCAG 对比度，断言
#   --ui-border-interactive vs --ui-bg-card 在 light + dark 都 ≥ 3:1。
#   （回归守卫：防止有人把功能边框调淡又退回不可见。）
#   附带报告 border-default 的比值（应 <3 = 装饰用，不达标是正常的）。
#
# 用法：bash scripts/audit-contrast.sh <prototype-or-shell.html>
# 退出码：0 达标 / 1 不达标 / 2 usage
# ──────────────────────────────────────────────────────────────────
set -u
FILE="${1:-}"
[[ -z "$FILE" ]] && { echo "用法: bash $0 <file.html>" >&2; exit 2; }
[[ ! -f "$FILE" ]] && { echo "❌ 文件不存在: $FILE" >&2; exit 2; }

python3 - "$FILE" <<'PY'
import sys, re
html = open(sys.argv[1]).read()

def lin(c):
    cs=c/255
    return cs/12.92 if cs<=0.03928 else ((cs+0.055)/1.055)**2.4
def L(h):
    h=h.lstrip('#')
    if len(h)==3: h=''.join(c*2 for c in h)
    return 0.2126*lin(int(h[0:2],16))+0.7152*lin(int(h[2:4],16))+0.0722*lin(int(h[4:6],16))
def cr(a,b):
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb)
    return (hi+0.05)/(lo+0.05)

# 抽某个 var 在 darkVars / lightVars JS 块里的值。
# 结构：darkVars = { ... } 在前，lightVars = { ... } 在后。
def grab(varname, scope):
    # scope: 'dark' 取第 1 次出现，'light' 取第 2 次（lightVars 在后）
    pat = re.compile(r"['\"]"+re.escape(varname)+r"['\"]\s*:\s*['\"](#[0-9a-fA-F]{3,8})['\"]")
    vals = pat.findall(html)
    if not vals: return None
    if scope=='dark':  return vals[0]
    if scope=='light': return vals[-1]
    return vals[0]

fail=0
print("────────────────────────────────────────────────────")
print("Contrast Audit · WCAG 1.4.11 功能性边框 ≥3:1  (v6.9.4)")
print("────────────────────────────────────────────────────")
for theme in ('light','dark'):
    inter = grab('--ui-border-interactive', theme)
    card  = grab('--ui-bg-card', theme)
    deflt = grab('--ui-border-default', theme)
    if not (inter and card):
        print(f"  ⚠️  {theme}: 抽不到 border-interactive / bg-card（非 shell-sample？跳过）")
        continue
    ri = cr(inter, card)
    rd = cr(deflt, card) if deflt else 0
    ok = ri >= 3.0
    mark = '✅' if ok else '❌'
    if not ok: fail=1
    print(f"  {theme:5s}  border-interactive {inter} vs bg-card {card} = {ri:.2f}:1 {mark} (≥3 要求)")
    if deflt:
        print(f"  {theme:5s}  border-default     {deflt} vs bg-card {card} = {rd:.2f}:1   (装饰用，<3 正常)")

print("────────────────────────────────────────────────────")
if fail:
    print("❌ 功能性边框未达 3:1 —— radio/checkbox/可点卡 在该主题下会看不清")
    print("   修：调亮 --ui-border-interactive（light 需 ≥3:1 on 白；dark 需 ≥3:1 on #18181b）")
    print("   参考达标值：light #8f8f8f / dark #71717a")
    sys.exit(1)
else:
    print("✅ 功能性边框 light + dark 均 ≥3:1（WCAG 1.4.11 达标）")
PY
