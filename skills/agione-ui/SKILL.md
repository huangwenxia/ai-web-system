---
name: agione-ui
version: 6.9.8
description: >
  AGIOne Console UI prototype generator (**strict mode, v6.0+**). Produces single-file
  HTML prototypes that feel like the real product — consistent, professional,
  bilingual (中/EN), Light/Dark, strictly aligned with production mamba-layout.

  Trigger for any **PM-review / production-aligned** prototype request: list pages,
  form pages, detail pages, overview dashboards, shell/chrome-only reviews, anything
  referencing the AGIOne design language.

  **NOT for exploration / multi-variant / DS-外 visual experiments** —— use the
  sibling skill `agione-ui-explore` instead. If user says "explore / 探索 / 几种方案 /
  超出 DS / 创新视觉", politely suggest switching to `agione-ui-explore`.
---

# AGIOne Console UI Skill — v6.9.8 (Strict-only / Production Aligned · Dashboard chapter)

> **设计哲学**
> 本 skill 分两个层级：
> - **锁定层**（Chrome + Design DNA）：像素级执行，同事间保持视觉一致
> - **发挥层**（组件 + 页面内容）：遵循设计语言原则，AI 自行判断构图与细节
>
> 你是一名有审美判断力的高级前端工程师，不是像素搬运图。
> 在锁定层之外，优先考虑"这个页面是否美观、层次是否清晰"，而不是"是否精确遵守了某个数值"。

> **v3.16 结构说明 · v6.8 更新**：本文件经过 v6.3-v6.7 累积加固后约 **~900 行**（v6.7 加默认克制后增长，v6.8 加 mamba token alias 章节）。**重复内容**（完整 token 表 / Chrome 像素细节 / 38 个原子组件规则 / Scenario Switcher 实现 / 字型 / Badge 词汇 / token 列表等）**已迁移到 `design-system/`**。AI 主路径 → `design-system/AI-USAGE.md`，本文件作为基础铁律 + 设计原则的最小集。

> **v4.0 Token Alignment**：全部 CSS 变量已重命名为 `--ui-*` 前缀，**与生产项目 `mamba-layout` npm 包 100% 对齐**。原型代码内的 token 引用可直接粘贴到 project-mamba 仓库，零 rename。详见 §1.5。

---

# §0 调用模式

## 0.1 三种调用方式

| 模式 | 指令 | 说明 |
|------|------|------|
| **A · 从 prototype 文件生成** | `/agione-ui --from <prototype-角色.md>` | 读取原型说明，按其菜单/页面/字段/Badge/Mock 生成完整 HTML |
| **B · 自由描述** | `/agione-ui <需求描述>` | 单页面快速验证 |
| **C · 增量改** | `/agione-ui --edit <existing.html> <修改描述>` | 已有原型上加页面 / 改某段（见 §0.2）|

**Token 提示**：同一 REQ 下有 F002/F003 等后续功能时优先用 `--edit`，不要每次重生成。Chrome / 公共组件已存在，只 Edit `<main>` 增量。

## 0.2 增量修改（--edit）执行规则（v6.3 加固 · 局部 Read 不是整文件 Read）

1. **rg -n 找编辑锚点**：`rg -n "AGIONE_EDIT_MAIN_START" target.html` 找业务区行号；shell-sample 自带 7 个 `AGIONE_EDIT_*_START/END` 锚点（详见 §1.2）
2. **Read 目标 HTML 局部**：`Read target.html offset:<锚点行号> limit:30-80`——**只读锚点附近**，**禁止 Read 整文件**（210KB ≈ 75-85k token 实测，会重伤 input）
3. **⛔ 绝不 Read LOGO 区**：`rg -n "AGIONE_LOGO_DANGER" target.html` 先拿实际行号（**别信文档里的死行号，行号会随版本漂移**）——区内 2 行 base64（36k + 38k 字符单行，实测 ~22k token），Read 错窗口直接爆
4. **用 Edit 工具精准修改**，禁止 Write 整文件（破坏 cp+Edit 工作流）
5. **只改 `<main>` 内容**：Chrome / 变量 / Logo / PrototypeComponents 不允许动
6. **定位到对应页面的 `v-show` 区块内部**精准 Edit，不替换整块
7. **保持原有 mock**：只新增需要的，不动已有数据
8. **不输出整文件到对话**：用户用浏览器看效果

## 0.3 本 skill 是 strict-only（v6.0 起）

> **v6.0 拆分**：原 §0.3 双模式已废弃。本 skill 现在 **100% strict**，专做生产对齐、PM 评审、产品交付级原型。
>
> **需要探索 / 多 variant / DS 之外尝试？→ 用 `agione-ui-explore` skill**

如果 prompt 出现下列关键词，**应该停下来提醒用户切到 explore skill**，不要在本 skill 里硬做：

- "探索 / explore / 不局限于 DS / 超出 DS / DS 之外"
- "几种方案 / 多种风格 / 看看可能性 / 创新视觉 / fresh take"
- "试试不一样的 / 跳出框架"

**推荐回复模板**：

> 你这个需求像是要探索几种方向。我建议切到 `agione-ui-explore` skill（专做 2-3 variant 并排 + 鼓励 DS 之外尝试）。如果确实只要一个 strict 原型，告诉我我就在这里做。

**本 skill 的契约**：
- 每次 1 个原型
- 严格按 `design-system/catalog.md` + `selection-rules.md` 选组件
- 跟生产 mamba-layout 视觉对齐
- 守所有 4 条信息架构硬约束
- typography audit 强制 0 violation

## 0.4 Rule-gap 逃生口（v3.16 引入）

> 约束系统不可能覆盖所有边界场景。本机制让 AI 在判断规则不合适时**显式标记而非隐性破坏**。

**触发条件**：AI 判断某条铁律 / 决策树在当前场景明显不合适、强守反而产出更差结果时。

**先排除：不需要 rule-gap 的场景** ⚠️
- **L3 业务卡自由场景**（§1.4-14）：业务卡形状自定义、自定义视觉元素（Sankey / 双轨 Hero / event-stream / quota grid 等）只要守了 5 条底线，**这是 §1.4-14 明文允许的正常行为，不要走 rule-gap**
- **DS catalog 没有的组件**：本来就在 L3 自由层，不存在"违反规则"

**禁止行为**：
- ❌ 默默不守规则，假装规则不存在
- ❌ 因为难以判断就放弃规则（默认必须守）

**正确行为**：在生成的 HTML 文件**顶部 `<!--AI-NOTES-->` 块内**显式记录：

```html
<!--AI-NOTES
rule-gap:
  - rule: §1.4-6 Scenario Switcher       # 写完整路径锚点：§<章>.<节>-<编号>
    scene: 本页虽含 5 个订单状态，但 PM 实际只评审默认态，多出 Switcher 反而散焦
    decision: skip
  - rule: §1.4-12.2 REQ 明文宽度
    req-value: width: 1200px
    ds-suggest: width: 720px
    reason: 1200px 在 1440px 视口下溢出可视区，dark mode 下尤其难看
    decision: ds-override
AI-NOTES-->
```

