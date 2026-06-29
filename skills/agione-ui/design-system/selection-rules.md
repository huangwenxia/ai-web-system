# Component Selection Rules — 决策树（v6.9.1）

> AI 必读时机：catalog.md 的 `signal` 列指向 `TREE-N` 时，Read 本文件对应章节。
> 单候选（signal=STOP）/ SKILL.md 已明文 / prototype 已指定 → 跳过本文件。
>
> 本文件 ~4.5k token，覆盖 12 个决策点（Layer 0 页面骨架 + ① 到 ⑩ 组件选型 + ⑪ Dashboard 页型；v6.9.1 加 ⑪）。
> 每棵树固定结构：**决策问 → 分支表 → 默认 → 反模式**。

---

## ⓪ Layer 0 · 页面骨架决策（先于所有组件决策）

**决策问**：要生成的是什么页面？

| 页面性质 | 模板 | 必备组件 | 文件 |
|---------|------|---------|------|
| 列表 / 管理（90% 控制台） | **StandardListPage** | MainBox + HeaderBox + FilterBox + DataTable + TableActions | `partials/standard-list-page.partial.html` |
| 详情 / 配置 | **DetailPage** | Breadcrumb + PageHeader + MetricsStrip + Tabs + DetailSection × N | `partials/detail-page.partial.html` |
| 轻量概览（KPI + 内容卡，无 chart 主体） | **OverviewPage** | HeaderBox + KpiCard × 3 + CardBox × N | `partials/overview-page.partial.html` |
| **监控大盘 / analytics（chart 为主）** | **DashboardPage（v6.9）** | 先走 **决策树 ⑪** → `.ds-section` × N + KPI 两档 + chart family | `partials/dashboard.partial.html` + `dashboard.md` |
| 向导 / 多步表单 | 组装 | HeaderBox + Stepper + FormModern × N | — |
| 营销 / 引导 | 组装 | HeroBand + ListCardItem × N | — |

**默认（不确定时）**：StandardListPage —— 控制台 90% 是列表/管理页

**强约束**：
- **基础步骤**：先 `cp shell-sample-v1.html` → 然后把 `partials/X.partial.html` 内容塞到 `<main>` 内
- ⚠️ 不要复制 `components/templates/pattern-*.html`（独立预览文档，含 chrome，复制会重叠）
- 模板的"必备组件"按其位置就位，不要换位（如 FilterBox 不能放到 footer）
- 进入组件层决策前，**先确认 Layer 0 选定**，不要直接拼组件

---

## ① 列表展示：DataTable vs ListCardItem vs 自定义网格

**决策问**：每行展示多少字段？是否有视觉资产（icon / 缩略图 / avatar）？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| ≥ 6 字段 / 需排序筛选分页 / 操作列固定右侧 | **DataTable** (L1) | `components/L1/data-table.html` |
| 3-5 字段 + 含视觉资产（模型 logo / 头像 / 大图标） | **ListCardItem** (L2) | `components/L2/list-card-item.html` |
| 1-2 字段 / 极简清单（如设置项列表） | 自定义 `div` + `.type-body` | — |

**默认（不确定时）**：`DataTable` —— 列表页 90% 走表格

**反模式 ❌**：
- 4 字段强行用 ListCardItem → 卡片显空
- 8 字段用 ListCardItem → 信息密度不够，用户要点详情才能看全
- 列表项无视觉资产却用 ListCardItem → 沦为丑卡片，不如表格

---

## ② 页面顶部：HeaderBox vs PageHeader vs HeroBand

**决策问**：页面类型 + 是否需要营销感？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 列表 / 管理页（title + 筛选 + 主操作） | **HeaderBox** (L1) | `components/L1/header-box.html` |
| 详情页（title + 面包屑 + 元数据 + 后续 Tabs） | **PageHeader** (L2) | `components/L2/page-header.html` |
| 营销 / 引导首屏 / 大数字 hero / 模型广场顶部 | **HeroBand** (L2，⚠ 特定场景) | `components/L2/hero-band.html` |

**默认（不确定时）**：`HeaderBox` —— 控制台 80% 是列表/管理页

**反模式 ❌**：
- 详情页用 HeaderBox → 缺面包屑和 meta，用户找不到层级
- 普通列表页用 HeroBand → 营销感过重，与产品调性不符
- HeroBand 用于内部管理（License 列表等运营页） → 浪费视觉权重

---

