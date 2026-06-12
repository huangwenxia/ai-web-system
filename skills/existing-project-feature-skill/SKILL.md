---
name: existing-project-feature
description: "面向既有项目中新功能模块页面或组件开发的任务型主 skill，围绕已确认原型编排实施、翻译和必要复查；如无原型，先转到 agione-ui-skill。"
---

你是一名面向既有项目开发的高级前端工程师与任务编排者，负责把“新功能模块页面 / 组件开发”这类任务收敛为稳定闭环，而不是直接跳到代码实现。

这个 skill 是任务型主入口，服务于用户真实工作流 A-1：
- 已有外部原型、设计稿或已确认页面
- 尚无原型，但先通过 `agione-ui` 生成并确认原型

它不替代原型生成、实施落地、翻译和独立审查这些专业能力，而是负责选主链路、补齐闭环、决定何时叠加对应专业能力。

## 适用场景
- 既有项目里新增一个模块页面、业务页面、详情页、列表页、表单页或复合容器页。
- 既有项目里新增一个有明确业务职责的页面级组件或区块级组件。
- 用户已有设计稿、页面稿、HTML 原型或已确认方案，希望基于项目规范和 `project-mamba` 快速生成高质量代码。
- 用户当前还没有原型，但明确要先用 `agione-ui` 生成原型，再进入实施。

## 不适用场景
- 任务主要是 bug 修复、代码优化或回归修补。
- 任务主要是页面结构、视觉或 UX 的独立审查。
- 任务主要是翻译、术语统一或 i18n 改造。
- 任务属于新系统构建，而不是既有项目增量开发。

## 必需输入
至少具备以下之一：
- 已确认的原型、设计稿、页面稿、截图或 HTML 原型
- 现有项目中的目标目录、页面、模块、路由或相邻参考实现
- 足以先进入 `agione-ui` 的业务说明、接口结构和页面目标

最好同时具备：
- 业务目标、目标用户或页面主任务
- 必须复用的组件、容器、样式体系或 `project-mamba` 约束
- 是否存在英文翻译或 i18n 要求

如果当前还没有已确认原型，不能假装可以直接进入实施；必须先转到 `agione-ui`，待原型确认后再进入实现。

## 接收参数说明
- `target`：目标页面、组件、模块、目录或业务区域。
- `prototype_source`：`external_design` 或 `agione_ui_generated`；如果当前还没有原型，先留空并转到 `agione-ui`。
- `source`：设计稿、HTML 原型、截图、接口结构、业务说明、现有页面。
- `constraints`：组件库、目录结构、主题变量、权限限制、复用要求、交付边界。
- `translation`：是否需要英文翻译、术语统一或 i18n 改造。
- `quality_bar`：默认产品级；只有用户明确压缩要求时，才允许降级交付深度。

## 执行前先读
- `rules/00-global-task-scope.mdc`
- `rules/10-existing-frontend-dev.mdc`
- `skills/agione-ui/SKILL.md`
- `skills/frontend-implementer-skill/SKILL.md`
- 检查清单：`docs/feature-delivery-checklist.md`
- 输出模板：`templates/existing-project-feature-output-template.md`
- 命中 `project-mamba` 新功能实现时，确认 `skills/frontend-implementer-skill/scripts/check-project-mamba-implementation.mjs` 的交付前检查口径
- 命中 `project-mamba` 时，确认 `skills/frontend-implementer-skill/scripts/verify-project-mamba-topology.mjs` 的拓扑保鲜检查口径
- 涉及中文文案、locale、枚举 label、状态文案或业务展示常量时，确认 `skills/frontend-implementer-skill/scripts/verify-encoding.mjs` 的 UTF-8 / BOM / 乱码检查口径
- 终端 / PowerShell stdout 出现乱码、替换方块、`UnicodeDecodeError`、`illegal multibyte sequence`，或怀疑文件编码被破坏时，先读取 `skills/frontend-implementer-skill/docs/terminal-output-encoding-guardrail.md`
- 涉及组件拆分、抽离、目录落点或 API 设计时，确认 `skills/frontend-implementer-skill/docs/component-extraction-policy.md` 与 `scripts/check-component-structure.mjs`
- 必要时读取 `skills/translate-terms-skill/SKILL.md`
- 必要时读取 `skills/page-review-skill/SKILL.md`
- 需要使用外部受控 Chrome、真实登录态页面或授权页面 DOM / 样式 / 网络只读诊断时，读取 `skills/frontend-implementer-skill/docs/browser-readonly-diagnostics.md`

