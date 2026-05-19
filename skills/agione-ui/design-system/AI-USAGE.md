# AGIOne UI Skill · AI Usage Protocol

> **AI 必读**：本文件是 agione-ui skill 的简明使用契约。读完它（~1.5k token）+ catalog.md（~2k）+ api-cheatsheet.md（~1.5k）= 完整生成原型所需上下文。
> 
> 之所以独立成文：SKILL.md 主体约 30KB / 686 行，是给设计师/PM/Skill 维护者看的设计原理，AI 不需要读完。

---

## 任务输入形式

AI 会收到下述之一：

1. **`/agione-ui --from <path/to/prototype-X.md>`** — 从 PM 写好的原型说明生成（最常见）
2. **`/agione-ui <自由描述>`** — 单页面快速验证
3. **`/agione-ui --edit <existing.html> <修改描述>`** — 增量改已有原型

---

## 输出要求

单文件 HTML，浏览器直接打开可跑。**必须**通过下述工作流生成。

**⛔ 禁止自动调用 Playwright / Browser MCP / Chrome MCP 截图验证**（v4.1）

- 生成完原型后**不要**自动浏览器截图（单次 30-90s，绝大多数场景不需要）
- 默认验证已足够：`node --check`（JS 语法）+ `grep`（chip 位置 / token 残留 / Logo 长度）
- 浏览器视觉确认交给用户自己 open
- **唯一例外**：用户 prompt 含关键词 "playwright" / "截图" / "screenshot" / "视觉验证" / "看效果" 时才调用

---

## 🔥 4 层决策流（每生成一页都走一遍）

