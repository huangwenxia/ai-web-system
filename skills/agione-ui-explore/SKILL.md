---
name: agione-ui-explore
version: 2.16
description: >
  AGIOne Console UI **探索模式** 原型生成器。当用户想"放飞"
  尝试不同视觉方案、跳出 design system 框架、看几种构图对比时使用。
  不追求与生产 100% 一致，鼓励 DS 之外的创新视觉。
  触发关键词：探索 / explore / 不局限于 DS / 超出 DS / 几种方案 /
  多种风格 / 看看可能性 / 创新视觉 / fresh take。

  **如果用户要原型直接交付产品/PM 评审，请用 agione-ui skill（strict 模式）**。
---

# AGIOne Console UI — Explore Skill v2.16

> **设计哲学**：
> 探索是为了**在 base spec 之内**找答案，不是为了破坏一致性。
> chrome / token / 字型 / Scenario / BalanceBox 是 AGIOne 项目的**基础规范**——
> 它们跟 strict skill **完全一致地强制执行**，是不可放飞的部分。
> "放飞"只发生在 base spec 之上的 L2/L3 构图层：组件选型、信息架构、卡片形状。

---

## 🚨 Base Spec 红线（任何 mode 都不许破 · explore 同样守）

> 这些是 AGIOne 项目的**基础规范**，不是 strict skill 独有。explore skill **同等强制**——
> 任何 variant 违反这些 = **整个 variant 作废重写**，不接受 "explore 给了我自由" 的辩解。

| 维度 | 规则 | 在 explore 里 |
|------|------|--------------|
| **颜色 token** | 必须用 `var(--ui-color-*)` / `var(--ui-text-*)` / `var(--ui-bg-*)` / `var(--ui-border-*)` | ❌ **禁止** 硬编码 `#xxx` / `rgb()` |
| **间距 / 圆角 / 阴影 token** | 必须用 `var(--ui-space-*)` / `var(--ui-radius-*)` / `var(--ui-shadow-*)` | ❌ **禁止** 硬编码 px / 数值 |
| **Typography** | 必须用 12 个 `.type-*` class（v2.9: +type-hero-data 44px dashboard 巨数）| ❌ **禁止** 手写 `font-size / font-weight / font-family / line-height` |
| **Chrome 结构** | TopNav / Sidebar / Logo / theme toggle 是 shell-sample 锁定 | ❌ **禁止** 改 chrome HTML 结构 |
| **Scenario Switcher 位置** | chip 只在 TopNav 右侧，chrome 自动渲染 | ❌ **禁止** 自己造 `.scenario-bar` / `.demo-switcher` |
| **BalanceBox** | chrome 常驻，AI 只能设值不能造 | ❌ **禁止** 自己写 BalanceBox / 充值按钮 / 余额显示 |
| **Logo base64** | 两个 `LOGO_DARK` / `LOGO_LIGHT` 不能动 | ❌ **禁止** 替换 / 删除 / 截断 |
| **业务专用色命名** | 必须用 `--biz-<feature>-<role>-*` 命名规范 | ❌ **禁止** 在 `:root` 加无前缀的全局色 |

**违反任何一条的 variant** = 不合规，必须**重写或修正**。explore 的"自由"指的是 base spec 上层的**组合自由**，不是规则破坏自由。

---

## ⚠️ 你是 explore skill，跟 strict 不一样

> 下表的 "explore 行为" 全部都是在**严守 base spec 红线**前提下发生的——不是 base spec 也可以放飞。

| 维度 | strict (`agione-ui`) | **explore（本 skill）** |
|------|---------------------|----------------------|
| **Base spec（token / chrome / .type-* / Scenario / Balance）** | **100% 守** | **100% 守**（同 strict）|
| 输出数量 | 1 个原型 | **2-3 个 variant 并排** |
| L2/L3 组件选型 | 严格按 DS catalog | **鼓励 DS 外组件**（但仍用 token 实现）|
| 业务卡形状 | 守 5 条底线 | 守 **2 条 base spec**（token / `.type-*`）+ 放开 3 条构图纪律 |
| 信息架构 | 4 硬约束 | 2 硬约束（视觉焦点 / 禁套娃）+ 1 推荐（KpiCard ≤ 3）·副标题已全禁 |
| **跟生产视觉对齐** | 跟生产 100% 对齐 | 视觉构图可以漂移，**但底层 token / class 仍 100% 对齐** |
| 文案 subtitle | 禁用（组件已删 prop）| 禁用（base spec 红线，同 strict v6.9.3）|
| typography audit | 强制 0 violation | **info-only**（不阻断，但 AI 心中有数；交付前应清理）|
| 保守生成 | "REQ 没要的不加" | "REQ 没要的可以试试" |

