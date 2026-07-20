# AGIOne Design System · Component Catalog

> AI 组件选型索引（v3.12，按意图分组）。
> Owner-maintained，自动生成。AI / 同事**不要手改本文件**。

## 📖 AI 使用本 catalog 的规则

1. **先按意图桶定位** → 找到组件需求所在的章节
2. **看类型列**决定**怎么写**这个组件：
   - `runtime-component` → 用 PascalCase 标签并显式闭合：`<HeaderBox title="..."></HeaderBox>`
   - `css-pattern` → 用 div 包裹给 DOM 片段：`<div class="form-modern" data-component="form-modern"><el-form>...</el-form></div>`（DOM 骨架见 api-cheatsheet.md）
   - `element-plus` → 用 EP 原生标签：`<el-button type="primary">`
   - `template-partial` → 复制 partials/X.partial.html 内容到 `<main>` 内（不复制 `<html>` / chrome）
   - `reference-only` → 不直接用，只查阅 token / 词汇
3. **看信号列**决定**要不要 Read 组件文件**：
   - `STOP` → 直接用，**禁止 Read 单组件文件**（catalog 行已足够）
   - `TREE-N` → 必须先 Read `selection-rules.md` 第 N 棵决策树才能选
   - `READ` → 罕见特殊场景，允许 Read 该组件文件查实现细节
4. **看注意混淆列** → 在最终选定前再确认一遍
5. **绝对禁止**：Read `agione-design-system.html`（458KB / 150k token）

_Last build: 2026-05-15 14:36:35_

## 🎨 Foundations · 视觉基础

> 类型 `reference-only` —— 不直接用，只查 token / 字型 / Badge 词汇。共享规则已汇总在 `references/base-spec.md`；只有需要精确词汇或视觉真值时才 Read 对应 foundation。

| 基础 | 用途 | 文件 |
|------|------|------|
| Badge Vocabulary | Tag 或 StatusBadge 选词时**必须**遵守此词汇表，避免文案漂移 | `design-system/foundations/badge-vocab.html` |
| Colors | AI 引用某颜色 token 时（如 --ui-color-primary） | `design-system/foundations/colors.html` |
| Icons | 所有 icon 尺寸用 --ui-icon-* token；图标库 Lucide UMD | `design-system/foundations/icons.html` |
| Motion Library | 页面 / 组件出场或交互动画 | `design-system/foundations/motion-library.html` |
| Motion | 所有 transition / animation 必须用 --ui-duration-* / --ui-ease-* token | `design-system/foundations/motion.html` |
| Radius | 所有 border-radius 必须用 --ui-radius-* token | `design-system/foundations/radius.html` |
| Page Rhythm | 页面构图 / Section 间距时遵守 | `design-system/foundations/rhythm.html` |
| Shadow | 所有 box-shadow 必须用 --ui-shadow-* token | `design-system/foundations/shadow.html` |
| Spacing | 所有 padding / gap / margin 必须用 --ui-space-* token | `design-system/foundations/spacing.html` |
| Typography | L1 铁律 — 禁止在 HTML 上手写 font-size / weight / line-height / family | `design-system/foundations/typography.html` |
| Z-index | 所有 z-index 必须用 --ui-z-* token | `design-system/foundations/z-index.html` |

## 🎯 按意图选组件（v3.12）

### 列表展示

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| DataTable | `runtime-component` | ≥ 6 字段; 需排序筛选; 操作列固定 fixed=right | `TREE-①` | ListCardItem | `design-system/components/L1/data-table.html` |
| ListCardItem | `css-pattern` | 3-5 字段; 含视觉资产（logo / icon / avatar）; 卡片间距感 | `TREE-①` | DataTable | `design-system/components/L2/list-card-item.html` |

### 数据指标

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| KpiCard | `runtime-component` | 单一数值（金额/计数/百分比）; 可选趋势方向; 可选状态色变体 | `TREE-③` | MetricsStrip, KvCard | `design-system/components/L1/kpi-card.html` |
| UsageBar | `runtime-component` | 百分比; 数值 + 上限; 自动阈值配色（库内固化） | `STOP` | — | `design-system/components/L1/usage-bar.html` |
| MetricsStrip | `runtime-component` | 横排紧凑; 无大数字突出; 适合 5-8 指标 | `TREE-③` | KpiCard, KvCard | `design-system/components/L2/metrics-strip.html` |

### 页面头部

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| HeaderBox | `runtime-component` | 页面顶部; 标题 + 操作; 可选 content 区放筛选 | `TREE-②` | PageHeader, HeroBand | `design-system/components/L1/header-box.html` |
| HeroBand | `runtime-component` | 大字号 hero; 装饰渐变; 营销视觉权重 | `TREE-②` | HeaderBox, PageHeader | `design-system/components/L2/hero-band.html` |
| PageHeader | `runtime-component` | 面包屑 + title + meta + 右操作; 通常后接 Tabs | `TREE-②` | HeaderBox, HeroBand | `design-system/components/L2/page-header.html` |

