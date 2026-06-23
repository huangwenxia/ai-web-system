# §11 Dashboard 大盘契约（v6.9 完整版 · 按需加载）

> **加载时机**：决策树 ⑪（`selection-rules.md`）命中 dashboard 页型时 Read 本文件。
> 非 dashboard 任务**不要加载**（~5k token，按需经济）。
> **配套资产**：
> - 骨架 partial：`partials/dashboard.partial.html`（cp 进 `<main>`，5 种 chart 全示范）
> - chrome CSS：shell-sample 自带全部 `.ds-*` class（17 骨架/KPI + chart 系 + 装饰）
> - 字号：`.type-hero-data` (44px) / `.type-kpi` (28px) 已在 shell-sample `.type-*` 体系
> **本文件结构**：§11.1 何时用 → §11.2 信息架构 → §11.3 section → §11.4 KPI 两档 →
> §11.5 跟老约束协调 → §11.6 chart family 5 模板（含 Gauge 查表）→ §11.7 装饰与复用 →
> §11.8 反例 → §11.9 工作流 + 自检

---

## §11.1 何时用

走 `selection-rules.md ⑪` 决策树。简化口诀（任一命中即走本章）：

| 触发条件 | 走 §11 |
|---|---|
| brief 里有 "dashboard / 大盘 / 监控 / overview / analytics / 看板" | ✅ |
| 主体由 ≥ 3 个 KPI / 图表块 grid 组成 | ✅ |
| 含时间范围筛选 + 多 section 切片视觉 | ✅ |
| 列表 / 详情 / 表单为主 | ❌ 回 Layer 0 ⓪ |

**轻量 overview vs 监控大盘**：
- 轻量 overview（KPI + 营销引导 + 少量内容卡）→ `partials/overview-page.partial.html`（KpiCard + CardBox 老路）
- 监控大盘 / analytics（chart 为主信息载体 + section 切片）→ **本章** + `partials/dashboard.partial.html`

## §11.2 Dashboard 5 层信息架构

```
Layer 0: chrome（TopNav + Sidebar + 圆角 body 16px · 复用现有，不动）
Layer 1: PageHeader（title + 可选 statusLabel 警示 pill + actions）
Layer 2: Filter row（4 列 .ds-filter-row，可选）
Layer 3: Section 切片（.ds-section + .ds-section-header）—— dashboard 信息架构第一公民
Layer 4: Section 内 grid（.ds-overview-grid 3 列 / .ds-stats-row 4 列 / .ds-chart-grid 2 列）
Layer 5: Card（.ds-ov-card / .ds-stat-card / .ds-chart-card / .ds-detail-rows）
```

## §11.3 Section 骨架契约

每个 section 必有 `.ds-section-header`（icon + title + pill + collapse chevron）：

```html
<section class="ds-section">
  <div class="ds-section-header">
    <div class="ds-section-header__l">
      <div class="ds-section-icon"><i data-lucide="layout-dashboard"></i></div>
      <h2 class="type-h3 ds-section-title">{{ t.dashSec1Title }}</h2>
      <span class="type-caption ds-section-pill">3 Panel</span>
    </div>
    <div class="ds-section-header__r"><i data-lucide="chevron-up"></i></div>
  </div>
  <!-- section 内 grid + card -->
</section>
```

**约定**：
- `.ds-section-header` 的 `border-bottom` 是**分隔器**，豁免 v6.7 外壳克制（audit-borders.sh 已白名单）
- section-pill "N Panel" 提示 section 内卡片数（Grafana 习俗）
- chevron-up 是折叠视觉提示，原型不需要真功能

## §11.4 KPI 两档对照（28 vs 44）