## ③ KPI / 数据展示：KpiCard vs MetricsStrip vs KvCard

**决策问**：要展示几个指标？需要趋势文本吗？是否详情页内部？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 2-3 个核心指标 + 趋势 + 上下文（Overview 顶部） | **KpiCard** 网格 (L1) | `components/L1/kpi-card.html` |
| 5-8 个紧凑指标横向条带 + 无趋势或极简趋势 | **MetricsStrip** (L2) | `components/L2/metrics-strip.html` |
| 详情页内的键值对（属性值 / 配置值，无数字突出） | **KvCard** (L1) | `components/L1/kv-card.html` |

**默认（不确定时）**：`KpiCard` —— 数据感最强，最常用

**反模式 ❌**：
- 1 个 KpiCard 独占大空间 → 显空，应做 Hero 数字或合进 HeaderBox
- ≥ 4 个 KpiCard 并排 → 视觉过载，应用 MetricsStrip / KvCard / 表格；dashboard stat-card 4 列只在 §⑪ 里例外
- 详情页用 KpiCard 展示元数据（如"创建时间"） → 数字字体不合适，应用 KvCard

---

## ④ 状态显示：StatusBadge vs Tag vs Alert vs 颜色文字

**决策问**：是否强语义状态？单点 vs 多个共存？需要附加操作吗？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 强语义状态码（active / pending / expired / error） + 单点显示 | **StatusBadge** (L1) | `components/L1/status-badge.html` |
| 分类标签 / 多个共存（如"GPU"、"INT8"、"DeepSeek 系列"） | **Tag** (L1，可多) | `components/L1/tag.html` |
| 整行警示 / 可能含操作（"配额超限 [立即升级]"） | **Alert** (L1，inline) | `components/L1/alert.html` |
| 极简（表格内某字段染色，如"-15ms"红色） | 仅 `.type-caption / .type-data` + color token | — |

**默认（不确定时）**：`StatusBadge` —— 状态码用它最不会错

**反模式 ❌**：
- 用 Tag 表示状态（"激活"标签） → 语义错位，Tag 是分类不是状态
- 用 Alert 展示常规状态 → 占据整行，喧宾夺主
- 多状态共存用多个 StatusBadge → 视觉混乱，应改为 Tag 数组
- 表格行内塞 Alert → 撑爆行高

---

## ⑤ 多步骤流程：Stepper vs StepPills vs Tabs

**决策问**：步骤是否强制串行？是否需要可视化完成度？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 串行强制 + 显示完成度 + 正式向导（注册 / 实名 / 部署） | **Stepper** (L2，水平或垂直) | `components/L2/stepper.html` |
| 步骤可跳 + 顶部紧凑条 + 当前位置高亮（详情页流程总览） | **StepPills** (L2) | `components/L2/step-pills.html` |
| 完全独立 + 用户任意切换 + 无完成度概念 | **Tabs** (L1) | `components/L1/tabs.html` |

**默认（不确定时）**：`Stepper` —— 流程类用它最直观

**反模式 ❌**：
- 独立功能切换用 Stepper → 用户误以为必须按顺序
- 向导流程用 Tabs → 用户可能跳过必填步骤
- ≤ 2 步用 Stepper → 显得做作，直接表单 + 主按钮即可
- StepPills 用于非流程（如"分类切换"） → 应改 Tabs

---

## ⑥ 单选输入：Radio 4-variant

> 已在 SKILL.md §1.4 规则 10 明文，此处仅 mirror。文件：`components/L2/radio-variants.html`

| 触发条件 | 选 | 标识 |
|---------|-----|------|
| 选项含副描述（套餐 / 角色 / 计费方案） | `.radio-card` | D · L2 |
| 2-4 个互斥状态 + 强切换感（视图切换 / 周期切换） | `.radio-segmented` | C · L2 |
| 横排紧凑 / 筛选条件 / 标签类 | `.radio-pill` | B · L2 |
| 其他所有场景（默认 90%） | `.radio-circle` | A · L1 |

**默认（不确定时）**：`.radio-circle`

**反模式 ❌**：
- 直接用 EP 默认 `<el-radio>`（视觉漂移最严重）

---

## ⑦ 弹层操作：Modal vs Drawer vs Popconfirm