**何时**用本 skill：
- ✅ "看看几种风格" / "做 2-3 个方案" / "explore: ..."
- ✅ "跳出 DS 试试" / "不要 KpiCard，给个新的"
- ✅ 设计早期发散阶段，跟产品/设计师讨论方向

**何时**改回 strict：
- ❌ 要给真实业务方评审 → 用 `agione-ui` skill
- ❌ 要做生产部署原型 → 用 `agione-ui` skill
- ❌ 已经定方向、补 F002/F003 → 用 `agione-ui --edit`

---

# §0 调用模式

## 0.1 触发方式

| 模式 | 指令 | 说明 |
|------|------|------|
| **A · 从 prototype 文件 explore** | `/agione-ui-explore --from <prototype-角色.md>` | 读 REQ 但给 2-3 种构图 |
| **B · 自由描述 explore** | `/agione-ui-explore <需求描述>` | 单页面 2-3 种方案 |
| **C · 局部探索** | `/agione-ui-explore --refine <existing.html> <某区域>` | 已有原型某区域出 2-3 种变体 |

**输出契约（强制）**：
- 必须 **≥ 2 个 variant**，**≤ 3 个**（多了用户挑不动）
- 每个 variant 输出独立 HTML 文件（命名：`{slug}-v1.html` / `-v2.html` / ...，详见 §2.1.5）
- 在每个文件顶部 `<!--AI-NOTES-->` 写：
  ```html
  <!--AI-NOTES
  variant: 1 of 3
  approach: "Hero + 时间线（消耗趋势驱动）"
  ds-status: [DS 变体]              # [DS 已有] / [DS 变体] / [DS 之外·待评估]
  tradeoff: 视觉冲击强，但 mobile 折叠困难
  AI-NOTES-->
  ```

## 0.1.1 REQ 输入怎么处理（v1.1 引入）

`/agione-ui-explore --from prototype-X.md` 调用时，AI 怎么消化 REQ：

| REQ 元素 | 处理方式 |
|---------|---------|
| **业务字段 / 数据**（GPU 数量、状态枚举、API 名称、价格）| ✅ **3 个 variant 都用同一份业务数据**，保持业务诚实性 |
| **菜单 / 路由 / Sidebar 结构** | ✅ **3 个 variant 都遵循同一份**，否则用户没法对比 |
| **页面标题 / i18n** | ✅ **3 个 variant 都遵循同一份** |
| **REQ 明文要的视觉元素**（"展示余额药丸 / 必须有 Export CSV 按钮"）| ✅ **3 个 variant 都实现**，但**呈现方式可以不同** |
| **REQ 隐含的构图建议**（"4 个 KPI 卡 + 表格"）| ⚠️ **explore 是来挑战这条的**——V1 守 REQ，V2/V3 可以试别的构图 |
| **REQ 没明说的细节**（subtitle 文案 / hover 状态 / 二级交互） | ✅ **3 个 variant 可以各自试错**，但写进 AI-NOTES |

**核心约定**：
- ✅ **业务诚实**：数据 / 字段 / 流程不能随 variant 变（用户挑构图，不是挑业务）
- ✅ **构图各异**：视觉信息架构 / 主组件类型 / 视觉焦点 必须真的不同
- ❌ **不要**为了 variant 差异化而**改业务数据**（如 V1 显示 4 个 GPU、V2 显示 6 个）——业务诚实性大于 explore 自由

## 0.2 重新设计触发器（继承 strict §0.5）

prompt 含「重新设计 / redesign / from scratch / 换一种思路」时，禁止基于旧版改，必须从 shell-sample cp 全新文件。explore skill 天然就是多 variant，重新设计触发后**所有 variant 都必须重新构图**。

---

# §1 锁定层（仍然要守 · L1 铁律）

> 这些规则跟 strict skill **一字不差**——它们是 chrome / token / 字型的基础锁定层，是同事之间共享的语言。放飞不能破坏它们。

## 1.1 Chrome 零漂移工作流（v2.1 加固 · ⚠️ explore 多 variant 场景特别重要）

> **核心原则**：所有 variant 必须以 `agione-console-shell-sample-v1.html` 为起点，**通过 `cp` 文件级复制 + `Edit` 局部修改**生成，禁止 Read 整 shell-sample。
>
> **explore 比 strict 更敏感**：strict 单原型 Read shell-sample ≈ 浪费 80k token（v6.9 实测）；**explore 3 variant 各 Read = 浪费 240k token（实测口径）**。**绝对禁止**。