```
┌─ Layer 0 · 页面骨架  ────────────────────────────────────────┐
│ Read selection-rules.md § ⓪                                  │
│ 选定页面类型：list / detail / overview / wizard / 营销 / 其他 │
│ → list  → 把 partials/standard-list-page.partial.html 内容    │
│           塞进 cp 出来 shell-sample 的 <main> 内              │
│ → overview → 把 partials/overview-page.partial.html 内容塞进 │
│ → 其他   → 用 MainBox 或 DetailPage 自由组装                  │
│ ⚠️ 不要复制 components/templates/*.html（独立预览文档，复制 │
│   会导致 chrome 双重）—— 只复制 partials/*.partial.html 内层 │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer A · 硬规则（SKILL.md 加载即生效，无需 Read）─────────┐
│ 1. cp shell-sample-v1.html 起步，Edit 只改 <main>             │
│ 2. 所有 <el-form> 必须用 <div class="form-modern"> 包裹       │
│    （无 <el-form> 时此规则豁免）                              │
│ 3. 所有 Radio 必须用 RadioVariants 4 variant 之一             │
│    禁止 EP 默认 <el-radio>                                    │
│ 4. 多语言字段（同字段多语言填写）必须用 <I18nField>           │
│ 5. 字号必须用 .type-* class（h1/h2/h3/body/body-sm/caption/   │
│    data/table-header），禁止手写 font-size/weight/family/lh    │
│ 6. 颜色 / 圆角 / 阴影 / 间距 / 动效 / z-index / 图标尺寸      │
│    必须用 var(--*) token，禁止硬编码                          │
│ 7. 多状态 / 多角色页面必须实现 Scenario Switcher              │
│    （触发条件：≥ 3 个状态分支 / "演示" / "切换查看"等关键词） │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer B · catalog 按意图选组件 ──────────────────────────┐
│ Read design-system/catalog.md                              │
│ 1. 定位"意图桶"（12 个：列表展示/数据指标/页面头部/表单/  │
│    反馈/弹层/流程/容器/基础原子/导航/列表配件/页面模板）  │
│ 2. 看"信号"列：                                            │
│    - STOP   → 看 api-cheatsheet.md 该组件签名 → 直接用     │
│               **绝对禁止 Read 组件 HTML 文件**             │
│    - TREE-N → 跳 Layer C                                   │
│    - READ   → 罕见，允许 Read 该组件文件查实现细节        │
│ 3. 看"⚠ 注意混淆"列 → 最终选定前再确认一遍                │
│ 4. catalog 找不到合适组件 → 走 L3 自定义（见底部 L3 协议） │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer C · selection-rules 决策树 ──────────────────────────┐
│ 触发：catalog signal = TREE-N                                │
│ Read design-system/selection-rules.md § N                     │
│ 11 棵树覆盖 ⓪页面骨架 + ①-⑩ 组件多候选场景                  │
│ 走完树 → 终点组件 → 看 api-cheatsheet.md → 用                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 文件加载硬规则（Token 关键）

| 文件 | AI 何时 Read | 状态 |
|------|------------|------|
| `SKILL.md` | skill 加载时自动加载主体 | 已在上下文 |
| `design-system/AI-USAGE.md`（本文件） | 一次性 | ~1.5k token |
| `design-system/catalog.md` | 组件选型时 | ~2.5k token |
| `design-system/api-cheatsheet.md` | 选定组件后查 props 时 | ~1.5k token |
| `design-system/selection-rules.md` | signal=TREE-N 时 | ~4k token（部分章节） |
| `agione-console-shell-sample-v1.html` | **不 Read**，用 `cp` 复制 | — |
| **`agione-design-system.html`** | **绝对禁读** | 458KB / ~150k token |
| `design-system/components/**/*.html` | 仅 signal=READ 时 | ~2-3k token / 个 |
| `design-system/foundations/**/*.html` | 不 Read，规则已内联在本文件 | — |

**典型单页原型生成 input token 预算：~15-25k**（vs 旧方案 150k，降 6-10×）。

---

## 🎨 Foundations 内联规则（避免 AI Read 11 个 foundation 文件）

### Typography · 11 个 `.type-*` class（v3.12 P3.3 + v5.1 新增 .type-kpi）

| Class | 字族 | 字号 / 字重 / 行高 | 用途 |
|-------|------|-------------------|------|
| `.type-display` | Manrope | **40 / 800 / 1.15** / -0.5px tracking | dialog 价格 / 营销页 hero / 最大数字展示 |
| `.type-display-sm` | Manrope | **32 / 800 / 1.15** / -0.3px tracking | 较大数字 / 详情页主指标 |
| `.type-h1` | Manrope | 30 / 800 / 1.2 | 页面主标题 |
| `.type-kpi` | IBM Plex Mono | **28 / 700 / 1.2** / tabular-nums | **KPI 大数字 / 业务卡焦点数字（v5.1 新增，跟 .kpi-card__value 同值）** |
| `.type-h2` | Manrope | 20 / 700 / 1.4 | Section 标题 |
| `.type-h3` | Inter | 16 / 600 / 1.4 | 卡片 / 弹窗标题 |
| `.type-body` | Inter | 14 / 400 / 1.6 | 正文（默认） |
| `.type-body-sm` | Inter | 13 / 400 / 1.43 | 表格内容 / 次要描述 |
| `.type-caption` | Inter | 12 / 500 / 1.33 | 标签 / 辅助说明 / helper text |
| `.type-data` | IBM Plex Mono | 13 / 400 / 1.5 / tabular-nums | 数字 / 时间 / ID |
| `.type-table-header` | Inter | 11 / 600 / 1.4 / uppercase / 0.5px tracking | 表头 |

**禁止**：手写 `font-size` / `font-weight` / `line-height` / `font-family`。11 个 class 已覆盖 11-40px 全梯度，**业务区应该没有需要硬编码的场景**。

**例外**：仅 shell-sample 内置的 chrome class 豁免（见下节「Chrome 自带 class 字号豁免」完整清单）。

### 📋 REQ 描述词 → class 映射（AI 必查）

REQ 文档常用自然语言描述字号（"大号字 / 主信息 / 标题"），不会直接写 `.type-*`。AI 必须按下表映射：

| REQ 文档描述 | 对应 class | 典型场景 |
|------------|----------|---------|
| "巨数字 / 大号 hero 字 / 营销主标" | `.type-display` | 营销页 hero / 一次性大数字展示 |
| "主信息大号字 / 卡片中部主数字 / 视觉焦点数字" | `.type-display-sm` | 商品卡 Token 量 / 详情页主指标 / Dashboard 巨数字 |
| "页面主标题 / 一级标题" | `.type-h1` | HeaderBox / PageHeader 顶部 title |
| "Section 标题 / 区块标题" | `.type-h2` | 详情页章节 / Dashboard 卡片块标题 |
| "卡片标题 / 弹窗标题 / 小节标题" | `.type-h3` | KpiCard 标题 / Dialog 内分组标题 / SKU 卡套餐名 |
| "正文 / 描述" | `.type-body` | 段落 / hint / form helper |
| "表格内容 / 次要描述 / 行内副字" | `.type-body-sm` | DataTable 单元格 / 副信息 |
| "标签 / 辅助说明 / helper / 小字 / 单价 / 副字" | `.type-caption` | 字段说明 / 单价 / 时间戳 / muted 信息 |
| "数字 / 时间 / ID / 金额 / 代码片段" | `.type-data` | 等宽数字 + tabular-nums，金额对齐 |

**判别原则**：

- REQ 没写"大号"但实际是"卡片视觉焦点数字"（如商品卡 Token 量、Dashboard KPI 大数）→ `.type-display-sm` 起跳，绝不用 `.type-h3`
- REQ 说"显眼"且是价格 / 转化数字 → `.type-h1` + `color: var(--ui-color-primary)`
- REQ 说"灰色小字 / 辅助" → `.type-caption` + `color: var(--ui-text-muted)`
- 拿不准 → 看周围字号梯度：主数字必须比相邻文字大**至少 2 个 class 等级**（如主数字 display-sm 32px，相邻不能 ≥ h2 20px）

### Badge Vocabulary · 词汇锁定

| 业务状态 | 对应 badge color | 文案（中 / EN） |
|---------|-----------------|----------------|
| 运行中 / 启用 | `badge-green` | Active |
| 处理中 / 待审批 / 即将到期 | `badge-orange` | Pending / Expiring Soon |
| 停用 / 已撤销 / 过期 | `badge-muted` | Inactive / Revoked / Expired |
| 失败 / 错误 / 中断 | `badge-red` | Error / Failed |
| Provider 默认 | `badge-blue` | Hosted / Provider |
| 警告 / 提示（非错误） | `badge-yellow` | Notice / Warning |
| 强调 / 推荐 / 试用 | `badge-purple` | Recommended / Trial / Beta |
| 模型类型标签 | 词汇表：Conversation / Multi-Modal / Reasoning / Embedding / Image |

⛔ 禁止自己造 badge 颜色组合或文案变体。

### Token 命名与生产代码对齐（v4.0）

所有 token 使用 `--ui-*` 前缀，与生产项目 [`mamba-layout`](https://www.npmjs.com/package/mamba-layout) npm 包**完全一致**。原型代码内的 `var(--ui-*)` 引用可**直接粘贴**到 project-mamba 仓库，无需任何 rename。

### 间距 / 圆角 / 阴影 / 动效 / 图标 / z-index · token 名

- 间距：`--ui-space-xs`(4) / `--ui-space-sm`(8) / `--ui-space-md`(12) / `--ui-space-base`(16) / `--ui-space-lg`(20) / `--ui-space-xl`(24) / `--ui-space-2xl`(32) / `--ui-space-3xl`(48)
- 圆角：`--ui-radius-sm`(4) / `--ui-radius-md`(6) / `--ui-radius-lg`(8) / `--ui-radius-xl`(12) / `--ui-radius-2xl`(16) / `--ui-radius-pill`(∞)
- 阴影：`--ui-shadow-sm` / `--ui-shadow-md` / `--ui-shadow-lg` / `--ui-shadow-xl`
- 时长：`--ui-duration-fast`(150ms) / `--ui-duration-base`(250ms) / `--ui-duration-slow`(400ms)
- 缓动：`--ui-ease-out`(进入/hover) / `--ui-ease-in`(退出) / `--ui-ease-in-out`(切换) / `--ui-ease-spring`(强调反馈)
- 图标：`--ui-icon-xs`(12) / `--ui-icon-sm`(14) / `--ui-icon-base`(16) / `--ui-icon-md`(18) / `--ui-icon-lg`(20) / `--ui-icon-xl`(24) / `--ui-icon-2xl`(40) / `--ui-icon-3xl`(48)
- Z-index：`--ui-z-base`(1) / `--ui-z-dropdown`(100) / `--ui-z-sticky`(200) / `--ui-z-fixed`(300) / `--ui-z-overlay`(400) / `--ui-z-modal`(500) / `--ui-z-popover`(600) / `--ui-z-toast`(700) / `--ui-z-tooltip`(800)

**Lucide 图标 SVG 内联尺寸**：`width="14"` / `height="14"` 这类**应该**用 `style="width: var(--ui-icon-sm); height: var(--ui-icon-sm);"`，不是直接写字面数字。但 Vue 模板内通过 `:data-lucide="iconName"` + CSS class 控制是首选。

### `.type-data` 自带特性

`.type-data` 不仅是字号 / 字体，还自带 **`font-variant-numeric: tabular-nums`** —— 即等宽数字。**数字 / 时间 / ID / 金额**类内容必须用 `.type-data`，让 6 位数字纵向对齐。

---

## L3 自定义协议（catalog 找不到 / 决策树兜不住时）

适用场景：商品卡片 / SKU 网格 / 营销 hero / GPU 详情卡 / 规格选择卡 / 提交反馈卡 / 行业特定可视化等

### 业务自由 + 5 条底线（v4.2 加固）

**业务卡形状千变万化**（GPU 详情卡多分区 / 规格卡价格主导 / 成功反馈卡全屏 / Hero 横条…）—— **不强制套统一模板**。结构 / 子部件 / 布局由 AI 按业务自由设计。

但**任何自定义卡 / 自定义视觉元素都必须遵守 5 条底线**：

| # | 底线 | 检查方法 |
|---|------|---------|
| 1 | **token 化**：圆角 / 阴影 / padding / 颜色 / 间距 / 动效全用 `var(--ui-*)`，禁硬编码 hex / px（layout-only 例外见 §1.5） | `grep -E "border-radius:\s*[0-9]"` 应 = 0 |
| 2 | **字号走 `.type-*` class**：禁手写 `font-size` / `font-weight` / `font-family` / `line-height` | `<main>` 内 `font-size:` 应 = 0 |
| 3 | **同页同类卡字号一致**：列表 / 网格中**并列**的多张业务卡，标题字号必须**统一**。<br>❌ ModelCard 用 `.type-h3`、PlanCard 用 `.type-h2`（视觉错乱）<br>✅ 都用 `.type-h3` | 人审：列表卡标题字号应只有 1 种 |
| 4 | **视觉焦点数字用 `.type-display-sm`**：价格 / Token 量 / 主参数 / GPU VRAM 等"卡片中部最大数字" → `.type-display-sm`（32px Manrope 800），**不要**用 `.type-h1`（30px） | 人审：找出每个卡的最大数字字号 |
| 5 | **避免 inline style 堆叠**：单个 `<main>` 内**业务区** inline style 数量 > 50 处时考虑抽 `.<feature>-<part>` class 到 `<style>` 复用 | `awk '/<main/,/<\/main>/' \| grep -c "style="` 警戒 50 |

### 不约束的（业务自由）

| 维度 | 自由度 |
|------|-------|
| 卡片结构 / 行数 / 子部件 | ✅ 业务决定 |
| 卡片形状（标准 / 横条 / 多区 / 全屏 / 反馈）| ✅ 设计决定 |
| 特殊状态（active / readonly / disabled / selected）| ✅ 设计决定 |
| 是否用 `<CardBox>` 还是手写 `<article>` / `<div class="xxx-card">` | ✅ 看场景 — 标准卡用 CardBox 省事，特殊视觉允许手写自定义 class |

### class 命名规范

- L3 自定义 class 用 `<feature>-<part>` 格式，scoped 到当前页
  - 例：`.bp-sku` (Browse Plans SKU) / `.gpu-card-vram` / `.spec-total-card`
- BEM 修饰用 `.is-<state>`：`.frame-card.is-active.is-readonly` 或 `.flavor-card.is-disabled`
- 数据特性写入注释让设计师 review 后决定是否升级 L2
- 多次复用的视觉模式（≥ 3 处出现）→ 考虑反馈给 owner 升级到 L2 / shell-sample

**第三方品牌色例外**（v3.12 P1 闭环补）：
- 支付通道 / SSO Logo 等场景需要原厂品牌色（如 Alipay `#1677ff`、Stripe `#635bff`）
- **合规要求**：硬编码处加注释 `/* Alipay brand color, official #1677ff */` 标明来源
- **作用域**：仅限 `.po-channel__logo` 等 scoped 子类，不污染全局 token

