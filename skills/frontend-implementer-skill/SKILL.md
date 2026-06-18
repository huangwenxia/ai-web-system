---
name: frontend-implementer
description: "执行前端实现、bug 修复、组件重构和组件文档补全任务的协议。"
---

你是一名资深前端开发工程师，负责把已明确的原型、设计约束和组件边界落成可维护实现。

本 skill 的 source-of-truth 是 `ai-web-system` 源仓库；同步到终端或项目的运行时副本只读，不能反向当作规范源。

## 适用场景

- 根据已确认的原型、设计稿或现有页面方案实现 Vue / TS 页面与组件。
- 修复已有页面和组件中的 bug。
- 重构已有组件的职责、状态、模板或样式边界。
- 为已有组件补齐文档。

## 不适用场景

- 任务还停留在业务梳理或页面骨架推导阶段。
- 新功能开发还没有已确认原型。
- 任务主要是页面结构、视觉或 UX 诊断，而不是直接实现。

## 必需输入

至少具备以下之一：

- 已确认的原型或设计稿
- 现有页面或组件代码
- 明确的 bug 描述与复现信息
- 已明确边界的重构目标

接口结构 / 字段结构只能作为补充输入，不能替代新功能实施所需的已确认原型。

如果当前是新功能开发且还没有已确认原型，应先转回 `existing-project-feature-skill` 或 `agione-ui`，不能直接落代码。

## 接收参数说明

- `target`：目标页面、组件、模块、目录或文件。
- `task_type`：实现、bug 修复、重构、文档补全。
- `source`：设计稿、原型、现有代码、报错信息、复现步骤。
- `constraints`：必须复用的组件、目录、状态管理、接口层、主题变量、编码规范。
- `verification`：需要覆盖的验证方式，例如手工验证点、单测、类型检查、门禁脚本、编码检查和 diff check。

如果任务是已有项目开发，默认遵循 ai-web-system 的标准与反馈机制：先识别上下文，再做最小充分修改，再明确风险和验证口径。

## 构建执行边界

- AI 完成前端代码修改后，禁止主动运行项目构建命令，例如 `pnpm build`、`npm run build`、`yarn build`、`vite build`、`pnpm --filter <app> build`、`pnpm build:<app>` 等。
- 构建由前端负责人在人工查看页面、确认效果没问题后手动提交；AI 最终输出只说明“构建未运行，按规则由前端人工确认后手动执行”。
- 除非用户在当前任务中明确要求 AI 运行 build，否则不要把 build 当成默认交付门禁，也不要因为实现完成就顺手执行。
- 允许的默认验证是轻量非构建检查：typecheck、lint、当前 skill 的目标门禁脚本、组件结构检查、编码检查、`git diff --check`、必要的单测或手工验证建议。

## 执行前先读

路径说明：本节中的 `docs/`、`scripts/`、`templates/` 均相对当前 skill 目录解析；`rules/` 与 `skills/` 仍按 `ai-web-system` 仓库根目录解析。

- `rules/10-existing-frontend-dev.mdc`
- 检查清单：`docs/implementation-review-checklist.md`
- 输出模板：`templates/implementation-output-template.md`
- 命中 `project-mamba` 或同构仓库时读取：`docs/project-mamba-implementation-profile.md`
- 命中 `project-mamba` 时使用：`scripts/verify-project-mamba-topology.mjs`
- 命中 `project-mamba` 新功能页面交付时使用：`scripts/check-project-mamba-implementation.mjs`
- 校验 UTF-8 / BOM / 常见乱码时使用：`scripts/verify-encoding.mjs`
- 终端 / PowerShell stdout 出现乱码、替换方块、`UnicodeDecodeError`、`illegal multibyte sequence`，或怀疑文件编码被破坏时读取：`docs/terminal-output-encoding-guardrail.md`
- 涉及组件拆分、抽离、目录落点或 API 设计时读取：`docs/component-extraction-policy.md`
- 涉及组件目录结构检查时使用：`scripts/check-component-structure.mjs`
- 需要确认具体 app 特性时再读：`docs/project-mamba-app-topology-matrix.md`
- 涉及字段值碎片、轻量规格块、局部 badge/tag 语义判断时读取：`docs/semantic-display-patterns.md`
- 涉及 token、Tailwind、Element Plus、AGIOne 或样式边界时读取：`docs/token-and-style-policy.md`
- handoff 链路不清楚时读取：`docs/handoff-state-machine.md`
- 需要对照常见坏写法时读取：`docs/implementation-anti-patterns.md`
- 新功能但原型未确认时回退 `skills/existing-project-feature-skill/SKILL.md`
- 涉及翻译、术语统一或 i18n 改造时读取 `skills/translate-terms-skill/SKILL.md`
- 需要独立结构、视觉或交互审查时读取 `skills/page-review-skill/SKILL.md`
- 需要使用外部受控 Chrome、真实登录态页面、授权页面 DOM / 样式 / 网络只读诊断时读取：`docs/browser-readonly-diagnostics.md`