**决策问**：操作复杂度（字段数）+ 焦点级别（是否需要上下文）？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| ≤ 2 字段 / 一句话确认（"确定删除？"） | **Popconfirm** (L2，inline 浮层) | `components/L2/popconfirm.html` |
| 中等表单（3-6 字段）/ 详情查看 / 焦点对话 | **Modal** (L2，居中遮罩) | `components/L2/modal.html` |
| 大表单（≥ 7 字段）/ 多步操作 / 详情编辑 / 需要保留主页面上下文 | **Drawer** (L2，侧抽) | `components/L2/drawer.html` |

**默认（不确定时）**：`Modal` —— 中等焦点最常用

**⚠ 宽度规则**：

- **REQ 明文宽度优先**：如果 REQ 写"宽度：480px"，**必须**用 480px，**禁止**根据字段数自由发挥成 620px / 720px
- REQ 没明文 → 默认值：
  - Modal：520px（3-6 字段标准）/ 640px（含表格 / 复杂内容）
  - Drawer：480px（≤ 7 字段）/ 560px（中等）/ 640px（多步骤 / 详情）
  - Popconfirm：自适应（无固定宽度）

**反模式 ❌**：
- 大表单（10+ 字段）用 Modal → 撑爆视口，应改 Drawer
- 简单确认用 Modal → 操作步骤过多，应改 Popconfirm
- 表格删除按钮直接用 Modal → 应该用 Popconfirm 在行内确认
- 详情编辑用 Modal → 用户失去对原数据的上下文，应改 Drawer
- ⛔ **REQ 明文宽度被 AI 改了** → AI 不得擅自调整 REQ 明文给的尺寸 / 颜色 / 文案

---

## ⑧ 容器：CardBox vs KvCard vs DetailSection

**决策问**：要在容器里放什么内容？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 键值对列表（label-value 行 × N，无趋势 / 无大数字） | **KvCard** (L1) | `components/L1/kv-card.html` |
| 详情页 section 容器（标题 + 操作 + 自由内容） | **DetailSection** (L1) | `components/L1/detail-section.html` |
| 通用面板（可选标题区 + 自由内容，列表页 / 设置页内分组） | **CardBox** (L1) | `components/L1/card-box.html` |

**默认（不确定时）**：`CardBox` —— 最通用，可以包任何内容

**反模式 ❌**：
- 详情页元数据用 CardBox（应该用 KvCard，KvCard 自带 label/value 对齐）
- 列表内容分块用 DetailSection（应该用 CardBox，DetailSection 是详情页专用）
- 表单分组用 CardBox（应该用 `.form-group`，CardBox 没有表单 layout）

---

## ⑨ 表单字段输入类型

**决策问**：字段的数据类型 / 取值范围？

| 触发条件 | 选 | 备注 |
|---------|-----|------|
| 短文本（≤ 100 字） | `<el-input>` | 必须包在 FormModern + form-group 里 |
| 长文本 / 多行 | `<el-input type="textarea">` | rows 自适应或固定 |
| 数字 + 加减按钮 | `<el-input-number>` | 严格数值约束（min/max/step） |
| **单选**（任意场景） | **RadioVariants** | 必走 TREE-⑥ 选 4 variant 之一，禁止 EP 默认 |
| 多选枚举（≤ 5 项） | `<el-checkbox>` 平铺 | |
| 多选枚举（> 5 项） | `<el-checkbox>` + scroll 或 `<el-select multiple>` | |
| 单选枚举（> 8 项 / 大量选项） | `<el-select>` | 含搜索时 filterable |
| 级联枚举（如省/市/区） | `<el-cascader>` | |
| 日期 / 时间 | `<el-date-picker>` / `<el-time-picker>` | |
| **多语言同字段**（套餐名 / 介绍 / 政策标题） | **I18nField** (L2) | L1 铁律：禁止自己拼"中/英"双框 |
| 文件 / 图片上传 | **Upload** (L2) | 拖拽 drop-zone + 进度条 |
| 颜色选择 | `<el-color-picker>` | 罕见，运营页可能用 |
| 富文本 | （DS 暂无，需 L3） | TipTap / Quill 等第三方 |

**默认（不确定时）**：`<el-input>` —— 90% 字段都是短文本

**反模式 ❌**：
- 单选用 EP 默认 `<el-radio>`（绝对禁止，必走 RadioVariants）
- 多语言字段拼两个 input（必须 I18nField）
- "类型/分类"用 input 让用户填字符串（应该用 el-select 提供枚举）
- 数字用 el-input + 校验（应该用 el-input-number）