### 推荐工作流：`cp` × N + `Edit` × N

```bash
# Step 1：N 个 variant 各 cp 一份（0 token / 0 漂移）
cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v1.html
cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v2.html
cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v3.html
```

`[skill-dir]` = skill 加载时的 base directory（如 `~/.claude/skills/agione-ui-explore/`）。**AI 自动用 Bash 执行**。

`{slug}` 命名规范见 §2.1.5。

**Step 2**：对每个 variant 用 Edit 工具精准修改下表可改区域，其余字节级保持。**禁止 Read 整文件 + Write 整文件**（破坏 cp+Edit 节省效益）。

### 锁定区域（Edit 禁止触碰，cp 已包含）

| 区域 | 内容 |
|------|------|
| `<style>` 内 `:root { }` | 全部 CSS 变量（base spec / token 锁定层）|
| App Shell CSS（`.app .body .main`）| 布局 |
| TopBar / Sidebar CSS | chrome 像素 |
| `darkVars` / `lightVars` JS 对象 | 主题切换数据 |
| **`LOGO_DARK` / `LOGO_LIGHT` JS 常量** ⚠️ 易漏 | base64 logo 字符串（每个 ~25KB）必须**完整保留**，禁止替换为占位符 / 注释 / 短链 |
| `PrototypeComponents` JS 对象 | 全部 23 个运行时组件（含 chrome 必用的 HeaderBox / FilterBox / DataTable / I18nField / BalanceBox / Scenario / DetailPage / PageHeader）|
| `i18n` 对象基础结构 | 双语骨架 |
| `<nav class="topnav">` 完整 HTML | 顶栏 DOM |
| `<aside class="sidebar">` 完整 HTML | 侧栏 DOM（菜单项可按页面调整）|

### 可改区域（Edit 工具仅修改这些位置，每个区域有 AGIONE_EDIT_*_START / _END 锚点）

| 区域 | 锚点 | 修改方式 |
|------|------|---------|
| **顶部 `<!--AI-NOTES-->`** ⚠️ explore 强制 | （variant 自加，无 chrome 锚点）| Edit 加入 variant 编号 / approach / ds-status / tradeoff（详见 §2.1）|
| `<title>` | `AGIONE_EDIT_TITLE_*` | Edit 替换为双语标题 |
| Sidebar 菜单项 + `activeNav` 初始值 | `AGIONE_EDIT_SIDEBAR_*` | Edit 替换/新增业务菜单 |
| `i18n` 对象 | `AGIONE_EDIT_I18N_*` | Edit 增加 zh/en 嵌套 key，**不删原有** |
| `<main>` 区域内容 | `AGIONE_EDIT_MAIN_*` | Edit 替换占位 → 写业务内容（**各 variant 之间最大差异在这里**）|
| `darkVars` / `lightVars` 增量 token | `AGIONE_EDIT_THEME_VARS_*` | Edit 末尾追加业务专用色（**禁止改已有值**）|
| `balance` ref 值（如需切告警态）| 在 setup() 内 `balance.value = {...}` | Edit `balance.value = { ... }` |

> ⚠️ 锁定区域如需调整，**先升级 shell-sample**（在 strict skill 里改 + 重 sync 过来），禁止单 variant 私改。

### 🛡️ Anchor-driven 安全 cp + Edit 协议（v2.2 必读 · explore 多 variant 场景特别敏感）

**核心**：`Edit` 工具要求"调用前必须有过 Read"。如果 AI 偷懒 Read 整个 cp 出来的 variant 文件（210KB ≈ 75-85k token 实测），就抹掉了 `cp` 节省的全部价值。**explore 3 variant 重复 3 次 = 240k+ token 浪费（v6.9 实测口径）**。

**协议步骤**（每个 variant 重复一遍）：

```bash
# 1. cp（0 token，3 variant 各一次）
cp [skill-dir]/agione-console-shell-sample-v1.html ./{slug}-v1.html

# 2. rg -n 找编辑锚点行号（Bash 调用，~50 token）
rg -n "AGIONE_EDIT_MAIN" {slug}-v1.html
#   → 2430:  <!-- AGIONE_EDIT_MAIN_START · ... -->
#   → 2452:  <!-- AGIONE_EDIT_MAIN_END -->

# 3. Read offset/limit 局部（覆盖即将 Edit 的范围，~200-1500 token）
Read {slug}-v1.html offset:2430 limit:25     # 只读 <main> 占位区
# ❌ 禁止: Read {slug}-v1.html (无 offset → 整文件 ~150k token)

# 4. Edit 精准修改（old_string 来自上一步 Read 的内容）
Edit {slug}-v1.html old_string:<占位 HTML> new_string:<业务内容>
```