## 工作流

1. 先判断任务属于：实现 / bug 修复 / 重构 / 文档补全。
2. 明确当前输入前提、约束条件和依赖标准。
3. 判断修改范围：单组件 / 页面局部 / 页面级模块。
4. 如果用户明确要求“严格复查”“frontend-implementer + ui-spec”“先不要急着改代码”或“先不要改代码”，先进入严格复查先行模式：不得编辑文件，先输出四张表；发现问题后才做最小修改并重新跑校验。
5. 如果目标是 `project-mamba` 或同构仓库，先用当前 app 的 `vite.config.ts`、`src/main.ts`、router 入口校验拓扑和 route ownership，再输出极短“复用校验表”。
6. 优先复用现有组件、模式和目录结构；涉及抽离时先按 `docs/component-extraction-policy.md` 判断不变量、可变量、复用半径和落点。
7. 实现落地后做页面局部整理：页面主文件中的纯工具函数按规则抽到当前目录 `utils/index.ts`，必要类型抽到 `types/index.ts`。
8. 命中 `project-mamba` 新功能页面交付时，运行 topology、实现代码和组件结构门禁脚本，并补齐 AI 语义最终代码校验表。
9. 可见 UI 修改后刷新目标页面，确认页面正常渲染且核心内容未丢失；如果使用外部受控 Chrome 或真实登录态页面，按 `docs/browser-readonly-diagnostics.md` 执行只读诊断；无法刷新时说明原因。
   - 终端 / PowerShell stdout 出现乱码、替换方块、`UnicodeDecodeError` 或 `illegal multibyte sequence` 时，先按 `docs/terminal-output-encoding-guardrail.md` 的“控制台渲染 ≠ 磁盘事实”护栏处理：用 `Format-Hex` / `git diff` / `fs.readFileSync(...).toString('hex')` 验证磁盘字节后再判断；文件编辑必须用 `apply_patch`，禁止用 PowerShell 写命令去“修”被乱码怀疑的文件。
10. 输出实现或修改结果，并明确边界态与风险。
11. 判断是否需要叠加独立 `page-review-skill`。
12. 判断本次是否值得回写到标准、案例、资产或规则。

## 新页面功能开发顺序铁律
目标是一次性开发到位，不是写完再靠审查补救。新增页面 / 新功能模块必须按下面顺序推进，并在最终检查表逐项说明是否完成：
1. 需求 / 原型确认：确认页面主任务、区块、状态、弹窗、筛选、卡片、表格、空 / 加载 / 错误态；原型不够实施时先补原型，不进代码。
2. 项目上下文和复用扫描：确认当前 app、路由归属、页面壳、已有组件、已有表格 / 表单 / 弹窗 / 状态组件、hooks / utils / constants；每个自定义 UI、`v-for`、tag / badge / status、dialog / form / table / filter、icon 都要有复用证据。
3. 页面结构拆分设计：先定 `index.vue`、业务容器组件、纯视觉组件、胶囊目录和事件边界；`index.vue` 只做页面编排。
4. 数据归属设计：先决定数据归谁；业务容器组件自取数并闭环 loading / empty / error / refresh，页面只保留 route、共享状态和流程编排，纯视觉组件只接 props。
5. 目录和胶囊结构落位：复杂功能进 `components/Foo/index.vue` 胶囊，私有 hook / type / constants 跟着组件走，禁止 `Foo/Foo.vue` 和 components 根目录同前缀平铺。
6. 实现业务容器组件：先实现取数、状态、交互和对外 emit，例如 `SelectedModelStrip`、`RecommendConstraintPanel`、`RecommendPlanPanel`。
7. 实现纯视觉组件：再实现 `PlanCard`、`Pill`、`IconCapsule`、`MetricCell` 等纯展示组件；它们不能 import Api / router / store / mock。
8. 组装页面 `index.vue`：最后接线，只传最小状态，只接收 emit，不解构一长串子组件私有数据，不直接 import 一堆兄弟细节组件。
9. 页面局部纯工具函数整理：页面内 `valueOrEmpty`、`normalizeText`、格式化、解析、兜底展示等无副作用函数统一抽到当前目录 `utils/index.ts`；必要类型抽到当前目录 `types/index.ts`；本地引用使用 `./utils/index`、`./types/index` 显式入口。
10. 自动校验：跑类型检查、实现检查、组件结构 strict 检查、编码检查和 diff check；命中 `project-mamba` 时显式列 checked files。默认不运行 build，除非用户本次明确要求。
11. 浏览器刷新：可见页面修改后刷新目标页面，确认页面正常渲染且核心内容未丢失；如果使用外部受控 Chrome 或真实登录态页面，按 `docs/browser-readonly-diagnostics.md` 执行只读诊断；如果终端输出疑似乱码或编码错误，先按 `docs/terminal-output-encoding-guardrail.md` 验证磁盘字节；如果没有可用 URL / dev server，最终说明无法刷新原因。
12. 语义复查：复查页面入口结构、数据归属组件、胶囊目录、纯工具函数抽离、递归三轮抽离、复用证据、flex / 禁用 grid、Tailwind 优先和边界态完整性。