---

## ⑩ 状态显示：EmptyState vs Loading vs Alert

**决策问**：当前页面是什么"非主流"状态？

| 触发条件 | 选 | 文件 |
|---------|-----|------|
| 数据加载中（spinner + 文案） | **Loading** (L2) | `components/L2/loading.html` |
| 加载完但无数据 / 搜索无结果 / 首次使用 | **EmptyState** (L1) | `components/L1/empty-state.html` |
| 整行警示 / 错误 / 警告 / 信息 + 可选操作 | **Alert** (L1) | `components/L1/alert.html` |
| 局部状态点（行内一个状态码） | **StatusBadge** (L1) | `components/L1/status-badge.html` |
| 分类 / 类型标记（不带状态语义） | **Tag** (L1) | `components/L1/tag.html` |

**默认（不确定时）**：
- 列表 / 表格无数据 → `EmptyState`
- 整体加载 → `Loading`
- 错误反馈 → `Alert type="error"`

**反模式 ❌**：
- 加载中用 EmptyState（用户以为"真没数据"，应该用 Loading 表示"等等")
- 配额超限用 Tag / StatusBadge（情况严重应整行 Alert 提示）
- 单个状态用 Alert（占行太重，应该用 StatusBadge）
- "状态"用 Tag（Tag 是分类不是状态，应该用 StatusBadge）

---

## ⑪ Dashboard 页型决策（v6.9.1 引入 · 在 Layer 0 之前先问一次）

**决策问**：要生成的是**大盘 / 监控 / 概览数字砌墙**类页面吗？

| 触发条件（任一命中即可） | 选 | 文件 / 章节 |
|---|---|---|
| 用户 brief 里有 "dashboard / 大盘 / 监控 / overview / analytics / 看板" | **Dashboard 章节** | `design-system/AI-USAGE.md §11` |
| 主体由 ≥ 3 个 KPI / 图表块 grid 组成 | **Dashboard 章节** | 同上 |
| 含时间范围筛选 + 多 section 切片视觉 | **Dashboard 章节** | 同上 |
| 含 chart（line / area / bar / donut / gauge）作为主信息载体 | **Dashboard 章节** | 同上 |
| 列表 / 详情 / 表单为主 → ❌ **不是 dashboard** | 回 Layer 0 ⓪ 走老路 | — |

**默认（不确定时）**：当 ≥ 2 个触发条件命中时按 dashboard 走，否则回 Layer 0 决策。

**dashboard 命中后**：**Read `design-system/dashboard.md`（完整契约 ~5k token）+ cp `partials/dashboard.partial.html` 进 `<main>`**。子流程概要：
- §11.1 判轻量 overview（→ overview-page.partial 老路）还是监控大盘（→ 本路径）
- §11.2-11.3 section 切片数（1-4 个 `.ds-section`，header 必带）+ filter row 取舍
- §11.4 KPI 档位：小档 `.ds-stat-card`（28px + delta）/ 巨档 `.ds-ov-card`（44px hero），不混用
- §11.6 chart family 5 种（line / area / bar / donut / gauge）—— Gauge 几何抄 dashboard.md 查表
- §11.7 装饰复用：header 警示 → PageHeader statusLabel；表格状态 → StatusBadge（树 ④）；7d/30d → `.tabs-segmented`

**反模式 ❌**：
- 命中 dashboard 但仍走 Layer 0 ⓪ StandardListPage → 用错"列表 chrome" 包数字，节奏断
- KPI 套 KPI（`.ds-stat-card` 内嵌 `.ds-ov-card`）→ 违反信息架构 ③ 禁止套娃
- chart 区不用 `.ds-section` 包，直接平铺 → 失去 dashboard "切片" 视觉识别
- dashboard 也按 list page "外壳克制" 处理 `.ds-section-header` 的 border-bottom → 错；section-header 的 border 是分隔器豁免

---

## 决策树 ROI 速查（AI 自检用）

每次选完组件后心智复核：

- [ ] 组件 vs 数据特性匹配（不是"看着差不多"）
- [ ] 不在反模式清单里
- [ ] 同类决策树里**已经选过的**组件能复用（一个页面里 Modal + Drawer + Popconfirm 同时上 = 失败）
- [ ] 默认选项触发条件不确定时优先选默认，不要发明 L3

---

## 升级路径

新增 / 废弃决策树是 skill owner 私有工作流，AI 不参与。