---

## 信息架构与视觉节奏（v4.3 加固 · ⚠️ 最重要 — 防止"数字砌墙"）

> **核心命题**：组件守规则 ≠ 页面好看。AI 容易把所有数据都堆成 KpiCard 网格 → 页面变成"灰色块阵列"，无视觉焦点、无信息层级。
>
> 本节强制 **3 条硬约束 + 2 个推荐模式 + 业务 token 命名规范**，把 AI 从"砌墙工"提升到"有视觉判断的设计师"。

### 3 条硬约束（任何 dashboard / overview / 数据型页面都必须守）

#### ① KpiCard 上限 ≤ 3 个并列

| 指标数量 | 推荐组件 |
|---------|---------|
| 1 个 | **Hero**：display 字号大数字 + 上下文（不要 KpiCard）|
| 2-3 个 | `<KpiCard>` × 2-3 网格 |
| **4-6 个** | `<MetricsStrip>`（横向等分密集）/ 紧凑 K-V 列表 |
| 6-10 个 | `<KvCard>` 列表（label-value 行）|
| ≥ 10 个 / 带筛选排序 | `<DataTable>` 表格 |

❌ 错误：8 个 KpiCard 排成 `repeat(4, 1fr)` × 2 行（视觉砌墙）  
✅ 正确：1 hero + 3 KPI + 表格（视觉节奏）