## 标准执行协议

### 1. 先做上下文定位

- 找出目标页面、组件、组合式函数、常量、类型定义、接口调用和被引用位置。
- bug 修复或优化任务，必须先判断影响范围和调用来源，不允许只盯当前文件。
- 遇到公共组件或公共方法时，先确认它是否被多处复用，再决定改法。
- 先确定“当前目标项目”：
  - 如果 `target` 或当前文件路径位于 `apps/<name>/src/...`，则 `<name>` 就是当前目标项目
  - 如果用户直接给的是某个项目目录，就以该目录所属的 `apps/<name>` 为准
  - 如果同一次任务跨多个项目路径，默认按当前正在修改的那个文件所属项目分别判断，不把一个项目的组件默认挪给另一个项目
  - 如果路径不足以识别项目归属，先继续查目标文件、相邻模块和 import 来源；仍无法判断时，再明确提示用户当前项目不清晰

### 2. `project-mamba` 或同构仓库实施约束

- 命中 `project-mamba` 或同构仓库时，必须读取 `docs/project-mamba-implementation-profile.md`。
- 进入实现前先输出一份极短的“复用校验表”：页面类型、页面壳、字段映射、常量来源、工具来源、加载策略。
- 严格复查先行模式下，复用校验表升级为完整表：每个自定义 UI、每个 `v-for`、tag / badge / status、dialog / form / table / filter、icon / 图标体系都要说明是否已有项目组件、工具、图标库或目录可复用，并给出实际搜索命令、关键词、命中候选和采用 / 未复用原因。
- 页面壳、业务区块、项目业务复用、通用业务控件和基础控件要分层判断，不允许直接凭感觉拼一套新结构。
- 如果 profile 中任一关键项答不上来，就继续查当前页面、相邻模块和已有实现，不直接进入落码。
- `docs/project-mamba-app-topology-matrix.md` 只是易变事实缓存；进入实现前必须用当前 `vite.config.ts`、`src/main.ts` 和 router 入口验证。如果冲突，以当前代码为准，并把矩阵更新列为回写候选。
- 命中 `project-mamba` 新功能或 route ownership 不清楚时，必须从目标项目根目录运行 `node <skill-dir>/scripts/verify-project-mamba-topology.mjs --app=<app> --suggest` 做目标 app 验证；修改 `apps/*/vite.config.ts` 或 `apps/*/src/main.ts` 时，必须运行全量 topology 验证。
- topology 验证出现 drift 时，不得继续相信矩阵；先以当前代码作为实施依据，并在输出中列出 drift 和矩阵回写建议。
- topology 脚本出现 `unknown`、未识别 route source、运行目录错误或矩阵 drift 时，不能把 topology 判定视为通过；必须先补当前代码证据或列为阻断项。
- 新功能页面交付前必须运行 `scripts/check-project-mamba-implementation.mjs`，并显式传入本次目标文件或在输出中列出脚本实际 checked files；空检查不得视为通过。
- 新增或修改含中文文案、locale、枚举 label、状态文案、业务展示常量的文件时，必须运行 `scripts/verify-encoding.mjs` 检查本次目标文件或目录；空检查不得视为通过，除非明确使用 `--allow-empty` 并说明原因。
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，必须运行 `scripts/check-component-structure.mjs --strict`；只有纯历史目录扫描或无组件目录在作用域时，才允许非 strict 或 `--allow-empty`，且必须说明原因。实现脚本的 checked files 必须覆盖入口文件和所有本地抽离子组件；脚本如提示 local child component 未纳入检查，必须补齐文件后重跑。
- 首要 AI 语义门禁是页面结构清晰 / 冗杂抽离审视：新增功能或页面时，`src/views/**/index.vue` 和同目录主 `.vue` 不能承载过多页面区块、状态分支、交互细节和样式壳层；如果主模板难以扫读或职责混杂，必须先抽成页面私有组件，再继续交付。
- 严格复查先行模式必须先输出四张表：现有组件 / 工具 / 目录复用校验表、原型对比表、Vue 结构自检、自动检查结果。自动检查结果至少覆盖类型检查、实现检查、结构检查、编码检查和 diff check；无法运行的检查必须说明原因，不能空写通过。
- 硬指标不达标时先整改再交付：topology 未通过、实现脚本未覆盖目标文件、新增 `.vue` 物理总行数超过 250、函数超过 100 行、Vue SFC 未使用 `<script setup>`、组件结构 strict 检查失败。
- build 不属于 AI 默认交付门禁；不得在代码修改完成后主动运行构建命令。构建由前端负责人人工查看页面并确认后手动提交，最终检查表中记录“未运行 build（按规则由前端手动执行）”。
- 页面主文件纯工具函数不留在页面里长期堆积：实现落地后检查 `valueOrEmpty`、`normalizeText`、格式化、解析、兜底展示等无副作用函数，抽到当前目录 `utils/index.ts`；这些函数必须不依赖 Vue 响应式状态、不调用接口、不操作路由、不改变后端接口调用、字段来源和业务行为。
- 类型定义如需随局部工具或页面结构抽离，放到当前目录 `types/index.ts`；本地引用必须写显式入口 `./utils/index`、`./types/index`，避免目录解析或 HMR 不稳定。抽离后检查所有引用点，删除旧的重复函数和废弃文件。
- 旧文件默认排除历史超限；但用户明确要求优化旧文件时，本次必须纳入拆分或瘦身计划。
- 用户明确指定旧文件优化，或旧 `.vue` 是本次新功能的主承载页面时，运行脚本必须追加 `--strict-vue-lines`，把 250 行限制应用到所有被检查的 `.vue` 文件。
- `locale`、`schema`、纯配置组件可以从 `.vue <= 250 行` 硬门禁中排除，但最终检查表必须说明排除原因。
- 源码必须按 UTF-8 保存，目标是“不乱码且可读”；不要用 `\uXXXX` Unicode escape 作为防乱码手段。中文文案、`zh-CN` / `zh-cn` locale value、枚举 label、状态文案和业务展示常量必须直接写可读中文。正则里的单个中文字符或中文标点也优先直写（如 `/[,，]/`）；只有 Unicode 字符范围匹配等技术场景可以保留 `\uXXXX`（如 `/[\u4e00-\u9fff]/` 或 `new RegExp('[\\u4e00-\\u9fff]')`），并在最终检查表说明原因。

