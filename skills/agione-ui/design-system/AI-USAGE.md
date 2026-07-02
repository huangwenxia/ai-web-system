# AGIOne UI Skill · AI Usage Protocol

> **AI 必读**：本文件是 agione-ui skill 的简明使用契约。具体体积和读取预算以下方「文件加载硬规则」表为准；不要沿用旧版 `~1.5k` / `~8-10k` 估算。
> 
> 之所以独立成文：SKILL.md 主体 ~900 行（v6.8），是给设计师/PM/Skill 维护者看的设计原理，AI 不需要读完。

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
- **唯一例外**：用户明确要求浏览器自动化或采集工具时才调用，例如 "用 Playwright" / "Browser MCP" / "Chrome MCP" / "自动截图验证" / "浏览器截图" / "screenshot" / "render check" / "pixel compare" / "抓取 DOM" / "采集 CSS"
- "看效果"、"帮我看下页面"、"视觉效果怎么样" 只表示人工审查 / 反馈请求，不构成 Playwright / Browser MCP / Chrome MCP 授权

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
│ 5. 字号必须用 .type-* class（12 个：display / display-sm /    │
│    h1 / kpi / hero-data / h2 / h3 / body / body-sm / caption / │
│    data / table-header），禁止手写 font-size/weight/family/lh  │
│    v6.9.1 加 hero-data (44px Mono) 给 dashboard ov-card 巨数字 │
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
│ 12 个决策点覆盖 ⓪页面骨架 + ①-⑩ 组件多候选场景 + ⑪ Dashboard │
│ 走完树 → 终点组件 → 看 api-cheatsheet.md → 用                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 文件加载硬规则（Token 关键）

| 文件 | AI 何时 Read | 体积（v6.9 实测*） |
|------|------------|------|
| `SKILL.md` | skill 加载时自动加载主体 | 已在上下文（~19k token） |
| `design-system/AI-USAGE.md`（本文件） | 一次性 | **~21k token** |
| `design-system/catalog.md` | 组件选型时 | ~4.3k token |
| `design-system/api-cheatsheet.md` | 选定组件后查 props 时 | ~8.3k token |
| `design-system/selection-rules.md` | signal=TREE-N 时 | ~6k token（部分章节更少） |
| `design-system/dashboard.md` | **决策树 ⑪ 命中 dashboard 时**（非 dashboard 不读）| ~6k token |
| `design-system/partials/dashboard.partial.html` | dashboard 命中后 cp 进 `<main>` 时 | ~11k token（SVG 路径占大头）|
| `agione-console-shell-sample-v1.html` | **不整文件 Read**；cp 起手 → rg 找锚点 → Read offset/limit 局部 | 210KB（整文件 **~75-85k**，其中 LOGO base64 ~22k）/ 局部 ~60-2100 |
| **`agione-design-system.html`** | **绝对禁读** | 458KB / ~150k token |
| `design-system/components/**/*.html` | 仅 signal=READ 时 | ~2-3k token / 个 |
| `design-system/foundations/**/*.html` | 不 Read，规则已内联在本文件 | — |

> \* **v6.9 实测方法**：`wc -c` 字符数 ÷ 2.5（中英混合经验比；base64 dense 区 ÷ 3.5）。
> 非 tokenizer 精确值但量级可信。修正两处历史错误：本文件旧标 "~1.5k / ~8-10k" 实际 ~21k；
> shell-sample 旧标 "~150k" 实际 ~75-85k（高估 1 倍，但"绝不整读"结论不变）。

**目标预算**（基于上表实测推算）：典型单页原型固定开销 = SKILL(19k) + AI-USAGE(21k) ≈ 40k，加规则文件按需 4-12k + 锚点局部 Read 2-5k → **input ~45-60k**。dashboard 页型再 +17k（dashboard.md + partial）。**Read 纪律是关键**——偷懒整读 shell-sample 一次就 +80k。

### 🛡️ shell-sample Edit 锚点速查（v6.3 引入）

cp 之后直接 `rg -n "AGIONE_EDIT_" target.html` 即可定位 5 个可改区域 + 1 个 LOGO 禁读区：

| 锚点（grep with rg -n） | 用途 | 区段实测（v6.9·chars÷2.5）|
|---|---|---|
| `AGIONE_EDIT_TITLE_*` | 业务页面标题 | ~60 token |
| `AGIONE_EDIT_THEME_VARS_*` | darkVars / lightVars 增量 | ~2.1k token |
| `AGIONE_EDIT_I18N_*` | 双语 key 增量 | ~0.7k token（写业务 key 后增长）|
| `AGIONE_EDIT_SIDEBAR_*` | sidebar 菜单项 | ~1.1k token |
| `AGIONE_EDIT_MAIN_*` | 业务内容（主战场） | ~0.4k token（占位态；写业务后最大）|
| `AGIONE_EDIT_SETUP_DATA_*` | setup() 内业务 ref / reactive（v6.8 加）| ~0.9k token |
| `AGIONE_EDIT_SETUP_RETURN_*` | setup return 暴露业务 key 给 template（v6.8 加）| ~0.2k token |
| `⛔ AGIONE_LOGO_DANGER_*` | **禁读区**：2 行 LOGO base64 实测 **~22k token** | ❌ 永远不 Read |

> dashboard 页型的参考实现**不在 shell-sample 内**（v6.9 起挪到 `partials/dashboard.partial.html`，
> 跟 standard-list / detail / overview 三个 partial 同机制）——决策树 ⑪ 命中才 cp，非 dashboard 页零负担。

**协议**：每次 Edit 前 `rg -n` 找锚点 → `Read target.html offset:<行号> limit:30-80` → `Edit`。**禁止整文件 Read**。

---

## 🎨 Foundations 内联规则（避免 AI Read 11 个 foundation 文件）

### Typography · 12 个 `.type-*` class（v3.12 P3.3 + v5.1 新增 .type-kpi + v6.9.1 新增 .type-hero-data）

