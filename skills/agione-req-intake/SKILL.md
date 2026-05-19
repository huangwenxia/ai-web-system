---
name: agione-req-intake
version: 1.1
description: >
  接收一条模糊原始需求 → 通过结构化多选/追问式采访挖清楚业务信息 → 自动生成并写回知识库：
  raw-demand-log.md、brief.md、acceptance-checklist.md。
  三轮采访：定性（来源/复杂度/紧迫度/归属）、业务（用户/痛点/期望/场景）、边界（本期做/不做/约束）。
  所有问题优先给 2-4 选项，AI 不脑补不发明业务规则；信息不足必须停下来问清楚。
  触发方式：/agione-req-intake，或告诉 AI 一条原始需求并要求开始需求采访。
---

# agione-req-intake Skill

## 用途

接收一条模糊原始需求 → 通过结构化多选/追问式采访挖清楚业务信息 → 自动生成并写回知识库：

- `99-inbox/raw-demand-log.md` — 收口记录
- `02-projects/agione-platform/requirements/REQ-YYYY-NNN-{slug}/brief.md` — 业务简报
- `02-projects/agione-platform/requirements/REQ-YYYY-NNN-{slug}/acceptance-checklist.md` — 验收 Checklist

## 触发方式

用户输入 `/agione-req-intake` 或者告诉 AI 一条原始需求，并要求开始需求采访。

---

## 执行规则（AI 必须遵守）

### 通用规则

1. **先问后写**：任何文档产出必须在采访完成、信息足够后才能开始，禁止边问边生成。
2. **优先给选项**：凡是有有限答案的问题，必须给 2-4 个选项让用户选，不要让用户凭空组织语言。
3. **选项纵排（CLI 友好）**：每个选项独立成行，禁止 `A. xxx  B. yyy  C. zzz` 横排在同一行——窄终端会自动换行导致编号和内容错位。统一格式见下方各 Q 模板。
4. **一轮最多 3 个问题**：不允许在一轮里堆砌超过 3 个问题。
5. **不自行脑补**：遇到信息不足，必须停下来问清楚，不允许自行推断业务规则。
6. **禁止问技术细节**：字段名、接口规范、状态机、异常处理不属于本阶段范畴，禁止出现在采访问题中。
7. **实时确认进度**：每轮问答结束后，展示「已掌握信息摘要」，让用户确认准确性。

---

## Step 1 — 接收原始需求

收到原始需求后，**不做任何评价，不做任何假设**，只是复述你理解的原始语义，然后开始 Step 2。

格式：
> 我理解你的原始需求是：「{复述}」，接下来我会通过几轮问答把它梳理清楚，开始第一轮。

---

## Step 2 — 第一轮：快速定性（必问，选择题为主）

**目标**：确定需求的归属、复杂度和优先级方向。

问题清单（每轮选最相关的 2-3 个）：

**Q1 — 需求来源**
> 这个需求是谁提的？
>
> A. 老板/领导口头传达
> B. 外部客户/用户反馈
> C. 内部团队发现
> D. 我自己发起

**Q2 — 复杂度初判**（可多选）
> 这个需求是否涉及以下任何一项？
>
> A. 跨系统/跨服务依赖
> B. 新表或新接口
> C. 支付/权限/安全/数据迁移
> D. 以上都没有（纯 UI 或逻辑调整）

**Q3 — 紧迫程度**
> 这个需求的时间压力是？
>
> A. 有明确上线死线（请说明）
> B. 下个迭代优先排进去
> C. 重要但不紧急
> D. 探索性，先看方向

**Q4 — 归属项目**（如果存在多个项目）
> 这个需求归属哪个项目？
>
> A. agione-platform
> B. 其他（请说明）

**Q4.5 — 与已有需求的关系**
> 这个需求是独立的新需求，还是某个已有 REQ 的扩展/补丁？
>
> A. 全新独立需求
> B. 已有 REQ 的扩展（请说明 REQ 编号）
> C. 不确定

**Q4.5 选 B 时的分支处理**（决定走"扩展分支"还是"新建 REQ 分支"）：

| 改动量 | 路径 | 本 Skill 后续动作 |
|-------|------|-----------------|
| 补丁 / 文案 / 小调整 | 不新建 REQ，在已有 REQ 目录追加 changelog.md 条目 + 更新对应 functions/Fxxx.md | 跳过 Step 6 文档生成，仅写 changelog 后结束 |
| 新增功能模块 / 改变核心规则 | 新建 REQ 编号，在 brief.md 头部标注 `Extends: REQ-YYYY-NNN` | 走完整 Step 6 流程 |
| 界限模糊 | 中止采访 | 让用户先和已有 REQ Owner 沟通定性后再回来 |

询问用户改动量属于哪一类后再继续。

---

## Step 3 — 第二轮：核心业务信息（必问）