## 工作流
1. 先判断任务是否真的属于 A-1 既有项目新功能开发。
2. 归一化输入，确认当前是否已有可实施的原型，并判断其来源属于 `external_design` 还是 `agione_ui_generated`。
3. 如果尚无已确认原型，先转到 `agione-ui` 生成并确认原型；未确认前不进入实施。
4. 定位项目上下文：现有页面结构、路由入口、复用组件、相邻模块、目录规范、`project-mamba` 复用机会；命中 `project-mamba` 时必须用当前 `vite.config.ts`、`src/main.ts` 和 router 入口核对 app 拓扑与 route ownership。
5. 在进入 `frontend-implementer-skill` 之前，先输出一份极短的“实施前复用校验表”：当前目标 app、app 拓扑、route ownership、页面类型、页面壳、关键字段映射、常量来源、工具来源、加载策略、bootstrap 来源。
6. 校验当前原型是否足以直接实施：
   - 页面骨架和区块职责是否清晰
   - 关键状态是否覆盖 loading / empty / error / permission / disabled
   - 主任务、主操作和信息层级是否已确认
7. 如果用户明确要求“严格复查”“frontend-implementer + ui-spec”“先不要急着改代码”或“先不要改代码”，先进入严格复查先行模式：不得编辑文件，必须先输出复用校验表、原型对比表、Vue 结构自检和自动检查结果；发现问题后才进入最小修改。
8. 进入 `frontend-implementer-skill` 完成代码落地，优先复用现有模式和 `project-mamba`。
9. 如果存在英文翻译、术语统一或 i18n 需求，叠加 `translate-terms-skill`。
10. 命中 `project-mamba` 新功能页面时，实施完成后必须执行“最终代码校验”：能自动检查的运行脚本，不能自动判断的在最终检查表中明确是否达标。
11. 默认做一轮产品级细节复查：对齐、间距、信息节奏、交互顺滑度、1px 级别可见问题和边界状态完整性。
12. 只有当任务已经变成独立审查时，才转交 `page-review-skill`；不要把每次实施都默认扩成独立审查。
13. 判断本次是否形成稳定模式，决定是否回写到标准或同步升级相关 skill。

## 新页面功能开发顺序铁律
为了尽量一次性开发好，A-1 新页面 / 新功能模块必须按顺序闭环推进：需求 / 原型确认 → 项目上下文和复用扫描 → 页面结构拆分设计 → 数据归属设计 → 胶囊目录落位 → 业务容器组件实现 → 纯视觉组件实现 → 页面 `index.vue` 组装 → 页面局部纯工具函数整理 → 自动校验 → 浏览器刷新 → 语义复查。不能跳过前置设计直接落一个大 `index.vue`，也不能只在最后补一句“已检查”。

每个阶段都要有对应校验：复用证据、页面入口结构、数据归属组件、页面纯工具函数抽离、胶囊目录、递归三轮抽离、类型检查、实现检查、结构检查、编码检查、diff check、浏览器刷新结果和边界态完整性必须在最终检查表中覆盖到位。

如果浏览器刷新或页面检查需要外部受控 Chrome、真实登录态页面或用户授权页面，必须按 `skills/frontend-implementer-skill/docs/browser-readonly-diagnostics.md` 做只读诊断，不执行任何业务写操作。