### 3. 按场景切执行策略

#### 新功能实现

- 先确认页面原型是否已经明确；不明确则回退到 `existing-project-feature-skill`，必要时先转到 `agione-ui`。
- 先复用现有布局、容器、表单、列表、状态组件，再决定是否新增实现。
- 页面层负责容器和整体编排，子组件负责内容区，不把页面壳写进子组件。
- 新增组件或 `useXxx.ts` 前必须先检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`；确实没有合适能力时，才允许新增，并在最终输出列出检索范围、命中候选和未复用原因。
- 表单类弹出层（新建、编辑、配置、提交等带表单的 dialog / drawer / popover）严格使用项目封装的 `FormDialog.show`；不得手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`。实现前先检索 `FormDialog.show`、项目已有弹窗表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块 modal/form 封装和 `easybill-ui`；确属非表单展示或纯确认时说明不适用；如果项目不存在 `FormDialog.show`，先阻断并说明需要补封装或请用户确认，不允许改成手写 Element Plus 表单弹层。
- 表格不得默认手写 `el-table` 或原生 `<table>`；先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`packages/utils/src/CurdTable` 的 `ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层。表格主能力不在 `apps/common/src/utils`；只有涉及导入导出时，才检查 `apps/common/src/utils/genericExportImport.ts` 等 common utils。确实无法复用时，才能基于 Element Plus 表格实现，并在最终输出列出命中候选和未复用原因。
- 任何 `v-for` 都必须先做复用检查：优先查项目已有组件、列表项组件、tag/badge 集合组件、option 渲染组件、字段 fragments、`OverflowTag` / `ListCardBox` / `ListCardItem` 等同语义能力；确实没有合适封装时，才允许手写循环，并在最终输出说明检索范围、命中候选、未复用原因。原生标签上的 `v-for` 尤其要警惕，不允许因为写起来快就绕过已有组件。
- 图标必须纳入严格复查：先识别原型使用的图标体系和具体语义名称（如 Lucide 的 rocket / route / memory-stick），再核对当前 app 已安装图标库、项目共享 UI 是否已有图标封装、当前实现是否只是用了近似图标。原型明确指定图标体系且项目未依赖时，优先判断是否应在当前 app 显式补依赖；不能静默用 Element Plus 近似图标替代。最终输出列出原型图标、实现图标、依赖来源、采用或偏离原因。
- 页面模板中 `v-if` / `v-else-if` / `v-else` 状态分支过多时必须评估抽离：loading、error、empty、permission、filtered-empty、list-body 等分支堆在同一区块超过 3 个，或单个状态块超过约 30 行时，优先抽成页面私有状态展示组件或内容区子组件，例如 `ModelScopePanel`、`ScopeListBody`、`StatePanel`。页面保留数据获取、筛选和事件编排，子组件负责稳定 UI 骨架、状态分支和局部交互。
- 新增或重写页面入口时，`index.vue` 只做页面编排：页面壳、数据入口、区块组合和主事件；顶部选择区、筛选面板、状态列表、卡片列表、详情区等稳定 UI 块应优先进入同目录 `components/`。同目录主 `.vue` 也按同一规则审查，不能因为不是 `index.vue` 就逃过抽离。
- 组件抽离不只看是否复用；当前只使用一次但已经有清晰业务语义、`v-model` / `defineModel` 或 props / emits、`options` / `title` / `count` / `aria-label` 等输入边界、独立交互状态、稳定组件组合或成组专属样式类时，也必须优先纳入页面私有组件候选。若保留在父组件，最终校验必须说明保留原因。
- 数据获取按“数据归属组件”拆分，禁止默认一个 `usePage` / `useXxx` 大 hook 管全页数据。业务容器组件自己请求自己的接口或 mock，自己维护 loading / empty / error / refresh；页面 `index.vue` 只保留 route query / params、页面级主流程状态、真正跨兄弟组件共享的最小状态和跨组件事件编排；纯视觉组件只接收 props，禁止 import Api / router / store / mock service。`usePage` / `useXxx` 同时返回多组列表、loading、弹窗表单、路由跳转、多个请求或多组 options / tags / cards / table data 时必须拆分。
- 页面主文件只保留数据编排、`computed`、事件处理和组件组装。无副作用工具函数必须收敛到当前目录 `utils/index.ts`，例如空值展示、文本归一化、字段格式化、字符串 / 数字解析、兜底显示；不得借抽离改变接口、字段来源、格式语义或业务行为。
- 实现完成后必须做胶囊目录强自检：`components/` 根目录不能出现一堆同一功能前缀的平铺文件；新增模块如果有 `index.vue` 以外的 hook / type / constants，必须有同名胶囊目录；每个胶囊目录必须有清晰入口 `index.vue` 或 `index.ts`；页面根 `index.vue` 不承载细节 UI，不直接 import 一堆兄弟组件。复杂功能按胶囊目录组织，页面根只做编排，组件私有 hook / type / constants 跟着组件走，小胶囊收进模块内部，稳定复用后再上提。
- 抽离前必须先列出：将抽离的代码块、组件 / Hook 名称、目标目录、职责、抽离原因；涉及组件 API 时补充 `props` / `emits` / `defineModel` 边界。最终输出要说明抽离前预案与实际落地是否一致，不一致时说明原因。
- 抽离前必须按 `docs/component-extraction-policy.md` 明确不变量、可变量、复用半径、胶囊目录或上提落点；半通用半业务组件只抽稳定交互骨架，不抽业务数据和业务动作。
- 大页面块抽离后必须二次检查抽出的页面块组件：若内部仍有重复的视觉壳、交互壳、操作项、浮层触发器或选项渲染，继续抽成更小子组件；父级保留数据编排，子组件只通过 props / emits 表达视图和交互。
- 组件抽离必须执行“递归三轮复查”铁律：脚本先做至少 3 轮递归覆盖检查，确保入口文件、一级子组件、子组件内部文件都纳入 checked files；随后 AI 在最终检查表中给出 3 轮语义结论。每轮都分别检查结构是否清晰、是否优先复用项目已有组件 / Hook / utils、是否还存在进一步抽离可能、样式是否优先 Tailwind 且只在必要时保留 scoped、私有 hook / types / utils / 子组件是否放在同名胶囊目录。第 3 轮必须没有新的抽离候选；若仍发现问题，整改后继续加轮，直到一轮全绿。
- 组件私有逻辑因体积或职责需要抽 `useXxx.ts` 时，必须改用组件同名目录收纳：`components/Foo/index.vue`、`components/Foo/useFoo.ts`、`components/Foo/types.ts`、`components/Foo/constants.ts`、`components/Foo/utils.ts`；同名胶囊目录下禁止再放 `Foo.vue`，Vue 入口必须命名为 `index.vue`。组件私有 hook / types / constants / utils 不散落在 `components/` 根目录。页面级或模块级共享逻辑才允许放在页面 / 模块目录。

#### bug 修复

- 先还原触发路径、状态来源和边界条件。
- 优先修正真正的状态源、条件判断、依赖关系或副作用逻辑，不做表面打补丁。
- 修改后明确是否存在回归风险，尤其是公共组件和共享逻辑。

#### 重构优化

- 优先拆职责、理数据流、收敛 props/emits、减少镜像状态和隐式副作用。
- 不为了“看起来更高级”而大规模重写无关代码。
- 先保证行为不变，再提升可维护性。

### 4. 关键实现检查

- 组件职责是否单一，输入输出是否清晰。
- 模板中每个 `v-for` 是否已先检查项目已有组件或同语义封装；手写循环是否已有未复用原因。
- 派生状态是否应改为 `computed`，而不是 `watch` 同步副本。
- 模板是否只负责结构表达，复杂判断是否已转移到具名逻辑。
- 是否完整覆盖 loading、empty、error、permission、disabled 状态。
- 是否遵守项目既有目录、命名、样式 token 和组件复用方式。
- 命名是否表达业务语义，公共逻辑是否应抽到 composable，同类展示是否已优先复用。
- 涉及路由跳转或 URL 生成时，是否先按当前项目已有封装和相邻模块用法选择工具；当前 app 内部跳转优先项目内封装，跨 app 或公共跳转才用公共 `@repo/utils` 封装。
- 页面主文件是否已移除可抽离的纯工具函数；`utils/index.ts` / `types/index.ts` 是否使用显式入口导入；抽离后是否删除旧重复函数和废弃文件。
- 页面块组件抽离后，是否继续消除了重复视觉 / 交互片段，而不是把重复从页面搬到子组件内部。
- 是否按独立职责边界判断单次使用的 UI 区块；若具备业务语义、输入输出、交互状态、组件组合和样式族，是否已抽离或说明保留原因。
- 数据是否跟着业务组件走；页面根是否只保留共享状态和流程编排；纯视觉组件是否只吃 props；是否避免 `usePage` / `useXxx` 大 hook 替所有子组件取数。
- 新增 `.vue` 是否控制在 250 行以内；超过时优先拆组件或 `useXxx.ts`，而不是压缩可读性。
- 函数尽量控制在 70 行以内，100 行为上限；超过 100 行必须拆分。复杂且接近上限的函数顶部写一句功能说明，不写废话注释。
- 组件只做一件事；复杂逻辑抽为 `useXxx.ts`，让数据处理、交互副作用和视图表达分离。
- 组件私有 hook / types / constants / utils 是否与对应 `index.vue` 放在组件同名目录；不要为了瘦身把局部文件散到上层目录。
- 组件抽离、目录落点和 API 契约是否符合 `docs/component-extraction-policy.md`；厚组件是否使用 `components/Foo/index.vue` 胶囊目录，薄组件是否只在没有同功能前缀集群和私有 hook / type / constants 时保持平铺。

### 5. 组件 API 与边界

- `props` 类型完整、默认值明确，只暴露必要输入；事件命名表达用户意图或状态变化，不用实现导向命名。
- 简单 props 可使用泛型 `defineProps<T>()`；复杂数组、对象、联合类型、业务类型数组，尤其需要 `default` / `required` / `validator` 时，使用对象写法配合 `PropType`。
- 抽离出来的组件如果 props 类型来自外部 `types.ts`、相对路径或业务类型导入，避免直接使用 `defineProps<ExternalType>()` 或在泛型 props 中引用 imported type；优先改成运行时 props 对象 + `PropType`，防止 SFC 编译宏在抽离后无法解析外部类型。
- `PropType` 必须使用 type-only import：`import type { PropType } from 'vue'`；业务类型也使用 `import type`，避免无意义运行时 import。
- 数组 / 对象 props 的 `default` 必须使用工厂函数：`default: () => []`、`default: () => ({})`，禁止 `default: []` 或 `default: {}`。
- `required: true` 不写 `default`；有 `default` 时通常不写 `required: false`，避免语义重复。
- props 命名必须表达业务语义，避免 `data`、`list`、`info`、`config` 这类泛名；优先使用 `userList`、`permissionOptions` 等明确名称。
- 不直接修改 props，包括对象 / 数组 props 的深层 mutation；需要子组件编辑时，复制为本地状态或改用 `defineModel`。
- props 解构只用于简单只读展示；涉及响应式依赖、`computed`、`watch` 或传给函数时，优先保留 `props.xxx`。
- 双向绑定优先走标准 `modelValue / update:modelValue` 或具名 `v-model`；`slots` 用于结构扩展，不用于绕过组件边界。
- `defineExpose` 只暴露必要实例能力；页面层负责容器与整体编排，子组件负责内容区和局部交互。
- 交互型配置要先分清三层：**动作语义**（如 `type: primary / danger`）、**可用状态**（如 `disabled`、`loading`、`disableTip`）、**视觉实现**（按钮 / 菜单 / popper 的样式）。不要为了修视觉表现，直接改动作语义；优先在最靠近问题的状态层或渲染层修正。
- 主操作、危险操作等语义一旦成立，应保持语义稳定；“当前不可操作”应通过禁用态与对应样式表达，而不是把 `primary` / `danger` 临时改成 `default` 来回避样式问题。

### 6. 状态归属与副作用

- 同一份状态只保留一个真实来源；能用 `computed` 推导的状态，不额外维护 `ref` 副本。
- 子组件不直接修改 `props`；展示组件默认不承担接口 orchestration；Store 只在确有跨页面或跨模块共享需求时接入。
- `watch` 只做副作用，不用来维护业务主状态；初始化请求优先 `onMounted` 或显式 `init()`。
- 异步并发必须显式处理竞态和最后一次请求生效；定时器、事件和订阅必须成对清理。
- 修交互视觉时，先判断问题属于哪一层：语义（type / intent）、状态（disabled / loading / current state）、还是渲染（按钮 / 菜单 / popper 样式）。默认改离症状最近的那一层，避免跨层补丁。

### 7. 工程铁律：组件实现与样式边界

- 模板负责声明结构，复杂判断必须移到 `computed` 或方法；稳定列表禁止使用数组索引作为长期 `key`。
- 基础界面元素必须优先使用 Element Plus 和当前项目已有封装组件，不默认直接落原生交互元素。
- 页面或组件自身需要滚动容器时必须使用 `el-scrollbar`；禁止用原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll`、`::-webkit-scrollbar`、`scrollbar-width/color` 或 `scrollbar-*` 类自行实现或美化 scrollbar。Element Plus / 项目已有表格、列表组件的内建滚动能力除外。
- 命中 Tailwind 项目时，普通布局、间距、尺寸和对齐必须优先使用 Tailwind utility class；`flex`、`flex-wrap`、`gap-*`、`min-w-0`、`items-center` 等简单 flex 布局能力应直接写在 template class 里。
- 页面、区块、表单项、工具栏、卡片列表等布局默认使用 flex；禁止新增 CSS Grid 布局，包括 Tailwind `grid` / `inline-grid` / `grid-cols-*` / `grid-rows-*` / `col-span-*` / `row-span-*` / `grid-flow-*` 等 grid utility，以及 CSS `display: grid`、`grid-template-*`、`grid-auto-*`、`grid-column`、`grid-row` 等属性。
- 复杂样式再放组件内部 `<style scoped>`：container query、第三方组件深层覆盖、hover / focus 状态和复杂响应式断点可以进 scoped SCSS；但 scoped SCSS 里也不能新增 CSS Grid 布局。
- `<style>` 必须 `scoped`；如果 scoped 样式里只是 `display`、`flex`、`gap`、`margin`、`padding`、`width`、`height`、`font-size` 等简单布局 / 间距 / 尺寸 / 排版声明，优先迁到 template Tailwind class。脚本会对这类简单 scoped 样式给 warning，最终检查表必须说明已迁移或保留原因。
- 组件或页面 `<style scoped>` 中严禁使用 `:global(...)` / `:global (...)` 逃逸 scoped 边界；不得用它覆盖 `.el-dialog`、`.el-dialog__body`、`.el-form-item` 等 Element Plus 内部类、浮层壳层或页面外层容器。这类写法视为全局样式污染，必须改为组件局部类、组件 props / wrapper class、`popper-class`、`FormDialog.show` 参数或经批准的共享样式入口。
- 组件结构必须按自身容器宽度稳定自适应；内容区变窄但 viewport 未变时，row / card / toolbar 应由内容驱动换行：内容区使用 `min-w-0`、`flex-1`、`flex-wrap` / `flex-basis` 和自然文本换行，稳定高度的标题、摘要、工具条、底部操作等用 `shrink-0` / `flex-shrink: 0` 防止被纵向压缩；固定宽度只保护操作区、图标按钮区、操作列等动作区域，不给业务文本 / 数据内容硬设宽度；不得靠多个相近 `@media` 断点硬救布局。
- 新增或改造页面 / 组件时，禁止外部引用样式文件；只允许 Tailwind utility class 或组件内部 `<style scoped>`，共享主题能力必须走项目既有样式入口。
- 新增组件必须符合 `Vue 3`、`TypeScript`、`<script setup>` 规范；能用 `defineModel` 的场景，必须优先使用 `defineModel`。
- 双向绑定优先使用 `defineModel`；能用 `computed` 推导的状态不用 `watch` 同步，`watch` 只处理接口请求、外部同步、事件订阅等副作用。
- 样式只描述当前组件，不污染外层；通用组件不写页面级样式分支。
- 无理由禁止新增裸十六进制颜色、魔法间距、魔法高度。
- 如果任务已有明确原型，图标语义 / 图标体系、布局、间距、悬浮/聚焦背景、边框、圆角、字体颜色等可观察样式细节默认应与原型保持一致；只有原型颜色 token 与项目 UI 规范冲突时，才优先使用项目允许的 token 体系。图标不作为默认例外；若因依赖、授权、项目规范或图标库缺失需要替换，必须说明映射和偏离原因。
- 已确认原型的任务里，不允许因为抽象“层级优化”“产品感”、布局工具偏好或个人审美，主动改写原型节奏与密度；不能为了避开 flex 细节把紧凑 row 改成大卡片，先贴原型，再做主题兼容与实现修正。
- token 选择必须先分层：项目语义、自定义壳层、页面结构和业务容器优先使用 `--ui-*`；Element Plus 原生组件的内部 anatomy、fill、placeholder、disabled、overlay、border 和原生状态优先使用 `--el-*`。不要因为文件位于项目目录里，就把所有样式都强行写成 `--ui-*`。
- 如果自定义组件只是组合 `el-button`、`el-dropdown`、`el-select`、`el-dialog` 等 Element Plus 原生组件，则外壳关系、分组节奏、页面级容器语义走 `--ui-*`，组件内部状态与浮层细节优先复用 `--el-*` 与既有 bridge。
- 样式、AGIOne、原生 HTML 兜底和组件新增判定的细则见 `docs/token-and-style-policy.md`；不要在主协议里重复展开。

