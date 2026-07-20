---
name: agione-prototype-prep
description: >
  需求讨论结束后，通过三阶段交互流程，帮助产品整理面向 UI 原型生成的完整原型说明。
  阶段 1（诊断）：读取 REQ 文档，确认角色，选定当前角色。
  阶段 1.5（功能模块划分）：从业务对象和流程推导菜单→页面→功能，由用户确认。
  阶段 2（字段补齐）：逐页向用户提问并提供选项，用户选择后填入 prototype-[角色].md。
  支持小型模式（仅有 brief.md 时跳过对象识别，从功能模块分配表直接推菜单）。
  所有信息都通过"我问你选"的方式确认，AI 不自行发明任何业务决策。
  触发方式：/agione-prototype-prep [REQ 路径]
---

# Prototype Prep Skill

> **核心原则**
>
> 1. **AI 不做产品决策** — 所有页面内容、字段选择、布局安排都由用户决定
> 2. **问 + 选 > 提取 + 猜** — 即使文档中已有定义，也要呈现给用户确认
> 3. **一次只讨论一个页面** — 不要同时铺开所有页面，逐个推进
> 4. **选项优先 + 纵排 + 开放兜底** — 每个问题先给 2-4 个推荐选项，**每个独立成行**（不要 `A. xxx  B. yyy  C. zzz` 横排——窄终端会自动换行导致编号和内容错位），最后附"其他"
> 5. **业务口径先于页面字段** — 逻辑字段、自动解析关系和数据库字段不会因为存在就自动进入界面

---

# PART 1 · 触发与输入

## 1.1 触发方式

```
/agione-prototype-prep [REQ 目录路径]
```

**示例**：
```
/agione-prototype-prep knowledge-base/02-projects/agione-platform/requirements/REQ-2026-001-account-foundation
```

如果用户没有提供路径，询问用户要整理哪个 REQ。

## 1.2 输入文件

按以下顺序读取：

| 优先级 | 文件 | 用途 |
| --- | --- | --- |
| 1 | `brief.md` | 角色、范围、约束 |
| 2 | `solution.md` | 对象模型、页面清单、业务规则 |
| 3 | `flow.md` | 流程、状态流转 |
| 4 | `functions/*.md` | 功能说明书（可能不完整） |
| 5 | `prototype.md`（如已存在） | 已有页面定义，必须与当前稳定口径核对；不盲目保留旧规则 |
| 6 | `tech-solution.md`（如存在） | 数据模型、API 字段参考 |
| 7 | `changelog.md`、`Extends` / `Supersedes` 关系（如存在） | 识别最新决定、被替代规则和受影响文档 |

全局上下文：

| 文件 | 用途 |
| --- | --- |
| `knowledge-base/00-overview/platform-role-matrix.md` | **角色权威来源**：租户类型、业务身份、子模块角色名、内置角色码 |
| `knowledge-base/02-projects/agione-platform/product-concept-doc.md` | 业务域、商业化架构 |
| `templates/prototype-template.md` | 输出格式 |

## 1.3 前置检查

前置检查：
- brief.md 不存在 → 中止，提示用户先运行 /agione-req-intake
- solution.md 不存在 → 询问用户：
    "solution.md 不存在，请确认：
     A. 这是小型需求（brief.md 复杂度=小），启动**小型模式**：跳过对象识别，
        基于 brief.md 的功能模块分配表直接推菜单
     B. 这是中/大型需求，请先运行 /agione-req-refine 补充 solution.md / flow.md / functions/
     C. 我现在就口述对象/规则清单，跳过 solution"

### 1.3.1 小型模式（仅有 brief.md 时）

如果用户选 A，整个 prep 流程相对标准模式做以下简化：

| 阶段 | 标准模式 | 小型模式 |
|------|---------|---------|
| 阶段 1 诊断 | 读 brief + solution + flow + functions | 只读 brief.md，角色字段直接列出 |
| 阶段 1.5 模块划分 | Step 1 业务对象识别 | **跳过 Step 1**，从 brief.md「功能模块分配表」提取候选模块 → 用户确认 |
| 阶段 1.5 菜单建议 | 同标准 | 同标准（基于已确认的模块） |
| 阶段 2 字段补齐 | 选项参考含 solution / flow / functions | 选项参考标注全部为 brief.md §X 或「行业常规」 |