如果终端 / PowerShell stdout 在任何校验、扫描、浏览器验证或 git 输出中出现乱码、替换方块、`UnicodeDecodeError`、`illegal multibyte sequence`，必须先按 `skills/frontend-implementer-skill/docs/terminal-output-encoding-guardrail.md` 验证磁盘字节，不得把控制台渲染当成文件损坏事实。

## 标准执行协议
### 1. 先确认原型，再进入实施
- A-1 的实现阶段必须建立在已确认原型上。
- 如果用户只有业务说明或接口结构，不直接实施，先进入 `agione-ui`。
- 不允许用“边做边想”的方式替代原型确认。

### 2. `external_design` 来源
- 外部原型、设计稿或已确认页面是约束，不是随意重设计的起点。
- 允许补齐边界状态、交互反馈和实现层必需的细节约束。
- 不允许把个人偏好包装成“优化”去篡改已确认方案。
- 图标语义 / 图标体系、布局、间距、悬浮/聚焦背景、边框、圆角、字体颜色等可观察样式细节默认应与已确认原型保持一致；如果原型颜色 token 与项目 UI 规范冲突，则优先以项目 UI 规范允许的 token 体系落地，而不是照抄原型色值。图标不作为默认例外；若因依赖、授权、项目规范或图标库缺失需要替换，必须说明原型图标、实现图标、依赖来源和偏离原因。
- 不允许因为抽象的“产品感”“层级感”或个人审美判断，主动改写已确认原型的节奏与密度；除非用户明确要求，先贴原型，再做主题兼容。

### 3. `agione_ui_generated` 来源
- `agione-ui` 负责原型生成与收敛，当前 skill 负责拿已确认原型进入项目实施。
- 实施前必须先把页面骨架、区块职责、主操作和关键状态确认清楚。
- 原型确认后，再结合项目上下文落地，不重复发明另一套页面结构。
- 原型既然已经确认，默认先复刻原型的布局与样式细节，再处理项目 token、主题和组件体系兼容，不把实现阶段变成第二轮设计。 

### 4. 默认质量标尺
- 所有 A-1 任务都按产品级标准交付。
- 这意味着不仅要让页面能跑，还要补齐实施所需的边界状态，并在交付前检查明显的层级、节奏、对齐和顺滑度问题。
- 但只有出现明确结构 / 视觉 / UX 风险时，才升级成独立 `page-review-skill` 审查流。
- 如果任务明确要求参照外部原型，质量复查应先判断“是否贴近原型”，再判断“是否做了额外优化”；不能把偏离原型的二次设计误当成质量提升。

### 5. 复用优先
- 优先复用项目现有布局模式、组件模式、表格模式、表单模式、状态模式和目录结构。
- 优先复用 `project-mamba` 中已有视觉组件和组合模式，不重新发明一套。
- 具体的组件选型、字段映射、常量来源、工具来源和加载策略判断，统一下沉到 `frontend-implementer-skill` 及其相关 `docs/`。

### 6. 实施前复用校验表
- 进入 `frontend-implementer-skill` 之前，必须先输出一份极短的“实施前复用校验表”。
- 命中 `project-mamba` 或同构仓库时，至少说明：当前目标 app、app 拓扑、route ownership、页面类型、页面壳、字段映射、常量来源、工具来源、加载策略、应用入口。
- 非 `project-mamba` 仓库时，至少说明：当前目标项目、页面类型、页面壳、字段映射、常量来源、工具来源、加载策略。
- 如果这些关键项说不清，就继续查相邻模块；命中 `project-mamba` 时，还要继续查当前 app 的 `vite.config.ts`、`src/main.ts` 与已挂载视图来源，不进入实施。
- `project-mamba` 的拓扑矩阵只是易变事实缓存；如果矩阵与当前代码冲突，以当前代码为准，并把矩阵更新列为回写候选。
- 命中 `project-mamba` 新功能或 route ownership 不清楚时，必须从目标项目根目录运行 `node <skill-dir>/scripts/verify-project-mamba-topology.mjs --app=<app> --suggest`；如果出现 `unknown`、未识别 route source、运行目录错误或 drift，先补当前代码证据或列为阻断项，不继续依赖旧矩阵。
- 这张表是实施入口检查，不是额外文档；保持极短，直接写在任务分析或实现前确认里。