**目标**：挖清楚 WHO / WHY / WHAT。

问题清单（按需选 2-3 个，信息已知的跳过）：

**Q5 — 目标用户**（可多选，参考 `platform-role-matrix.md` 业务身份）
> 这个功能主要给谁用？
>
> A. `admin` — 超管（菜单/权限/元数据治理）
> B. `operator` — 平台运营（跨域运营、客户账户管理等账务操作）
> C. `provider` — ModelOne 模型发布方 / PowerOne 模型部署方 / InfraHub 模型部署方（提供算力或 BYOK）
> D. `eu` — 终端用户（模型使用、私有模型发布与聚合）
> E. 项目级角色（Project Admin / Developer）
> F. 外部第三方 / API 调用方
> G. 其他（请说明）

**Q6 — 核心痛点**
> 没有这个功能，现在最痛的是什么？（请用一两句话描述，不用写方案）

**Q7 — 期望结果**
> 这个需求做完后，用户能做到什么原来做不到的事？或者什么流程会变得更顺？

**Q8 — 典型使用场景**
> 能描述一个最典型的使用场景吗？（比如：某个角色在某种情况下，需要完成某件事）

---

## Step 4 — 第三轮：边界与约束（必问）

**目标**：定清楚本期做什么、不做什么、有什么约束。

**Q9 — 本期必须包含**
> AI 基于 Q5-Q8 已掌握的痛点/期望/场景预判了几项必须包含的能力，请确认：
>
> AI 预判（必须由 AI 在采访过程中实时填入，不允许使用通用占位）：
> 1. {基于核心痛点反推的能力}
> 2. {基于期望结果反推的能力}
> 3. {基于典型场景反推的能力}
>
> A. 上述 1-3 全要
> B. 只要其中部分（请说明编号）
> C. 还要补充其他（请列举 1-3 项）
> D. AI 预判不准，请重新列

**Q10 — 本期明确不做**
> 有没有「相关但这次不想做」的内容？AI 基于场景边界推断了几项可能想做但暂不做的，请确认：
>
> AI 预判：
> 1. {可能想到但暂不做的能力 A}
> 2. {可能想到但暂不做的能力 B}
>
> A. 上述都不做
> B. 1 不做、2 仍要做
> C. 还要补充其他不做的（请列举）
> D. 没有「明确不做」的

**Q11 — 已知约束**（可多选）
> 目前你知道有哪些约束？
>
> A. 有上线时间硬限制（请说明）
> B. 依赖其他团队或系统（请说明）
> C. 预算/资源限制
> D. 技术历史包袱（请说明）
> E. 目前没有已知约束

**Q12 — 还有什么不清楚的**
> AI 在前面采访中识别到以下尚未澄清的点（来自不确定的回答 / 跳过的问题），请勾选哪些进入「待澄清问题」列表：
>
> AI 识别：
> 1. {不确定项 1}
> 2. {不确定项 2}
>
> A. 全部需要澄清
> B. 只勾选编号 X
> C. 还要补充其他不确定项（请列举）
> D. AI 识别错了，请重新列

---

## Step 5 — 信息确认

采访完成后，展示信息摘要，格式如下：

```
📋 采访完成，确认一下掌握的信息：

- 需求来源：{来源}
- 归属项目：{项目}
- 复杂度判断：{小/中/大}，原因：{简述}
- 目标用户：{用户}
- 核心痛点：{痛点}
- 期望结果：{结果}
- 本期做：{列表}
- 本期不做：{列表}
- 已知约束：{列表}
- 待澄清问题：{列表}

确认无误后回复「可以」，我开始生成文档。有需要调整的请直接说。
```

---

## Step 6 — 生成文档

用户确认后，按以下顺序生成文档：

### 6.1 确定编号与路径

1. 读取 `99-inbox/raw-demand-log.md`，确认下一个可用的 REQ 编号。
   - **Fallback 规则**：如果文件不存在，自动创建并从 `REQ-{当前年份}-001` 开始；如果文件存在但格式无法解析，扫描 `02-projects/agione-platform/requirements/` 目录下已有的 `REQ-*` 文件夹，取最大编号 +1。
2. 根据需求名称生成英文 slug（小写、短横线分隔，例如：`user-quota-management`）。
3. 确定路径：`02-projects/agione-platform/requirements/REQ-{YYYY}-{NNN}-{slug}/`

### 6.2 写入 raw-demand-log.md

在 `99-inbox/raw-demand-log.md` 末尾追加一条记录：

```markdown
## REQ-{YYYY}-{NNN} {需求名}

- 收口日期：{今天日期}
- 复杂度：{小/中/大}
- 提出人：{来源}
- 当前状态：`Brief Draft`
- 路径：`02-projects/agione-platform/requirements/REQ-{YYYY}-{NNN}-{slug}/`
- 原始需求：{原始一句话}
```