小型模式下，待 PM 拍板的字段级细节直接写入 prototype-[角色].md 末尾的「待确认问题」章节，不再回写 functions/。

### 1.3.2 口径一致性前置门禁

进入角色诊断前必须先完成：

1. 从 brief、acceptance、solution、flow、functions、changelog 和已有 prototype 中提取核心规则、明确不做项、角色权限和字段可见性。
2. 根据最新 Owner 决定及 `Extends` / `Supersedes` 关系确定当前稳定口径；输入文件的读取顺序不代表冲突优先级。
3. 整理新旧关键词并使用 `rg --no-ignore` 检索整个 REQ 和关联 REQ，输出冲突位置。
4. 业务规则冲突时停止受影响页面：上游可由 `/agione-req-refine` 维护的，先回到 refine；brief / acceptance 冲突的，先回到 `/agione-req-intake`。不得只在 prototype 文档里选择一个版本继续。
5. 已有 prototype 中的旧口径必须替换或明确标记废弃；“已有定义”不是保留理由。

---

# PART 2 · 阶段 1：诊断报告

## 2.1 原型架构：一个角色 = 一个独立 HTML

**铁律**：每个业务身份角色生成一个独立的 HTML 原型文件，不合并。

角色来源为 `knowledge-base/00-overview/platform-role-matrix.md` §4 的**业务身份**层。每次执行时必须动态读取该文件获取最新角色列表，不依赖以下硬编码示例。

当前已知角色示例（仅供参考，以 `platform-role-matrix.md` 实时内容为准）：

| 业务身份 | 原型文件命名 | 典型菜单域 |
| --- | --- | --- |
| `eu` | `prototype-eu.md` → `eu.html` | Overview / Projects / API Keys / Finance / 成员额度 |
| `provider` | `prototype-provider.md` → `provider.html` | 同 EU + Earnings |
| `operator` | `prototype-operator.md` → `operator.html` | Platform Overview / 客户充值记录 / 组织账户 / 平台流水 / 收益结算 |
| `admin` | `prototype-admin.md` → `admin.html` | 菜单管理 / 权限管理 / 系统设置 |

**注意**：
- 角色以 `业务身份` 为粒度拆分，不以子模块角色名（如 `[ModelOne] Provider`）拆分
- REQ 中涉及的项目级角色（如 `Project Admin`、`Developer`）是 EU 角色的**权限子集**，它们的页面在 EU 原型中通过菜单可见性控制体现，不单独出原型
- 如果某个 REQ 只涉及部分角色，只为涉及的角色输出 prototype 文件
- 如果 `platform-role-matrix.md` 中新增了业务身份，诊断报告中自动呈现，无需修改本 Skill

## 2.2 诊断目标

读取所有文件后，输出一份**精简诊断报告**，只确认两件事：

1. 本 REQ 涉及哪些角色
2. 先做哪个角色

**不在诊断阶段列出页面清单**——因为页面/模块划分可能还不存在，这是阶段 1.5 要解决的。

## 2.3 诊断报告格式

```markdown
# REQ-YYYY-NNN 原型准备诊断报告

## 已读取的文件
- brief.md ✅
- solution.md ✅
- flow.md ✅ / ❌ 缺失
- functions/ [N] 个文件
- platform-role-matrix.md ✅

---

## 1. 本 REQ 涉及的角色（请确认）

| # | 业务身份 | 原型文件 | 备注 |
|---|---------|---------|------|
| 1 | `eu` | prototype-eu.md | 含 Project Admin / Developer 的权限子集 |
| 2 | `provider` | prototype-provider.md | EU 页面 + Earnings 独有页面 |
| 3 | `operator` | prototype-operator.md | 独立平台入口 |

是否正确？有没有漏掉或多余的？

---

## 2. 你想先做哪个角色？

- A. `eu` — 功能最核心，其他角色可以复用其页面定义
- B. `operator` — 页面预计最少，最快完成
- C. `provider` — 和 EU 大量重叠，建议 EU 后再做
- D. 其他
```

## 2.4 诊断阶段的交互

用户确认角色清单并选定一个角色后，进入阶段 1.5。

---