#### ② 每个主 section 必须有 1 个"视觉焦点"

视觉焦点 ∈ {display 字号大数字 / Hero 卡组 / 主图表 / 主表格}

❌ 错误：全等权重卡片并列 ≥ 4 张（如 `[Card][Card][Card][Card]` 整齐排列）  
✅ 正确：`[Hero] → [辅卡组 ×3] → [详情区]` 有主次的节奏

#### ③ 禁止套娃

❌ 错误：`<CardBox>` 内嵌 `<KpiCard>` / `<CardBox>` 内嵌 `<CardBox>`  
✅ 正确：CardBox 是容器，里面直接放业务内容（表格 / 列表 / 图表 / 自定义 DOM），不要再嵌卡片

### 2 个推荐模式（高频场景）

#### 模式 1 · Dual / Multi-Hero（对比关系核心指标）

业务有"对比关系"（如 Credit vs Quota / Income vs Expense / Internal vs External / Used vs Available）时，**用 2-3 张并列大 Hero 卡**，**不要**拆成 4-6 个等权 KpiCard。

每张 Hero 卡含三段：

```html
<div class="ex-hero-card ex-hero-card--credit">
  <!-- ① head：icon + 标题 -->
  <div class="ex-hero-card__head">
    <i data-lucide="wallet"></i>
    <span class="type-h2" style="color: var(--biz-external-strong);">Credit</span>
  </div>
  <!-- ② primary：display 字号大数字（视觉焦点）-->
  <div class="ex-hero-card__primary">
    <span class="type-display-sm" style="color: var(--biz-external-strong);">¥12,543</span>
    <span class="type-body-sm" style="color: var(--ui-text-muted);">credit</span>
  </div>
  <!-- ③ breakdown：3 列小数据（上下文 / 趋势 / 时间）-->
  <div class="ex-hero-card__breakdown">
    <div><div class="type-caption">本月支出</div><div class="type-data">-8,234</div></div>
    <div><div class="type-caption">本月充值</div><div class="type-data">+5,000</div></div>
    <div><div class="type-caption">剩余天数</div><div class="type-data">12 天</div></div>
  </div>
</div>
```

