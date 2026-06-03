# AGIOne UI **Explore** Skill · AI Usage Protocol

> ⚠️ **本 skill 是 explore 模式**——专门做多 variant 探索、构图层创新视觉。
> 如果用户要 PM 评审 / 生产部署级 strict 原型 → 切到 `agione-ui` skill。
>
> **AI 必读**：本文件是 explore skill 的简明使用契约。

## 🚨 先记住：所有 mode 共用的 Base Spec（不许破）

无论 strict 还是 explore，AGIOne 项目的下列规范**完全一致地强制执行**：

| 规则 | 必须用 | 禁止 |
|------|-------|------|
| 颜色 | `var(--ui-color-*)` / `var(--ui-text-*)` / `var(--ui-bg-*)` / `var(--ui-border-*)` | 硬编码 `#xxx` / `rgb()` |
| 间距 | `var(--ui-space-*)` | 硬编码 px / 数值 |
| 圆角 / 阴影 / 动效 | `var(--ui-radius-*)` / `var(--ui-shadow-*)` / `var(--ui-motion-*)` | 硬编码 |
| 字号 / 字重 / 字族 / 行高 | 11 个 `.type-*` class | 手写 `font-size` / `font-weight` / `font-family` / `line-height` |
| Chrome 结构 | shell-sample cp 锁定 | 改 TopNav / Sidebar / Logo / theme toggle 结构 |
| Scenario Switcher | chrome 自动渲染 chip 在 TopNav 右侧 | 自己造 `.scenario-bar` / `.demo-switcher` |
| BalanceBox | chrome 常驻，AI 只能设 `balance.value` | 自己写 BalanceBox / 充值按钮 / 余额显示 |
| Logo base64 | `LOGO_DARK` / `LOGO_LIGHT` 整段保留 | 替换 / 删除 / 截断 |
| 业务专用色 | `--biz-<feature>-<role>-*` 命名 | 在 `:root` 加无前缀全局色 |

**explore 自由 = 在以上 base spec 之上的构图自由**。任何 variant 破上述规范 = **作废重写**。

## explore 跟 strict 的真正差异（构图层）

| 维度 | strict | explore |
|------|--------|---------|
| 输出数量 | 1 个 | 2-3 个 variant |
| L2/L3 组件选型 | 守 catalog | 鼓励 catalog 之外（仍用 token 实现）|
| 信息架构 | 4 硬约束 | 2 必守 + 2 推荐 |
| 卡片形状 | 守 5 底线 | 守 2 base spec + 放开 3 构图纪律 |
| typography audit | 强制 0 violation | info-only（不阻断生成）|

⚠️ typography audit info-only 的意思是 **explore 阶段先看构图**，但**底层的 `.type-*` class 仍 100% 守**——info-only 只是不阻断**业务自定义 class 的 inline style 数量超阈值**这种边缘违规，**不是允许硬编码 font-size**。

下面所有章节大部分跟 strict 一致；只有标 ⚠️ explore-only 的章节有差异。

---

## 任务输入形式

AI 会收到下述之一：

1. **`/agione-ui-explore --from <path/to/prototype-X.md>`** — 从 REQ 出多 variant
2. **`/agione-ui-explore <自由描述>`** — 自由探索多 variant
3. **`/agione-ui-explore --refine <existing.html> <某区域>`** — 局部变体探索

⚠️ **explore 必出 2-3 个 variant**——独立 HTML 文件，构图必须真的不同（不是只换色）。详见 SKILL.md §2.1。

---

## 输出要求

单文件 HTML，浏览器直接打开可跑。**必须**通过下述工作流生成。

**⛔ 禁止自动调用 Playwright / Browser MCP / Chrome MCP 截图验证**（v4.1）

- 生成完原型后**不要**自动浏览器截图（单次 30-90s，绝大多数场景不需要）
- 默认验证已足够：`node --check`（JS 语法）+ `grep`（chip 位置 / token 残留 / Logo 长度）
- 浏览器视觉确认交给用户自己 open
- **唯一例外**：用户 prompt 含关键词 "playwright" / "截图" / "screenshot" / "视觉验证" / "看效果" 时才调用