| Class | 字族 | 字号 / 字重 / 行高 | 用途 |
|-------|------|-------------------|------|
| `.type-display` | Manrope | **40 / 800 / 1.15** / -0.5px tracking | dialog 价格 / 营销页 hero / 最大数字展示 |
| `.type-display-sm` | Manrope | **32 / 800 / 1.15** / -0.3px tracking | 较大数字 / 详情页主指标 |
| `.type-h1` | Manrope | 30 / 800 / 1.2 | 页面主标题 |
| `.type-kpi` | IBM Plex Mono | **28 / 700 / 1.2** / tabular-nums | **KPI 大数字 / 业务卡焦点数字（v5.1 新增，跟 .kpi-card__value 同值）** |
| `.type-hero-data` | IBM Plex Mono | **44 / 700 / 1** / -0.04em tracking / tabular-nums | Dashboard `.ds-ov-card` 巨数字，非 dashboard 少用 |
| `.type-h2` | Manrope | 20 / 700 / 1.4 | Section 标题 |
| `.type-h3` | Inter | 16 / 600 / 1.4 | 卡片 / 弹窗标题 |
| `.type-body` | Inter | 14 / 400 / 1.6 | 正文（默认） |
| `.type-body-sm` | Inter | 13 / 400 / 1.43 | 表格内容 / 次要描述 |
| `.type-caption` | Inter | 12 / 500 / 1.33 | 标签 / 辅助说明 / helper text |
| `.type-data` | IBM Plex Mono | 13 / 400 / 1.5 / tabular-nums | 数字 / 时间 / ID |
| `.type-table-header` | Inter | 11 / 600 / 1.4 / uppercase / 0.5px tracking | 表头 |

**禁止**：手写 `font-size` / `font-weight` / `line-height` / `font-family`。12 个 class 已覆盖 11-44px 全梯度，**业务区应该没有需要硬编码的场景**。

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

### 字族 token 名（v6.2 加固 · 别用错名字）

| Token | 值（mamba-layout 0.50.0 真值）| 用于 |
|-------|--------------------------|------|
| `--ui-font-heading` | `Manrope, var(--el-font-family)` | `.type-display / display-sm / h1 / h2` |
| `--ui-font-body` ⚠️ | `var(--el-font-family)` | `.type-h3 / body / body-sm / caption / table-header` |
| `--ui-font-mono` | `"IBM Plex Mono", ...` | `.type-data / .type-kpi` |

⚠️ **v6.2 修正**：本 token 名是 `--ui-font-body`（不是 `--ui-font-base`）。v4.0 token rename 时遗漏，v6.2 全局修正。任何 inline style 用 `var(--ui-font-base)` 都是错的，会在 mamba 工程里解析不到。

### 间距 / 圆角 / 阴影 / 动效 / 图标 / z-index · token 名

⚠️ **v6.8 加固 · mamba semantic 命名**：业务区**优先用 mamba 语义命名**，size scale 命名作为向后兼容保留。

**圆角（两套共存，业务区优先 semantic）**：
- 🌟 **Semantic（mamba 真值）**：`--ui-radius-control`(8) / `--ui-radius-card`(12) / `--ui-radius-modal`(24) / `--ui-radius-pill`(∞)
- Size scale（向后兼容 + skill 独有档位）：`--ui-radius-sm`(4) / `--ui-radius-md`(6) / `--ui-radius-lg`(8 = control) / `--ui-radius-xl`(12 = card) / `--ui-radius-2xl`(16)

**间距（两套共存，业务区优先 semantic）**：
- 🌟 **Semantic（mamba 真值）**：`--ui-space-inline`(8) / `--ui-space-control`(12) / `--ui-space-card`(20) / `--ui-space-section`(24)
- Size scale（向后兼容 + skill 独有档位）：`--ui-space-xs`(4) / `--ui-space-sm`(8 = inline) / `--ui-space-md`(12 = control) / `--ui-space-base`(16) / `--ui-space-lg`(20 = card) / `--ui-space-xl`(24 = section) / `--ui-space-2xl`(32) / `--ui-space-3xl`(48)

**判别原则**：
- 写**业务卡 / 容器 / section / 按钮**等"有语义"的元素 → 用 semantic（更贴 mamba 生产）
- 写**纯间距调整 / gap / 一次性 margin** → 用 size scale 也行
- chrome 内部 CSS 已大量用 size scale，**不要去 rename**（向后兼容）

- 阴影（对齐 mamba 0.51.8 三档语义）：`--ui-shadow-xs`（输入 / hover 微浮）/ `--ui-shadow-card`（卡片）/ `--ui-shadow-pop`（弹层 · 模态）。旧 `-sm/-md/-lg/-xl` 已映射到这三档、仍可用，**新代码请用语义档**。
- 信息弱底：`--ui-color-info-subtle`（v6.9.9 补齐，对齐 mamba）——info 蓝灰系的浅底（info banner / tag 底），随主题自动适配；跟 `primary/success/warning/destructive-subtle` 同级。
- **状态色交互档（v6.9.6 新增 hover/active）**：`success` / `warning` / `destructive` 现在各有 `base` / `-hover` / `-active` 三档（primary 早有），两套主题都定义好了。**做这些色的可点元素（按钮 / 可点行）时，hover 用 `var(--ui-color-<色>-hover)`、按下用 `-active`，别再 `filter:brightness()` 或硬编码**。约定：交互态都往深/浓走（light + dark 一致方向）。`-subtle` 仍是弱底（卡片浅底 / tag 底），不是交互态。
- 时长：`--ui-duration-fast`(150ms) / `--ui-duration-base`(250ms) / `--ui-duration-slow`(400ms)
- 缓动：`--ui-ease-out`(进入/hover) / `--ui-ease-in`(退出) / `--ui-ease-in-out`(切换) / `--ui-ease-spring`(强调反馈)

**动效用法（v6.9.7 · 吸收 Geist 节奏）**：动效只在"让变化更清楚"时用,默认即时——大多数交互不加动画最快最好。要用就按交互类型取时长 token,别随手写时长:

| 交互 | 时长 token |
|---|---|
| hover / active / focus / 颜色态切换 | `--ui-duration-fast`(150) |
| dropdown / tooltip / popover 出现 | `--ui-duration-base`(250) |
| modal / drawer / overlay | `--ui-duration-slow`(400) |

- 缓动一律用上面 4 个 `--ui-ease-*`,不手写 cubic-bezier
- ❌ 不做循环 / 吸睛 / 装饰性长动画;✅ `prefers-reduced-motion` 已在 chrome 关掉装饰动画(shell-sample 自带,AI 不用管)
- 参考:Geist 跑得更 snappy(状态 150 / 弹层 200 / 模态 300),你的 token 偏稳(250/400);要更快可调 base/slow,但那是改既有手感,本次不动

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

## 主业务锚定 + 语义 / Attention 清洗（v6.9.8 · 总纲 · ⚠️ 统领下面所有设计纪律）