# PART 2.5 · 阶段 1.5：功能模块划分

> **为什么需要这一步**
>
> 需求讨论过程是发散的，不会提前划分好"有哪些菜单、每个菜单下有哪些页面、每个页面有哪些功能"。
> 这些边界需要 AI 帮用户从讨论结果中**提炼出来**，再由用户确认。
>
> 本阶段的目标：为所选角色确定 **菜单结构 → 页面清单 → 每页核心功能**。

## 2.5.1 核心原则

1. **从对象和流程推导页面，不从页面推导功能**
   - 先识别文档中出现的业务对象（如 Project、Key、Transaction、Quota）
   - 再识别围绕每个对象的操作（CRUD、状态变更、查询、审批）
   - 最后把对象+操作组织成页面
2. **AI 提出划分方案，用户确认/调整**
   - AI 不是问"你想要哪些模块"，而是说"基于文档，我建议这样分，你看对不对"
3. **同样用选项方式**
4. **先区分业务对象与页面信息**
   - 对象存在于 solution、代码或数据库中，只证明它是领域事实
   - 只有角色需要查看、判断、输入或操作的信息，才进入页面和字段候选
   - 系统自动解析、仅用于内部归属、幂等或审计的字段默认标记为“逻辑层，不展示”

## 2.5.2 执行步骤

### Step 1：业务对象识别

从 brief/solution/flow 中提取该角色涉及的所有业务对象，呈现给用户：

```markdown
## [角色名] — 业务对象识别

从需求文档中识别到以下业务对象和操作：

| # | 对象 | 关键操作 | 来源 |
|---|------|---------|------|
| 1 | Credit Account | 查看余额、充值、查看流水 | solution §6 |
| 2 | Project | 创建、查看列表、查看详情、归档/恢复 | solution §7 |
| 3 | Personal Key | 创建、查看明文、轮换、启停、限额 | solution §8 |
| 4 | Project Key | 创建、查看明文、轮换、启停、限额 | solution §8 |
| 5 | Member Quota | 查看、申请、审批、直调 | solution §9 |
| 6 | Transaction | 查看列表、筛选、导出、查看详情 | solution §6 |
| ... | | | |

有没有遗漏或多余的？
- A. 全部正确
- B. 需要增加（请说明）
- C. 需要删减（请说明）
```

### Step 2：菜单分组建议

基于确认的对象，AI 提出菜单分组方案：

```markdown
## [角色名] — 菜单结构建议

基于上面的业务对象，建议这样组织 Sidebar 菜单：

**方案 A（按业务域分组）：**

| 菜单项 | 包含对象 | 包含操作 |
|--------|---------|---------|
| Overview | 跨对象摘要 | 余额、异常、快捷入口 |
| Finance | Credit Account + Transaction | 余额、充值、流水 |
| Projects | Project + Project Key | 项目CRUD、预算、项目Key管理 |
| API Keys | Personal Key + Project Key | Key的创建/管理/限额 |
| 成员额度 | Member Quota | 额度查看、申请、审批、设置 |

**方案 B（把 API Keys 并入 Projects）：**

| 菜单项 | 包含对象 | 包含操作 |
|--------|---------|---------|
| Overview | 跨对象摘要 | 余额、异常、快捷入口 |
| Finance | Credit Account + Transaction | 余额、充值、流水 |
| Projects | Project + Project Key + Personal Key | 项目+所有Key管理 |
| 成员额度 | Member Quota | 额度查看、申请、审批 |

**方案 C：** 其他（请描述）

你倾向哪个？
```

### Step 3：页面拆分

菜单确认后，逐个菜单项拆分页面：

```markdown
## [角色名] — Finance 菜单下的页面拆分

Finance 菜单覆盖 Credit Account 和 Transaction 两个对象。

你希望怎么组织页面？

**方案 A（3 页分离）：**
1. Finance Overview — 余额摘要 + 最近交易 + 快捷入口（Dashboard 类型）
2. Top-up — 充值流程（表单/操作页）
3. Transactions — 全量流水列表（表格类型）

**方案 B（2 页合并）：**
1. Finance Home — 余额 + 充值入口 + 流水列表全合在一页
2. Top-up — 充值流程（弹窗或独立页）

**方案 C：** 其他

你倾向哪个？
```