---

## 🔥 explore 4 层决策流（v2.0 重写 · 跟 strict 完全不同）

> strict 用 catalog → selection-rules → 组件 流程"选 DS 组件"。explore 故意没这套——它的流程是"**先定 variant 切入方向，再自创构图**"。

```
┌─ Layer 0 · 决定 3 个 variant 的不同切入方向 ────────────────┐
│ 读 REQ / 需求描述，识别业务核心元素（指标 / 状态 / 流程 /    │
│ 关系等），然后给 3 个 variant 各定一种**根本不同**的切入：    │
│                                                              │
│ 推荐切入维度（参考 SKILL.md §2.5 好 explore 模式）：         │
│ - 信息架构差异：hero-driven / timeline-driven / sankey-driven│
│ - 主组件类型差异：KpiCard 网格 / MetricsStrip 横条 / 异形 grid│
│ - 数据呈现哲学：数字优先 / 趋势优先 / 事件优先              │
│ - 响应密度：信息密集 / 中等 / 稀疏                          │
│                                                              │
│ ⚠️ 不要 3 个 variant 都按同一切入方向只换皮——会被           │
│   check-explore-variants.sh 的 Jaccard > 0.80 检测到判作废  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer A · Base Spec 红线（任何 mode 都必守）───────────────┐
│ 1. cp shell-sample-v1.html 起步，Edit 只改 <main>             │
│ 2. 所有 <el-form> 必须用 <div class="form-modern"> 包裹       │
│ 3. 所有 Radio 必须用 4 variant 之一，禁止裸用 <el-radio>      │
│ 4. 多语言字段必须用 <I18nField>                              │
│ 5. 字号必须用 .type-* class（11 个），禁止手写 font-size      │
│ 6. 颜色 / 圆角 / 阴影 / 间距 / 动效 必须用 var(--ui-*) token │
│ 7. 多状态页面必须实现 Scenario Switcher（chrome 自动渲染）    │
│ 8. BalanceBox chrome 常驻（AI 只设 balance.value）            │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer B · 用 chrome-mandatory 组件（不可替代）─────────────┐
│ 这些组件 explore 跟 strict 一样必用，AI 不要造替代品：       │
│ - <HeaderBox> / <PageHeader> / <DetailPage>                  │
│ - <FilterBox>（filter bar 标准，不要 wrap CardBox）          │
│ - <DataTable>（列表表格，不要降级 el-table）                 │
│ - <I18nField>（多语言字段）                                  │
│                                                              │
│ Read design-system/api-cheatsheet.md 查这些组件 props/slots  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer C · L3 业务卡 / 视觉焦点 自创（explore 的主战场）────┐
│ 业务卡 / 自定义可视化（Sankey / 时间线 / 异形 grid / 双轨    │
│ hero 等）—— **自己设计，守 2 条 base spec 红线**：           │
│                                                              │
│ ① token 化：颜色/间距/圆角/阴影/动效全用 var(--ui-*)          │
│ ② 字号走 .type-* class，禁手写 font-size                     │
│                                                              │
│ ⚠️ explore 故意不给 catalog.md / selection-rules.md /         │
│   components/ —— 目的是强迫你自创，不是按 DS 现成组件拼      │
│                                                              │
│ 真的需要 KpiCard / MetricsStrip 等 DS 组件？两条路：         │
│ A. 用 token + class 自己造一个类似视觉                       │
│ B. 切到 agione-ui (strict) skill                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 文件加载硬规则（v2.0 explore 故意比 strict 少 80% 文件）

| 文件 | AI 何时 Read | 状态 |
|------|------------|------|
| `SKILL.md` | skill 加载时自动加载主体 | 已在上下文 |
| `design-system/AI-USAGE.md`（本文件） | 一次性 | ~3.5k token |
| `design-system/api-cheatsheet.md` | 用 chrome-mandatory 组件时（HeaderBox / FilterBox / DataTable / I18nField / DetailPage / PageHeader） | ~2k token |
| `agione-console-shell-sample-v1.html` | **不整文件 Read**；cp 起手 → rg 找 `AGIONE_EDIT_*` 锚点 → Read offset/limit 局部 | 180KB / 局部 ~200-1500 token |
| `design-system/foundations/**/*.html` | 不 Read，规则已内联在本文件 | — |

**explore v2.0 故意没有的文件**（跟 strict 关键差异）：

| strict 有 | explore v2.0 故意没有 | 理由 |
|----------|---------------------|------|
| `catalog.md` | ❌ | 引导按 DS 选组件，跟探索精神反向 |
| `selection-rules.md` | ❌ | 选 DS 组件的决策树 |
| `components/L1/` + `L2/` | ❌ | 23 个组件展示，引导原样复用 |
| `components/templates/` | ❌ | 4 个 page partial，引导布局复制 |
| `agione-design-system.html` | ❌ | 458KB DS 全景，引导整体复制 |

**目标预算**（**经验估算，未实测**）：3 variant 总 ~30-75k token。**取决于 Read 纪律**——如果 AI 偷懒整文件 Read，预算瞬间到 450k+（每个 variant 150k）。详见 SKILL.md §1.1 anchor-driven 协议。

### 🛡️ shell-sample Edit 锚点速查（v2.2 跟随 strict v6.3）

每个 variant cp 之后直接 `rg -n "AGIONE_EDIT_" {slug}-vN.html` 即可定位 5 个可改区域 + 1 个 LOGO 禁读区：

| 锚点（grep with rg -n） | 用途 | 典型 partial Read 量 |
|---|---|---|
| `AGIONE_EDIT_TITLE_*` | 业务页面标题 | ~50 token |
| `AGIONE_EDIT_THEME_VARS_*` | darkVars / lightVars 增量 | ~200 token |
| `AGIONE_EDIT_I18N_*` | 双语 key 增量 | ~500-1000 token |
| `AGIONE_EDIT_SIDEBAR_*` | sidebar 菜单项 | ~300-800 token |
| `AGIONE_EDIT_MAIN_*` | 业务内容（**主战场，各 variant 在这里差异最大**） | ~500-2000 token |
| `⛔ AGIONE_LOGO_DANGER_*` | **禁读区**：2 行 LOGO base64 共 ~18k token | ❌ 永远不 Read |

**协议**：每个 variant 的每次 Edit 前都 `rg -n` 找锚点 → `Read offset:<行号> limit:30-80` → `Edit`。**禁止整文件 Read**。

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

### 构图自由 + 2 条 base spec 红线（⚠️ explore-only）

**explore 鼓励异形 / 多形状 / 创新视觉**（GPU 详情卡多分区 / Sankey 流向 / 时间线 / 异形 quota grid 等）—— **构图 / 子部件 / 布局 / 形状由 AI 决定**。

但**任何自定义卡 / 视觉元素都必须严守这 2 条 base spec 红线**——这不是"底线可以谈"，是**项目基础规范，违反直接 variant 作废**：

| # | Base Spec 红线 | 检查方法 |
|---|---------------|---------|
| 1 | **Token 化**：圆角 / 阴影 / padding / 颜色 / 间距 / 动效全用 `var(--ui-*)`，**禁止硬编码 hex / px**（layout-only 例外见 §1.5）| `grep -E "border-radius:\s*[0-9]"` 应 = 0 |
| 2 | **字号走 `.type-*` class**：**禁止手写 `font-size` / `font-weight` / `font-family` / `line-height`** | `<main>` 内 `font-size:` 应 = 0（audit-typography.sh info-only 模式跑）|

⚠️ 这 2 条加上 chrome / Scenario / BalanceBox / Logo 锁定（在 SKILL.md §🚨 Base Spec 红线表里）= **AGIOne 项目所有 mode 共用的基础规范**。explore 跟 strict 的差异**不在这里**。

**strict 5 底线里 explore 放开的 3 条**（属于"构图纪律"，不是 base spec）：
- ⏸️ 同页同类卡字号一致 → explore **允许字号梯度差异化**（hero 用 display-sm，辅卡用 h3）。**但都用 `.type-*` class，不是手写字号**
- ⏸️ 视觉焦点必用 `.type-display-sm` → explore **可以用 `.type-display`（40px）做爆炸字号**。**仍是 `.type-*` class**
- ⏸️ inline style ≤ 50 处 → explore **不设上限**，但重复 ≥ 3 次的应抽 class。**inline style 里的值也必须是 token，不是硬编码**

**关键澄清**：以上 3 条"放开"指的是**构图纪律放开**，不是 base spec 放开。所有字号还是走 `.type-*`、所有颜色还是 token、所有间距还是 `var(--ui-space-*)`。

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

## 信息架构与视觉节奏（⚠️ explore-only · 2 必守 + 2 推荐）

> **核心命题**：组件守规则 ≠ 页面好看。strict skill 用 4 硬约束防"砌墙"；explore skill 把后 2 条放成"推荐"，**鼓励 AI 在受控范围内挑战常规视觉**。
>
> 但**视觉焦点必须有**、**套娃必须禁**——这两条 explore 同样守，否则 explore 出的东西会"乱七八糟"。

### 2 条必守（同 strict）

#### ① 每个主 section 必须有 1 个"视觉焦点"

视觉焦点 ∈ {display 字号大数字 / Hero 卡组 / 主图表 / 主表格 / Sankey / 时间线 / 异形可视化}

❌ 错误：全等权重卡片并列 ≥ 4 张（如 `[Card][Card][Card][Card]` 整齐排列）  
✅ 正确：`[Hero] → [辅卡组 ×3] → [详情区]` 或 `[Sankey 流向] → [底部 KV 表]` 有主次

#### ② 禁止套娃

❌ 错误：`<CardBox>` 内嵌 `<KpiCard>` / `<CardBox>` 内嵌 `<CardBox>`  
✅ 正确：CardBox 是容器，里面直接放业务内容；自定义异形卡也不要再嵌标准卡

### 2 条推荐（explore 可破，但必须在 AI-NOTES 写理由）

#### ③ KpiCard 上限 ≤ 3 个并列 → **explore 可破**

strict 强制 4-6 个指标用 MetricsStrip / KvCard / DataTable。explore 里**如果 variant 的设计意图是"砌墙美学"**（比如 8 个相等权重指标 grid 是构图本身的视觉表达），**可以破**——但必须在 `<!--AI-NOTES-->` 写：

```html
<!--AI-NOTES
variant: 2 of 3
constraint-broken: ③ KpiCard ≤ 3
reason: 8 指标"砌墙美学"是这个 variant 的视觉主张，对比 V1 的 hero-driven 看哪种更合用户脑模型
AI-NOTES-->
```

#### ④ HeaderBox subtitle 默认**可填可不填** → **explore 可填**

strict 默认不传 subtitle（防 AI 脑补废话）。explore 里 subtitle 是**有效的视觉试错维度**——可以试"含 subtitle vs 不含 subtitle"看哪种更适合该页面气质。

但同样**禁止脑补废话**（"X events stream in current scope" 这种翻译式描述还是不要写）。建议传 subtitle 时是**有信息增量的**（如"#PO-12345 · 待付款" / "5 个项目 · 12 个 API Key"）。

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
| `.page-header__title` | **22 / 700 / Manrope line-height 1.25 letter-spacing -0.01em** | type scale 1.25 第 3 档位（14→18→**22**→28→36）| PageHeader 主标题（v2.3 跟随 strict v6.4 PageHeader B-Pro）| ❌ 禁止 |
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
| `.lux-tabs-page button` | **14 / 500 (active 600) / inherit / letter-spacing -0.005em** | 比 `.type-body` (14/400) 稍重，跟 Stripe/Linear/Vercel page tab 一致 | 详情页 4+ 一级分区 Tab 导航（v2.4 跟随 strict v6.5）| ❌ 禁止 |

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

**每个 variant 必须过**：

- [ ] 语法纯净：无 React/JSX 残留 / 无 `${...}` / 无 className
- [ ] 字符串闭合：`:style` 对象引号正确
- [ ] Token 覆盖：颜色 / 间距 / 圆角 / 阴影 / 动效 全用 `var(--*)`
- [ ] i18n 闭合：每个语言块 `},` 收尾
- [ ] Logo 完整：`LOGO_DARK` / `LOGO_LIGHT` 两个 base64 字符串均 ≥ 20000 字符
- [ ] 字号走 `.type-*` class，无手写 font-size/weight/family/line-height（audit-typography.sh **info-only**，违规不阻断但要 AI 心中有数）
- [ ] Scenario Switcher：多状态页面已实现，chip 在 TopNav 右侧（chrome 自动渲染）

**explore-only 额外自检**：

- [ ] 输出 **2-3 个 variant**（不是 1 个也不是 4+）
- [ ] 每个 variant 顶部 `<!--AI-NOTES-->` 块完整（`variant:` / `approach:` / `ds-status:` / `tradeoff:`）
- [ ] variant 之间**构图真的不同**（不是只换色、换字号、换 KPI 数量——必须改信息架构 / 主组件类型）
- [ ] 若破了"2 推荐约束"（KpiCard ≤ 3 / subtitle 默认不传），AI-NOTES 写 `constraint-broken:` + reason
- [ ] 命名规范：`{slug}-v1.html` / `-v2.html` / `-v3.html`（详见 SKILL.md §2.1.5）

---

## 工具调用顺序模板（v2.1 加固 · 多 variant 共享一份 shell 来源）

```
─── Phase 1: cp 多 variant（0 token，~3 个 Bash 命令）───
1. cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v1.html
2. cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v2.html
3. cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v3.html
   （[skill-dir] = ~/.claude/skills/agione-ui-explore/）