**LOGO 危险区禁读（v2.2 加固）**：

shell-sample 第 2248-2254 行有 `⛔ AGIONE_LOGO_DANGER_START / END` 标记的 2 行 base64（LOGO_DARK 36k 字符 + LOGO_LIGHT 38k 字符 ≈ 共 18k token 单次 Read）。

- ❌ **绝对禁止** Read 包含 LOGO 行的窗口（offset 必须 ≥ 2256）
- ❌ **绝对禁止** Edit LOGO 内容（cp 自动带来）
- ✅ 如需 LOGO 附近上下文，offset 必须 ≥ `AGIONE_LOGO_DANGER_END` 之后

**partial Read 必须覆盖 Edit 范围**（不依赖工具细节）：
- Edit 的 `old_string` 必须从你**当前对话已 Read 的实际内容**里取，不要靠 SKILL.md 文档约定的"模板字符串"猜
- explore 3 variant 场景：每个 variant 的每次 Edit 都按此协议走，**不要赌"any prior Read 就能解锁 Edit"**

### Token 经验预算（目标，非实测）

| 工作流 | 1 variant 经验估算 | 3 variant 经验估算 |
|---|---|---|
| ❌ 错：Read shell（整文件）+ Write 整文件 | ~300k | ~900k（基准）|
| ❌ 半错：cp + Read 整 target.html + Edit | ~155k | ~465k（省 50%，但仍很贵）|
| ✅ 正确：cp + rg + Read offset/limit + Edit | ~10-25k | ~30-75k（**目标预算**，未实测）|

> ⚠️ **倍数未经实测**。实际 token 取决于：rg 命中精度、Read offset/limit 是否准确覆盖 Edit 范围、AI 是否退化到整文件 Read。**遇到超预算先 retro 哪步走了大窗口 Read**。

### 兜底工作流（仅当 Bash 不可用）

退化为 Read + Write（每 variant 单独）。Logo 防漏检：
- ❌ `'data:image/svg+xml,...'` 占位符
- ❌ `// LOGO base64 omitted` 注释
- ❌ `iVBOR...` 短链截断
- ✅ **必须完整粘贴两个常量的全部 base64**（各 ~25KB）

⚠️ 兜底工作流在 explore 多 variant 场景成本极高（~450k+ token）。**强烈建议**先检查 Bash 是否可用而不是直接降级。

## 1.2 Token 体系（100% 守）

- 颜色：用 `var(--ui-color-*)` / `var(--ui-text-*)` / `var(--ui-bg-*)` / `var(--ui-border-*)`
- 间距：`var(--ui-space-*)`
- 圆角：`var(--ui-radius-*)`
- 阴影：`var(--ui-shadow-*)`
- 业务专用色：用 `--biz-<feature>-<role>-*` 命名（详见 design-system/AI-USAGE.md）

**禁止**：硬编码 `#xxx` / `rgb(...)` / 数值 px（间距 / 圆角 / 阴影）。

## 1.3 Typography（11 个 `.type-*` class）

跟 strict 同套规则：
- `.type-display` (40/800) / `.type-display-sm` (32/800) / `.type-h1` (30/800) / `.type-kpi` (28/700/mono) / `.type-h2` (20/700) / `.type-h3` (16/600) / `.type-body` (14/400) / `.type-body-sm` (13/400) / `.type-caption` (12/500) / `.type-data` (13/mono) / `.type-table-header` (11/600)
- 业务区 `<main>` **禁止手写** `font-size / font-weight / font-family / line-height`
- chrome 内置 13 个 class 豁免（详见 design-system/AI-USAGE.md）
- **audit 跑成 info-only**：`bash scripts/audit-typography.sh variant.html` 输出违规但不阻断生成（你可以在 explore 探索阶段先看构图，后期切回 strict 再清理）

## 1.4 Scenario Switcher / BalanceBox 位置铁律

跟 strict 一致：
- Scenario Switcher chip：**只在 TopNav 右侧**，由 chrome 自动渲染
- BalanceBox：chrome 常驻，AI 仅在切换告警态时覆盖 `balance` ref
- 禁止自己造 `.scenario-bar` / `.demo-switcher` / 替代 BalanceBox

---

# §2 构图自由层（explore 独有 · L2/L3 放开）