**`rule:` 字段格式约定**：必须给完整路径锚点（如 `§1.4-6` / `§1.10-9` / §4.x），让 owner 一眼定位。**禁止只写"组件按等级使用"这种描述性引用**，否则 owner 要在 §1.4 / §1.10 / §4 之间猜要查哪节。

**`decision:` 字段枚举值**：
- `skip` — 完全跳过该规则
- `ds-override` — 偏离 DS 推荐做某种自定义（**仅当违反规则时用**；L3 业务卡自由不算违反）
- `partial-comply` — 部分守、部分不守，已说明理由

**Owner 处理 rule-gap 的标准动作**：
- **规则真有漏** → 把例外补进 SKILL.md / selection-rules（rule-gap 变成显式例外）
- **AI 误判** → 在该 prompt 加澄清，下次让 AI 守规则
- **每次 review 必看 `<!--AI-NOTES-->`**，不然约束系统会停止演化

> ⚠️ **不要滥用**。rule-gap 不是"我懒得遵守"的借口，是"规则跟现实不匹配"的反馈通道。每个 rule-gap 都应该让 owner 学到点新东西。

## 0.5 重新设计触发器（v4.9 引入 · 必读）

> §0.2 的镜像规则：默认偏向 `--edit` 增量改省 token，但**当用户明确要求"重新设计"时，增量改是错误行为**——会复用上一版的构图/层次/视觉决策，无论怎么改都"换汤不换药"。

**触发关键词**（prompt 出现任意一个 → 强制走完整重生成路径）：

- 中文：**重新设计** / **重做** / **推翻重来** / **重新生成** / **从头来** / **抛弃旧版** / **不要基于上一版** / **换一种思路** / **完全不一样**
- 英文：**redesign** / **start over** / **from scratch** / **fresh take** / **rethink the layout**

**触发后的强制行为**：

1. ❌ **禁止** 走 `--edit` 路径，即使用户提供了旧 HTML 文件路径
2. ❌ **禁止** Read 旧 HTML 之后照搬其布局 / 卡片排布 / 信息分组 / 视觉焦点
3. ✅ **从 shell-sample cp 一份全新文件**，按 L2/L3 重新构图
4. ✅ **可以** Read 旧版本，但**仅用于理解"用户为什么不满意"**——不作为新版的结构起点
5. ✅ 重生成后在 `<!--AI-NOTES-->` 顶部记录：
   ```html
   <!--AI-NOTES
   redesign:
     trigger: "用户说『重新设计这个页面』"
     old-version: by-prototype.html
     reason-for-redesign: 旧版数字砌墙、5 张同型 KPI 卡视觉单调
     new-approach: 改用 Dual-Hero + 时间线，主焦点放消耗趋势而非余额堆叠
   AI-NOTES-->
   ```

**反例（违反此规则）**：

```
用户：「这个 dashboard 重新设计一下，太丑了」
❌ 错误：Read 旧 HTML → Edit 调整颜色和间距 → 结构没动
✅ 正确：从 shell-sample cp 新文件 → 重新选组件树 → 重新决定层次
```

**为什么要专门定一条规则**：AI 默认偏向"低成本增量改"省 token，但用户说"重新设计"时正是因为**结构本身就是问题**——增量改无法解决结构问题，只会反复打磨一个错的骨架。

---

# §1 工程基础（铁律 · AI 必读）

## 1.1 输出格式

每次输出都是**单文件可在浏览器直接打开的 HTML**，包含完整功能。

## 1.2 Chrome 零漂移工作流（⚠️ 最高优先级）

**核心原则**：所有原型必须以 `agione-console-shell-sample-v1.html` 为起点，Chrome 字节级一致，不允许重新手写或简化。

### 推荐工作流：`cp` + `Edit`

```bash
# Step 1：文件级复制（0 token，0 漂移）
cp [skill-dir]/agione-console-shell-sample-v1.html ./[新原型].html
```

`[skill-dir]` = skill 加载时的 base directory（如 `~/.claude/skills/agione-ui/`）。**AI 自动用 Bash 执行**。

**Step 2**：用 Edit 工具精准修改下表可改区域，其余字节级保持。

### 锁定区域（Edit 禁止触碰，cp 已包含）

| 区域 | 内容 |
|------|------|
| `<style>` 内 `:root { }` | 全部 CSS 变量（设计 DNA，详见 shell-sample 字节级源）|
| App Shell CSS（`.app .body .main`）| 布局 |
| TopBar / Sidebar CSS | chrome 像素 |
| `darkVars` / `lightVars` JS 对象 | 主题切换数据 |
| **`LOGO_DARK` / `LOGO_LIGHT` JS 常量** ⚠️ 易漏 | base64 logo 字符串（每个 ~25KB）必须**完整复制**，禁止替换为占位符 / 注释 / 短链 |
| `PrototypeComponents` JS 对象 | 全部 23 个运行时组件（HeaderBox / KpiCard / DataTable / I18nField / ...，签名见 `design-system/api-cheatsheet.md`）|
| `i18n` 对象基础结构 | 双语骨架 |
| `<nav class="topnav">` 完整 HTML | 顶栏 DOM |
| `<aside class="sidebar">` 完整 HTML | 侧栏 DOM（菜单项可按页面调整） |

### 可改区域（Edit 工具仅修改这些位置，每个区域有 AGIONE_EDIT_*_START / _END 锚点）

| 区域 | 锚点 | 修改方式 |
|------|------|---------|
| `<title>` | `AGIONE_EDIT_TITLE_*` | Edit 替换为双语标题 |
| Sidebar 菜单项 + `activeNav` 初始值 | `AGIONE_EDIT_SIDEBAR_*` | Edit 替换/新增业务菜单 |
| `i18n` 对象 | `AGIONE_EDIT_I18N_*` | Edit 增加 zh/en 嵌套 key，**不删原有** |
| `<main>` 区域内容 | `AGIONE_EDIT_MAIN_*` | Edit 替换占位 → 写业务内容（**唯一需要"创作"**） |
| **setup() 业务 ref / reactive** | `AGIONE_EDIT_SETUP_DATA_*` （v6.8 加）| Edit 在 chrome ref（activeNav 等）后追加业务 ref |
| **setup return 业务 key** | `AGIONE_EDIT_SETUP_RETURN_*` （v6.8 加）| Edit 在 chrome 返回 key 后追加业务 key |
| `darkVars` / `lightVars` 增量 token | `AGIONE_EDIT_THEME_VARS_*` | Edit 末尾追加业务专用色（**禁止改已有值**） |