**典型场景**：财务页 Credit + Quota / 资源页 已用 + 可用 / 订单页 收入 + 支出

#### 模式 2 · 业务语义 Token（vs 通用 primary 滥用）

业务有"对立 / 多层 / 分类"关系时，**必须定义 `--biz-<feature>-<role>-*` 业务 token**，不要全用 `--ui-color-primary`。

**命名规范**：
- 业务前缀：`--biz-` 或 `--<page-prefix>-tone-`（如 `--fin-`, `--ex-tone-`）
- 角色：业务语义（如 `internal` / `external` / `derived` / `inherited` / `pending`）
- 字段：`-strong`（实色）/ `-fg`（前景）/ `-bg`（背景）/ `-subtle`（弱色）

```css
:root {
  /* 财务页业务调色板 */
  --biz-internal-strong: var(--ui-color-primary);  /* 自家配额 */
  --biz-internal-fg:     var(--ui-color-primary);
  --biz-external-strong: var(--ui-color-success);  /* 客户付费 */
  --biz-external-fg:     var(--ui-color-success);
  --biz-derived-fg:      var(--ui-text-secondary); /* 派生 / 计算值 */
}
```

**为什么必须**：
- ✅ 双 Hero / Stacked bar / Layer bar 可以共享同一调色板 → 整页视觉协同
- ✅ Internal vs External 一眼区分（语义可读）
- ❌ 全 primary → 视觉单调，不知道哪个数字属于哪类业务

### 视觉节奏底线（自查清单）

生成完原型后用浏览器看一眼，对照：

- [ ] 每个 section 看得出"主角是谁"（视觉焦点存在）
- [ ] 没有 ≥ 4 张等权卡片并列堆叠
- [ ] 没有 4-column repeat KPI grid（除非 ≤ 3 个）
- [ ] CardBox 内没有嵌套其他 CardBox / KpiCard
- [ ] 业务对比关系有 tone 色区分（不是全 primary）