> ⚠️ **"自由"不是无规则**。本节描述的所有 explore 自由都建立在 §🚨 Base Spec 红线和 §1 锁定层 100% 守住的前提下。
>
> strict 让你"守规则 + 守构图"，explore 让你"守规则 + 试构图"。区别只在**构图层**，不在 base spec 层。
>
> 如果你看完本节有"explore 是放飞，没规则也可以"的印象 → **回头重读 §🚨 Base Spec 红线**。

## 2.1 多 variant 输出契约

**任何 explore 调用必须出 2-3 个 variant**。每个 variant 是：
- 独立 HTML 文件
- 不同的**构图思路**（不是只改颜色/字号）
- 每个标 `[DS 已有] / [DS 变体] / [DS 之外·待评估]`

**好的 variant 差异示例**：
- V1：Dashboard 用 Hero + 3 KPI + 表格（DS 已有）
- V2：用 Sankey 流向图替代 KPI 卡（DS 之外·待评估）
- V3：时间线驱动 + 异形 quota grid（DS 变体）

**坏的 variant 差异示例**（不要这样）：
- V1：紫色主调
- V2：蓝色主调
- V3：绿色主调
- ❌ 只换色不算 variant，**必须改构图**

## 2.1.5 Variant 命名 / 组织规范（v1.1 引入）

**文件命名（强制）**：
```
{slug}-v1.html
{slug}-v2.html
{slug}-v3.html
```

`{slug}` 由 AI 从需求里提炼：
- REQ 文件名为 `prototype-admin.md` → slug = `admin` → `admin-v1.html` / `admin-v2.html`
- 自由描述"Credit dashboard 重新设计" → slug = `credit-dashboard`
- 局部 refine "顶部 hero 区" → slug = `{原文件名}-hero`（如 `usage-log-hero-v1.html`）

**禁止**：
- ❌ 起名 `fancy-version.html` / `conservative-version.html`（语义命名不可比）
- ❌ 起名 `v1.html` / `v2.html`（缺业务 slug，跟其他原型混）
- ❌ 用 emoji / 中文 / 空格做文件名

**输出位置**：

| 场景 | 输出位置 |
|------|---------|
| 用户给了明确的工作目录 | 写到那个目录 |
| 用户用 `--from <REQ.md>` | 写到 REQ 同级目录 |
| 用户自由描述无目录信息 | 写到当前 cwd |
| **不要** 创建子目录 | 三个 variant 跟其他文件**平铺**（用 slug 前缀区分） |

**index.html 对比页**（**可选** · 用户明示要才出）：

如果用户说"做个对比页"或 "side by side 看效果"，额外输出 `{slug}-compare.html`：
```html
<!-- {slug}-compare.html：三栏 iframe 并排，方便一屏看完 -->
<iframe src="{slug}-v1.html"></iframe>
<iframe src="{slug}-v2.html"></iframe>
<iframe src="{slug}-v3.html"></iframe>
```

**用户挑完后的处理**：

explore skill **不删** variant 文件。用户挑选后：
1. AI 提示用户：「选定 V2？切到 `agione-ui` skill 把 V2 作为基线收敛成 strict 版本」
2. V1/V3 留着（作为 design decision 的历史证据，给后人看为什么选 V2）
3. 用户可手动归档到 `explore-archive/{slug}/` 子目录（owner 自由选择）

**多次 explore 同一页面**：

如果用户半个月后再 explore 同一个页面（如 `credit-dashboard`），新 variant 用**时间戳后缀**避免覆盖：
```
credit-dashboard-v1.html         # 第一轮
credit-dashboard-v2.html
credit-dashboard-v1-20260520.html  # 第二轮，加日期
credit-dashboard-v2-20260520.html
```

## 2.2 组件选型：DS 是起点，不是终点

| 场景 | strict skill 行为 | explore skill 行为 |
|------|-----------------|-------------------|
| catalog 有现成组件 | 直接用 | **用一个 variant 试 catalog，再用另一个 variant 试自创** |
| catalog 没有 | 走 L3 自由 + 5 底线 | **L3 自由 + 鼓励异形**（5 底线只剩 2 个：token化 / 字号 class）|
| 业务卡形状 | 5 条底线全守 | **守 2 条**：用 token / 用 `.type-*`；其他放飞 |
| 4-6 个 KPI | 必须用 MetricsStrip（防砌墙）| 至少一个 variant 试新构图（Sankey / 时间线 / 异形 grid） |

## 2.3 信息架构（放飞但不混乱）

strict 4 硬约束在 explore 里降为"推荐"：