> **Dashboard 页型**（v6.9）：参考实现在 `design-system/partials/dashboard.partial.html`（跟 list / detail / overview 三个 partial 同机制），完整契约在 `design-system/dashboard.md`——决策树 ⑪ 命中才加载，**非 dashboard 页零负担**（shell-sample 内不再有 demo 区）。

> ⚠️ 锁定区域如需调整，**先升级 shell-sample**，禁止单原型私改。

### 🛡️ Anchor-driven 安全 cp + Edit 协议（v6.3 必读 · 防 Read 爆 input）

**核心问题**：`Edit` 工具要求"调用前必须有过 Read"。如果 AI 偷懒 Read 整个 cp 出来的文件（180KB ≈ 150k token），就抹掉了 `cp` 节省的全部价值。

**协议步骤**（每次 Edit 前严格走一遍）：

```bash
# 1. cp 起手（0 token）
cp [skill-dir]/agione-console-shell-sample-v1.html ./target.html

# 2. rg -n 找锚点行号（Bash 调用，~50 token）
rg -n "AGIONE_EDIT_MAIN" target.html
#   → 2430:  <!-- AGIONE_EDIT_MAIN_START · ... -->
#   → 2452:  <!-- AGIONE_EDIT_MAIN_END -->

# 3. Read offset/limit 局部（覆盖即将 Edit 的范围，~200-1500 token）
Read target.html offset:2430 limit:25     # 只读 <main> 占位区
# ❌ 禁止: Read target.html (无 offset → 整文件)

# 4. Edit 精准修改（old_string 来自上一步 Read 的内容）
Edit target.html old_string:<占位 HTML> new_string:<业务内容>
```

**LOGO 危险区禁读（v6.3 加固 · v6.9 去死行号）**：

```bash
# ⚠️ 行号随版本漂移（v6.3 时在 ~2248，v6.9 已在 ~2675）——永远用 rg 拿实时行号：
rg -n "AGIONE_LOGO_DANGER" target.html
# 区内 2 行 base64：LOGO_DARK (36,956 字符) + LOGO_LIGHT (38,608 字符)
# 共 ≈ 22k token 单次 Read（v6.9 实测，chars÷3.5 base64 dense 比）
```

- ❌ **绝对禁止 Read 包含 LOGO_DARK / LOGO_LIGHT 行的窗口**（offset 必须 > `AGIONE_LOGO_DANGER_END` 的实际行号）
- ❌ **绝对禁止 Edit LOGO 内容**——LOGO 由 cp 自动带来，永远不需要 Edit
- ✅ 如需 Read LOGO 附近上下文，先 rg 拿 `AGIONE_LOGO_DANGER_END` 行号，offset 从其后开始

**partial Read 必须覆盖 Edit 范围**（不依赖工具细节）：
- Edit 的 `old_string` 必须从你**当前对话已 Read 的实际内容**里取，不要靠 SKILL.md 文档约定的"模板字符串"猜
- 工具可能在某些情况只看 "any prior Read"，但**不要赌**——按"partial Read 覆盖 Edit 范围"的纪律走最稳

### 兜底工作流（仅当无 Bash 时）

退化为 Read + Write。Logo 防漏检：
- ❌ `'data:image/svg+xml,...'` 占位符
- ❌ `// LOGO base64 omitted` 注释
- ❌ `iVBOR...` 短链截断
- ✅ **必须完整粘贴两个常量的全部 base64**

## 1.3 AI 文件加载（Token 关键）

> 🆕 **AI 主路径**：Read `design-system/AI-USAGE.md`（~3.5k token，含 4 层决策流 + Foundations 内联规则 + Scenario 契约 + 自检清单）。**不必读完整 SKILL.md 主体**。本文件主要给 skill 维护者看。

| 文件 | AI 何时 Read |
|------|------------|
| `design-system/AI-USAGE.md` | **每次必读**（~3.5k） |
| `design-system/catalog.md` | 组件选型时（~2.5k） |
| `design-system/selection-rules.md § N` | signal=TREE-N 时（~1k / 棵）|
| `design-system/api-cheatsheet.md` | 选定组件后查 props（~2.5k）|
| `agione-console-shell-sample-v1.html` | **永远不 Read**（用 `cp`）|
| `agione-design-system.html` | **绝对禁读**（458KB / ~150k token） |
| `design-system/components/**/*.html` | 仅 signal=READ 时（~1-3k / 个）|
| `design-system/foundations/**/*.html` | 不 Read（已内联 AI-USAGE）|

**单次原型 input 预算**：~15-25k token（vs 旧方案 150k，降 6-10×）。

## 1.4 工程铁律（11 条核心）

1. **显式闭合**：所有 `el-*` 和图标组件必须有闭合标签，禁止自闭合
2. **无 mustache 属性**：禁止 `placeholder="{{x}}"`，必须用 `:placeholder="x"`
3. **设计 token 优先**：所有有对应 CSS 变量的属性必须用变量，禁止硬编码（详表见下文 §1.5）
4. **Lucide 初始化**：Vue mount 后立即 `lucide.createIcons()`
5. **app 引用分步**：禁止链式 `Vue.createApp({}).use(...).mount()`，必须保存 app 引用
6. **多状态 / 多角色页面必须实现 Scenario Switcher** ⚠️（**位置铁律：顶部 TopNav，永远不允许漂移**）
   - 触发条件：≥ 3 状态分支 / 用户描述含"演示 / 评审 / 不同状态 / 切换查看" / 强状态机（订单流 / 审批流 / 配额 / 订阅）
   - **唯一动作**：在 `setup()` 中给 `scenarios` reactive 对象赋值（≥ 2 个 key），其余**全部由 chrome 自动完成**。**禁止自己写任何切换 UI**。
   - **契约见 `design-system/AI-USAGE.md` § Scenario Switcher 契约**

   **位置锚点（chrome 自动渲染，不要重复造）**：
   ```
   ┌─ TopNav ─────────────────────────────────────────────────┐
   │ [Logo] [Tabs]    [💡 演示场景：X ▾] [🔍][📄][🌐][🌓][U] │  ← ✅ 切换 chip 唯一位置
   ├──────────────────────────────────────────────────────────┤
   │ 💡 当前演示场景：X · 仅评审用，非真实数据                  │  ← ✅ 非默认场景自动 banner
   ├──────────────────────────────────────────────────────────┤
   │ [Sidebar]  │  [Main Content]                              │
   │ ❌ 不放    │  ❌ 不放                                      │
   │            │  ❌ 不放（不要做 segmented tabs / 卡片选择器）│
   └──────────────────────────────────────────────────────────┘
   ```

   **明确禁止（这些是历史漂移的样子，AI 不要再发明）**：
   - ❌ Sidebar 加 "演示场景" / "模式切换" 菜单项 / sub-section
   - ❌ Main 顶部加 segmented tabs / radio-group / dropdown 选 scenario
   - ❌ PageHeader / HeaderBox 的 `actions` slot 里塞场景下拉
   - ❌ HeroBand `right` slot 里放场景选择卡
   - ❌ 自己写一个新的 `.scenario-bar` / `.demo-switcher` CSS class
   - ✅ **唯一正确**：`const scenarios = reactive({ normal: {...}, empty: {...}, ... })` —— chrome 自动出 chip + banner

   **可视化验证**：生成完原型后，用 Bash 跑 `grep -c "demo-mode-chip" prototype.html` 应得 1（仅 chrome 自带）；若 ≥ 2 说明 AI 自己重复造了。

   - **Rule-gap 出口**：如果触发条件满足、但 AI 判断本页 demo Switcher 实际价值低（如 PM 只评审默认态、多状态散焦），可走 §0.4 输出 `rule-gap: §1.4-6` 跳过，但**必须在 AI-NOTES 里说明为什么没价值**。默认行为仍是实现 Switcher，不要因为难就放弃