### 6.3 生成 brief.md

严格按照 `templates/requirement-brief-template.md` 的结构生成，内容规则：

- **只写业务层**，不写字段、接口、状态机
- 所有内容必须来自采访结果，不允许编造
- 信息不足处标注 `⚠️ 待补充：{说明}`
- AC（验收标准）必须从用户视角描述，可验证，禁止出现字段名
- 功能模块分配表必须附在最后

### 6.4 生成 acceptance-checklist.md

严格按照 `templates/acceptance-checklist-template.md` 的结构生成，基于 brief.md 中的每一条 AC 展开。

### 6.5 完成提示

文档生成后，根据复杂度输出不同的下一步建议：

**如果复杂度为「小」：**

```
✅ 已生成以下文件：

- 📥 99-inbox/raw-demand-log.md（已追加）
- 📄 REQ-{YYYY}-{NNN}-{slug}/brief.md
- ✅ REQ-{YYYY}-{NNN}-{slug}/acceptance-checklist.md

这是小型需求，可走快车道：
→ 跳过 /agione-req-refine（无需 solution.md / flow.md / functions/）
→ 下一步：直接用 /agione-prototype-prep 生成原型指导文件
```

**如果复杂度为「中」：**

```
✅ 已生成以下文件：

- 📥 99-inbox/raw-demand-log.md（已追加）
- 📄 REQ-{YYYY}-{NNN}-{slug}/brief.md
- ✅ REQ-{YYYY}-{NNN}-{slug}/acceptance-checklist.md

这是中型需求，建议按以下顺序推进：

① 运行 /agione-req-refine → 生成 solution.md + flow.md + functions/ 骨架 + batch-align.md
② 分配研发 Owner → 各功能补 functions/Fxxx-*.md 的字段/状态机/埋点
③ 召开批量对齐会 → 决策 batch-align.md 中的待拍板问题
④ 方案评审（建议请 AI 或 Tech Lead 交叉审查 solution + flow 一致性）
⑤ 文档收敛后 → /agione-prototype-prep → /agione-ui

要现在开始运行 /agione-req-refine 吗？
```

**如果复杂度为「大」：**

```
✅ 已生成以下文件：

- 📥 99-inbox/raw-demand-log.md（已追加）
- 📄 REQ-{YYYY}-{NNN}-{slug}/brief.md
- ✅ REQ-{YYYY}-{NNN}-{slug}/acceptance-checklist.md

这是大型需求，必须走完整流程：

① 运行 /agione-req-refine → 生成 solution.md + flow.md + functions/ 骨架 + batch-align.md
② 分配研发 Owner + Tech Lead 介入 → 各功能补 functions/Fxxx-*.md
③ 召开批量对齐会 → 决策 batch-align.md 中的待拍板问题
④ ⚠️ 方案评审（必须由 AI + Tech Lead 交叉审查 solution + flow + functions 一致性，不可跳过）
⑤ 原型：/agione-prototype-prep → /agione-ui（需严格评审）
⑥ 技术方案（tech-solution.md）+ Tech Lead 评审

要现在开始运行 /agione-req-refine 吗？
```

---

## 复杂度判断规则

| 复杂度 | 判断条件 | 默认流程 |
|---|---|---|
| **小** | 纯 UI 调整 / 文案修改 / bug 修复，无跨系统，无新表接口 | brief + checklist，可直接进原型 |
| **中** | 有新功能但不涉及支付/安全/数据迁移，可能有新接口 | 完整 REQ 流程 |
| **大** | 涉及支付/权限重构/安全/跨系统数据迁移/多团队依赖 | 完整 REQ 流程 + 技术方案评审 |

---

## 参考模板路径

| 文档 | 路径 |
|---|---|
| Brief 模板 | `templates/requirement-brief-template.md` |
| Acceptance Checklist 模板 | `templates/acceptance-checklist-template.md` |
| 原始需求收口日志 | `99-inbox/raw-demand-log.md` |
| 需求目录 | `02-projects/agione-platform/requirements/` |

---

## 与其他 Skill 的衔接

```
/agione-req-intake  →  /agione-req-refine  →  /agione-prototype-prep  →  /agione-ui
（本 Skill）            （需求细化）              （原型指导文件）             （生成 HTML 原型）
```

- 本 Skill 产出的 `brief.md` 是 `/agione-req-refine` 的主要输入。
- 小型需求可跳过 `/agione-req-refine`，直接进 `/agione-prototype-prep`。
- `/agione-req-refine` 产出的 `solution.md` + `flow.md` + `functions/` 是 `/agione-prototype-prep` 的主要输入。
- `/agione-prototype-prep` 产出的 `prototype-[角色].md` 是 `/agione-ui` 的主要输入。