| 档 | class | 字号 | 适用 grid | 内部结构 |
|---|---|---|---|---|
| **小档** | `.ds-stat-card` | `.type-kpi` (28px Mono) | `.ds-stats-row` (4 列) | icon-pill 32×32 + title + value + **delta 三段式**（trend icon + % + `{{ t.dashDeltaVs }}`） |
| **巨档** | `.ds-ov-card` | `.type-hero-data` (44px Mono) | `.ds-overview-grid` (3 列) | dot-icon 24×24 + title + 巨数字 + hint |

- 小档 = SaaS analytics 风（多指标横排 + delta 对比）；巨档 = Ops monitoring 风（≤ 3 个 hero 数字"砸"出来）
- 语义色：`.ds-ov-value--success / --danger / --primary`；`.ds-ov-dot--success / --danger / --primary`
- **不混用**：同一 grid 里不要小档大档混排；巨档不加 delta 三段式（次要信息走 hint）

## §11.5 跟现有约束的协调

| 老约束 | dashboard 适用情况 |
|---|---|
| 信息架构 ① KpiCard ≤ 3 | ov-card 仍守 ≤ 3；stat-card 可 4（grid 4 列）|
| 信息架构 ② 视觉焦点 ≤ 1 | 大盘允许"4 KPI + 1 主图"平铺（焦点在主图）|
| 信息架构 ③ 禁止套娃 | stat-card 不嵌 ov-card，chart-card 不嵌 KPI 卡 |
| 信息架构 ④ 副标题一律禁用（v6.9.3）| PageHeader 只传 title + statusLabel，**无 subtitle**；口径/时间窗信息进卡内说明 |
| 信息架构 ⑤ FilterBox 不 wrap CardBox | dashboard 用 `.ds-filter-row`（不是 FilterBox），规则不适用 |
| 默认克制 ① 四段韵律只用 hero 区 | dashboard 页头不走四段韵律 |
| 默认克制 ② 外壳沿边 ≤ 1 | `.ds-section-header` border-bottom 豁免；其余卡守 ≤ 1 |
| Chrome 字号豁免 | `.ds-*` 前缀整族豁免（audit-typography 已实现）|
| Layer A .type-* 12 个 | `.type-hero-data` 是第 12 个 |
| 数据表 ⊂ 卡片（如大盘含明细表）| 走 AI-USAGE §②.1「双线重合防治」——首选 `.data-table`/`<DataTable>`；手搓 `<table>` 必须卡片 `overflow:hidden` + 表格 `border:none` + `border-collapse:collapse` |

## §11.6 Chart Family 5 模板

> **总纪律**：全部 inline SVG / 纯 CSS。**禁止 chart.js / d3 / echarts / 任何图表库**
> （chrome-mandatory 约定，v3.x 起适用全 skill）。颜色一律 `var(--ui-color-*)` token。

### §11.6.1 LineChart / AreaChart

**容器**：`.ds-chart-body`（y-axis 左 + plot 中）→ `.ds-x-axis` → `.ds-legend-row`
**SVG**：`viewBox="0 0 600 230"` + `preserveAspectRatio="none"`（占满 plot）

```html
<svg viewBox="0 0 600 230" preserveAspectRatio="none">
  <!-- Area 填充（可选）：stroke path + 底边闭合，fill-opacity 0.15 -->
  <path d="M 0 105 L 85 60 ... L 600 25 L 600 230 L 0 230 Z"
        fill="var(--ui-color-success)" fill-opacity="0.15"/>
  <!-- 主线 -->
  <path d="M 0 105 L 85 60 ... L 600 25"
        fill="none" stroke="var(--ui-color-success)" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
</svg>
```

**path 数学**（N 个数据点 → 坐标）：
```
x_i = i / (N-1) × 600
y_i = 10 + (1 - value_i / maxValue) × 210    # 上下各留 10 边距
```

**硬性细节**：
- `vector-effect="non-scaling-stroke"` **必加**——否则 preserveAspectRatio="none" 会把线粗拉变形
- 双线对比：主线带 area 填充，次线只 stroke；色用 success/warning 或 primary/info 对
- 网格线用 `.ds-plot-grid-line`（HTML div，top:25%/50%/75%），不画进 SVG