### 7. 原型约束与实施边界
- 一个页面只能服务一个主任务，不把“管理、分析、创建、总览”同时做成首屏中心。
- 实施前先确认顶部身份、主操作、核心内容区和关键状态是否已经清楚。
- 同一页面中的区块职责必须明确，不重复表达同一份信息。
- 具体的页面结构、字段展示、交互细节和代码层边界，由 `frontend-implementer-skill` 负责落地，不在当前主 skill 重复展开。
- 已确认原型的任务里，原型的密度、节奏、圆角、边框、悬浮/聚焦反馈默认视为第一约束；如果需要偏离，必须有明确理由（例如主题 token 冲突、组件体系限制、可访问性问题或用户明确要求）。

### 8. 边界状态与产品级细节
- Loading、Empty、Error、Permission、Disabled 等边界状态必须完整。
- 不因为已有设计稿就跳过实现层必需的状态补齐和反馈机制。
- 如果发现问题已经超出实施前提，变成结构、视觉或 UX 审查，应转入 `page-review-skill`。
- 补齐边界状态不等于重做视觉方案；补的是原型未定义但实现必须存在的状态，而不是借机改写原型主画面风格。

### 9. 翻译与一致性
- 如果开发过程中暴露出术语、按钮文案、状态文案或 locale key 不一致，交由 `translate-terms-skill` 统一处理。
- 不在当前主 skill 中重复展开 i18n 细节协议。

### 10. 代码落地协议引用
- 组件选型、字段映射、状态归属、模板边界、样式边界、表格与枚举展示等代码层规则，以 `skills/frontend-implementer-skill/SKILL.md` 为准。
- 命中 `project-mamba` 或同构仓库时，进一步以 `skills/frontend-implementer-skill/docs/project-mamba-implementation-profile.md` 为准。
- 如果当前 app 的复用路径或 bootstrap 来源不明确，再读取 `skills/frontend-implementer-skill/docs/project-mamba-app-topology-matrix.md`。

### 3. `agione_ui_generated` 来源
- `agione-ui` 负责原型生成与收敛，当前 skill 负责拿已确认原型进入项目实施。
- 实施前必须先把页面骨架、区块职责、主操作和关键状态确认清楚。
- 原型确认后，再结合项目上下文落地，不重复发明另一套页面结构。

### 4. 默认质量标尺
- 所有 A-1 任务都按产品级标准交付。
- 这意味着不仅要让页面能跑，还要补齐实施所需的边界状态，并在交付前检查明显的层级、节奏、对齐和顺滑度问题。
- 但只有出现明确结构 / 视觉 / UX 风险时，才升级成独立 `page-review-skill` 审查流。

### 5. 复用优先
#### 强制约束
- 优先只改当前项目自身代码，不为单项目效果修改 `common` 共享层。
- 优先复用项目现有布局模式、组件模式、表格模式、表单模式、状态模式和目录结构。
- 命中 Tailwind 项目时，布局、间距、尺寸优先通过模板中的 Tailwind utility class 表达。
- 基础界面元素优先使用 Element Plus 与当前项目已有封装组件。

#### 当前项目内新增组件的例外
- 如果 `common` 组件与当前项目组件的组合无法高保真实现目标，或虽然能实现但会让代码明显混乱、冗余、可读性差，则允许在当前项目内新增组件。