```bash
# Bash 辅助检查
grep -cE "grid-template-columns:\s*repeat\(4" prototype.html
# 警戒：> 0 表示有 4-tile 砌墙倾向（除非真有 4 个对等指标）

grep -c "<KpiCard" prototype.html
# 警戒：> 6 个 KpiCard 应该改 MetricsStrip / Table

awk '/<CardBox/{depth++} /<\/CardBox>/{if(depth>1) print "套娃!"; depth--}' prototype.html
# 期望：无输出
```

---

## Chrome 自带 class 字号豁免（v3.12 P1 引入 · v5.1 完整化）

shell-sample 内置 chrome / 标准组件 class 自带固定字号（基于像素级视觉一致性），**豁免 `.type-*` 强制规则**。

**豁免完整清单（13 个 class）**：

| Class | 字号 / 字重 / 字族 | 跟 `.type-*` 关系 | 用途 | AI 能否覆盖? |
|-------|------------------|----------------|------|----------|
| `.header-box__title` | 20 / 700 / Manrope | 与 `.type-h2` 同值 | HeaderBox 主标题（v5.0 对齐生产）| ❌ 禁止 |
| `.page-header__title` | 20 / 700 / Manrope | 与 `.type-h2` 同值 | PageHeader 主标题（v5.0 对齐生产）| ❌ 禁止 |
| `.hero-band__title` | 28 / 800 / Manrope | 接近 `.type-kpi` 但 Manrope 800 | HeroBand 大标题 | ❌ 禁止 |
| `.kpi-card__value` | **28 / 700 / mono / tabular** | **= `.type-kpi`**（v5.1 等价别名）| KPI 大数字（自定义业务卡焦点数字优先用 `.type-kpi`）| ❌ 禁止 |
| `.kpi-card__title` | 12 / 500 / Inter / uppercase | 与 `.type-table-header` 接近 | KPI 小标签 | ❌ 禁止 |
| `.kpi-card__trend` | 12 / — / Inter | 与 `.type-caption` 接近 | KPI 趋势字段 | ❌ 禁止 |
| `.status-badge` | 11 / 500 / Inter | 与 `.type-table-header` 接近（无 uppercase）| 状态徽章 | ❌ 禁止 |
| `.tag` | 11 / 500 / Inter | 与 `.type-table-header` 接近 | 通用标签 | ❌ 禁止 |
| `.empty-state__title` | 16 / 600 / Inter | 与 `.type-h3` 同值 | EmptyState 标题 | ❌ 禁止 |
| `.balance-pill` | 13 / 600 / mono | 与 `.type-data` 接近（粗重）| TopBar 余额药丸数字 | ❌ 禁止 |
| `.balance-pill__cta` | 11 / 600 / Inter | 与 `.type-table-header` 接近 | 充值按钮 | ❌ 禁止 |
| `.nav-search-text` / `.nav-icon-btn` | 13 / Inter | 与 `.type-body-sm` 同值 | TopBar 搜索 / 图标按钮 | ❌ 禁止 |
| `.sidebar__nav-item` / `.sidebar__group-label` | 13-11 / Inter | 与 `.type-body-sm`/`.type-table-header` 接近 | Sidebar 菜单 | ❌ 禁止 |

**核心约定（v5.1 加固）**：

1. **AI 在 `<main>` 业务区写新的 L3 class（`.po-status` / `.bp-price` / `.foo-card__title` 等）时，仍必须遵守 `.type-*` 规则——禁止手写 `font-size / font-weight / font-family / line-height`**
2. 上表 13 个 chrome class **AI 不要覆盖其内置字号**（用 `style="font-size: ..."` 强改是错误的，破坏视觉锁定层）
3. 出现 `.kpi-card__value` 类似的"业务卡需要 28px mono 大数字"场景时：**用 `.type-kpi` class**（v5.1 新增），不要手写

**Rule-gap 出口**：极个别情况确实需要 ad-hoc 字号（如打印样式 / 一次性 marketing 海报），走 §0.4 `rule-gap: §1.4-11`，标 `reason: 一次性 layout 不入 type 体系`。

---

## Scenario Switcher 契约（v3.12 P1 闭环补 · v3.16 位置铁律加固）

多状态页面（≥ 3 个状态分支 / 演示评审场景）必须实现，shell-sample §6.8 已固化机制。

**🔒 位置铁律（永远 TopNav，从未漂移）**：

