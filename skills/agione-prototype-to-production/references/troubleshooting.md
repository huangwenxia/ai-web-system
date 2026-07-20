# 保真闭环排错手册

按命中频率排序。多数"看起来很难"的偏差有固定套路。

## 1. mismatch% 高，但 style delta 很少/为 0
这只能说明**已配置 probe** 没发现多少差异，不能直接推出“不是样式问题”。排查顺序：
1. 打开 `report/shots/<page>-diff.png`，看大块彩色（非品红）在哪。
2. 先确认对应区域已有足够的 required probe，并打开未遮罩 side-by-side 检查缺件、错序和明显视觉偏差。
3. 再排查常见动态根因：
   - 动态数据没对称 mask（数字/日期/图表/表格 body）→ 在 `mask` 里两边都补。
   - 真实表格行数 ≠ 原型行数 → 保留真实分页语义，分别验证表头、列结构、行模板、空态和分页；只在产品口径本来要求时调整 `pageSize`。
   - 空态高度 ≠ 表格态高度 → 让默认态贴近原型默认态。
   - 截到了 loading 遮罩 → 加 `impl.waitForGone: ".<root> .el-loading-mask"`。
   - 默认 tab 不一致（原型默认 A，实现默认 B）→ 对齐默认 tab。

## 2. probe selector not found（报告显示 required element missing）
- 该元素在**默认态不存在**（在别的 tab/展开态）→ 把 probe 配到对应 state，并用 setup 打开该状态；若业务确认不适用则记录 N/A，不要为过 Gate 直接删除覆盖。
- 原型多页 DOM 共存，选择器命中了隐藏页 → 加 `section.main-box:not([style*='display: none'])` 限定当前可见页。
- 实现还没有对应根 class → 给实现根节点加稳定 class（`.operator-<page>`）。
- 原型用下划线 tab、实现写成 segmented tab（类名不同）→ 统一成原型的 `.detail-tabs`。

## 3. Vite `504 Outdated Optimize Dep`（图标导入触发）
先读取目标仓库 `AGENTS.md` 和依赖，确认**当前**图标包。渲染即用的图标使用该包的静态具名导入；不要把历史 `lucide-vue-next` 深路径方案复制到已经迁移到其他包的项目。

- 静态具名导入能让 Vite 在启动时稳定预打包，是默认方案。
- 动态 barrel/deep import 只用于真实懒加载；optimizer 重跑后旧优化 URL 可能 504。
- 命中 504 时先确认导入包符合当前规范，再重启 dev server 复测；不要修改依赖或 lockfile 来掩盖页面代码问题。

## 4. height mismatch（报告标 ⚠ proto=…px impl=…px）
整页高度不一致 = **结构性问题**：某个 section 缺失/多余/尺寸错。先比结构（缺了哪块卡片、tab 默认态不同、表格行数不同），不要只调样式。

## 5. 原型文案 vs 需求规范冲突 → 规范优先
原型是视觉权威，业务文案以本次需求、当前 term base 和目标仓库 locale 规范为准。不要依赖一个可能不在目标仓库的历史绝对路径，也不要把某次 FO 需求的禁用词提升为跨项目规则。

处理方式：记录“原型文案 → 生产文案 → 权威来源”，保留相同 typography/布局并把文案差异标为业务 residual。不能为了像素相同回退到错误业务术语。

## 6. 单文件原型切页截不到目标页
原型靠 sidebar nav 切页（多页共存一个 HTML）。在 target 里加 `proto.click: "button.nav-item:has-text('<Tab文案>')"`，再用 `proto.waitFor` 锚到该页特征文案/元素。

## 7. 真实数据和原型静态数据不同（表格/图表）
**不能 mock**。只 mask 不可对齐的动态值或表体文案，不 mask 整张 table card；同时为 table shell、表头、列数、行模板、空态和分页配置 probe/状态检查。真实首屏行数不同可以记录为数据残差，不能只为降低 mismatch 擅改生产 `pageSize`。视觉保真要求结构和样式一致，不要求伪造相同数字（见 SKILL Gate A/B）。

## 8. mismatch% 超阈值但 style deltas = 0 → 区分"样式回归"和"真数据残差"
`style deltas = 0` 只表示**已配置 probes**清零，不是整页通过。mismatch% 偏高但 probes 清零时，先检查 probe 覆盖、未遮罩 side-by-side 和被 mask 区域，再分类：
- **真数据/语义残差(可接受)**:实现用真实后端字段、原型是 mock。实测例:dashboard 用 `tasks/today` 真实字段(Compensation / Unpaired / Pending),原型是 mock 标签(Last month settled / Created this month),两侧标签文案不同 → mismatch% 升高,但样式/结构对齐。**后端没有的字段绝不伪造去凑原型** —— 保留真实语义,findings 里记为 "true-data semantic residual",这不是回归。
- **locale/theme 残差(测试态问题)**:proto 和 impl 不在同一语言/主题态,所有文案/配色都不同 → mismatch% 虚高。对齐两侧状态(§9)再测。
- **真·样式回归(要修)**:style deltas 非 0,或 side-by-side 肉眼可见间距/字号/对齐/缺件差。这才修。
> no-regression 判据 = required probes/数量/结构无差异 + 未遮罩目检无新增偏差 + mask 区域独立验证。mismatch% 升高若能用证据归因到真数据或不可控渲染残差，记录即可；不要为它 mock 或回退真实语义。

## 9. 四态(en/zh × light/dark)怎么切 + 验
先从目标 app 的 theme/locale 初始化代码确认真实 storage key、值格式和 DOM class；不同版本可能使用小写 key、常量 key或带过期信息的 JSON，不能写死。

把精确 key/value 配进 target 的 `state.localStorage`，必要时配 `state.htmlClasses`，让 comparator 在页面脚本执行前注入。逐态检查：① 无未解析 locale key ② 深色/浅色语义一致 ③ 长文案与大数字不破版 ④ hover/focus/disabled 仍可辨认。

## 10. scope = targets.json,不是 shots/ 里的历史文件
`report/shots/` 跨轮累积旧截图(可能含不在本轮范围的页,如 generate-wizard)。**本轮范围永远以 `targets.json` + 任务 prompt 为准**,别把 shots/ 里残留的历史 PNG 当成要审查的页。