7. **真实组件对齐 + data-component 标记** ⚠️
   - 列表 / 管理页默认采用 §1.7 标准骨架
   - 所有组件实例必须带 `data-component="xxx"`，方便 HTML→Vue 转换识别边界
8. **多语言字段必须用 `<I18nField>`** ⚠️
   - 表单内同字段多语言填写**必须**用此组件，禁止自己拼 input 数组 / "中文 / 英文" 双框
   - props 见 `design-system/api-cheatsheet.md`
9. **所有 `<el-form>` 必须用 `<div class="form-modern">` 包裹** ⚠️
   - 必备结构：`.form-modern > el-form > .form-group > .form-group__head + el-form-item + .form-helper > .form-actions`
   - `el-form-item` 用 `size="large"`（40px 高），不要 default
   - **无 `<el-form>` 时此规则豁免**（如纯 radio + checkbox 的简单选择）
10. **Radio 必须按数据特性选 4 variant** ⚠️
    - 禁止 EP 默认 `<el-radio>`
    - 决策：含副描述 → `.radio-card` / 2-4 互斥强切换 → `.radio-segmented` / 横排紧凑 → `.radio-pill` / 默认 90% → `.radio-circle`
    - 详见 `design-system/selection-rules.md § ⑥`
11. **字体走 `.type-*` utility class** ⚠️（v5.1 加固）
    - **禁止在 `<main>` 业务区手写 `font-size / font-weight / line-height / font-family`**（包括 inline `style="..."` 和自定义 CSS class）
    - 11 个 class 覆盖 11-40px：`.type-display / display-sm / h1 / kpi / h2 / h3 / body / body-sm / caption / data / table-header`
    - **`.type-kpi`（v5.1 新增，28/700/mono/tabular-nums）** 用于业务卡焦点数字 / KPI 大数字，跟 `.kpi-card__value` 等价
    - 详表见 `design-system/AI-USAGE.md § Typography`
    - **REQ 描述词 → class 映射**（"大号字" / "主信息" / "灰色小字" 等）：见 AI-USAGE.md § Typography 触发词映射表
    - **颜色与字型解耦**：颜色用 `var(--*)` token 独立设置
    - **chrome 内置 class 豁免**（13 个，完整清单见 AI-USAGE.md § Chrome 自带 class 字号豁免）：`.header-box__title / .page-header__title / .hero-band__title / .kpi-card__value / .kpi-card__title / .kpi-card__trend / .status-badge / .tag / .empty-state__title / .balance-pill / .balance-pill__cta / .nav-* / .sidebar__*`
    - **AI 不允许覆盖 chrome class 的字号**（用 `style="font-size:..."` 强改 = 破坏视觉锁定层）
    - **验证**：`bash scripts/audit-typography.sh <prototype.html>` 应输出 0 violations

12. **保守生成原则**（v3.16 保留，⚠️ 高频问题）：
    - **REQ 没要求的不自加** —— 不要给 SKU 卡加 Active badge / 不要给静态卡加 Hover 飘字 / 不要给表单加 REQ 没提的字段
    - **REQ 明文优先** —— REQ 写"480px"用 480px，REQ 写"绿色"用 badge-green，REQ 写"Save X%"必须实现（包括 conditional 显示逻辑）
      - **Rule-gap 出口**：REQ 给的具体值在当前 chrome / DS 下产生明显违和（如 `width: 1200px` 撑爆视口、`#ff0000` 在 dark mode 完全消失）时，走 §0.4 输出 `rule-gap: §1.4-12.2`，标明 REQ 值 + DS 建议值 + 理由。**禁止**默默改值不告诉 owner
    - **不要把 REQ 表格当摆设** —— REQ 元素清单表里每一行都是必须实现的契约，不要跳过 conditional badge / 二次确认 / 校验逻辑
    - **保守判断字号** —— REQ 说"大号字 / 主信息"时映射到 `.type-display-sm`（32px），不是 `.type-h3`（16px）。详见 AI-USAGE Typography 触发词映射表

13. **禁止自动 Playwright 截图验证**（v4.1，⚠️ 性能问题）：
    - 生成完原型后**不要**自动调用 Playwright / Browser MCP / Chrome MCP 等浏览器工具截图验证视觉
    - 默认验证手段已足够：`node --check`（JS 语法）+ Bash grep（chip 位置 / token 残留 / Logo 长度）
    - 浏览器视觉确认交给用户自己 open
    - **唯一例外**：用户 prompt 中明确出现以下任一关键词时才允许：
      - "playwright" / "截图" / "screenshot"
      - "视觉验证" / "看效果" / "render check"
    - **理由**：Playwright 启动 + 渲染 + 截图单次 30-90s，绝大多数原型生成不需要这步；让用户自己浏览器打开 0 成本。

14. **L3 业务卡：自由 + 5 条底线**（v4.2，⚠️ 高频审美问题）：
    - **不强制统一卡片模板**——业务卡形状自由（GPU 详情卡 / 规格卡 / 反馈卡 / 商品卡…千变万化）
    - 但**任何自定义卡 / 自定义视觉元素都必须遵守 5 条底线**：
      1. **token 化**：圆角 / 阴影 / padding / 颜色 / 间距 / 动效全用 `var(--ui-*)`，禁硬编码
      2. **字号走 `.type-*` class**：禁手写 `font-size` / `font-weight` / `font-family` / `line-height`
      3. **同页同类卡字号一致**：列表 / 网格里并列的多张卡，标题字号统一（如都用 `.type-h3`，不要一个 h3 一个 h2）
      4. **视觉焦点数字用 `.type-display-sm`（32px）**：价格 / Token 量 / 主参数等卡片中部主数字，不要用 `.type-h1`（30px）
      5. **避免 inline style 堆叠**：单页 `<main>` 内业务区 inline style > 50 处时抽 `.<feature>-<part>` class 复用
         - **计入分母（应该抽）**：重复出现的样式块（同样 padding / background / border / spacing 组合在多处出现）
         - **不计入分母（不要硬抽）**：一次性 layout 表达式（如 `grid-template-columns: 200px 1fr` / `display: flex; gap: var(--ui-space-md)` / 单次 `align-items` `justify-content`）—— 这些抽 class 反而要发明语义且无复用价值
    - **完整规则 + 检查方法见 `design-system/AI-USAGE.md § L3 自定义协议`**