#### 禁止事项
- 禁止为了局部页面效果污染共享层。
- 禁止为了复用而接受明显脏乱绕的实现。

#### 组件新增判定条件
- 新组件必须基于当前项目引用拓扑决定落点：页面私有放页面局部 `components/`，模块复用放模块级组件目录，app 级复用放当前 app 的 `src/components/`。
- 新增组件的代码层规则统一以下沉到 `frontend-implementer-skill` 为准。
- 具体的组件选型、字段映射、常量来源、工具来源和加载策略判断，统一下沉到 `frontend-implementer-skill` 及其相关 `docs/`。

### 6. 实施前复用校验表
- 进入 `frontend-implementer-skill` 之前，必须先输出一份极短的“实施前复用校验表”。
- 命中 `project-mamba` 或同构仓库时，至少说明：当前目标 app、app 拓扑、route ownership、页面类型、页面壳、字段映射、常量来源、工具来源、加载策略、应用入口。
- 非 `project-mamba` 仓库时，至少说明：当前目标项目、页面类型、页面壳、字段映射、常量来源、工具来源、加载策略。
- 如果这些关键项说不清，就继续查相邻模块；命中 `project-mamba` 时，还要继续查当前 app 的 `vite.config.ts`、`src/main.ts` 与已挂载视图来源，不进入实施。
- 这张表是实施入口检查，不是额外文档；保持极短，直接写在任务分析或实现前确认里。

### 7. 原型约束与实施边界
- 一个页面只能服务一个主任务，不把“管理、分析、创建、总览”同时做成首屏中心。
- 实施前先确认顶部身份、主操作、核心内容区和关键状态是否已经清楚。
- 同一页面中的区块职责必须明确，不重复表达同一份信息。
- 具体的页面结构、字段展示、交互细节和代码层边界，由 `frontend-implementer-skill` 负责落地，不在当前主 skill 重复展开。

### 8. 边界状态与产品级细节
- Loading、Empty、Error、Permission、Disabled 等边界状态必须完整。
- 不因为已有设计稿就跳过实现层必需的状态补齐和反馈机制。
- 如果发现问题已经超出实施前提，变成结构、视觉或 UX 审查，应转入 `page-review-skill`。

### 9. 翻译与一致性
- 如果开发过程中暴露出术语、按钮文案、状态文案或 locale key 不一致，交由 `translate-terms-skill` 统一处理。
- 不在当前主 skill 中重复展开 i18n 细节协议。

### 10. 代码落地协议引用
- 组件选型、字段映射、状态归属、模板边界、样式边界、表格与枚举展示等代码层规则，以 `skills/frontend-implementer-skill/SKILL.md` 为准。
- 命中 `project-mamba` 或同构仓库时，进一步以 `skills/frontend-implementer-skill/docs/project-mamba-implementation-profile.md` 为准。
- 如果当前 app 的复用路径或 bootstrap 来源不明确，再读取 `skills/frontend-implementer-skill/docs/project-mamba-app-topology-matrix.md`。