对每个菜单项重复此步骤，直到全部页面确定。

### Step 4：页面功能确认

每个页面确定后，确认其核心功能：

```markdown
## [角色名] — Transactions 页面功能确认

这个页面的主要功能有哪些？

**建议（基于文档中的 Transaction 对象和流程）：**

1. ✅ 流水列表展示
2. ✅ 按条件筛选
3. ✅ 导出 CSV
4. ✅ 查看交易详情（弹窗）
5. ？ 高级筛选（是否需要折叠式完整筛选区？）

- A. 1-4 就够了
- B. 全部都要（1-5）
- C. 还要加其他功能（请说明）
```

### Step 5：模块划分汇总

全部页面和功能确认后，输出汇总：

```markdown
## [角色名] — 模块划分汇总

| # | 菜单项 | 页面 | 页面类型 | 核心功能 |
|---|--------|------|---------|---------|
| 1 | Overview | Overview Home | Dashboard | 余额摘要/最近交易/异常提醒/快捷入口 |
| 2 | Finance | Finance Overview | Dashboard | 余额卡片/充值入口/交易摘要 |
| 3 | Finance | Top-up | 表单页 | 金额选择/支付渠道/确认 |
| 4 | Finance | Transactions | 列表页 | 流水表格/筛选/导出/详情弹窗 |
| 5 | Projects | Project List | 列表页 | 项目表格/创建/筛选 |
| 6 | Projects | Project Detail | 详情页(Tabs) | Overview/Members/Usage/API Keys/Settings |
| ... | | | | |

总计 [N] 个页面。

- A. 全部确认，进入字段级补齐（阶段 2）
- B. 需要调整（告诉我编号）
```

## 2.5.3 如果文档已有页面划分

如果 solution.md 或 prototype.md 中已经有明确的页面清单（如 REQ-001 的 solution §4），
先通过 1.3.2 的口径门禁，再进入确认模式。发现已有页面包含被替代字段或动作时，必须先清理旧定义，不能把它作为默认选项继续确认。

```markdown
## [角色名] — 模块划分确认

文档中已有以下页面划分（来自 solution.md §4）：

[列出已有页面清单]

- A. 全部按现有划分
- B. 需要调整（告诉我哪里）
- C. 需要大幅重新划分

> 注意：即使选 A，后续仍会逐页确认字段级细节。
```

## 2.5.4 阶段 1.5 的输出

本阶段确认完毕后：

1. 立即在 prototype-[角色].md 中写入 §2（角色说明）和 §3（Sidebar 菜单结构）
2. 在 §4 中写入页面骨架（页面名 + 页面类型 + 功能列表），字段暂留空
3. 输出进度报告，进入阶段 2

---

# PART 3 · 阶段 2：逐页交互补齐

## 3.1 核心原则：问 + 选

**每个问题必须遵循这个格式：**

```markdown
### [页面名] — 问题 N/M

[问题描述 + 上下文]

**选项：**
- A. [推荐选项，附简要说明]
- B. [备选项]
- C. [备选项]
- D. 其他（请描述）

> 参考：solution.md §X 定义了 [相关字段]...
```

**规则：**

- 每个问题附带 2-4 个具体选项 + 1 个"其他"
- 选项不是泛泛而谈，而是**具体到字段名、列名、控件类型**
- 选项基于已确认的角色任务和页面目标生成；solution 对象字段、tech-solution 数据字段、行业常识和已有原型只能作为候选证据，不能直接证明字段需要展示
- 用户可以直接回复字母选择，也可以自由描述
- 每个问题附带上下文参考（从哪个文档推导出来的）
- 提出字段选项前逐项标注：`当前角色输入 / 当前角色可见 / 其他指定角色可见 / 逻辑层不展示`。缺少明确页面任务依据的字段不得进入 A/B/C 展示方案

## 3.2 每个页面的标准提问流程

进入某个页面的补齐时，按以下**固定顺序**提问：

### Step 1：页面定位确认

```markdown
### [页面名] — 页面定位

这个页面的核心目标是什么？

**选项：**
- A. [从 solution/prototype 推导的目标描述]
- B. [备选理解]
- C. 其他

> 参考：prototype.md 中的描述是"[引用]"
```