### §11.6.2 BarChart（纯 CSS，无 SVG）

单色 + **opacity 渐变档**表达排序（不要硬编码 alpha hex 颜色——token 纪律）：

```html
<div class="ds-bar-area">
  <div class="ds-bar-col">
    <span class="ds-bar-val">2.4M</span>
    <div class="ds-bar-rect" style="height:150px; opacity:1;"></div>
  </div>
  <!-- 后续列 opacity 依次 0.86 / 0.72 / 0.58 / 0.44 / 0.30 / 0.16（每档 -0.14）-->
</div>
```

- 高度：`height_px = value / maxValue × 150`（bar-body 高 180，留 30 给数字+gap）
- `.ds-bar-rect` 底色固定 `var(--ui-color-primary)`，**只改 opacity 不改色**
- x 轴标签 `.ds-bar-x-label` 自带 ellipsis 防溢出

### §11.6.3 DonutChart

**几何**：circle `r=56`，周长 `2π×56 ≈ 351.86`；`transform="rotate(-90 80 80)"` 让起点从 12 点钟开始。

```
每段 stroke-dasharray = "<segLen> 351.86"，segLen = pct × 351.86
每段 stroke-dashoffset = -（之前所有段的累积 segLen）
```

**示例（60% / 30% / 10%）**：

```html
<svg viewBox="0 0 160 160">
  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--ui-bg-muted)" stroke-width="32"/>
  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--ui-color-primary)" stroke-width="32"
    stroke-dasharray="211.12 351.86" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>
  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--ui-color-info)" stroke-width="32"
    stroke-dasharray="105.56 351.86" stroke-dashoffset="-211.12" transform="rotate(-90 80 80)"/>
  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--ui-color-success)" stroke-width="32"
    stroke-dasharray="35.19 351.86" stroke-dashoffset="-316.68" transform="rotate(-90 80 80)"/>
</svg>
```

中心数字：`.ds-donut-center`（absolute overlay，num 22px Mono + label caption）。
段色顺序约定：primary → info → success → warning（按占比降序）。

### §11.6.4 GaugeChart（270° 弧 · ⚠️ 查表用，别自己推几何）

**几何契约**（所有 gauge 统一）：
- viewBox `0 0 100 100`，`preserveAspectRatio="xMidYMid meet"`（**不是** none）
- 弧：圆心 **(50, 50)**，半径 **40**，从 135°（左下）顺时针扫 270° 到 45°（右下）
- track 固定：`M 21.72 78.28 A 40 40 0 1 1 78.28 78.28` + `stroke="var(--ui-bg-muted)" stroke-width="11"`
- 指针：pivot **(50, 70)**（视觉下移，跟弧心不重合是有意的），`<line>` + 双圆
- 颜色阈值：0-50% success / 50-80% warning / 80-100% danger（warning 或 destructive 视语义）

**fill path 公式**（任意 pct）：
```
φ = 135° + 270° × pct          （屏幕坐标角，y 向下为正）
终点 x = 50 + 40·cos(φ)
终点 y = 50 + 40·sin(φ)
large-arc = pct > 2/3 ? 1 : 0   sweep = 1
d = "M 21.72 78.28 A 40 40 0 {large} 1 {x} {y}"
针尖（line x2,y2）= 半径换 34.5：x = 50 + 34.5·cos(φ)，y = 50 + 34.5·sin(φ)
```

**⚠️ 查表优先（已预计算，AI 直接抄，禁止心算三角函数）**：