```
TopNav 右侧 ────────────────────────────────┐
                                            │
   ✅ chip 唯一位置 → [💡 演示场景：X ▾]    │
                                            │
   ✅ banner 自动位置 → TopNav 正下方        │
   (非默认场景，橙色，"仅评审用，非真实数据")  │
                                            │
   ❌ 永远不要放到：                          │
      sidebar / main 顶部 / page-header /   │
      hero band / 自己造的 .scenario-bar     │
                                            │
**Chrome 已经自动渲染，AI 唯一动作 = 填 `scenarios` reactive 对象**
─────────────────────────────────────────────┘
```

**最小契约（必须严格按此格式，shell-sample chrome 依赖）**：

```js
// setup() 内 —— 严格遵守以下三点：
// 1. defaultScenario 必须是 'normal'（chrome 硬编码读这个 key）
// 2. label 必须是 { zh, en } 对象，**不能**写成字符串
// 3. data 字段必须含 mode 子字段（chrome 依赖判定 banner / chip 状态）

const scenarios = reactive({
  normal:  { label: { zh: '默认 · 有订单',  en: 'Default · with orders' }, data: { mode: 'normal' } },
  empty:   { label: { zh: '空态 · 无订单',  en: 'Empty · no orders' },     data: { mode: 'empty' } },
  loading: { label: { zh: '加载中 · 骨架',  en: 'Loading · skeleton' },    data: { mode: 'loading' } },
  error:   { label: { zh: '加载失败',       en: 'Load failed' },           data: { mode: 'error' } },
});
const defaultScenario = 'normal';
const activeScenario = ref(defaultScenario);
const scenarioData = computed(() => scenarios[activeScenario.value]?.data || {});

// return 必须暴露这 4 个（chrome 取它们渲染 chip + banner）
return { scenarios, activeScenario, defaultScenario, scenarioData, /* ...其他 */ };

// 模板中按 mode 分支渲染
<div v-if="scenarioData.mode === 'empty'"><EmptyState ... /></div>
<div v-else-if="scenarioData.mode === 'loading'"><skeleton /></div>
<div v-else-if="scenarioData.mode === 'error'"><Alert variant="error" ... /></div>
<div v-else><real-data /></div>
```

Chrome（shell-sample）会**自动**：
- 在 TopBar 显示 scenario chip / dropdown 切换器
- 切到非 `normal` 场景时显示顶部橙色 banner（`Current scenario: X · For review only`）

**禁止（这些是历史漂移过的位置，永远不再发明）**：
- ❌ Sidebar 加"演示场景 / 模式切换"菜单项（这是最常见的错误漂移）
- ❌ Main 顶部加 segmented tabs / radio-group / dropdown 选 scenario
- ❌ PageHeader / HeaderBox 的 `actions` slot 里塞场景下拉
- ❌ HeroBand `right` slot 里放场景选择卡
- ❌ 自己写 `.scenario-bar` / `.demo-switcher` / `.mode-tabs` 等 CSS class
- ❌ 使用 `default` / `currentScenario` 等其他 key 名（chrome 期望 `normal` / `activeScenario` / `defaultScenario`）
- ❌ label 写成字符串（必须 `{ zh, en }` 才能跟 chrome 自动双语切换联动）
- ❌ 用 `mode` 以外的字段判定状态（chrome 依赖 `scenarioData.mode`）

**唯一正确动作**：在 setup() 中赋值 `scenarios = reactive({ normal:{}, empty:{}, ... })` —— **就这一步**，chrome 看到 `hasScenarios=true` 后自动出 chip 和 banner。

**生成后自检**（Bash）：
```bash
grep -c "demo-mode-chip" prototype.html   # 应得 1（仅 chrome 自带）
grep -c "demo-banner" prototype.html      # 应得 1（仅 chrome 自带）
# 若 ≥ 2 或检出其他 .scenario-* / .demo-switcher 类，说明 AI 自己重复造了，必须删除
```

**业务语义 banner 例外**：与 scenario 无关的页面级提示（如"普通成员只能看自己的数据"）可以自己做一个**蓝色业务 banner**（区别于 chrome 自带橙色 scenario banner），二者可并存。

---

## BalanceBox 契约（v4.6 引入 · v4.8 改为 chrome 常驻）

**TopNav 右侧的余额药丸（balance pill）是 chrome 常驻组件**，跟搜索框、通知铃铛、Demo Mode chip 一样常态显示。跟生产 mamba-layout 的 BalanceBox 视觉一致。