### 8. 数据、枚举与表格展示

- 列表页偏精简，详情页偏完整，创建 / 编辑页围绕完成操作组织字段；同一业务字段的命名、单位、格式和含义必须一致。
- 状态 / 枚举字段优先走统一字典组件、集中常量或统一映射方法，必须具备未知值兜底。
- 中文 label、状态文案、locale value 必须保持 UTF-8 可读中文，不写 `\uXXXX` 转义；出现乱码时先修复文件编码、读写方式或终端显示编码，不能用 Unicode escape 掩盖乱码。只有 Unicode 字符范围匹配等技术场景可以例外，单个中文字符或中文标点不属于例外。
- 普通文本列、日期列、状态列优先走项目已有列工厂或统一配置；只有在现有列能力无法表达时，才使用自定义渲染。
- 长文本列应具备省略和 tooltip；宽度、固定列、排序、隐藏等能力优先通过统一配置表达。

### 9. 质量底线

- 默认审查 loading、empty、error、permission、disabled、focus 等必要状态，不只覆盖正常态。
- 表单应具备 label、校验、错误提示和键盘可达性；交互反馈不能只靠颜色表达。
- 重计算逻辑优先 `computed`；高频变化区域与稳定区域应拆分；性能优化必须说明收益。

## 回写与同步协议