> **这是下面 §信息架构 / §默认克制 / §文案与语气 的上位纲领**——它们都是本纲的具体落地。先建立"页面为谁服务"的锚,再用两道 gate 过滤每个元素。
>
> ⚠️ **这是生成时的 gate,不是事后清洗**。AI 不是"先堆装饰再review掉",而是一上来就按"仪表盘都有描述""卡片都配图标"的模式堆——所以**加每一处文字/图标/强调之前先过 gate**,而不是画完再删。本纲**无自动 audit**(语义太活),靠生成时自律 + 输出前自检人眼过。

**① 先锚定主业务目标**

- 每个页面定 **1 个主业务目标**(+ 至多 1 个次目标)。怎么定:**REQ/prototype 明文** > 按**页型默认**推(列表页=找到并操作某条 / 详情页=理解这个对象的状态与可做的事 / dashboard=看健康度与异常 / 表单=填完提交) > **拿不准就问用户**,别瞎猜。
- 锚错了,下面两道 gate 会把对的东西删掉、错的东西留下——所以锚是入口,必须先对。

**② 二级漏斗:每个文字 / 图标 / 强调元素都过两道 gate**

| gate | 问句 | 不过则 |
|---|---|---|
| **A · 存在性（语义）** | "删了它,用户完成主业务会丢失什么?" 答"没什么 / 只是好看 / 凑丰富感" | **删** |
| **B · 强调性（attention）** | "它抢了第一眼吗?抢的话它是主任务吗?" 抢眼但**不是**主任务、也不导向下一步 | **弱化**（降字号/去色/去边/调灰） |

> 一句话测试:**"第一眼吸引用户、但不能帮他理解当前状态或完成下一步"的元素 = 错误 attention**,要么删要么弱化。

**③ 图标语义（v6.9.8 硬规则 · 之前是空白）**

图标不是装饰。每个 `data-lucide` 图标必须满足:

- ✅ **承担文字没表达的辅助语义**:可点击 / 可复制 / 可跳转 / 可展开 / 不可用 / 错误 / 代码 / 事件 / 配置 / 状态。图标补的是"交互属性 / 状态",不是复述文字。
- ✅ 跟它旁边的业务对象 / 状态 / 动作**一致**,提升识别效率。
- ❌ **不为装饰 / 填空 / 视觉平衡而出现**(最常见:每个 section 标题前随手配个 icon、每张卡左上角配个 icon——问 gate A,多半该删)。
- ❌ **不误导**:非交互元素别配看起来可点的图标(箭头 / 外链 / 加号),用户会以为能点。
- ⚠️ **affordance 图标 ≠ 重复,要保留**:ID 旁的 copy 图标、可跳转项旁的 external-link、可展开行的 chevron——这些是**加了一个动作能力**,不算"跟文字重复语义"。**"重复"只指纯标签型图标复述文字含义**(如"成功"二字旁再放个对勾且无任何其他作用 → 删图标)。
- 辅助 / 蒙版 / 环境类图标(空态大图、背景 watermark)**弱化**,不抢主任务。

**④ Attention 是一份预算,不能叠加**

强调色 / 边框 / 阴影 / 字号 / 图标 / 插画 / 蒙版 / 动效——**都是同一份 attention 预算的开销**。一屏只能有 **1 个主 attention**(对应主业务内容 / 关键状态 / 关键决策 / 主操作),次级信息只能辅助、不能竞争。

- 视觉强调必须跟**业务优先级**一致,不是跟版面装饰需求一致。
- 状态变化时 attention 跟着任务走:可操作时突出操作与内容,不可操作时突出**原因 + 下一步**。
- 同一屏不要多个按钮 / 状态块 / 提示 / 图标同时强高亮。
- 主操作不一定最大,但必须在当前任务路径里**最容易被识别**。

**⑤ 跟现有具体规则的关系（这些是本纲的落地,不重复读）**

- §信息架构「视觉焦点 ≤ 1」「禁数字砌墙」= gate B 的具体形态
- §默认克制（subtitle 禁 / 页头只 Title / 左色条禁 / 外壳克制）= gate A + attention 预算的具体形态
- §文案与语气 = gate A 在文字上的落地
- 本纲是判断层,**无脚本 audit**;输出前自检里有对应的人眼检查项。

---

## 信息架构与视觉节奏（v4.3 加固 · ⚠️ 最重要 — 防止"数字砌墙"）

> **核心命题**：组件守规则 ≠ 页面好看。AI 容易把所有数据都堆成 KpiCard 网格 → 页面变成"灰色块阵列"，无视觉焦点、无信息层级。
>
> 本节强制 **5 条硬约束 + 2 个推荐模式 + 业务 token 命名规范**，把 AI 从"砌墙工"提升到"有视觉判断的设计师"。另见末尾 §默认克制（v6.7）补充 2 条页头 / 外壳约束。

### 5 条硬约束（任何 dashboard / overview / 数据型页面都必须守）

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

#### ④ 页面副标题（subtitle）**一律禁用**（v6.9.3 硬禁 · 从"默认不传"升级为"完全移除"）

> **v6.9.3 决策（user 直接拍板）**：**所有页面都不要副标题**。HeaderBox / PageHeader / DetailPage 的 `subtitle` prop 已从组件层**彻底移除**（shell-sample 删 prop + render + CSS class），不再是"默认不传但可选"，而是"没有这个能力"。
>
> 历史：subtitle 是高频"AI 脑补填充物"——REQ 没写却被 AI 加成"informative but not critical"的废话，无意义占用 25px 高度。v5.2 设为"默认不传"仍止不住漂移，v6.9.3 直接砍掉。

**唯一行为**：
```vue
<!-- ✅ 只有 title（subtitle prop 已不存在）-->
<HeaderBox title="Quota Usage Log" />
<PageHeader :title="t.pageTitle" />

<!-- ❌ 传 subtitle = 组件已无此 prop，且 check-prototype 第 8 项会 fail -->
<HeaderBox title="x" subtitle="任何文案" />
```

**那以前 subtitle 承载的信息去哪？**
- 状态 / 编号消歧（"#PO-12345 · 待付款"）→ `PageHeader` 的 `statusLabel` + `statusColor` 状态药丸
- 口径 / 范围 / 单位 / 时间窗 → 放进对应区块的卡内说明，不进页头
- 功能说明（导出 / 月份选择）→ 本就在 actions slot，不重复