─── Phase 2: 读规则文档（~5k token）───
4. Read AI-USAGE.md  (本文件，~3.5k)
5. [若需 chrome 组件] Read api-cheatsheet.md  (~2k)

─── ⚠️ explore 故意没有 catalog.md / selection-rules.md / components/ ───
─── 因为 explore 是 "自创构图"，不是 "按 DS 选组件" ───
─── Phase 3: 对每个 variant Edit（每个 ~1k token）───
对每个 vN.html 重复 6-10：
6. Edit 顶部 <!--AI-NOTES--> 块（最先写，明确 variant 意图）
7. Edit <title>
8. Edit sidebar 菜单（如有）
9. Edit i18n 对象
10. Edit <main> 内容（⚠️ 各 variant 在这里差异最大）

─── Phase 4: 整套自检（~1k token）───
11. bash scripts/check-explore-variants.sh {slug}-v{1,2,3}.html
12. bash scripts/audit-typography.sh {slug}-vN.html   (info-only)
```

🔚 **绝对禁止 Read shell-sample-v1.html 整文件**（180KB / ~150k token）。所有 variant 都 cp 自同一份 shell。

🔚 **绝对禁止 Write 整个 variant 文件**——只能 Edit 局部。Write 整文件 = output token 浪费 150k+。

### Token 成本对照

| 工作流 | 1 variant | 3 variant |
|---|---|---|
| ❌ Read shell + Write 整文件 | 300k token | **900k token** |
| ❌ cp + Write 整文件 | 150k token | 450k token |
| ✅ cp + Edit `<main>` only | ~3k token | **~9k token** |

差异：**100×**。所以 cp + Edit 是 explore L1 铁律。详见 SKILL.md §1.1。

---

## 历史背景（仅供参考，无需 Read 源文件）

- **shell-sample-v1.html** 是模板源，含完整 Chrome（TopBar / Sidebar / theme / Logo / PrototypeComponents 23 个运行时组件 / i18n 骨架）
- **agione-design-system.html** 是给设计师评审的视觉画廊（6544 行 / 458KB）。**AI 永远不该 Read 它**——所有规则已抽取到本目录其他文件
- **design-system/** 是 AI 选型素材：catalog / selection-rules / api-cheatsheet / foundations / components

完整版规则在 `/SKILL.md`（约 686 行），仅在本文件未覆盖的极少数边界场景时才查阅。