| pct | fill path `d` | 针尖 line `x2,y2` |
|---|---|---|
| 5%  | `M 21.72 78.28 A 40 40 0 0 1 15.89 70.90` | `20.58, 68.03` |
| 10% | `M 21.72 78.28 A 40 40 0 0 1 11.96 62.36` | `17.19, 60.66` |
| 20% | `M 21.72 78.28 A 40 40 0 0 1 10.49 43.74` | `15.92, 44.60` |
| 25% | `M 21.72 78.28 A 40 40 0 0 1 13.04 34.69` | `18.13, 36.80` |
| 30% | `M 21.72 78.28 A 40 40 0 0 1 17.64 26.49` | `22.09, 29.72` |
| 40% | `M 21.72 78.28 A 40 40 0 0 1 31.84 14.36` | `34.34, 19.26` |
| 50% | `M 21.72 78.28 A 40 40 0 0 1 50.00 10.00` | `50.00, 15.50` |
| 60% | `M 21.72 78.28 A 40 40 0 0 1 68.16 14.36` | `65.66, 19.26` |
| 70% | `M 21.72 78.28 A 40 40 0 1 1 82.36 26.49` | `77.91, 29.72` |
| 75% | `M 21.72 78.28 A 40 40 0 1 1 86.96 34.69` | `81.87, 36.80` |
| 80% | `M 21.72 78.28 A 40 40 0 1 1 89.51 43.74` | `84.08, 44.60` |
| 90% | `M 21.72 78.28 A 40 40 0 1 1 88.04 62.36` | `82.81, 60.66` |
| 95% | `M 21.72 78.28 A 40 40 0 1 1 84.11 70.90` | `79.42, 68.03` |

零碎 pct（如 94.6%）：取最近档（95%）或用公式代入；**差 1-2° 视觉无感知，优先抄表**。

**完整 gauge 模板**（94.6% ≈ 95% 档示范）：

```html
<div class="ds-gauge">
  <div class="ds-gauge-svg">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <path d="M 21.72 78.28 A 40 40 0 1 1 78.28 78.28" fill="none" stroke="var(--ui-bg-muted)" stroke-width="11"/>
      <path d="M 21.72 78.28 A 40 40 0 1 1 84.11 70.90" fill="none" stroke="var(--ui-color-warning)" stroke-width="11"/>
      <line x1="50" y1="70" x2="79.42" y2="68.03" stroke="var(--ui-text-primary)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="70" r="5" fill="var(--ui-text-primary)"/>
      <circle cx="50" cy="70" r="3" fill="var(--ui-color-warning)"/>
    </svg>
  </div>
  <div class="ds-gauge-value ds-gauge-value--warning">94.6%</div>
  <div class="ds-gauge-label">{{ t.dashGaugeAvg }}</div>
</div>
```

> 指针用 `<line stroke-width="3" linecap="round">`（生产设计稿是锥形 polygon，
> 原型 line 版视觉 95% 等价且 AI 零出错——这是有意的简化）。

### §11.6.5 empty-gauge（图表级空态）

数据源离线 / 无数据时**不是**放 EmptyState（那是整块页面空态），用 `.ds-empty-gauge`：

```html
<div class="ds-empty-gauge">
  <div class="ds-gauge-svg">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <path d="M 21.72 78.28 A 40 40 0 1 1 78.28 78.28" fill="none" stroke="var(--ui-bg-muted)" stroke-width="11"/>
      <line x1="50" y1="70" x2="50" y2="35.5" stroke="var(--ui-text-muted)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <circle cx="50" cy="70" r="5" fill="var(--ui-bg-card)" stroke="var(--ui-text-muted)" stroke-width="1.5" opacity="0.7"/>
    </svg>
  </div>
  <div class="ds-empty-dash"></div>
  <div class="ds-empty-caption">{{ t.dashEmptyCaption }}</div>
</div>
```

特征：track only（无 fill）+ 灰针垂直竖直（50%位）+ 短虚线 + caption。

## §11.7 装饰原语 — 复用优先，新造收口

**复用现有 chrome（不要新造重复物）**：