**校验**：`bash scripts/check-prototype.sh`（第 8 项检测任何 `subtitle=` / `.page-header__subtitle` / `.header-box__subtitle` 残留）。

#### ⑤ FilterBox **不要** wrap CardBox（v6.1 加固 · ⚠️ 高频漂移）

> **核心命题**：FilterBox 自带 `padding: var(--ui-space-md) 0` 已经足够呼吸感，**不需要白卡包裹**。AI 高频脑补行为：把 FilterBox 包到 `<CardBox>` / `<div class="card">` 里，造出第二个"独立白卡"，跟 v5.2 已修的 HeaderBox 白卡问题同源。

**默认行为**：
```vue
<!-- ✅ 正确（默认）：FilterBox 放 HeaderBox 默认 slot 内 -->
<HeaderBox :title="t.pageTitle">
  <template #actions>
    <el-button type="primary">{{ t.btnNew }}</el-button>
  </template>
  <!-- 默认 slot 渲染到 .header-box__content（自带 border-top 分隔） -->
  <FilterBox>
    <el-input v-model="kw" placeholder="搜索"></el-input>
    <el-select v-model="status" placeholder="状态">...</el-select>
  </FilterBox>
</HeaderBox>

<!-- ✅ 正确（独立放置）：FilterBox 直接坐在 page bg，不包卡 -->
<HeaderBox :title="t.pageTitle" />
<FilterBox>...</FilterBox>
<DataTable ... />
```

**禁止**：
```vue
<!-- ❌ 错误（AI 脑补 CardBox 包裹倾向）：-->
<HeaderBox :title="t.pageTitle" />
<CardBox>                       <!-- ← 多余的白卡 -->
  <FilterBox>...</FilterBox>
</CardBox>
<DataTable ... />

<!-- ❌ 错误（自己造 .filter-card 类）：-->
<div class="filter-card">       <!-- ← 不要自创 -->
  <FilterBox>...</FilterBox>
</div>
```

**何时**真的需要 wrap：
- 几乎没有。FilterBox 是"列表页 chrome"，跟 HeaderBox 一样不该被卡片化
- 如果你觉得"少了卡片视觉太空"，**先想想是不是 layout 节奏问题**（HeaderBox 跟 FilterBox 之间间距太大？），而不是加卡来填

**Standard 列表页推荐结构**（v3.14 standard-list-page.partial.html 已固化）：

```
[HeaderBox 标题 + actions 按钮]
         │ border-top (header-box__content 自带分隔)
         │
[FilterBox 搜索+筛选+操作]
         │ (无额外卡片)
         ▼
[DataTable / 列表内容]
```

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

### 默认克制（v6.7 加固 · 信息架构第 6-7 条约束 · ⚠️ 跟 PageHeader 去 border-bottom 同源）

> 注：本节约束跟前面 §5 条硬约束 ④ **副标题一律禁用**（v6.9.3 升级）/ ⑤ FilterBox 不 wrap CardBox 同主题（页头 / 外壳的克制）。AI 自检时合并看。

**① 页头：只保留 Title 一行 + 返回固定在标题左侧（v6.9.3 收紧）**

- **副标题彻底没有**（§④）：所有页面**一律不传 subtitle**，组件层已删 prop。状态消歧走 PageHeader `statusLabel` 药丸，不靠副标题。
- **eyebrow 只用于 hero 区**（overview / 详情 hero）且必须承载上下文（所属实体 / 批次 / 账期）；列表 / 表格 / 表单 / 设置页**不要 eyebrow**（99% 在复述导航分区名 = 噪音）
- **返回入口固定在标题左侧 inline**（v6.9.3）：详情页的 back 用 `PageHeader :backLabel + @back`（或 `DetailPage :showBack`），渲染为标题左缘的 `‹ 返回 │ 标题`，**禁止散放**到面包屑行 / 页头右侧 / 独立顶行 / main 里任意位置。"返回到处放"是高频毛病——位置只有一个：标题左边。

**自检**：把页头遮成只剩标题 + 左侧导航，用户还能判断"这是什么页"吗？能 → 页头不需要任何附加件。返回链接是否在标题左侧紧贴？不在 → 挪过去。

**② 外壳克制：一个区块只一层边界，不重复套框**

html→code 最高频的视觉赘余是**双层边框 / 卡上套卡**。约束：

- 自带边框 / 卡片底色的组件（`<FilterBox>` / `<DataTable>` / `<KpiCard>` / `<MetricsStrip>`）**外面不要再套一层带 `border` 的容器**
- 一个区块**只允许一层视觉边界**：`border` 与"卡片 bg + radius" **二选一，不叠加**
- **筛选区**：用 `<FilterBox>` 自带框时，外层 wrapper 保持 `background: transparent; border: 0`；反之外层做卡 / FilterBox 去框——**永远只留一层**
- **表格区**：`el-table` / `<DataTable>` 本身已是一张卡，**不要再包 `border + radius + bg` 的外层 section**

**自检**：任一筛选 / 表格区，沿边数 border —— 只能数到 **1** 条。数到 2 条就拆。

> 💡 跟 v6.6 PageHeader 去 border-bottom 同源：**少一条线比多一条线更克制**。container 应 reserve 给"重区块"，不滥用做装饰。

**②.1 数据表 ⊂ 卡片：表头/外框「双线重合」防治（v6.9.1 · 实测高频坑）**

最高频的表格视觉 bug：表格放进卡片后，**表头的分隔线跟卡片外框在顶部叠成两条贴在一起的平行线**（手搓 `<table>` 尤其常见）。生产 `apps/financial/.../settlements/index.vue` 里就有两处 scoped CSS 专门修过同源问题。根因有三，一套配方治掉：

| 根因 | 现象 | 治法 |
|---|---|---|
| 卡片有 radius 但表格没裁切 | 方角表格边线戳出圆角，顶部两角线交叉 | 卡片 `overflow: hidden`（把方角表裁进圆角）|
| 表格自带外框 + 卡片也有外框 | 顶/侧两条平行线 ≈1px 并排 | 表格 `border: none`，外框只留卡片一层 |
| 手搓 `<table>` 没合并边框 | 单元格边线跟邻居翻倍、表头线加粗/重影 | `<table>` 必加 `border-collapse: collapse` |