### Step 2：页面类型

```markdown
### [页面名] — 页面类型

这个页面适合用什么布局？

**选项：**
- A. 列表页（表格）— 数据密集、需排序筛选
- B. 列表页（卡片）— 视觉资产、状态突出
- C. Overview Dashboard — KPI 卡片 + 图表 + 快捷入口
- D. 详情页（Tabs）— 多维数据只读展示
- E. 其他
```

### Step 3：内容区块（核心）

根据页面类型不同，提问不同的问题：

**如果是列表页（表格）：**

```markdown
### [页面名] — 表格列定义

这个列表展示 [对象名] 的记录。solution.md 中定义了以下字段：
[列出对象的所有字段]

你希望在列表中展示哪些列？

**选项：**
- A. 精简版（5-6 列）：[具体推荐列名]
- B. 标准版（7-9 列）：[具体推荐列名]
- C. 完整版（10+ 列）：[具体推荐列名]
- D. 自定义（告诉我你想要哪些列）

> 参考：solution.md §5 "[对象名]" 的字段有 [字段列表]
> 参考：tech-solution.md 的数据库表结构有 [额外字段]
```

```markdown
### [页面名] — 筛选条件

这个列表需要哪些筛选？

**选项：**
- A. 轻量筛选：搜索框 + 1 个状态 Select
- B. 标准筛选：搜索框 + 状态 + 类型 + 时间范围
- C. 完整筛选：搜索框 + 多个 Select + 时间范围 + 金额范围
- D. 自定义
```

```markdown
### [页面名] — 行操作

每行数据可以执行哪些操作？

**选项：**
- A. [从 flow.md 主流程推导的操作列表]
- B. [增减后的操作列表]
- C. 自定义

> 参考：flow.md §4.X 中描述的操作有 [操作列表]
```

**如果是 Overview Dashboard：**

```markdown
### [页面名] — KPI 卡片

Overview 顶部需要哪些数据卡片？

**选项：**
- A. [推荐 3-4 个 KPI]
- B. [备选组合]
- C. 自定义

每个卡片需要包含趋势指示吗？
- A. 是，显示环比变化
- B. 否，只显示当前值
```

```markdown
### [页面名] — 快捷入口

需要哪些快捷操作入口？

**选项：**
- A. [从 prototype.md 推导]
- B. [增减后的列表]
- C. 自定义
```

**如果涉及弹窗/抽屉：**

```markdown
### [页面名] — [操作名] 弹窗

[操作名] 用什么方式承接？

**选项：**
- A. Dialog（小弹窗，适合 ≤6 个字段）
- B. Drawer（右侧抽屉，适合复杂表单）
- C. 跳转新页面

弹窗/抽屉中需要哪些字段？

**选项：**
- A. [推荐字段列表 + 控件类型]
- B. [精简版]
- C. 自定义
```

### Step 4：状态 Badge 确认

```markdown
### [页面名] — 状态标签

这个页面中 [对象名] 有以下状态值（来自 flow.md）：
[列出状态值]

它们的 Badge 颜色映射是否正确？

| 状态 | 推荐 Badge 色 | 前缀 |
|------|-------------|------|
| Active | Green | ● |
| Pending | Orange | ◐ |
| ... | | |

- A. 全部正确
- B. 需要调整（告诉我哪个）
```

### Step 5：确认收尾

```markdown
### [页面名] — 确认汇总

以上选择汇总如下：

[列出该页面的所有决定]

- A. 全部确认，进入下一个页面
- B. 需要修改某项（告诉我编号）
```

### Step 6：Mock 数据指导（列表页 / Dashboard 必问）

对于列表页和 Dashboard 类型的页面，在确认收尾后追问一轮 mock 数据：

```markdown
### [页面名] — Mock 数据指导

这个页面的原型需要展示样例数据。你希望怎么处理？

- A. AI 自动生成合理的样例数据（推荐）
- B. 我提供关键数据样例（请贴入）
- C. 用占位符即可，不需要真实感的 mock 数据

需要注意的特殊数据场景：
- 是否需要展示“金额为 0”的场景？
- 是否需要展示“状态混合”的多行数据？
- 是否有特定的业务编号格式（如 TXN-2026-XXXXXX）？
```