15. **信息架构与视觉节奏**（v4.3，⚠️ 最重要 — 防止"数字砌墙"）：
    - **KpiCard 不是万能砌墙工具**。组件守规则不等于页面好看，AI 容易把所有数据都堆成 KpiCard 网格 → 视觉灾难。
    - **3 条硬约束**：
      1. **KpiCard 上限 ≤ 3 个并列**（不是 4，不是 6）；≥ 4 个指标改用 `<MetricsStrip>`（4-6 个）/ 紧凑 K-V 列表（6-10 个）/ 表格（≥ 10 个或带筛选排序）
      2. **每个主 section 必须有 1 个"视觉焦点"**：display 字号大数字 / Hero 卡组 / 主图表，**禁止全等权重卡片并列 ≥ 4 张**
      3. **禁止套娃**：CardBox 内不要嵌 KpiCard / 另一个 CardBox（无信息层级，纯堆叠）
    - **2 个推荐模式**：
      - **Dual / Multi-Hero**：有"对比关系"的核心指标（Credit vs Quota / Income vs Expense） → 用 **2-3 张并列大 Hero 卡**，每张内含 head + display 数字 + breakdown，**不要拆成 4-6 个等权 KpiCard**
      - **业务语义 token**：业务有"对立 / 多层 / 分类"关系时，必须定义 `--biz-<feature>-<role>-*` token（如 `--biz-internal-fg` / `--biz-external-fg`），不要全用 `--ui-color-primary`（无语义、视觉单调）
    - **完整规则 + 视觉节奏底线 + 业务 token 命名规范见 `design-system/AI-USAGE.md § 信息架构与视觉节奏`**

## 1.5 必须用 token 的属性

| 属性 | ❌ 禁止 | ✅ 正确 |
|------|--------|--------|
| 颜色（背景 / 文字 / 边框）| `#09090b` | `var(--ui-text-primary)` |
| 主色 | `#5f4ecf` | `var(--ui-color-primary)` |
| 状态色 | `#22c55e` | `var(--ui-color-success)` |
| 边框 | `border: 1px solid #e4e4e7` | `border: 1px solid var(--ui-border-default)` |
| 阴影 | `box-shadow: 0 2px 8px rgba(0,0,0,.08)` | `box-shadow: var(--ui-shadow-md)` |
| 圆角 | `border-radius: 8px` | `var(--ui-radius-lg)` |
| 间距 | `padding: 16px` | `var(--ui-space-base)` |
| 动效时长 | `transition: .15s` | `var(--ui-duration-fast)` |
| 字族 | `font-family: 'Inter', sans-serif` | `var(--ui-font-body)` |
| 图标尺寸 | `width: 18px` | `var(--ui-icon-lg)` |
| z-index | `z-index: 100` | `var(--ui-z-dropdown)` |

完整 token 名单见 shell-sample `:root` 块 / `design-system/AI-USAGE.md`。

**可硬编码的例外**：
- 组件特定固定宽度：`width: 240px`（搜索框）/ `width: 256px`（侧边栏）
- `flex: 1` / `min-width: 0` / `overflow: hidden` 等纯布局
- 第三方品牌色（Alipay `#1677ff` / Stripe `#635bff` 等）— 必须加注释 `/* Alipay brand */` + scoped 子类（详见 AI-USAGE L3 协议）

## 1.6 颜色配对（防止 dark mode 错乱）