**标准配方（直接抄；`.data-table` / `<DataTable>` 已内置，首选用它别手搓）**：
```css
.xxx-table-card      { border: 1px solid var(--ui-border-default); border-radius: var(--ui-radius-lg); overflow: hidden; } /* 唯一外框 + 裁切 */
.xxx-table-card table{ width: 100%; border: none; border-collapse: collapse; }                                            /* 表格不带外框 + 合并边框 */
.xxx-table-card thead th { border-bottom: 1px solid var(--ui-border-soft); }                                              /* 表头只一条分隔 */
```
- 若卡片有标题栏（title + 副标题 + 计数）：标题栏一条 `border-bottom`（soft），它跟 thead 之间隔着表头行高，**不能贴成 0 间距叠线**。
- **从外到内只能数到**：卡片 1 条外框 +（可选）标题栏 1 条分隔 + 表头 1 条分隔。任何位置出现两条贴在一起的平行线 = bug。
- **首选 `<DataTable>` / `.data-table`**：已内置 `overflow:hidden` + 内层 `.el-table{border-radius:0}`，零配置不出双线；手搓 `<table>` 才需要上面三行。
- 校验：`bash scripts/audit-borders.sh prototype.html`（v6.9.1 起检测手搓 table 是否缺 `border-collapse: collapse`）。

**③ 卡片 / 标题禁用「左侧色条」装饰（v6.9.2 引入 · v6.9.3 收紧到标题）**

最常见的廉价装饰：在元素左缘加一条 `border-left: 3-4px solid <色>` 的竖色条当状态 / 分类标记 / 标题强调。**禁止**——它把元素变成"告警条"，列表里十几条色条 = 视觉噪音，且跟 Alert 抢语义。

- ❌ `.xxx-card { border-left: 4px solid var(--ui-color-success); }`（卡片状态色条）
- ❌ `.xxx-section__head { border-left: 4px solid var(--ui-color-primary); }`（标题 `▎标题` accent 条，**v6.9.3 也禁了**）
- ✅ 状态 → `<StatusBadge>` / `.status-badge`（药丸 + dot，决策树 ④）；分类 → `<Tag>`；强调 → 标题色 / 背景 subtle
- ✅ 卡片只留**四边等框**（`border: 1px solid var(--ui-border-default)`）+ radius；**section 标题靠字重 / 字号强调**，不靠左色条

**唯一例外**：`.alert` 组件——左 severity 条是 Alert 的语义本身（success/warning/error/info），那是"告警"不是卡片/标题装饰。

> 判别：任何 `border-left ≥ 2px` 带色竖条挂在卡片 / 列表项 / 标题上 = 禁；只有 `.alert` 留。
> 校验：`bash scripts/audit-borders.sh`（检测业务区 `border-left: ≥2px solid 带色`，唯一豁免 `.alert`）。

**④ 功能性边框 vs 装饰性边框（v6.9.4 · WCAG 1.4.11 · ⚠️ dark 下高频失明）**

边框分两类语义，**用不同 token**——这是 WCAG 1.4.11（UI 控件边界 ≥3:1）的硬要求：

| 类型 | token | 对比度 | 用在 |
|---|---|---|---|
| **功能性边界**（边框是"我可选/可输入"的唯一线索）| **`--ui-border-interactive`** | **≥3:1 强制** | radio 空心圈 / checkbox 空心框 / 可点选择卡（`.radio-card`/`.radio-pill`）/ switch / input 边 |
| **装饰性边界** | `--ui-border-default`（或 `-soft`）| 无要求（低对比更克制）| 卡片框 / 表格行线 / divider / section 分隔 |

**为什么**：`border-default` dark=#27272a vs 卡底 #18181b ≈ **1.19:1**，radio 空心圈直接"失明"。`--ui-border-interactive`（light #8f8f8f 3.23:1 / dark #71717a 3.67:1）才达标。**注意 `border-strong`(dark #52525b)只有 2.29:1，不是合规替代品**，别拿它救场。

- ✅ radio/checkbox/可点卡/switch/input 的**静息态边框** → `var(--ui-border-interactive)`
- ✅ hover/active → `var(--ui-color-primary)`（intent 色，比静息更显）
- ❌ 拿 `border-default` 画控件边 → dark 失明；拿 `border-strong` 当"达标版" → 仍 <3:1
- shell-sample 的 radio 4-variant + `.el-checkbox__inner`/`.el-radio__inner` 已绑 interactive；自造控件照此办
- 校验：`bash scripts/audit-contrast.sh`（断言 interactive vs bg-card 两主题均 ≥3:1）

**⑤ 键盘焦点环——自动有，别杀掉（v6.9.5 · WCAG 2.4.7）**

shell-sample 已内置**全局** `:focus-visible { outline: 2px solid var(--ui-color-primary); outline-offset: 2px }`——每个可交互元素键盘聚焦自动出紫色环，鼠标点击不显示（浏览器 `:focus-visible` 已区分）。**AI 不需要为焦点写任何东西**，它是 chrome 自带的。

- ❌ 业务区**禁止** `outline: none` / `outline: 0` 不给替代——这会让键盘用户彻底看不见焦点（2.4.7 失败）。自定义控件需要去掉默认 outline 时，必须在 `:focus-visible` 上给回可见环。
- ✅ 自定义可点元素（非 button/a 的 div/span 当按钮用）记得加 `tabindex="0"`，焦点环会自动套上。
- EP 组件保留自身焦点态（specificity 更高，不受全局规则影响）。
- 校验：`bash scripts/check-prototype.sh` 第 10 项（焦点环规则在 + 业务区无裸 `outline:none`）。

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

**豁免完整清单（14 个 class + `.ds-*` 前缀整族）**：

> v6.9.1 引入 `.ds-*` 前缀（dashboard chapter chrome）整族豁免——audit-typography.sh 已加 `if (sel ~ /\.ds-/) next`。详见 §11 Dashboard 大盘契约。