### 表单

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| FormControls | `css-pattern` | Form 内嵌特殊控件; 风格对齐 .form-modern | `READ` | — | `design-system/components/L2/form-controls.html` |
| FormModern | `css-pattern` | 任何含 el-form 的表单; label 顶部对齐; 40px 输入框; ring focus; ⚠ icon 错误 | `STOP` | — | `design-system/components/L2/form-modern.html` |
| Form | `element-plus` | 字段集合; 验证规则; 提交按钮区 | `STOP` | — | `design-system/components/L2/form.html` |
| I18nField | `runtime-component` | 同一字段多语言; Tabs 切换; 完成度圆点 | `TREE-⑨` | — | `design-system/components/L2/i18n-field.html` |
| RadioVariants | `css-pattern` | 四种单选视觉；按选项内容与密度选择 | `TREE-⑥` | — | `design-system/components/L2/radio-variants.html` |
| Upload | `element-plus` | 拖拽 drop-zone; 进度条; 文件列表 | `TREE-⑨` | — | `design-system/components/L2/upload.html` |

### 反馈

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| Alert | `runtime-component` | 整行宽度; 左侧色块; 可选 icon / desc / 关闭 / 操作按钮 | `TREE-⑩` | Tag, StatusBadge | `design-system/components/L1/alert.html` |
| EmptyState | `runtime-component` | 居中布局; icon + title + hint + 可选 CTA | `TREE-⑩` | Loading, Alert | `design-system/components/L1/empty-state.html` |
| StatusBadge | `runtime-component` | 单状态码; 圆点 + 文字; 颜色 = 状态语义 | `TREE-④` | Tag, Alert | `design-system/components/L1/status-badge.html` |
| Tag | `runtime-component` | 短文本标签; 可多个共存; 可选颜色调；无状态语义 | `TREE-④` | StatusBadge | `design-system/components/L1/tag.html` |
| Loading | `element-plus` | 短时阻塞; spinner + 文字; 可指令式调用 | `TREE-⑩` | EmptyState | `design-system/components/L2/loading.html` |

### 弹层

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| Drawer | `element-plus` | 右侧抽屉; 宽度灵活; 保留主页面可见 | `TREE-⑦` | Modal, Popconfirm | `design-system/components/L2/drawer.html` |
| Modal | `element-plus` | 居中; ≤ 600px 宽; 遮罩中断 | `TREE-⑦` | Drawer, Popconfirm | `design-system/components/L2/modal.html` |
| Popconfirm | `element-plus` | inline 浮出; 极简确认; 不打断主上下文 | `TREE-⑦` | Modal, Tooltip | `design-system/components/L2/popconfirm.html` |
| Tooltip | `element-plus` | hover 触发; 短文本; 不打断操作 | `STOP` | Popconfirm | `design-system/components/L2/tooltip.html` |

### 流程

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| Tabs | `runtime-component` | 并列内容; 无完成度概念; 用户自由切换 | `TREE-⑤` | Stepper, StepPills | `design-system/components/L1/tabs.html` |
| StepPills | `runtime-component` | 紧凑横排; 当前步高亮; 步骤可跳 | `TREE-⑤` | Stepper, Tabs | `design-system/components/L2/step-pills.html` |
| Stepper | `element-plus` | 串行步骤; 完成态/当前态/未来态; 显示步骤号 | `TREE-⑤` | StepPills, Tabs | `design-system/components/L2/stepper.html` |

### 容器

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| CardBox | `runtime-component` | 可选 head（标题 + 操作）; 可选 body 内边距 | `TREE-⑧` | KvCard, DetailSection | `design-system/components/L1/card-box.html` |
| DetailSection | `runtime-component` | 详情页中的内容分块单元; 标题左 + 操作右 | `TREE-⑧` | CardBox, KvCard | `design-system/components/L1/detail-section.html` |
| KvCard | `runtime-component` | label-value 行列表; 文本为主; 无数字突出 | `TREE-⑧` | CardBox, DetailSection, KpiCard | `design-system/components/L1/kv-card.html` |

### 基础原子

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| Avatar | `runtime-component` | 圆形 / 方形; 多种尺寸; 图片或首字母 | `STOP` | — | `design-system/components/L1/avatar.html` |
| Button | `element-plus` | primary 主色; default 描边; text 无背景; danger 红 | `STOP` | — | `design-system/components/L1/button.html` |

### 导航

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| Breadcrumb | `runtime-component` | 层级路径; 可点击跳转; 当前页面非链接 | `STOP` | — | `design-system/components/L1/breadcrumb.html` |

### 列表配件

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| FilterBox | `runtime-component` | 横排筛选项; 右侧搜索 / 重置; 含 selection 变体（批量操作） | `STOP` | — | `design-system/components/L1/filter-box.html` |
| TableActions | `runtime-component` | ≤ 3 个主操作 inline; 更多走 dropdown | `STOP` | — | `design-system/components/L1/table-actions.html` |

### 页面模板

| 组件 | 类型 | 数据特性 | 信号 | ⚠ 注意混淆 | 文件 |
|------|------|---------|------|-----------|------|
| DetailPage | `runtime-component` | 详情页骨架; 整页布局; 含滚动管理 | `STOP` | — | `design-system/components/L2/detail-page.html` |
| MainBox | `css-pattern` | 全高度根容器; 强制 flex 列布局 | `STOP` | — | `design-system/components/L2/main-box.html` |
| StandardListPage | `template-partial` | MainBox 根 + HeaderBox 顶部 + ScrollBox 滚动区 + FilterBox + DataTable | `STOP` | — | `design-system/components/templates/pattern-list.html` |
| OverviewPage | `template-partial` | 顶部 KPI 网格 + 多个分析卡片块 | `STOP` | — | `design-system/components/templates/pattern-overview.html` |