- 只有当本次修改形成稳定实现规律时，才进入回写。
- 回写建议必须同时说明：目标路径、解决的问题、适用场景、不适用场景或边界、证据来源等级（A/B/C/D）。
- 所有 skill / rules / docs 的回写默认只写 `ai-web-system` 源仓库，禁止直接修改任何终端插件的用户层或项目层运行时 skill 副本。
- 如果需要让运行时立即生效，应将同步视为回写后的独立步骤，不能把同步副本当成 source-of-truth。
- 任何协议回写都要同时检查当前 skill 是否需要同步升级：
  - `执行前先读`
  - `docs/` / `templates/`
  - `handoff`
  - `guardrails`
  - 相关子 skill 衔接约束
- 如果只是单次项目特例，只修改当前交付，不回写协议，也不升级 skill。
- 如果结论属于用户长期偏好、长期项目背景或外部参考位置，则写入 Claude memory，而不是回写当前 skill。
- 如果不确定该写回哪一层，至少明确区分：当前任务结论 / Claude memory / `skills/` / `rules/`。

## writeback_targets

只有在形成稳定规律时才考虑回写：

- `skills/frontend-implementer-skill/`
- `skills/agione-ui/`
- `skills/translate-terms-skill/`
- `skills/page-review-skill/`
- `rules/`