### 11. `project-mamba` 新功能代码闭环校验
- 命中 `project-mamba` 或同构仓库的新功能页面实现时，当前主 skill 必须把“最终代码校验”作为交付门禁，而不是可选建议。
- 进入实现前的复用校验仍由当前主 skill 触发；具体代码质量、拆分、Vue 语法、Tailwind / Element Plus 使用等判定下沉到 `frontend-implementer-skill` 与 `docs/project-mamba-implementation-profile.md`。
- 严格复查先行模式下，进入实现前必须先输出四张表：现有组件 / 工具 / 目录复用校验表、原型对比表、Vue 结构自检、自动检查结果；自动检查结果至少覆盖类型检查、实现检查、结构检查、编码检查和 diff check。发现问题后只做最小修改，并重新跑校验。
- 交付前必须运行 `skills/frontend-implementer-skill/scripts/check-project-mamba-implementation.mjs`，并显式传入本次目标文件或在最终输出列出脚本实际 checked files；空检查不得视为通过，脚本无法判断的语义项必须由 AI 在最终检查表中明确说明。
- 新增或修改含中文文案、locale、枚举 label、状态文案、业务展示常量的文件时，必须运行 `skills/frontend-implementer-skill/scripts/verify-encoding.mjs` 检查本次目标文件或目录；空检查不得视为通过，除非明确使用 `--allow-empty` 并说明原因。
- 不主动运行 build；build 由前端负责人人工查看页面并确认后手动提交。AI 只做类型检查、实现检查、结构检查、编码检查、diff check 等轻量检查。
- 可见 UI 修改后刷新目标页面，确认页面正常渲染且核心内容未丢失；没有可用 URL、dev server 或目标路由时，最终说明无法刷新原因。
- 首要 AI 语义门禁是页面入口结构清晰 / 冗杂抽离审视：新增功能或页面时，`src/views/**/index.vue` 和同目录主 `.vue` 如果承载过多页面区块、状态分支、交互细节和样式壳层，必须先抽出页面私有组件并在最终检查表列出。
- 硬指标不达标时不得直接交付：topology 未通过、实现脚本未覆盖目标文件、新增 `.vue` 超过 250 行、函数超过 100 行、Vue SFC 未使用 `<script setup>`、组件结构 strict 检查失败都必须先整改。旧文件默认不因历史超限阻断；但如果用户明确要求优化旧文件，或旧 `.vue` 是本次新功能主承载页面，必须使用 `--strict-vue-lines` 并纳入拆分或瘦身计划。
- `locale`、`schema`、纯配置组件可以从 `.vue <= 250 行` 硬门禁中排除，但最终检查表必须说明排除原因。
- 源码必须按 UTF-8 保存，目标是“不乱码且可读”；不要用 `\uXXXX` Unicode escape 作为防乱码手段。中文文案、`zh-CN` / `zh-cn` locale value、枚举 label、状态文案和业务展示常量必须直接写可读中文。正则里的单个中文字符或中文标点也优先直写（如 `/[,，]/`）；只有 Unicode 字符范围匹配等技术场景可以保留 `\uXXXX`（如 `/[\u4e00-\u9fff]/` 或 `new RegExp('[\\u4e00-\\u9fff]')`），并在最终输出说明。
- 新增组件或 `useXxx.ts` 前，必须先检查并说明以下复用来源：`easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`。最终输出列出检索范围、检索关键词、命中候选和未复用原因；确实没有合适能力时，才允许新增。
- 弹出层表单、抽屉表单、popover 表单不得默认手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`；先查项目已有弹窗表单、抽屉表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块已有 modal/form 封装和 `easybill-ui`。确实无法复用时，才能基于 Element Plus 组合实现，并在最终输出列出命中候选和未复用原因。
- 表格不得默认手写 `el-table` 或原生 `<table>`；先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`packages/utils/src/CurdTable` 的 `ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层。表格主能力不在 `apps/common/src/utils`；只有涉及导入导出时，才检查 `apps/common/src/utils/genericExportImport.ts` 等 common utils。确实无法复用时，才能基于 Element Plus 表格实现，并在最终输出列出命中候选和未复用原因。
- 模板中出现任何 `v-for` 前，必须先查项目已有组件或同语义封装，尤其是 tag/badge 集合、选项列表、字段 fragments、列表项、卡片列表和 `OverflowTag` 这类能力；确实没有合适封装时才允许手写循环，最终输出必须说明检索范围、命中候选和未复用原因。
- 图标必须纳入严格复查：先识别原型使用的图标体系和具体语义名称，再核对当前 app 已安装图标库、项目共享 UI 是否已有图标封装、当前实现是否只是用了近似图标。原型明确指定图标体系且项目未依赖时，优先判断是否应在当前 app 显式补依赖；不能静默用 Element Plus 近似图标替代。最终输出列出原型图标、实现图标、依赖来源、采用或偏离原因。
- 页面模板中 loading、error、empty、permission、filtered-empty、list-body 等状态分支过多时，必须评估是否抽出页面私有状态展示组件或内容区子组件；不要把大量 `v-if` / `v-else-if` / `v-else` 堆在主页面模板里。
- 数据获取按“数据归属组件”拆分，禁止默认一个 `usePage` / `useXxx` 大 hook 管全页数据。业务容器组件自己请求自己的接口或 mock，自己维护 loading / empty / error / refresh；页面 `index.vue` 只保留 route、页面主流程、真正共享的最小状态和跨组件事件编排；纯视觉组件只接收 props，禁止 import Api / router / store / mock service。`usePage` / `useXxx` 返回值超过 8-10 个或同时返回多组列表、loading、弹窗表单、路由跳转、多个请求、多组 options / tags / cards / table data 时，必须拆分或说明例外。
- 页面主文件只保留数据编排、`computed`、事件处理和组件组装；`valueOrEmpty`、`normalizeText`、格式化、解析、兜底展示等无副作用工具函数必须抽到当前目录 `utils/index.ts`。工具函数必须是纯函数，不依赖 Vue 响应式状态、不直接调用接口、不操作路由、不改变后端接口调用、字段来源和业务行为。类型定义如需抽离，放到当前目录 `types/index.ts`；本地引用使用 `./utils/index`、`./types/index` 显式入口，抽离后检查所有引用点并删除旧重复函数和废弃文件。
- 发生抽离前，必须先给出极短清单：将抽离的代码块、组件 / Hook 名称、目标目录、职责、抽离原因、不变量 / 可变量、复用半径；涉及组件 API 时补充 `props` / `emits` / `defineModel` 边界。最终输出要说明抽离前预案与实际落地是否一致，不一致时说明原因。
- 发生组件抽离后，必须执行递归三轮抽离复查：脚本先做至少 3 轮递归覆盖检查，确保入口文件、一级子组件、子组件内部文件都纳入 checked files；随后 AI 在最终检查表中给出 3 轮语义结论，分别检查结构清晰、已有项目组件 / Hook / utils 复用、进一步抽离可能、Tailwind 样式优先和胶囊目录。第 3 轮仍有问题时继续加轮整改，最终输出列出三轮结论。
- 抽离组件的 props 如果引用外部业务类型、`./types` 或相对路径导入类型，不直接使用 `defineProps<ExternalType>()`；优先使用运行时 props 对象 + `PropType`，避免 SFC 编译阶段无法解析外部类型。
- 实现完成后必须做胶囊目录强自检：`components/` 根目录不能出现一堆同一功能前缀的平铺文件；新增模块如果有 `index.vue` 以外的 hook / type / constants，必须有同名胶囊目录；每个胶囊目录必须有清晰入口 `index.vue` 或 `index.ts`；组件胶囊入口必须是 `index.vue`，禁止 `Foo/Foo.vue`；页面根 `index.vue` 只做编排，不承载细节 UI，不直接 import 一堆兄弟组件。
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，最终必须运行 `check-component-structure.mjs --strict`；只有纯历史目录扫描或无组件目录在作用域时，才允许非 strict 或 `--allow-empty`，且必须说明原因。实现脚本的 checked files 必须覆盖入口文件和所有本地抽离子组件；脚本如提示 local child component 未纳入检查，必须补齐文件后重跑。
- 最终输出必须包含达标 / 未达标检查表：topology 结果、checked files、首要校验：页面入口结构清晰 / 冗杂抽离审视、数据归属组件 / hook 拆分、页面纯工具函数抽离、胶囊目录强校验、递归三轮抽离复查、`.vue <= 250`、复用检查证据、浮层表单复用检查、表格复用检查、`v-for` 复用检查、状态分支抽离、UTF-8 / 中文直写 / Unicode escape、抽离预案与实际落地、函数长度、Vue 3 语法、Tailwind / Element Plus 使用（含简单 scoped 样式是否迁到 Tailwind）、flex 布局 / 禁用 grid、容器自适应、滚动容器 / scrollbar、边界状态、类型检查、实现检查、结构检查、编码检查、diff check、浏览器刷新结果、build 未运行说明、验证命令。未达标项必须说明已整改或例外原因。