| 约束 | strict | explore |
|------|--------|---------|
| ① KpiCard ≤ 3 | 必须 | **推荐**（如果 variant 是有意"砌墙美学"，可破，但 AI-NOTES 写理由）|
| ② 每 section 必须有视觉焦点 | 必须 | **必须**（这条 explore 也守）|
| ③ 禁止 CardBox 套娃 | 必须 | **必须**（这条 explore 也守）|
| ④ HeaderBox subtitle 默认不传 | 必须 | **可填可不填**——subtitle 是 explore 的"试错副标题"，可以试试效果 |

## 2.4 视觉创新边界（先看禁止，再看鼓励）

### 🚨 仍然禁止（这些是 base spec，不接受 explore 借口）

- ❌ 破坏 token / 硬编码颜色 `#xxx`、`rgb()`
- ❌ 硬编码间距 / 圆角 / 阴影 px 数值（必须 `var(--ui-space-*)` / `--ui-radius-*` / `--ui-shadow-*`）
- ❌ 改 chrome（TopNav / Sidebar / Scenario Switcher / theme toggle）
- ❌ 自己造 BalanceBox / Logo 占位 / 替代 Scenario Switcher
- ❌ 手写 `font-size / font-weight / font-family / line-height`（必用 `.type-*`，11 个 class 已覆盖 11-40px 全梯度）
- ❌ 在 `:root` 加无前缀的全局色（业务专用色必须 `--biz-<feature>-<role>-*`）

**违反任一条 = variant 作废**，必须重写或修正。详见 §🚨 Base Spec 红线。

### ✅ 鼓励的创新（在 base spec 之内，构图层放飞）

- ✅ **异形容器**：圆角不一致 / 双层堆叠 / 斜切 corner / 浮空 badge（但 `border-radius` 仍用 `var(--ui-radius-*)`）
- ✅ **非常规视觉焦点**：Sankey / 双轨 hero / 时间线驱动 / event-stream 卡
- ✅ **大胆字号梯度**：让单个数字爆炸大（`.type-display` 40px）跟极小辅助字（`.type-caption` 12px）拉到 3+ 档差——**但都是用 `.type-*` class，不是手写**
- ✅ **创意 motion**：可以用 `anim-*` 之外的自定义 keyframe（每个变体最多 1 个动画亮点；transition timing 仍用 `var(--ui-motion-*)`）
- ✅ **试 dark-only / light-only 设计**：标 `[DS 之外·待评估]`，明示是早期探索
- ✅ **L3 业务卡用自定义 class**：`.foo-card__head` / `.bar-grid__cell` 等 BEM 命名（但所有视觉属性走 token + `.type-*`）

**判别原则**：「我加的这个视觉创新，**有没有用到任何硬编码的颜色 / 字号 / 间距 / 圆角**？」
- 如果**没有**（全部 token + class）→ ✅ 合法 explore
- 如果**有** → ❌ 违反 base spec，重写

## 2.5 ⚠️ 好 explore vs 坏 explore（v1.1 加固 · 必读）

> **AI 容易把 "explore" 理解成 "随便糊"**。下面列出最常见的 6 种坏模式 + 对应好模式。

### 6 个坏 explore 反例（不要这样）

| # | 坏模式 | 为什么坏 |
|---|--------|---------|
| ❌ 1 | **只换主色调**（V1 紫 / V2 蓝 / V3 绿）| 用户挑色应该走 token 替换，不需要 3 个 HTML |
| ❌ 2 | **只换字号梯度**（V1 hero 字号 32 / V2 36 / V3 40）| 字号微调是设计 review，不是 explore |
| ❌ 3 | **Layout shuffling**（V1 hero 左 / V2 hero 右 / V3 hero 中）| 同一个信息架构换 grid 位置，没回答用户问题 |
| ❌ 4 | **同组件 count 不同**（V1 用 3 KPI / V2 用 4 KPI / V3 用 6 KPI）| 数量不是构图差异，是信息粒度差异 |
| ❌ 5 | **只在某个角落加 widget**（V1 没右侧栏 / V2 右侧加 chart / V3 右侧加 timeline）| 局部加料，不算 explore 全局构图 |
| ❌ 6 | **强行造概念**（V1 "minimalist" / V2 "modern" / V3 "playful"）| 设计风格标签是营销话术，不是工程师可判断的构图差异 |

### 6 个好 explore 模式（这样才对）