| Class | 字号 / 字重 / 字族 | 跟 `.type-*` 关系 | 用途 | AI 能否覆盖? |
|-------|------------------|----------------|------|----------|
| `.header-box__title` | 20 / 700 / Manrope **line-height 1.2** | 跟 `.type-h2` 视觉近似但**有意保留独立**（line-height 1.2 vs h2 的 1.4，页面标题单行紧凑）| HeaderBox 主标题（v5.0 对齐生产）| ❌ 禁止 |
| `.page-header__title` | **22 / 700 / Manrope line-height 1.25 letter-spacing -0.01em** | type scale 1.25 第 3 档位（14→18→**22**→28→36），对齐 Vercel/Stripe/Linear | PageHeader 主标题（v6.4 B-Pro Designer 标准）| ❌ 禁止 |
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
| `.lux-tabs-page button` | **14 / 500 (active 600) / inherit / letter-spacing -0.005em** | 比 `.type-body` (14/400) 稍重，跟 Stripe/Linear/Vercel page tab 一致 | 详情页 4+ 一级分区 Tab 导航（v6.5 B-Pro v4.1）| ❌ 禁止 |

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
grep -c "demo-mode-chip" prototype.html   # 应 ≥ 5（shell-sample chrome baseline）
grep -c "demo-banner" prototype.html      # 应 ≥ 3（shell-sample chrome baseline）
# 以 check-prototype.sh 的 baseline 为准：≥ 说明 chrome 机制未被删
# 如检出自造 .scenario-bar / .demo-switcher / .mode-tabs 类，说明 AI 重复造了切换 UI，必须删除
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

## PageHeader B-Pro 契约（v6.4 引入 · 95% 页面用这个做标题区）

**背景**：v6.4 之前 page 标题区有 3 种混乱写法（HeaderBox 24px 边框卡 / PageHeader v3.8 / 散装 `<h1>`）。v6.4 起 95% 页面统一用 PageHeader B-Pro——已在 REQ-20260515 EU + Provider 两份 HTML 共 32 个 section 标题实战验证。

### 6 个 Designer 原则（AI 应该能 explain"为什么这样设计"）

| # | 原则 | reasoning |
|---|------|-----------|
| ① | **title 22px**（不是 20 也不是 24） | type scale 1.25 第 3 档位（14→18→**22**→28→36，黄金比例）。Vercel / Stripe / Linear 都用 22-26px 段 |
| ② | **完全无 container 装饰**（v6.6 起：去 border-bottom）| (a) 边框卡是 2018-2020 Material Design 风格——现代 SaaS（Linear / Notion / Stripe / Vercel / GitHub）一律不用 card；(b) v6.4 曾用 hairline 底线 → v6.6 改成**彻底无界**：Linear / Vercel 最新版本已无底线；(c) PageHeader + lux-tabs-page 组合时 tabs wrapper 自带 border-bottom，PageHeader 再有底线 = 双线重复；(d) container 应 reserve 给"重区块"（KPI cards / data tables / form sections）|
| ③ | **actions `align-items: flex-end`**（不是 flex-start） | 36px 按钮跟 22px 标题 baseline 对齐 → typography 严谨。flex-start 让按钮顶部贴标题顶部 → 视觉偏上，不够精致 |
| ④ | **`font-weight: 700`**（不是 800） | 800 是 marketing / hero 字重。page title 用 700 足够"权威"——Manrope / Inter / SF Pro 字体设计师本意。中文字体下 800 渲染偏失真 |
| ⑤ | **eyebrow `color: var(--ui-text-muted)`**（不是 primary） | eyebrow 是"定位辅助"（如 "User Space · API Keys"），不是 CTA。primary 色 reserved for 行动召唤 / interactive。muted + uppercase + letter-spacing 0.6px 已经够显眼 |
| ⑥ | **无 subtitle + 返回固定标题左侧**（v6.9.3） | 副标题已从组件移除（§④）——页头只有 title 一行。详情页 `:back-label` 渲染为标题左缘的 `‹ 返回 │ 标题`（DetailPage 的 `‹` 圆钮同理），**返回入口位置唯一 = 标题左边**，不散放到面包屑 / 右侧 / 独立行 |

### 5 个用法场景（覆盖 95% 业务页面）

**场景 A · 普通列表/设置/表单页**（最常用）：

```vue
<section v-show="activeNav === 'topup'" class="main-box">
  <PageHeader :title="lang === 'zh' ? '充值' : 'Top-up'" />   <!-- 只有 title，无 subtitle -->
  <el-scrollbar>
    <div class="page-content">...</div>
  </el-scrollbar>
</section>
```

**场景 B · 带 actions 的列表页**：

```vue
<PageHeader :title="lang === 'zh' ? '团队成员' : 'Team Members'">
  <template #actions>
    <el-button>导出 CSV</el-button>                  <!-- 次要 actions 在左 -->
    <el-button type="primary">+ 邀请成员</el-button>  <!-- 主 CTA 在右 -->
  </template>
</PageHeader>
```

**场景 C · 详情页 — back（标题左侧）+ status pill**：

```vue
<!-- back-label 自动渲染为标题左缘的 ‹ 返回 │ 标题；status 药丸在标题右侧 -->
<PageHeader
  :title="viewingProject.name"
  :back-label="lang === 'zh' ? '项目列表' : 'Projects'"
  @back="nav('projects')"
  :status-label="'● ' + viewingProject.status"
  :status-color="viewingProject.status === 'Active' ? 'green' : 'muted'">
</PageHeader>
```

**场景 D · 成员/客户详情 — 头像嵌入标题行**：

```vue
<PageHeader v-if="selectedMember"
  :title="selectedMember.name"
  :back-label="lang === 'zh' ? '团队成员' : 'Team Members'"
  @back="nav('teamMembers')"
  :status-label="'● ' + selectedMember.status"
  :status-color="selectedMember.status === 'Active' ? 'green' : 'muted'">
  <template #avatar>
    <div style="width:40px;height:40px;border-radius:50%;background:var(--ui-avatar-bg);
                display:flex;align-items:center;justify-content:center;color:#fff;
                font-weight:700;font-family:var(--ui-font-heading);font-size:16px;">
      {{ selectedMember.name.charAt(0) }}
    </div>
  </template>
  <template #actions>
    <el-button>调整额度</el-button>
    <el-button type="primary">限额</el-button>
  </template>
</PageHeader>
```

**场景 E · 深层菜单加 eyebrow 品类定位**：

```vue
<PageHeader
  eyebrow="User Space · API Keys"
  :title="lang === 'zh' ? '我的 Keys' : 'My Keys'">
  <template #actions>
    <el-button type="primary">+ 创建 Key</el-button>
  </template>
</PageHeader>
```

### 6 个反例（⛔ 禁止）