对于表单页、弹窗等简单页面，跳过 Step 6。

## 3.3 提问批量化策略

为了避免对话轮次过多，可以在**同一轮**中合并多个相关问题：

- 同一页面的"列定义 + 筛选 + 行操作"可以合并为一个消息
- 简单页面（只有列表 + 弹窗）的全部问题可以一次问完
- 复杂页面（Dashboard / 多 Tab 详情页）仍逐步问

**合并示例：**

```markdown
## Transactions（交易流水）— 一次性确认

### Q1：表格列
solution.md 中 Transaction 对象有：transactionNo / transactionType / inOutFlag / changeAmount / afterAmount / bizType / bizId
tech-solution.md 额外有：operator_id / remark / created_at

你希望展示哪些列？
- A. 标准版（7列）：交易编号 / 时间 / 类型 / 方向 / 金额 / 余额 / 来源
- B. 完整版（9列）：+ 操作人 / 备注
- C. 自定义

### Q2：筛选
- A. 搜索 + 类型 + 时间范围
- B. 搜索 + 类型 + 方向 + 时间范围 + 金额范围
- C. 自定义

### Q3：行操作
- A. 仅"查看详情"（弹窗）
- B. "查看详情" + "导出单条"
- C. 自定义

### Q4：详情弹窗
点击行后弹窗展示完整信息。弹窗用：
- A. Dialog（只读卡片式展示）
- B. Drawer（右侧展开，可能含关联信息）

可以直接回复如 "A B A A" 快速选择。
```

## 3.4 已有 functions/ 的页面处理

对于已经有功能说明书的模块（如 Member Quotas），**不跳过**，但改为确认模式：

```markdown
## Member Quotas Home — 确认（functions/ 已定义）

functions/ 中的 Member Quota 说明书已定义了以下内容：

- 成员额度列表：granted / used / remaining / 状态
- 筛选：按状态、按额度范围、按是否允许创建 Key
- 行操作：直接追加/扣减额度、跳转 Member Detail

是否按此定义生成原型？
- A. 全部按 functions/ 定义
- B. 需要调整（告诉我哪里）
```

---

# PART 4 · 输出规则

## 4.1 文件结构：按角色拆分

每个角色的原型说明独立成文件：

```
REQ-YYYY-NNN/
  prototype-eu.md          ← EU 角色原型说明
  prototype-provider.md    ← Provider 角色原型说明
  prototype-operator.md    ← Operator 角色原型说明
  prototype.md             ← 保留为总览索引（可选）
```

## 4.2 何时输出

**不是等所有页面都确认完才输出。** 采用增量写入方式：

- 每确认完一组页面（通常 2-3 个），立即写入/更新对应角色的 prototype 文件
- 用户可以随时中断，已确认的部分不丢失
- 下次继续时从上次中断的位置开始

## 4.3 输出格式

严格按照 `templates/prototype-template.md` 的结构。

每个角色的 prototype 文件**自包含**——包含该角色完整的菜单、页面、弹窗、Badge、Mock 数据定义，
agione-ui Skill 只需读取单个文件即可生成该角色的 HTML 原型。

自包含不等于复制历史口径。文件必须记录本次采用的稳定来源和已废弃规则；上游决定变化时，直接替换受影响页面、字段和操作，不同时保留新旧两套定义。

## 4.4 跨角色页面复用

如果多个角色共享相同页面（如 EU 和 Provider 的 Finance 页面完全一致）：

- **即使与其他角色相同，也必须完整写入该角色的 prototype 文件**，不做引用
- 保证每个 prototype-[角色].md **完全自包含**，agione-ui 只需读取单个文件即可生成
- 在采访第二个角色时，对于已在先前角色中确认的相同页面，用确认模式快速通过：

```markdown
### Finance Overview — 复用确认

这个页面与 EU 角色的 Finance Overview 定义完全一致。

- A. 确认一致，复制完整定义到 prototype-provider.md
- B. 有差异（告诉我哪里不同）
```

## 4.5 版本号

- 阶段 1 诊断后：不改版本号
- 每次阶段 2 写入后：版本号 +0.1（如 v0.6 → v0.7 → v0.8）
- 该角色全部页面确认完毕后：版本号改为 vX.0-ready（如 v1.0-ready）