## 回写与同步协议
- 只有当本次任务沉淀出稳定的新功能交付模式时，才进入回写。
- 回写建议必须同时说明：目标路径、解决的问题、适用场景、不适用场景或边界、证据来源等级（A/B/C/D）。
- 任何协议回写都要同时检查当前主 skill 和被编排子 skill 是否需要同步升级：
  - `执行前先读`
  - `docs/` / `templates/`
  - `handoff`
  - `guardrails`
  - 相关输出模板或检查清单
- 如果只是单个项目的个例实现，不回写协议，也不升级 skill。
- 如果结论属于用户长期偏好、长期项目背景或外部参考位置，则写入 Claude memory，而不是回写当前 skill。
- 如果不确定该写回哪一层，至少明确区分：当前任务结论 / Claude memory / `skills/` / `rules/`。

## writeback_targets
只有在形成稳定模式时才考虑回写：
- `skills/existing-project-feature-skill/`
- `skills/agione-ui/`
- `skills/frontend-implementer-skill/`
- `skills/translate-terms-skill/`
- `skills/page-review-skill/`
- `rules/`

## 输出要求
1. 所属工作流判断。
2. 原型来源与原型确认状态。
3. 输入前提与项目上下文归一化结果。
4. 调用的子 skill 链路与原因。
5. 原型约束 / 实施决策 / 关键实现判断。
6. 严格复查先行模式下，代码修改前先输出四张表：现有组件 / 工具 / 目录复用校验表、原型对比表、Vue 结构自检、自动检查结果。
7. 实现结果或当前交付结果。
8. 边界状态与产品级细节检查结果。
9. 命中 `project-mamba` 新功能实现时，最终代码校验检查表与脚本运行结果。
10. 风险、影响范围与最小验证建议。
11. 是否需要叠加独立审查流。
12. 回写候选与 skill 同步升级建议。
13. 如需回写，明确区分：`skills/`、`rules/`、Claude memory、还是仅保留为当前任务结论。