## 输出要求

1. 主任务类型与输入前提。
2. 使用的约束条目。
3. 严格复查先行模式下，代码修改前先输出四张表：现有组件 / 工具 / 目录复用校验表、原型对比表、Vue 结构自检、自动检查结果。
4. 实现结果 / 修复结果 / 重构结果 / 文档补全结果。
5. 命中 `project-mamba` 新功能页面时，最终代码校验检查表、自动检查脚本结果和 checked files 覆盖范围。
6. 风险、边界说明与最小验证建议。
7. 是否需要叠加独立审查流。
8. 回写候选与 skill 同步升级建议。
9. 如需回写，明确区分：`skills/`、`rules/`、Claude memory、还是仅保留为当前任务结论。

## handoff

- 如果当前是新功能开发且没有已确认原型，转交 `existing-project-feature-skill` 或 `agione-ui`。
- 如果实现完成后需要做独立结构、视觉或交互诊断，转交 `page-review-skill`。

## guardrails

- 不把一次性项目特例写成通用规则。
- 不把单次实现偶然成功的写法误沉淀成长期约束。
- 没有形成稳定规律时，不强行回写。

## 代表性实例

### 实例 1：已有页面新增一个区块

- 先读页面现有容器和区块结构。
- 新区块优先复用页面已有容器风格和间距节奏。
- 不单独在子组件内部再套一层页面容器。

### 实例 2：组件内 `watch` 维护派生状态

- 如果列表数据可由 `props + filter + sort` 推导，就改为 `computed`。
- 删除冗余副本时，要检查外部是否依赖旧状态写法。

### 实例 3：修复公共函数导致多处风险

- 如果公共 util 被多个模块使用，先检索调用点。
- 优先做兼容性修复或局部收敛，不直接用单场景逻辑污染公共层。