| # | 好模式 | 为什么好 |
|---|--------|---------|
| ✅ 1 | **信息架构差异化**：V1 hero-driven / V2 timeline-driven / V3 sankey-driven | 用户能直接选 "我要的页面叙事是哪种" |
| ✅ 2 | **主组件类型差异**：V1 用 KpiCard 网格 / V2 用 MetricsStrip 横条 / V3 用 Sankey 流向图 | 视觉锚点不同，用户挑哪种最贴业务直觉 |
| ✅ 3 | **数据呈现哲学不同**：V1 "数字优先"（大字号显示余额）/ V2 "趋势优先"（图表占主导）/ V3 "事件优先"（时间流）| 三种 mental model，用户选哪种符合用户实际诉求 |
| ✅ 4 | **响应密度差异**：V1 信息密集（一屏全部）/ V2 中等（hero + scroll）/ V3 稀疏（hero + 二级下钻）| 用户场景决定密度选择 |
| ✅ 5 | **chrome 复用 vs 异形容器**：V1 全用 KpiCard / V2 用自定义异形卡（双层堆叠）/ V3 用 full-bleed 全屏卡 | 探索 DS 内 vs DS 外的视觉边界 |
| ✅ 6 | **交互范式差异**：V1 全静态 / V2 加 hover reveal / V3 加 timeline scrubber 交互 | 探索"静态原型 vs 微交互"的价值差异 |

### 自检：你做的真的是 explore 吗？

每个 variant 写完后问自己：

> **"如果我把 V1 的视觉风格（颜色 / 字号 / spacing）应用到 V2 的构图上，V2 会变成 V1 吗？"**
>
> - 如果**会** → 它们其实是同一个 explore，**只换了皮**。重做。
> - 如果**不会**（构图本身不同）→ ✅ 真 explore。

---

---

# §3 文件加载（v2.0 重构 · explore 故意比 strict 少 80% 文件）

> **v2.0 设计哲学**：explore 是探索 DS 之外的 mode。如果给 AI 看完整 DS catalog / selection rules / 23 个 component 展示 → AI 本能反应是"按 DS 选组件" → 跟探索精神冲突。所以 explore **故意只给 base spec + chrome-mandatory API**。

| 文件 | 何时 Read | 大小 |
|------|----------|------|
| `design-system/AI-USAGE.md` | **每次必读** | ~3.5k |
| `design-system/api-cheatsheet.md` | 用 chrome-mandatory 组件时（HeaderBox / FilterBox / DataTable / I18nField / DetailPage / PageHeader）| ~2k |
| `agione-console-shell-sample-v1.html` | **永远不 Read**（用 `cp`）| 180k |
| `design-system/foundations/**/*.html` | **不 Read**（token / typography 规则已内联在 AI-USAGE）| - |
| `scripts/audit-typography.sh` | 生成完跑（info-only，不阻断）| - |
| `scripts/check-explore-variants.sh` | 出完 2-3 variant 跑 | - |

**explore 故意没有的文件**（跟 strict 的关键差异）：

| strict 有 | explore 故意没有 | 理由 |
|----------|----------------|------|
| `catalog.md`（DS 组件总览）| ❌ | 引导按 DS 选组件 |
| `selection-rules.md`（选 DS 组件的决策树）| ❌ | 跟探索精神反向 |
| `components/L1/` + `L2/`（23 个组件展示）| ❌ | 引导原样复用 |
| `components/templates/`（4 个 page partial）| ❌ | 引导布局复制 |
| `agione-design-system.html`（458KB DS 全景）| ❌ | 引导整体复制 |

**如果你（AI）在 explore 里想拿 `<KpiCard>` / `<MetricsStrip>` / `<HeroBand>` 等 DS 选用组件**：
- 这些组件 API explore 故意不给——目的是强迫你**自创**业务卡
- 真的非要用？两条路：
  1. **自己造**：用 `var(--ui-*)` token + `.type-*` class 写一个类似视觉的自定义卡
  2. **切 skill**：跟用户说"这个用 strict skill 现成的 KpiCard 更好"，切到 `agione-ui`

---

# §4 输出前自检（精简版）

每个 variant 必须过：

- [ ] JS 语法：`sed -n '/<script>/,/<\/script>/p' v.html | sed '1d;$d' | node --check`
- [ ] Logo 完整：两个 base64 ≥ 20000 字符
- [ ] Token 覆盖：颜色 / 间距 / 圆角 / 阴影 / 动效 全用 `var(--*)`
- [ ] Typography：业务区无 inline `font-size`（`audit-typography.sh` info-only）
- [ ] Scenario Switcher：多状态页面已实现，chip 在 TopNav 右侧
- [ ] **AI-NOTES 顶部块完整**（variant 编号 / approach / ds-status / tradeoff）