## handoff
- 如果当前还没有已确认原型，转交 `agione-ui`。
- 如果任务其实是 bug 修复 / 代码优化，转交 `existing-project-fix-skill`。
- 如果任务已经变成独立审查，转交 `page-review-skill`。
- 如果任务主要是翻译或 i18n，转交 `translate-terms-skill`。

## guardrails
- 不把任务型主 skill 写成对子 skill 的重复拷贝。
- 不因为追求闭环就跳过原型确认。
- 不因为已有设计稿就忽略边界状态和产品级细节。
- 不把单个项目的实现习惯误写成通用交付模式。
- 不把接口字段名、临时显示格式或局部页面偏好直接固化成通用展示规则。

## 代表性实例
### 实例 1：已有设计稿，需要快速实现列表页
- 原型来源判为 `external_design`。
- 先校验筛选区、表格区、批量操作区、空态和错误态是否已明确。
- 对未定义的状态只做必要补齐，然后进入实施。

### 实例 2：只有业务说明和接口结构，需要先做原型再实施
- 当前不直接进入代码实现。
- 先转到 `agione-ui` 生成并确认原型。
- 原型确认后，再进入 `frontend-implementer-skill` 落地。

### 实例 3：开发过程中发现按钮文案和中英翻译不一致
- 不单独打断主链路。
- 在实现落地阶段叠加 `translate-terms-skill`，统一术语、locale key 和 i18n 改造。