| 背景 | 必用文字色 | 禁止 |
|------|----------|------|
| `var(--ui-color-primary)` | `var(--ui-text-on-brand)` (= #fff) | `var(--ui-text-primary)` ❌ |
| `var(--ui-color-primary-subtle)` | `var(--ui-color-primary)` | `var(--ui-text-primary)` ❌（dark 下浅灰）|
| `var(--ui-sidebar-active-bg)` | `var(--ui-sidebar-active-fg)` | `#000` ❌ |
| `var(--ui-bg-card) / var(--ui-bg-page)` | `var(--ui-text-primary)` | `#000` `#fff` ❌ |
| `var(--ui-accent) / var(--ui-bg-muted)` | `var(--ui-text-muted)` | — |
| `--ui-topnav-bg` (#1a1025) | `var(--ui-topnav-foreground)` / `var(--ui-topnav-muted)` | 任何 light 色 ❌ |
| `--ui-color-{success/warning/destructive}-subtle` | 同色非 subtle 版 | — |

**Dark mode 配色口诀**：深色背景不用黑字，浅色背景不用白字；主色背景永远白字；用变量不用硬编码；不造新颜色。

## 1.7 标准列表页骨架

列表 / 管理页（占控制台 70%+）默认采用此骨架：

```css
.main-box { display: flex; flex-direction: column; height: 100%; }
.main-box > .el-scrollbar { flex: 1; min-height: 0; }
```

```html
<div class="main-box" data-component="main-box">
  <HeaderBox :title="pageTitle">
    <template #actions><el-button type="primary"><i data-lucide="plus"></i>新建</el-button></template>
    <FilterBox><!-- 筛选 --></FilterBox>
  </HeaderBox>
  <el-scrollbar>
    <div class="px-7 pb-7" data-scroll-box data-component="scroll-box">
      <DataTable :data="rows" :columns="columns" :total="total" v-model:page="page">
        <template #status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #operations="{ row }"><TableActions :actions="rowActions(row)" /></template>
      </DataTable>
    </div>
  </el-scrollbar>
</div>
```

> 列表 / 详情 / Overview / 向导 / 营销等其他骨架决策见 `design-system/selection-rules.md § ⓪`。

## 1.8 已知 CDN 坑

| 问题 | 错误 | 正确 |
|------|------|------|
| Element Plus 白屏 | `unpkg.com/element-plus`（裸路径）| 必须 `/dist/index.full.min.js` |
| 字体加载失败 | `fonts.googleapis.com`（国内被墙）| `cdn.jsdelivr.net` + fontsource |
| CSS 选择器无效 | `:deep(.el-xxx)` | 直接 `.el-xxx {}` |
| Lucide 不渲染 | `<script type="module" src="...lucide...">` | 去掉 `type="module"` |
| Unicode 乱码 | `¥` | 直接写 `¥` |

## 1.9 Vue 3 模板语法（强制）

> 用 Vue 3 CDN Global Build + `setup()` 选项式写法。**严禁混入 React / JSX 语法**。

| 用途 | ✅ 正确 | ❌ 禁止 |
|------|--------|--------|
| 模板插值 | `{{ expression }}` | `${...}` `${{...}}` |
| 属性绑定 | `:prop="expression"` | `prop={expression}` |
| 事件绑定 | `@click="handler"` | `onClick={handler}` |
| 类名 | `class="..."` `:class="..."` | `className="..."` |
| 内联样式 | `:style="{ color: x }"` | `style={{ color: x }}` |

**禁止清单**（每次生成前心智扫描）：
- ❌ 模板内出现 `${...}` / `${{...}}` / `className`
- ❌ `:style="{{ ... }}"` 双括号
- ❌ 长 `:style` 字符串未拆开（必须拆成对象 `{ fontSize: '14px', color: x }`，key 用 camelCase）
- ❌ 模板 `{{ }}` 里超过 1 个三元表达式 → 提取到 `setup()` 的 computed

### i18n 对象闭合规则（⚠️ 高频 Bug）

每次在 `i18n` 对象中添加新语言块（`en:`）之前，**必须确认上一个语言块（`zh:`）已用 `},` 正确闭合**。

```js
// ✅ 正确
const i18n = {
  zh: { title: '模型广场', add: '新建' },
  en: { title: 'Models',   add: 'Add'  }
};

// ❌ 错误 — zh 末尾只有逗号没有闭合 }
const i18n = {
  zh: { title: '模型广场', add: '新建',   // ← 缺少 }
  en: { title: 'Models',   add: 'Add'  }
  // 浏览器报 Unexpected token ':'
};
```

凡是 i18n 改动，扫一遍每个语言块的 `},` 收尾。

### i18n key 命名空间（对齐生产代码）

真实代码用 `vue-i18n` 命名空间 `t('common.btn.save')`。原型用嵌套对象模拟同结构：

```js
const i18n = {
  zh: {
    common: {
      save: '保存', cancel: '取消',
      btn: { add: '新建', delete: '删除' }
    },
    finance: { quota: { title: '配额管理' } }
  },
  en: { /* 同结构 */ }
};
// 模板：{{ t.common.btn.add }}（生产时 1:1 替换为 t('common.btn.add')）
```

### 数据规范

- 默认用静态 mock（`ref([...])` 硬编码数组），不用 `Math.random()` 作主展示值
- 复杂格式化（日期 / 金额 / 百分比）提取为 `setup()` 内纯函数，不内联模板

## 1.10 输出前自检清单（7 项，缺一不可）

- [ ] **1. 语法纯净**：无 React / JSX 残留
- [ ] **2. 无 `${...}`** 模板字符串污染
- [ ] **3. 字符串闭合**：`:style` 对象引号正确
- [ ] **4. `:style` 合法**：每个 `:style` 是合法 JS 对象字面量，key camelCase
- [ ] **5. Token 覆盖**：颜色 / 间距 / 圆角 / 阴影 / 动效 / 字族 / 图标尺寸 / z-index 全 `var(--*)`，无硬编码
- [ ] **6. i18n 闭合**：每个语言块 `},` 收尾
- [ ] **7. Logo 完整**：`LOGO_DARK` / `LOGO_LIGHT` base64 长度均 ≥ 20000
- [ ] **8. Scenario Switcher**：满足 §1.4-6 触发条件已实现，**且 chip 在 TopNav 右侧（chrome 自动渲染，不在 sidebar / main / page-header）**，Bash 验证：`grep -c demo-mode-chip` 应为 1，`grep -c demo-banner` 应为 1
- [ ] **9. 组件按等级使用**：DS catalog 内有的标准组件（`<HeaderBox>` `<KpiCard>` `<DataTable>` `<KvCard>` 等）必用对应标签，禁止重新发明；**但 L3 业务卡自由场景（§1.4-14）豁免** —— catalog 没有的视觉（Sankey / 双轨 Hero / event-stream / quota grid 等）属于合法 L3，**不要为此走 rule-gap**
- [ ] **10. 多语言字段已用 `<I18nField>`**（v3.10）
- [ ] **11. Form 已用 `.form-modern` 包裹**（v3.10，无 `<el-form>` 豁免）
- [ ] **12. Radio 按 variant 选用**（v3.10）
- [ ] **13. 字体走 `.type-*` class**（v3.10）

**快速验证**：

```bash
# JS 语法
sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' | node --check

# Logo 完整性
grep -E "^const LOGO_(DARK|LIGHT)" file.html | awk -F"'" '{print length($2)}'
# 输出两行，每行 ≥ 20000

# Typography 漂移检测（v5.1 加固）—— 应输出 0 violations
bash scripts/audit-typography.sh file.html

# Scenario Switcher 唯一性（v3.16）
grep -c "demo-mode-chip" file.html   # 应为 1（仅 chrome 自带）
```

---

# §2 设计语言（发挥层的原则）

> AI 在锁定层外构建组件 / 页面时的审美标准，不是像素规定。

## 2.1 视觉气质

**克制、专业、有层次。**
- 留白是设计的一部分，不要把每个角落都填满
- 不做炫技动效，交互反馈只用颜色变化 + 轻微阴影
- 信息密度：展示当前任务需要的，其余收起或折叠
- 颜色饱和度保持低调，主色只用在最重要的操作和激活态

## 2.2 层次原则

页面视觉重量由重到轻：

1. **主操作 / 页面标题** — 最突出，Manrope 大字重
2. **核心数据 / 列表内容** — 清晰可读，Inter 正文
3. **辅助信息 / 标签** — 弱化，muted 色，小字号
4. **边框 / 分隔线** — 只是结构线索，不是装饰

## 2.3 交互原则

- hover 只做颜色变化，不做位移 / scale（普通卡片表格行严禁位移）
- 150ms 默认过渡时长，感觉"快但不急"
- 危险操作必须二次确认 + destructive 色
- 状态反馈用色 + 图标 + 文字三重区分，不能只靠颜色
- 键盘焦点：`outline: 2px solid var(--ui-ring); outline-offset: 2px`，不要 `pointer-events: none` 屏蔽

## 2.4 排版原则

- 数字 / 时间 / ID / 代码片段 → IBM Plex Mono（用 `.type-data`，自带 tabular-nums）
- 中英文混排时中文同等字号，不缩小
- 不允许固定宽度文字容器（ID 列除外），用 flex 防溢出
- 禁止单词内断行：`word-break: keep-all; overflow-wrap: break-word`

## 2.5 信息韵律

> 从大量原型实践中提炼的"事实标准"，新原型应自觉遵循。

### Eyebrow → Title → Desc → Points 四段韵律

Overview / 详情 hero 区的标准信息阶梯：

```
[eyebrow]  ← 11px / 600 / uppercase / letter-spacing 0.5px / 主色，可选胶囊背景
[Title]    ← 24-32px / 700-800 / Manrope / foreground
[desc]     ← 13-15px / 400 / muted-foreground / line-height 1.6
[points]   ← 14px / 含 16px 主色 icon + strong（标题）+ muted（描述）
```

> 库内 `<HeroBand>` `<PageHeader>` 已固化此韵律。

**适用边界（重要 · 默认克制）**：

- 这套四段韵律**只用于 overview / 详情的 hero 区**（有沉浸感的落地页 / 详情页头），**不是每个页面都套**。
- **列表 / 表格 / 表单 / 设置类页面 → 页头只保留 `[Title]` 一行**：
  - **不要 eyebrow**。eyebrow 99% 是在重复"导航已经告诉用户的分区"——在「账务」分区里再顶一个 `BILLING` 纯属噪音，直接删。
  - **desc / 副标题可选，且仅当它给出标题之外的新信息**（口径、范围、单位、时间窗）才保留；若只是把标题换个说法复述一遍 → 删掉。
- eyebrow 即便在 hero 区也必须**承载上下文**（如详情页标明所属实体 / 批次 / 账期），**绝不只复述当前导航分区名**。

> 自检：把页头的 eyebrow 和副标题遮住，用户还能从标题 + 左侧导航判断"这是什么页"吗？能 → 这两行就是赘余，删。

### 外壳克制：一个区块只一层边界，不重复套框

html→code 最高频的视觉赘余是**双层边框 / 卡上套卡**。约束：

- **自带边框 / 卡片底色的组件（`<FilterBox>`、表格、`<KpiCard>`、`<MetricsStrip>`）外面不要再套一层带 `border` 的容器**。
- 一个区块**只允许一层视觉边界**：`border` 与"卡片 bg + radius"二选一，不叠加。
- 筛选区：用 `<FilterBox>` 自带框时，外层 wrapper 保持 `background: transparent; border: 0`；反之外层做卡、`<FilterBox>` 去框——**永远只留一层**。
- 表格区：`el-table` / 表格组件本身已是一张卡，**不要再包 `border + radius + bg` 的外层 section**。

> 自检：任一筛选 / 表格区，沿边数 border —— 只能数到 **1** 条。数到 2 条就是套框，拆掉外层。

### 三态进度阈值（80/100 双断点）

任何带阈值的进度（用量 / 配额 / 容量）必须遵循：
- `< 80%` → normal（主色）
- `≥ 80%` → warning（橙）
- `≥ 100%` → danger（红）

> 库内 `<UsageBar>` 已自动应用，禁止自定义其他阈值。

### 流程状态四色

显示流程进度时用 4 状态色（比通用 stepper 更精确）：
- `done`（紫透明）：已完成基础动作
- `doneGreen`（绿透明）：已通过审核 / 验证
- `current`（实心主色加粗）：当前正在进行
- `todo`（灰）：尚未开始

> 库内 `<StepPills>` 固化此规则。

### 5-cell 等分指标条

数据型详情页 hero 区**优先 5-cell 等分横条**而非"5 张独立卡片"：
- 信息密度更高
- cell 间用 1px `--ui-border-soft` 分隔，不用 gap
- 整体单一外框
- 适合：模型详情 / 节点详情 / API 详情等技术指标密集场景

> 库内 `<MetricsStrip>` 固化。卡片化场景仍用 `<KpiCard>` 网格。

### Drawer 三段式

右侧抽屉**强烈推荐**：
- 宽度 480-560px（数据多时可至 640px）
- header sticky（标题 + 关闭按钮）
- body 顶部第一屏放 3 列 summary stats
- footer sticky 放主操作（取消 + 主操作）

### FilterBar 三段布局

```
[search][filter1][filter2][filter3] <spacer/> [sort/view] [actions]
```

- 左：搜索 + 筛选条件
- 中：spacer（flex: 1）
- 右：视图切换 / 排序 / 主操作（如导出）

### Motion 动画（必用 anim-* preset class）

| 场景 | preset | 时长 + 缓动 |
|------|--------|-----------|
| 列表 / 卡片首次出现 | `.anim-stagger`（父加，子自动 30ms 错峰） | base + ease-out |
| 单个内容卡进入 | `.anim-fade-in` / `.anim-slide-in-up` | base + ease-out |
| Drawer 滑入 / 关闭 | `.anim-slide-in-right` / 反向 | slow + ease-in |
| Modal 弹出 | `.anim-scale-in` | base + ease-out |
| Toast | `.anim-slide-in-up` | base + ease-out |
| Tab 内容切换 | 新内容加 `.anim-fade-in` | fast + ease-in-out |
| CTA 按钮强调 | transition + `--ui-ease-spring` | base |

**4 缓动函数选型**：
- `--ui-ease-out` 进入 / hover（默认）
- `--ui-ease-in` 退出 / 离场
- `--ui-ease-in-out` 双向切换 / Tab
- `--ui-ease-spring` 仅"注意力反馈"场景

**红线**：
- 普通卡片 / 表格行 hover **严禁位移 / scale**
- Hero band 入口卡 / CTA "主行动强调"允许 -2px 位移 + ease-spring
- 不嵌套多层 anim-* class
- `prefers-reduced-motion` 已在 CSS 自动处理（@media 关闭装饰动画），禁止手动覆盖

## 2.6 Lucide 图标速查

常用图标名（按场景分组）：

| 场景 | 名称 | 场景 | 名称 |
|------|------|------|------|
| 搜索 | `search` | 删除 | `trash-2` |
| 新建 | `plus` | 下拉 | `chevron-down` |
| 编辑 | `pencil` | 展开 / 折叠 | `chevron-right` |
| 复制 | `copy` | 分页左 / 右 | `chevron-left` / `chevron-right` |
| 文档 | `book-open` | 错误 | `circle-x` |
| 语言 | `globe` | 成功 | `check` |
| 主题 | `sun` / `moon` | 设置 | `settings` |
| API Key | `key` | 数据库 | `database` |
| 模型 / CPU | `cpu` | 工具 | `wrench` |
| 发现 | `compass` | 终端 | `square-terminal` |

完整尺寸 token：`--ui-icon-xs/sm/base/md/lg/xl/2xl/3xl`（12/14/16/18/20/24/40/48px）。

---

# §3 组件 + 页面（精简，详见 design-system/）

> 大部分组件细节已迁移到 catalog / cheatsheet / selection-rules / components/。本节只列**必须由 SKILL.md 强制的接口规范**。

## 3.1 data-component 标记（强制）

> 这是 HTML→Vue 转换的桥梁，零视觉成本。所有组件实例必须带 `data-component` 属性。

```html
<!-- ✅ 正确 -->
<div class="header-box" data-component="header-box">...</div>
<KpiCard ... />  <!-- L1 全局组件，data-component 自动注入 -->

<!-- ❌ 错误 -->
<div class="header-box">...</div>  <!-- 少了 data-component -->
```

> 转换工具 / AI 通过 `data-component` 识别组件边界，DOM 树映射为 Vue 组件树。

## 3.2 组件选型（4 层决策）

AI 选组件时严格按 4 层顺序：

1. **Layer 0 · 页面骨架** → Read `design-system/selection-rules.md § ⓪`
2. **Layer A · SKILL.md 硬规则**（无 IO）→ form-modern / type-* / Radio variant / I18nField / Scenario Switcher
3. **Layer B · catalog 按意图定位** → Read `catalog.md`，12 意图桶 + signal 列（STOP / TREE-N / READ）
4. **Layer C · selection-rules 决策树**（按 signal 路由）→ 11 棵树覆盖（⓪页面骨架 + ①-⑩ 同意图多候选场景）

详细流程见 `design-system/AI-USAGE.md`。

## 3.3 多页面 → 单文件 HTML 导航映射

每个 prototype-X.md 定义多个页面（通常 5-15 个），全部组织在**单一 HTML 文件**中，通过 Sidebar 菜单项切换。

```js
// setup() 中
const activeNav = ref('overview');  // 默认页面 key
```

```html
<!-- Sidebar 菜单项：点击更新 activeNav -->
<div class="nav-item" :class="{ active: activeNav === 'finance' }" @click="activeNav = 'finance'">
  <i data-lucide="credit-card"></i> Finance
</div>

<!-- 主内容区：每页一个 v-show 区块 -->
<main class="main">
  <section v-show="activeNav === 'overview'"><!-- Overview --></section>
  <section v-show="activeNav === 'finance'"><!-- Finance --></section>
  <!-- ... -->
</main>
```

**规则**：
- 每菜单项一个唯一英文小写 key（如 `finance`、`api-keys`、`member-quota`）
- key 与 prototype 文件中的页面名对应，不随意发明
- 所有 `<section>` 同时存在于 DOM，用 `v-show` 控制（不用 `v-if`，保留状态）
- 页面切换时调用 `lucide.createIcons()` 重新初始化图标
- 禁止用路由 / iframe / 动态加载实现页面切换

## 3.4 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| `xl` | 1280px | 最低支持 |
| `2xl` | 1440px | **设计基准**，3 列卡片 |
| `3xl` | 1536px | 宽屏 |

- 列表卡片网格：≥ 1440px 3 列，1024-1440px 2 列
- < 1280px：可隐藏 Sidebar（Drawer 模式），TopBar 导航 Tabs 折叠隐藏

## 3.5 Shell-only 模式

用户只想看 chrome 时：`<main>` 区域降为空舞台（写一行 "Page content area" 或留白），但 TopBar / Sidebar / 主题切换 / 语言切换**必须完整可交互**。

## 3.6 L3 升级路径

设计师 review 时若发现 L3 自定义模式值得复用 → L3 → L2 升级是 skill owner 私有工作流，AI 不参与。
→ 升级完成后下次 AI 调用 skill 自动按 L2 用上。

---

# §4 交付自检

> 输出前过一遍，不通过不交付。

## 4.1 Chrome 完整性

- [ ] TopBar 结构与样式完全符合 shell-sample，右侧顺序正确
- [ ] **TopBar 左上角 logo 完整可见**（`LOGO_DARK` / `LOGO_LIGHT` base64 ≥ 20000）
- [ ] Sidebar 结构完全符合 shell-sample
- [ ] 主题切换真实生效（不是静态截图），Sun/Moon 图标正确切换
- [ ] 主题切换后 logo 仍显示正常（Light / Dark 两套都已完整复制）
- [ ] 语言切换生效，所有文案双语

## 4.2 工程健康

- [ ] 无自闭合 `el-*` 标签
- [ ] 无 `{{}}` 在 HTML 属性内
- [ ] 无硬编码颜色 hex
- [ ] 无硬编码 z-index 数字（全 `--ui-z-*` token）
- [ ] 无硬编码间距数字（全 `--ui-space-*` token 或有依据的例外）
- [ ] `lucide.createIcons()` 在 mount 后调用
- [ ] 控制台无报错
- [ ] **Vue 语法纯净**：无 `${...}` / `className` / `style={{ }}` / React/JSX 残留
- [ ] **i18n 闭合**：每语言块 `},` 收尾
- [ ] **JS 语法验证**：`sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' | node --check`
- [ ] **多场景 Scenario Switcher**：复杂状态机 / 多角色页面已实现（契约见 AI-USAGE）

## 4.3 设计一致性

- [ ] 所有颜色走 CSS 变量
- [ ] 圆角使用分级 token，未混用
- [ ] Badge 严格使用 7 套配色，状态映射符合 AI-USAGE Badge 词汇
- [ ] 数字 / 时间 / ID 用 IBM Plex Mono + `tabular-nums`（即 `.type-data` class）
- [ ] 字体层级符合 `.type-*` class
- [ ] 交互动效克制（150ms，无 scale / translate）
- [ ] 键盘焦点环可见
- [ ] 状态提示色 + 图标 + 文字三重区分

## 4.4 Rule-gap 自检（v3.16）

- [ ] 凡是 AI 主动跳过 / 改写某条铁律的，是否已在 HTML 顶部 `<!--AI-NOTES-->` 块里输出 `rule-gap:` 记录？（契约见 §0.4）
- [ ] 没有触发任何 rule-gap 的产物，不需要 `<!--AI-NOTES-->` 块

---

# §5 Peer Review 配合

## 5.1 用路径引用，不粘贴内容

执行 peer review 时用 `@路径` 引用文件，**禁止将 HTML 全文粘贴进对话**（通常 800-1500 行，消耗大量 context）。

```
✅ 高效：
请 review @[REQ路径]/prototype/eu.html，对照功能说明书 @[REQ路径]/functions/F001-*.md

❌ 低效：
[将 HTML 全文粘贴进对话]
```

## 5.2 Peer Review 两步标准

**Step 1 · 工程规范（前端研发自查）**
- [ ] 所有 el-* 和图标组件显式闭合
- [ ] 无属性字面量里的 mustache 语法
- [ ] 无硬编码色值（全 CSS 变量）
- [ ] Light / Dark 切换后显示正常
- [ ] 无控制台报错
- [ ] Lucide 已 `createIcons()`

**Step 2 · 功能覆盖（前端完成后同步 PM）**
- [ ] 功能说明书的每个功能都有对应页面
- [ ] 4 种状态可访问：空 / 加载 / 错误 / 权限不足
- [ ] 字段名与功能说明书一致
- [ ] 异常文案与功能说明书一致
- [ ] 权限逻辑与功能说明书一致

**结论**：
- **通过** — 可提交 PM 抽查
- **不通过** — 列出问题和文件位置，修复后重新提交

## 5.3 内容与双语

- [ ] 全部可见文案提供中英双语
- [ ] 无自创业务字段（信息不足时用合理占位）
- [ ] 错误 / 空状态 / 加载态有对应处理

---

> **版本**：v3.16 (Rule-gap) · **维护**：所有原型生成相关 AI rules 都在本文 + design-system/。skill 自身维护工作流为 owner 私有，不在仓库内。