## 4.6 写入后报告

每次写入后，输出简要报告：

```markdown
## 已更新 prototype-[角色].md

本轮确认：
- ✅ Transactions 页面（7列 + 3筛选 + 详情弹窗）
- ✅ Finance Overview 页面（4 KPI + 最近交易列表 + 快捷入口）

整体进度（当前角色 [角色名]）：
- 总页面 [N] 个，已确认 [M] 个，剩余 [K] 个
- 下一轮建议确认：[页面列表]

全局进度：
- eu: [已完成/总数] | provider: [已完成/总数] | operator: [已完成/总数]
```

---

# PART 5 · 全流程示例

```
用户：/agione-prototype-prep knowledge-base/.../REQ-2026-001-account-foundation

─── 阶段 1：诊断 ───

AI：[读取所有文件]
    → 输出诊断报告（3 个角色：eu / provider / operator）
    → "你想先做哪个角色？"

用户：eu

─── 阶段 1.5：功能模块划分 ───

AI：## EU — 业务对象识别
    识别到 6 个对象：Credit Account / Project / Personal Key / Project Key / Member Quota / Transaction
    → "有没有遗漏？A.正确 / B.增加 / C.删减"

用户：A

AI：## EU — 菜单结构建议
    方案 A（5 个菜单）：Overview / Finance / Projects / API Keys / 成员额度
    方案 B（4 个菜单）：Overview / Finance / Projects（含Key）/ 成员额度
    → "你倾向哪个？"

用户：A

AI：## EU — Finance 菜单页面拆分
    方案 A（3 页）：Finance Overview / Top-up / Transactions
    方案 B（2 页）：Finance Home（合并）/ Top-up（弹窗）
    → "你倾向哪个？"

用户：A

AI：[继续其余菜单的页面拆分...]
    → 最终输出模块划分汇总表（12 个页面）
    → "全部确认，进入字段级补齐？"

用户：A

AI：[写入 prototype-eu.md §2-§3-§4 骨架]

─── 阶段 2：逐页字段补齐 ───

AI：## Finance Overview — 一次性确认
    Q1 页面类型：A.Dashboard / B.列表+顶部摘要
    Q2 KPI 卡片：A.余额+当月消费+当月充值 / B.余额+当月消费+待结算 / C.自定义
    Q4 快捷入口：A.充值+查看流水 / B.充值+查看流水+查看项目 / C.自定义

用户：A A A B

AI：## Transactions — 一次性确认
    Q1 列定义：A.标准7列 / B.完整9列 / C.自定义
    Q2 筛选：A.搜索+类型+时间 / B.搜索+类型+方向+时间+金额 / C.自定义
    Q3 行操作：A.仅查看详情 / B.查看详情+导出
    Q4 详情弹窗：A.Dialog / B.Drawer

用户：B A A A

AI：## Top-up（充值）— 一次性确认
    Q1 页面类型：A.独立页面 / B.弹窗
    Q2 金额选择：A.预设4档(500/1000/2000/5000)+自定义 / B.纯自定义输入 / C.预设6档+自定义
    Q3 支付渠道：A.支付宝+Stripe / B.仅支付宝 / C.自定义
    Q4 汇率展示：A.固定显示"1 CNY = 100 Credits" / B.不展示

用户：A A A A

AI：[写入 prototype.md Finance 模块部分]
    → "Finance 模块已确认，进入 Projects 模块？"

... 如此循环直到全部页面确认
```

---

# PART 6 · 质量规则

## 6.1 选项生成规则

- 选项必须**具体到字段名**，不能是"简单版/复杂版"这种抽象描述
- 选项必须附带**推导来源**（从 solution §X / flow §X / tech-solution 表名）
- 如果上游文档完全没有相关信息，选项来源标注"行业常规"
- 推荐选项用 `A.` 打头，AI 认为最合适的放 A

## 6.2 禁止行为