**整套 variant 自检**（出完所有 variant 跑一遍）：

```bash
bash scripts/check-explore-variants.sh slug-v1.html slug-v2.html slug-v3.html
```

应该输出：
```
✅ 全部 variant 合规
```

如果报错 "构图过近 / Jaccard > 0.80"，说明 variant 是"假 explore"，**必须重写差异度最高那两个**。详见 §2.5。

---

# §5 Explore → Strict 收敛流程（v1.1 引入）

> explore 的产出是**探索阶段**——最终要落地必须收敛到 strict skill。这一节定义清晰的交接路径，避免 "explore 永远是 explore，落不了地"。

## 5.1 何时该收敛

| 信号 | 行动 |
|------|------|
| 用户说"我选 V2 了 / 就用第二个" | ✅ 立刻提醒切 strict |
| 用户说"V2 不错，但 X 处再改改" | ⚠️ 看改动大小：小改在 explore 里 refine；大改切 strict |
| 用户说"这三个都不满意，再来一轮" | ❌ 继续 explore（重新 3 个 variant）|
| 用户问"怎么交付给前端 / PM" | ✅ 必须切 strict（explore 不是交付物）|

## 5.2 收敛动作（推荐回复模板）

当 AI 检测到上面"✅ 切 strict"信号时，**主动给用户**：

> ✅ 你选定 **V2**（slug-v2.html）。
>
> 接下来建议：
> 1. 把 `slug-v2.html` 复制成 `slug.html`（最终交付名）
> 2. 切换到 `agione-ui` skill（strict 模式）
> 3. 跑 strict 收敛：`/agione-ui --edit slug.html "按 strict 规则收敛 — 守 4 硬约束 + 5 底线 + 跑 audit-typography.sh 到 0 violation"`
> 4. 我会在 strict skill 里做这些收敛工作：
>    - 把 V2 里破的 KpiCard ≤ 3 约束改回去（如果有）
>    - 把 V2 里的 subtitle 收紧（如果是 AI 脑补的）
>    - 把 V2 里 inline style 抽 class（如果 > 50 处）
>    - 跑 `audit-typography.sh` 修违规
>    - 在文件顶部加 `<!--AI-NOTES--> converged-from: slug-v2.html` 标记

## 5.3 收敛标记（VS strict 区分）

收敛后的文件**顶部必须有标记**，让后人知道这是从 explore 来的：

```html
<!--AI-NOTES
converged-from: credit-dashboard-v2.html
original-explore-approach: "Sankey 流向 + 时间线"
converged-at: 2026-05-20
strict-adjustments:
  - 把 V2 的 8 KPI 砌墙改回 3 KPI + MetricsStrip（违反 strict 4 硬约束①）
  - subtitle 去掉（V2 的 "fancy subtitle" 不符合 strict 默认不传）
  - typography audit 通过：0 violations
AI-NOTES-->
```

## 5.4 收敛后 explore 文件的处理

收敛完成后，原 explore 文件**不要删**——它是设计决策的证据：
- 留在原位（用户自己决定是否归档到 `explore-archive/{slug}/`）
- 6 个月后用户可以回看为什么当时选 V2 而不是 V1/V3

---

# §6 跟 strict skill 的关系

| 资产 | 来源 | 同步策略 |
|------|------|--------|
| `agione-console-shell-sample-v1.html` | `agione-ui` 为源 | 手动同步（strict 改了你跟一次）|
| `agione-design-system.html` | `agione-ui` 为源 | 手动同步 |
| `design-system/` 目录（catalog / selection-rules / api-cheatsheet / partials / components / foundations）| `agione-ui` 为源 | 手动同步 |
| `scripts/` | `agione-ui` 为源 | 手动同步 |
| **本 `SKILL.md`** | 独立 | 不同步 |
| **`design-system/AI-USAGE.md` 中 explore-specific 章节** | 独立 | 不同步 |

**同步命令**（owner 操作）：`bash scripts/sync-from-strict.sh`（v1.0 创建）

详见 `MAINTAINING.md`。

---

**当前版本**：v2.0（用户指出 explore 不该有完整 DS——会强烈引导按 catalog 选组件。重构去 DS 化：删 catalog/selection-rules/components/partials/agione-design-system.html；裁 api-cheatsheet 到 6 chrome-mandatory；改 sync-from-strict.sh；改 AI-USAGE 4 层决策流为 explore-oriented；体积从 ~1.5MB 砍到 584KB）
**Owner**：wangwei
**Created**：2026-05