- ❌ 用 HeaderBox 24px 边框卡做 page 标题区 → 它是"段级 card 容器"用，page 标题用 PageHeader
- ❌ 散装 `<h1 class="page-title">` + `<p class="page-subtitle">` 自写 → 用 PageHeader 组件，保证 type scale + spacing + actions 对齐 100% 一致
- ❌ actions 按钮跟标题用 `align-items: flex-start` → 用 flex-end，baseline 对齐（PageHeader 已默认）
- ❌ 给 actions 按钮加 `style="margin-right: 6px"` icon 间距 → 用 `<i data-lucide="..."></i><span style="margin-left: 6px;">文字</span>` 标准模式
- ❌ 在 page header 加 `padding-bottom: 24px` 大间距 → padding 永远 24/28/16，多余间距用 border-bottom hairline 替代
- ❌ 驾驶舱 Hero（"晚上好 Alice" / overview）也用 PageHeader → 驾驶舱保留 ex-v3-greeting Hero（luxury 渐变 + 个性化），它是产品名片不该砍
- ❌ **传 `:subtitle`**（v6.9.3 组件已无此 prop）→ 所有页面不要副标题，状态信息走 statusLabel 药丸
- ❌ **返回链接放到面包屑行 / 页头右侧 / 独立顶行 / main 里**（v6.9.3）→ back 唯一位置 = 标题左缘，用 `:back-label`+`@back`，渲染成 `‹ 返回 │ 标题`

### 3 个例外（PageHeader **不**适用，保留原有风格）

1. **驾驶舱性质页**（明显"欢迎/今日"性质，如 EU overview / Provider PR-1 revenue）→ 保留 ex-v3-greeting Hero / 暗色 luxury 渐变 / 个性化 greeting bar
2. **Onboarding / 全屏 wizard**（如 OP-2 generate wizard）→ 用 StepPills + HeroBand 组合
3. **Empty state 第一次接入引导页** → 用 EmptyState 组件包页面，没有标题区

### PageHeader 下方 Tab 导航（B-Pro v4.1 增量 · v6.5 引入）

**触发条件**：详情页含 **4+ 个一级分区切换**（如 Project Detail 的 Overview / Members / Usage / API Keys / Activity / Settings 6 tab）。

**解法**：紧贴 PageHeader 下方一行用 `.lux-tabs-page`（Stripe / Linear / Vercel 风格下划线 tab）。

**为什么不继续用 segmented control**：6 tab 时 segmented 视觉上像"小工具按钮组"而不是"页面导航"，跟高端 SaaS 标准脱节。**职责分离**：

| Class | 形态 | 字号 | 适用 | 来源 |
|-------|------|------|------|------|
| `.tabs-segmented`（≡ user 项目里的 `.lux-tabs-modern`）| segmented control · 灰底 + 白胶囊 | 13px | **2-3 项工具切换**（Day/Week/Month、List/Grid）| chrome 自带 |
| **`.lux-tabs-page`** | underline · 扁平 + 主色下划线 | 14px | **4+ 项页面级分区导航**（详情页主 tab）| v6.5 新增 |

**配套结构**（详情页 flex column，header / tab 固定，内容可滚）：

```
┌─ PageHeader B-Pro (22px/700, hairline-soft border) ─┐ flex-shrink:0
├─ lux-tabs-page (padding 8/28/0 + border-bottom)  ──┤ flex-shrink:0
└─ page-content                                       ┘ flex:1, overflow:auto
```

外层容器 `padding: 8px 28px 0`——`28px` 跟 PageHeader 左 padding 对齐，让 Tab 文字跟标题保持视觉竖直对齐。

**HTML 用法**：

```vue
<PageHeader :title :back-label="..." @back="..." />   <!-- 无 subtitle；back 在标题左侧 -->

<div style="flex-shrink:0; padding:8px 28px 0; border-bottom:1px solid var(--ui-border-soft);">
  <div class="lux-tabs-page">
    <button v-for="tab in [
      { key:'overview', icon:'layout-dashboard', zh:'概览',    en:'Overview' },
      { key:'members',  icon:'users',            zh:'成员',    en:'Members'  },
      { key:'usage',    icon:'bar-chart-3',      zh:'用量',    en:'Usage'    },
      { key:'apikeys',  icon:'key-round',        zh:'API Keys', en:'API Keys' },
      { key:'activity', icon:'history',          zh:'活动',    en:'Activity' },
      { key:'settings', icon:'settings-2',       zh:'设置',    en:'Settings' }
    ]" :key="tab.key"
       :class="{ 'is-active': currentTab === tab.key }"
       @click="setTab(tab.key)">
      <i :data-lucide="tab.icon"></i>{{ lang === 'zh' ? tab.zh : tab.en }}
    </button>
  </div>
</div>

<div class="page-content" style="flex:1; overflow:auto;">
  <!-- tab 内容 -->
</div>
```

**反例（在 PageHeader 6 反例基础上补 2 条）**：

- ❌ **详情页 4+ 分区用 `.tabs-segmented`** → 6 tab segmented 视觉散 / 像工具按钮 → 用 `.lux-tabs-page`
- ❌ **2-3 项工具切换用 `.lux-tabs-page`** → underline tab 在少数项时显得"虚 / 空旷" → 用 `.tabs-segmented`（segmented control 在少 tab 时聚焦感更强）

**落地状态**：REQ-20260515-173706-ww-finance-optimization 原型 EU + Provider 各 1 个 projectDetail（6 tab）已实战验证。

---

## §11 Dashboard 大盘契约（v6.9 · 独立文件按需加载）

> **完整契约在 `design-system/dashboard.md`（~5k token）**——决策树 ⑪ 命中 dashboard 页型才 Read，
> 非 dashboard 任务不要加载（跟 selection-rules.md 同一按需哲学）。

速记（判断是否要加载，不展开细节）：
- **触发**：brief 含 "dashboard / 大盘 / 监控 / analytics / 看板"，或主体 ≥ 3 个 KPI/图表块 grid → 走 `selection-rules.md ⑪` → Read `dashboard.md`
- **骨架**：cp shell-sample（`.ds-*` chrome CSS 全自带）→ `partials/dashboard.partial.html` 塞 `<main>`（5 种 chart 全示范 + i18n key 清单在尾注）
- **核心契约**：section 切片是第一公民（`.ds-section-header` 必带，其 border-bottom 豁免外壳克制）/ KPI 两档不混用（28px stat vs 44px hero）/ 每张 chart-card 必带 `.ds-type-badge` / chart 全 inline SVG 禁图表库 / Gauge 几何**抄 dashboard.md §11.6.4 查表**禁心算
- **复用不新造**：header 警示 → PageHeader statusLabel；表格状态 → StatusBadge；7d/30d → `.tabs-segmented`

---