- ❌ 不允许跳过任何页面不问就直接填
- ❌ 不允许用"根据常规做法"默认填入字段而不经过用户确认
- ❌ 不允许一次性铺开所有页面的问题（除非用户要求）
- ❌ 不允许修改上游文档（brief / solution / flow / functions）
- ❌ 不允许在选项中使用 agione-ui Skill 的内部术语（如 `--space-xl`、`§5.3`）
- ❌ 不允许把实体、API、数据库或内部处理字段直接转换成表单项、筛选项、列表列或详情字段
- ❌ 不允许因“已有 prototype/HTML 中存在”而保留与最新稳定口径冲突的页面内容
- ❌ 不允许用户在原型阶段改变核心业务规则后只修改 prototype；应暂停受影响页面并回到有权维护上游口径的 Skill

## 6.3 允许行为

- ✅ 可以从 tech-solution.md 的数据库字段中发现潜在线索，但只有存在明确角色任务时才作为页面选项；否则标记为逻辑层字段
- ✅ 可以参考已通过口径一致性检查的 HTML 原型推导视觉和交互选项；历史或已废弃 HTML 不能作为业务字段来源
- ✅ 可以从行业通用做法推导选项，但必须标注"行业常规"
- ✅ 可以在用户选择后追问细化（如用户选了"自定义"）

# PART 7 · 中断与恢复

## 7.1 随时可中断

用户可以在任何时候中断对话。中断前 AI 必须：

1. 把已确认的内容写入 prototype.md
2. 输出当前进度报告
3. 标注下次恢复的位置

## 7.2 恢复方式

下次触发 `/agione-prototype-prep` 时，如果 prototype.md 已有部分内容：

1. 读取已有 prototype.md
2. 识别已完成和未完成的页面
3. 从第一个未完成页面继续

```markdown
## 恢复上次进度

上次已确认 [M]/[N] 个页面：
- ✅ Finance Overview
- ✅ Transactions
- ✅ Top-up
- ⬜ Project List（未开始）
- ⬜ ...

从 Project List 继续？
```

---

# PART 8 · 与下游 Skill 的接口

## 8.1 单角色完成标志

当一个角色的所有页面都确认完毕后，先执行完成门禁：

1. 按新旧口径关键词使用 `rg --no-ignore` 复查该 REQ 的所有 prototype 文件和上游输入。
2. 当前有效 prototype 中的相反字段、动作、状态和说明必须清零，不能用新段落覆盖旧段落。
3. 残留的领域字段必须明确标注“逻辑层不展示”；历史 HTML 必须有废弃标记或被排除说明。
4. 输出检索关键词、修改文件、废弃资料和允许保留的残留命中。存在未解决冲突时不得标记 `v1.0-ready`。

门禁通过后，AI 输出：

```markdown
## ✅ prototype-[角色].md 已就绪

[角色名] 的 [N] 个页面已全部确认，版本已更新为 v1.0-ready。

你可以用以下方式触发该角色的原型生成：

/agione-ui 基于 [REQ路径]/prototype-[角色].md 生成 [角色].html 原型

---

其他角色进度：
- [角色2]：未开始
- [角色3]：未开始

是否继续下一个角色？
- A. 继续 [角色2]
- B. 先去生成当前角色的 HTML 原型
- C. 暂停
```

## 8.2 全部角色完成标志

当 REQ 的所有角色都完成后：

```markdown
## ✅ REQ-YYYY-NNN 全部原型说明已就绪

| 角色 | 文件 | 页面数 | 状态 |
|------|------|-------|------|
| eu | prototype-eu.md | 12 | v1.0-ready |
| provider | prototype-provider.md | 14 | v1.0-ready |
| operator | prototype-operator.md | 5 | v1.0-ready |

可以逐个触发 agione-ui 生成 HTML 原型。
```

## 8.3 prototype 文件对 agione-ui 的承诺

每个 prototype-[角色].md 保证自包含 agione-ui 需要的所有信息：

| agione-ui 需要 | prototype-[角色].md 提供 |
| --- | --- |
| 页面类型 | §4 每页的"页面类型"字段 |
| 表格列 | §4 表格区块 |
| 表单字段 | §5 弹窗字段表 |
| Badge 颜色 | §6 Badge 映射表 |
| Sidebar 菜单 | §3 菜单结构 |
| Mock 数据 | §8 数据指导 |
| 空/错误态 | §7 页面状态要求 |

agione-ui 只需读取**单个 prototype-[角色].md** 即可生成该角色的完整 HTML 原型文件。
