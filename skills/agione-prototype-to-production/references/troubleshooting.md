# 保真闭环排错手册

按命中频率排序。多数"看起来很难"的偏差有固定套路。

## 1. mismatch% 高，但 style delta 很少/为 0
**几乎都不是样式问题**，而是动态内容没对齐。排查顺序：
1. 打开 `report/shots/<page>-diff.png`，看大块彩色（非品红）在哪。
2. 常见根因：
   - 动态数据没对称 mask（数字/日期/图表/表格 body）→ 在 `mask` 里两边都补。
   - 真实表格行数 ≠ 原型行数 → 把真实查询首屏 `pageSize` 收敛到原型行数。
   - 空态高度 ≠ 表格态高度 → 让默认态贴近原型默认态。
   - 截到了 loading 遮罩 → 加 `impl.waitForGone: ".<root> .el-loading-mask"`。
   - 默认 tab 不一致（原型默认 A，实现默认 B）→ 对齐默认 tab。

## 2. probe selector not found（报告显示 element NOT FOUND）
- 该元素在**默认态不存在**（在别的 tab/展开态）→ 删掉这个 probe，只 probe 默认态可见的。
- 原型多页 DOM 共存，选择器命中了隐藏页 → 加 `section.main-box:not([style*='display: none'])` 限定当前可见页。
- 实现还没有对应根 class → 给实现根节点加稳定 class（`.operator-<page>`）。
- 原型用下划线 tab、实现写成 segmented tab（类名不同）→ 统一成原型的 `.detail-tabs`。

## 3. Vite `504 Outdated Optimize Dep`（图标导入触发）
**精确结论**（codex playbook §7.4 把规则讲过头了，实际深路径动态导入也能跑）：
- ✅ **静态具名导入最稳**：`import { CopyIcon, PlayIcon } from "lucide-vue-next"` —— 启动即预打包，永不 504。**渲染即用的图标首选这种。**
- ⚠ 深路径动态 `import("lucide-vue-next/dist/esm/icons/copy.js")` 能用，但 optimizer 重跑后那条已优化 URL 会失效偶发 504。
- ❌ barrel 动态 `import("lucide-vue-next")` 最易触发。
- 命中 504 时：重启 dev server（重新 optimize），或把动态改成静态具名。仅真正需要懒加载/条件加载的图标才用动态 import。

## 4. height mismatch（报告标 ⚠ proto=…px impl=…px）
整页高度不一致 = **结构性问题**：某个 section 缺失/多余/尺寸错。先比结构（缺了哪块卡片、tab 默认态不同、表格行数不同），不要只调样式。

## 5. 原型文案 vs 需求规范冲突 → 规范优先
原型只是视觉权威，业务文案以需求规范为准。**关键规则直接内联在此**（别假设 `frontend-development-guide-v1.md` 在当前 repo —— 它在 knowledge-base 的 `…/REQ-20260515-173706-ww-finance-optimization/frontend-development-guide-v1.md`，AI 在 project-mamba 里跑时够不到这个文件）：
- **禁用词**：`GNOSIS` / `WANMORE` / `OPERATOR_FEE` / `VOID` / `晚到顺延`。
- **账户名**：原型的 `OPERATOR_FEE` → 实现用 `OPERATOR_REVENUE`。
- **来源系统**只用 `MODELONE` / `POWERONE` / `FINANCIAL`。
- **上下架术语**：英文勿用 delist；供方主动 = Unpublish / Republish，平台强制 = Takedown / Resolve issue。
- 不能为了贴原型像素而倒退到违规文案。
> 要完整口径：去 knowledge-base 对应 REQ 目录读 `frontend-development-guide-v1.md`（§3 业务口径 / §13 禁用词）。

## 6. 单文件原型切页截不到目标页
原型靠 sidebar nav 切页（多页共存一个 HTML）。在 target 里加 `proto.click: "button.nav-item:has-text('<Tab文案>')"`，再用 `proto.waitFor` 锚到该页特征文案/元素。

## 7. 真实数据和原型静态数据不同（表格/图表）
**不能 mock**。三选一：① mask 表格 body 或整张 table card；② 把真实查询 pageSize 收敛到原型首屏行数；③ 保留真实字段，但 typography/spacing/card shell 与原型一致。"还原度"指结构/视觉语言一致，不是数字大小一致（见 SKILL §0）。

## 8. mismatch% 超阈值但 style deltas = 0 → 区分"样式回归"和"真数据残差"
**真正的门是 `style deltas = 0` + 结构一致,不是 mismatch% 数字本身。** mismatch% 偏高但 style deltas=0 时,开 side-by-side 判类型:
- **真数据/语义残差(可接受)**:实现用真实后端字段、原型是 mock。实测例:dashboard 用 `tasks/today` 真实字段(Compensation / Unpaired / Pending),原型是 mock 标签(Last month settled / Created this month),两侧标签文案不同 → mismatch% 升高,但样式/结构对齐。**后端没有的字段绝不伪造去凑原型** —— 保留真实语义,findings 里记为 "true-data semantic residual",这不是回归。
- **locale/theme 残差(测试态问题)**:proto 和 impl 不在同一语言/主题态,所有文案/配色都不同 → mismatch% 虚高。对齐两侧状态(§9)再测。
- **真·样式回归(要修)**:style deltas 非 0,或 side-by-side 肉眼可见间距/字号/对齐/缺件差。这才修。
> no-regression 判据 = **style deltas=0 且无新增结构差**;mismatch% 升高若能归因到"真数据标签"或"测试态不一致",记录即可,别为它 mock 或回退真实语义。

## 9. 四态(en/zh × light/dark)怎么切 + 验
mamba-layout 的状态别只靠点地球/月亮图标的黑盒,**直接读写 storage key 更可靠**:
- 语言:`localStorage.locale`(`'zh-cn'` / `'en'`)。
- 主题:`localStorage.theme`(`'light'` / `'dark'`)+ `document.documentElement.classList`(dark 态带 `dark` class)。
设完 reload 让 app 重新读取。验四态逐态截图,查:① 无未解析 `billing.*` key ② 深色 hero 在 dark 下仍深底浅字(不被 `--ui-bg-inverse` 反转) ③ 布局不破。
> `compare.mjs` 默认只截**当前**一态;跑保真前先把 impl 切到与原型同一语言/主题,否则 §8 的 locale 残差会污染 mismatch%。

## 10. scope = targets.json,不是 shots/ 里的历史文件
`report/shots/` 跨轮累积旧截图(可能含不在本轮范围的页,如 generate-wizard)。**本轮范围永远以 `targets.json` + 任务 prompt 为准**,别把 shots/ 里残留的历史 PNG 当成要审查的页。