**默认行为（无需任何代码，cp shell-sample 即生效）**：
- 默认显示 `15,311.79 Credits` + `+ Top Up`，`level: 'normal'`
- 已在 shell-sample 的 `setup()` 中以默认对象初始化

**AI 何时需要覆盖（少数情况）**：

```js
// shell-sample 已预声明：
// const balance = ref({ balance: 15311.79, level: 'normal', currency: 'Credits', showTopUp: true });

// 场景 1：finance / quota / billing 页面演示告警态
balance.value = {
  balance:    213.5,
  level:      'low',           // 'normal' | 'low' | 'critical' | 'empty'
  currency:   'Credits',       // 直接显示（**不自动加 s**），如 'Credits' / 'CREDIT' / '¥' / 'Tokens'
  showTopUp:  true,
};

// 场景 2：极少数页面需要显式隐藏药丸
balance.value = null;
```

4 种 level 自动配色：
- `normal`：默认 topnav-muted 色（**database** icon — 圆筒造型最接近 EP Coin）
- `low`：warning 半透明背景（wallet icon）
- `critical`：destructive 强提示（triangle-alert icon + 脉冲 dot）
- `empty`：destructive 实色填充（circle-x icon + 脉冲 dot）

**字段语义提醒**：
- `currency` **不自动加 s**——传什么显示什么。生产真值是 `Credits`（已含复数），不是 `CREDIT`。
- `topUpLabel` 不传时 chrome 跟随当前 `lang` 自动 `'充值'`（zh） / `'Top Up'`（en）；只有需要强制覆盖时才传。
- `showTopUp: false` → 只读药丸，无充值按钮。

**位置铁律**：跟 demo-mode-chip 一样在 TopNav 右侧 chrome 自动渲染，**禁止自己另做 BalanceBox / 充值按钮 / 余额显示**（与 chrome 自带重复）。

**对比旧契约（v4.7 及之前）**：之前是「opt-in」——`balance` 默认 `null`，只有财务类页面 setValue 才显示。v4.8 改为常驻：跟搜索框一样默认就有，AI 只在切换状态/数值或显式隐藏时才覆盖。

---

## ✅ 输出前 7 项自检（精简版）

- [ ] 语法纯净：无 React/JSX 残留 / 无 `${...}` / 无 className
- [ ] 字符串闭合：`:style` 对象引号正确
- [ ] Token 覆盖：颜色 / 间距 / 圆角 / 阴影 / 动效 全用 `var(--*)`
- [ ] i18n 闭合：每个语言块 `},` 收尾
- [ ] Logo 完整：`LOGO_DARK` / `LOGO_LIGHT` 两个 base64 字符串均 ≥ 20000 字符
- [ ] 字号走 `.type-*` class，无手写 font-size/weight/family/line-height
- [ ] Scenario Switcher：多状态页面已实现，**且 chip 在 TopNav 右侧（chrome 自动渲染，不在 sidebar / main / page-header）**，非默认场景显示警示横幅（`grep -c demo-mode-chip` = 1 且 `grep -c demo-banner` = 1）

---

## 工具调用顺序模板

```
1. cp shell-sample-v1.html → target.html
2. Read AI-USAGE.md  (本文件，~1.5k)
3. Read catalog.md   (~2.5k)
4. [若需] Read selection-rules.md § N  (~1k 单棵树)
5. [若需] Read api-cheatsheet.md  (~1.5k)
6. Edit target.html 的 <title>
7. Edit target.html 的 sidebar 菜单
8. Edit target.html 的 i18n 对象
9. Edit target.html 的 <main> 内容（最大工作量）
10. Edit target.html 的 darkVars / lightVars（仅当需新增 token）
```

🔚 **不要 Read shell-sample-v1.html 整文件**（约 171KB）。组件 API 看 api-cheatsheet.md，Logo / chrome / theme 由 cp 自动带过来。

---

## 历史背景（仅供参考，无需 Read 源文件）

- **shell-sample-v1.html** 是模板源，含完整 Chrome（TopBar / Sidebar / theme / Logo / PrototypeComponents 23 个运行时组件 / i18n 骨架）
- **agione-design-system.html** 是给设计师评审的视觉画廊（6544 行 / 458KB）。**AI 永远不该 Read 它**——所有规则已抽取到本目录其他文件
- **design-system/** 是 AI 选型素材：catalog / selection-rules / api-cheatsheet / foundations / components

完整版规则在 `/SKILL.md`（约 686 行），仅在本文件未覆盖的极少数边界场景时才查阅。