## 文案与语气（Voice & Content · v6.9.7 · 吸收 Geist）

> 文案是设计的一部分,不是占位填充。中英双语都守;中文无大小写概念,按等价精神写。AI 写 i18n key 的 zh/en 值时照这套来,别凑字数。

**① 动作 = 动词 + 宾语,不要光秃秃的"确定"**
- ✅ `部署模型` / `Deploy Model`、`删除成员` / `Delete Member`、`充值` / `Top Up`
- ❌ `确定` / `Confirm`、`OK`、`提交` / `Submit`（用户不知道在确定什么）
- EN 按钮 / 标签 / 标题 / tab 用 Title Case;正文 / 帮助文字 / toast 用 sentence case

**② 错误 = 发生了什么 + 怎么办**
- ✅ `充值失败,余额不足。检查支付方式或联系管理员。` / `Top-up failed. Insufficient balance. Check your payment method or contact admin.`
- ❌ `操作失败` / `Error`（零信息量,用户卡死）

**③ Toast = 说清改了什么 · 不带句号 · 不说"成功 / successfully"**
- ✅ `项目已删除` / `Project deleted`、`额度已更新` / `Quota updated`
- ❌ `成功删除项目。` / `Successfully deleted the project.`（赘余 + 多余句号）

**④ 空态（EmptyState）= 指向第一个动作**
- ✅ `还没有部署。推送到 Git 仓库即可创建。` / `No deployments yet. Push to your Git repository to create one.`
- ❌ 首次空态写 `暂无数据` / `No data`（死胡同）—— 注:**筛选/搜索无结果**的 DataTable 行内空态用 `暂无数据` 是 OK 的（那是过滤态,不是首次引导态）

**⑤ 进行中 = 进行时 + 省略号**
- `部署中…` / `Deploying…`、`保存中…` / `Saving…`（用 … 字符,不是三个点 ...）

**⑥ 杂项**
- 数字用阿拉伯数字（`3 个项目` / `3 projects`）
- 不写`请` / `please`;不写营销吹捧词（`强大的` / `极速` / `powerful` / `blazing fast`）
- 这是文案规范,**没有自动 audit**（语义太活,误报多）——AI 写 i18n 时自觉守,review 时人眼扫

---

## ✅ 输出前评测（v6.10 起）

```bash
python3 <skill-dir>/scripts/evaluate-prototype.py target.html
```

`evaluate-prototype.py` 会先调用 `check-prototype.sh` 的 10 项硬门槛，再补结构漂移检查：

- 无 `pageSubtitle` / `subtitle` 残留
- 无自造 `.scenario-bar` / `.demo-switcher` / `.mode-tabs` 等 scenario UI
- 普通页无 4 个以上 `<KpiCard>` 砌墙（dashboard `.ds-stat-card` 例外）
- 无 `<CardBox>` 包 `<FilterBox>` / `<KpiCard>` / `<CardBox>`
- 无裸 `<el-radio>`

底层 `check-prototype.sh` 覆盖（人工只需看输出，不用挨条 grep）：

- [ ] 1 语法纯净：无 React/JSX 残留 / 无 `${...}` / 无 className
- [ ] 2 Logo 完整：`LOGO_DARK` / `LOGO_LIGHT` 两段 base64 各 ≥ 20000 字符
- [ ] 3 Scenario Switcher 机制完整：`demo-mode-chip ≥ 5` / `demo-banner ≥ 3`（chrome 自带量未被删；v6.9 修正——旧版写 "= 1" 是错的，shell-sample chrome 本身就含 5/3 处）
- [ ] 4 i18n 双语块：`zh: {` 与 `en: {` 各 ≥ 1
- [ ] 5 业务区无硬编码 hex 色（含 SVG fill/stroke 必须走 `var(--ui-color-*)`）
- [ ] 6 字号走 `.type-*`（委托 audit-typography.sh）
- [ ] 7 外壳克制（委托 audit-borders.sh）
- [ ] 8 无副标题（PageHeader / HeaderBox subtitle 已禁）
- [ ] 9 功能性边框 ≥ 3:1（委托 audit-contrast.sh；文件含 `--ui-border-interactive` 时检查）
- [ ] 10 键盘焦点环（`:focus-visible` 在 + 无裸 `outline:none`）

脚本测不了、靠人眼/浏览器的 3 条：
- [ ] 字符串闭合：`:style` 对象引号正确（浏览器 console 无报错即过）
- [ ] Scenario chip 位置：在 TopNav 右侧（chrome 自动渲染，不在 sidebar / main / page-header），非默认场景显示警示横幅
- [ ] **语义 / Attention 清洗（§总纲）**：逐个文字/图标问 ❶"删了它,用户完成主业务丢什么?"答不上 → 删;❷"第一眼吸引、但不导向理解/行动?"→ 弱化。图标只留承担 affordance/状态语义的(copy/external/chevron 等),删纯装饰图标。一屏只一个主 attention。

---

## 工具调用顺序模板

```
1. cp shell-sample-v1.html → target.html
2. Read AI-USAGE.md  (本文件，~21k)
3. Read catalog.md   (~4.3k)
4. [若需] Read selection-rules.md § N  (全文件约 ~6k，按章节更少)
5. [若需] Read api-cheatsheet.md  (~8.3k)
6. Edit target.html 的 <title>
7. Edit target.html 的 sidebar 菜单
8. Edit target.html 的 i18n 对象
9. Edit target.html 的 <main> 内容（最大工作量）
10. Edit target.html 的 darkVars / lightVars（仅当需新增 token）
11. 运行 `python3 <skill-dir>/scripts/evaluate-prototype.py target.html`
```

🔚 **不要 Read shell-sample-v1.html 整文件**（约 171KB）。组件 API 看 api-cheatsheet.md，Logo / chrome / theme 由 cp 自动带过来。

---

## 历史背景（仅供参考，无需 Read 源文件）

- **shell-sample-v1.html** 是模板源，含完整 Chrome（TopBar / Sidebar / theme / Logo / PrototypeComponents 23 个运行时组件 / i18n 骨架）
- **agione-design-system.html** 是给设计师评审的视觉画廊（6544 行 / 458KB）。**AI 永远不该 Read 它**——所有规则已抽取到本目录其他文件
- **design-system/** 是 AI 选型素材：catalog / selection-rules / api-cheatsheet / foundations / components

完整版规则在 `/SKILL.md`（约 886 行），仅在本文件未覆盖的极少数边界场景时才查阅。