| 设计稿原语 | ❌ 不造 | ✅ 复用 |
|---|---|---|
| header 区 "13 alerts active" 警示 pill | ~~ds-alert-badge~~ | **PageHeader `statusLabel` + `statusColor="orange"`**（5 色 pill 已有）|
| 表格内 success/pending/failed 状态 | ~~ds-status-badge~~ | **StatusBadge**（决策树 ④，`.status-badge` + dot 已有）|
| chart 卡内 7d/30d 切换 | ~~ds-tab-toggle~~ | **`.tabs-segmented`**（2-3 项工具切换正是它的场景，v6.5 对比表）|

**dashboard 专属新原语（无现有等价物才造）**：

| 原语 | class | 用途 |
|---|---|---|
| type-badge | `.ds-type-badge` | chart 类型标记（"Time series"/"Gauge"/"Stat"/"Bar"/"Donut"），灰底+圆点，**每张 chart-card 必带** |
| size-badge | `.ds-size-badge` | Grafana 栅格尺寸（"12 x 8"），Mono 蓝底，推荐带 |
| detail-row | `.ds-detail-row` + `--warning/--success/--danger` | 阈值停留 KV 行（"Duration over 80%: 35s"）|
| empty-gauge | `.ds-empty-gauge` 系 | 图表级空态（§11.6.5）|
| pag | `.ds-pag` | chart 多组数据分页（"1/10"）|

## §11.8 Dashboard 反例（违反 = 重写该区块）

1. ❌ 命中决策树 ⑪ 仍按 StandardListPage chrome 走 → 列表壳包数字墙，节奏断
2. ❌ section 裸奔（无 `.ds-section-header` / 无 pill / 无 icon）→ 失去切片节奏
3. ❌ chart-card 无 `.ds-type-badge` → 看不出图表类型，跟 list page 卡混
4. ❌ 用 chart.js / d3 / echarts → 违反 chrome-mandatory，整页作废
5. ❌ KPI 两档混排同一 grid / 巨档加 delta 三段式 → §11.4 违反
6. ❌ 自造 alert-badge / status-badge / tab-toggle → §11.7 有复用路径
7. ❌ Gauge 自己心算三角函数写 path → 抄 §11.6.4 查表
8. ❌ SVG line 漏 `vector-effect="non-scaling-stroke"` → 线粗被拉变形
9. ❌ bar 用 alpha hex（`#5f4ecfdb`）→ 硬编码色违反 token 纪律，用 opacity
10. ❌ `.kpi-card`（v3.x 老 KPI）混进 dashboard → 用 `.ds-stat-card` / `.ds-ov-card`

## §11.9 工作流 + 自检

**生成流程**：
```bash
# 1. cp shell-sample（chrome 全量自带 .ds-* CSS）
cp <skill-dir>/agione-console-shell-sample-v1.html target.html
# 2. 决策树 ⑪ 命中 → Read 本文件 + partial
# 3. 把 partials/dashboard.partial.html 的 BEGIN~END 内容 Edit 进 <main>
#    （rg -n "AGIONE_EDIT_MAIN" target.html 定位）
# 4. 按 REQ 改 section 数 / KPI 档位 / chart 类型（删不需要的，保持 section 结构成对）
# 5. i18n key 增量写入（rg -n "AGIONE_EDIT_I18N" 定位，partial 尾注有完整 key 清单）
# 6. 自检（见下）
```

**Dashboard 5 项自检**（在全局 7 项自检之外加测）：
- [ ] 每个 section 有完整 `.ds-section-header`（icon + title + pill）
- [ ] 每张 chart-card 有 `.ds-type-badge`
- [ ] KPI 两档未混用；ov-card ≤ 3
- [ ] 所有 SVG 颜色走 `var(--ui-color-*)`；line 带 vector-effect；bar 用 opacity 不用 alpha hex
- [ ] `bash scripts/audit-borders.sh target.html` = 0 violations（ds-section-header 已白名单）
