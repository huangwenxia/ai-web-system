# Project Mamba Implementation Profile

本文件承接 `frontend-implementer-skill` 中命中 `project-mamba` 或同构仓库时的专属实施约束。

本文件保存稳定原则和少量事实缓存；`vite.config.ts`、`src/main.ts`、router 挂载来源等易变事实必须现场核对。如果目标仓库存在 `AGENTS.md` 或 `CLAUDE.md`，先把它们作为仓库级事实来源，本 profile 只补充实施判定口径。

## 先判定 app 拓扑，不把所有 apps 当成同一种项目
- `project-mamba` 的 app 不是单一拓扑。
- 进入实现前，必须先读当前 app 的 `vite.config.ts` 和 `src/main.ts`，必要时再读 router 入口，确认：
  - 路由来源是只来自当前 app，还是同时挂载了 `common` / 其他 app 的 views
  - 页面壳、i18n、auth、install、directives、globals、store 来源于本 app 还是共享层
  - 当前 app 的样式入口文件名是 `tailwind.css` 还是 `tailwindcss.css`
- 读取后用当前代码校验 `docs/project-mamba-app-topology-matrix.md`；命中新功能或 route ownership 不清楚时，必须从目标项目根目录运行 `node <skill-dir>/scripts/verify-project-mamba-topology.mjs --app=<app> --suggest`。如果冲突，以当前代码为准，并把矩阵更新列为回写候选。
- 修改 `apps/*/vite.config.ts` 或 `apps/*/src/main.ts` 时，从目标项目根目录运行 `node <skill-dir>/scripts/verify-project-mamba-topology.mjs --all --suggest`；出现 drift 时先处理事实依据，不继续依赖旧矩阵。
- topology 脚本出现 `unknown`、未识别 route source、运行目录错误或矩阵 drift 时，不能视为通过；必须先补当前代码证据或列为阻断项。
- 在完成这一步之前，不允许直接把 `apps/common/src/components` 或通用页面组合当成无条件默认答案。

## app 拓扑分类
详细矩阵见：`docs/project-mamba-app-topology-matrix.md`

### T1：common-shell source app
- 当前确认：`common`
- 这是共享壳、共享主题、共享布局、共享视图和大量共享组件的源头。
- 修改 `common` 时，默认按跨 app 影响处理。

### T2：common-view mixed app
- 当前确认：`zguan`、`gnosis`、`hashrate`、`financial`、`cbdp`
- 这类 app 通常同时挂载：
  - 自己的 `src/views`
  - `../common/src/views`（通过 `~common`）
- 但它们的 `main.ts`、i18n、auth、install、directives、globals 不一定来自 `common`，必须以当前 app 实际 bootstrap 为准。

### T3：multi-source route app
- 当前确认：`wanmore`、`metis`
- 这类 app 不止挂载一个视图来源。
- `wanmore`：本地视图按 `common / manager / user` 分段，同时再挂 `common` views。
- `metis`：同时挂载 `common` views、`cbdp` views，并通过虚拟模块拼装 `financial` / `gnosis` / `hashrate` / `wanmore` 等来源。
- 对这类 app，必须先确认“当前页面到底归谁拥有”，再做组件复用判断。

### T4：standalone route app
- 当前确认：`general`
- 这类 app 当前只挂自己的 `src/views`，不挂 `common` views。
- 即使存在 `@common` alias，也不能把 `common` 视图或 common-route 假定为页面默认来源。

## zguan 特别说明
`zguan` 不是完全脱离共享体系的特例，但它确实不能被当成“普通 common-path app”处理。

当前已确认的特殊点：
- `vite.config.ts` 同时挂载本地 `src/views` 和 `../common/src/views`
- `~common` 的 baseRoute 直接写死为 `/common`，不是走 `env.VITE_ROUTE_BASE_COMMON`
- `src/main.ts` 使用本地 `@/assets/scss/tailwind.css`，不是 `tailwindcss.css`
- `src/main.ts` 使用本地 `install`、本地 directives、本地 `stores/user.ts` 权限来源
- `src/main.ts` 还接入了 `$bus`、`@repo/ui/dist/ui.css` 和 `./service/template.service`

因此对 `zguan` 的规则是：
- 可以判定为 **T2 common-view mixed app**
- 但实现时要优先相信 `zguan` 自己的 bootstrap、样式入口、权限模型和业务组件层
- 不能因为它挂了 `common` views，就假设它在 i18n / auth / theme / install / tailwind 文件命名上完全跟 `common` 一致

## 实施入口检查
进入正式选型前，至少输出下面 10 项：
- 当前目标 app
- app 拓扑：T1 / T2 / T3 / T4
- 当前页面的 route ownership：本 app `src/views` / `~common` / `~cbdp` / 其他挂载来源
- 拓扑验证证据：已核对 `vite.config.ts` / `src/main.ts` / router 入口；记录 topology 验证脚本结果；如矩阵冲突，记录当前代码结论
- 页面类型：列表 / 卡片列表 / 详情 / 创建编辑 / 多步骤 / 组合容器
- 页面壳来源：当前 app / `apps/common/src/components` / 其他共享层
- 业务组件层级：页面壳 / 业务区块 / 当前 app 业务复用 / 通用业务控件 / 基础控件
- 字段映射
- 常量来源
- 工具来源
- 加载策略

如果这些关键项答不上来，就继续查当前 app 相邻模块和已挂载视图来源，不直接进入落码。

## 新功能最终代码校验
命中 `project-mamba` 新功能页面时，交付前必须完成自动检查和人工检查两层闭环。

### 自动检查
- 运行 `skills/frontend-implementer-skill/scripts/check-project-mamba-implementation.mjs`，必须显式传入本次目标文件，或在最终输出列出脚本实际 checked files；空检查不得视为通过。
- 运行 `skills/frontend-implementer-skill/scripts/verify-encoding.mjs` 检查本次目标文件或目录，覆盖 UTF-8 BOM 与常见乱码；空检查不得视为通过，除非明确使用 `--allow-empty` 并说明原因。
- 自动检查硬指标：
  - 新增 `.vue` 物理总行数不超过 250 行
  - 函数 70 行以内最佳，100 行为上限；超过 100 行必须拆分
  - Vue SFC 必须使用 `<script setup>`
- `locale`、`schema`、纯配置组件可以排除 `.vue <= 250` 硬门禁；最终输出必须说明排除原因。
- 源码必须按 UTF-8 保存，目标是“不乱码且可读”；不要用 `\uXXXX` Unicode escape 作为防乱码手段。中文文案、`zh-CN` / `zh-cn` locale value、枚举 label、状态文案和业务展示常量必须直接写可读中文。正则里的单个中文字符或中文标点也优先直写（如 `/[,，]/`）；只有 Unicode 字符范围匹配等技术场景可以保留 `\uXXXX`（如 `/[\u4e00-\u9fff]/` 或 `new RegExp('[\\u4e00-\\u9fff]')`），并在最终输出说明。
- `verify-encoding.mjs` 只负责 UTF-8 / BOM / 常见乱码；中文 Unicode escape 是否违规由 `check-project-mamba-implementation.mjs` 与最终人工检查共同兜底。
- 旧文件默认不因历史超限阻断；如果用户明确要求优化旧文件，本次必须纳入拆分或瘦身计划。
- 当用户明确指定旧文件优化，或旧 `.vue` 是本次新功能主承载页面时，运行脚本必须追加 `--strict-vue-lines`，把 250 行限制应用到所有被检查的 `.vue` 文件。

### 人工检查
- 新增组件或 `useXxx.ts` 前，先检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`；最终输出必须列出检索范围、命中候选和未复用原因。
- 弹出层表单、抽屉表单、popover 表单不得默认手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`；先查项目已有弹窗表单、抽屉表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块已有 modal/form 封装和 `easybill-ui`。确实无法复用时，才能基于 Element Plus 组合实现，并在最终输出列出命中候选和未复用原因。
- 表格不得默认手写 `el-table` 或原生 `<table>`；先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`packages/utils/src/CurdTable` 的 `ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层。表格主能力不在 `apps/common/src/utils`；只有涉及导入导出时，才检查 `apps/common/src/utils/genericExportImport.ts` 等 common utils。确实无法复用时，才能基于 Element Plus 表格实现，并在最终输出列出命中候选和未复用原因。
- 模板中出现任何 `v-for` 前，必须先查项目已有组件或同语义封装，尤其是 tag/badge 集合、选项列表、字段 fragments、列表项、卡片列表和 `OverflowTag` 这类能力；确实没有合适封装时才允许手写循环，最终输出必须说明检索范围、命中候选和未复用原因。
- 页面模板中 loading、error、empty、permission、filtered-empty、list-body 等 `v-if` / `v-else-if` / `v-else` 状态分支超过 3 个，或单个状态块超过约 30 行时，必须优先抽成页面私有状态展示组件或内容区子组件；页面保留数据和事件编排，子组件承接状态 UI。
- 组件抽离、目录落点、胶囊目录和 API 设计以 `docs/component-extraction-policy.md` 为准；半通用半业务组件只抽稳定交互骨架，不抽业务数据和业务动作。
- 抽离前列出将抽离代码块、组件 / Hook 名称、目标目录、职责和抽离原因；涉及组件 API 时补充 `props` / `emits` / `defineModel` 边界。最终输出要说明抽离前预案与实际落地是否一致，不一致时说明原因。
- 抽离大页面块后继续检查抽出的页面块组件：重复视觉壳、交互壳、浮层触发器、选项渲染或操作按钮不得留在同一组件内反复复制，应再抽成小子组件。
- 若组件私有逻辑需要抽 `useXxx.ts`、局部 `types.ts` 或 `utils.ts`，使用组件同名目录收纳；页面级或模块级共享逻辑才放在页面 / 模块目录。
- 拆分落点按复用半径决定：页面私有就近放当前页面目录；同模块多个页面复用放模块级目录；当前 app 多模块复用放 app 级 `commons` / `components`；跨 app 稳定复用才考虑 `apps/common` 或 `@repo`。
- 组件能力优先项目已有封装、Element Plus 和 `easybill-ui`；布局、间距和尺寸优先 Tailwind utility；布局结构默认使用 flex，禁止新增 Tailwind grid utility 或 CSS Grid 属性；`<style>` 必须 `scoped`，简单布局 / 间距 / 尺寸 / 排版声明优先迁到 template Tailwind class，复杂容器自适应、hover / focus 状态和深层覆盖再放 scoped SCSS；原生 HTML 只用于合适的视觉结构或现有能力缺口。
- 页面或组件自身需要滚动容器时，必须使用 `el-scrollbar` 或项目已有内建滚动组件；禁止自行使用原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll` 或自定义 scrollbar 样式。
- Vue 3 实现优先 `<script setup>`、TypeScript、`defineModel` 和 `computed`；`watch` 只处理副作用，不维护可推导状态。
- `defineProps` 简单场景可用泛型；复杂数组、对象、联合类型、业务类型数组或需要 default / required / validator 时，使用对象写法配合 `PropType`。`PropType` 与业务类型必须使用 `import type`。
- 抽离组件如 props 引用了外部业务类型、`./types` 或相对路径导入类型，不使用 `defineProps<ExternalType>()` 做 props 推导；改用运行时 props 对象 + `PropType`，避免 SFC 编译宏或 `anonymous.vue` 场景解析失败。
- 数组 / 对象 props 的 `default` 必须使用工厂函数；有 `default` 时通常不写 `required: false`，`required: true` 不写 `default`。
- props 命名必须有业务语义；子组件不得直接修改 props 或 props 对象 / 数组的深层值，需要编辑时复制本地状态或使用 `defineModel`。
- 最终输出必须给出达标 / 未达标检查表：topology 结果、checked files、`.vue <= 250`、复用检查证据、浮层表单复用检查、表格复用检查、`v-for` 复用检查、状态分支抽离、页面结构清晰 / 冗杂抽离审视、UTF-8 / 中文直写 / Unicode escape、抽离预案与实际落地、函数长度、Vue 3 语法、Tailwind / Element Plus 使用、flex 布局 / 禁用 grid、容器自适应、滚动容器 / scrollbar、边界状态、验证命令。
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，运行 `scripts/check-component-structure.mjs --strict`；只有纯历史目录扫描或无组件目录在作用域时，才允许非 strict 或 `--allow-empty`，且必须说明原因。

## 页面壳与组件选择规则
### T1：common-shell source app
- 页面壳、共享布局、主题行为优先查 `apps/common/src/components` 与 `apps/common/src/layout`
- 对 `common` 的页面改动，默认考虑跨 app 影响

### T2：common-view mixed app
- 当前页面如果归属本 app `src/views`，先查本 app 的业务组件和相邻模块
- 页面壳、布局容器、详情导航这类共享壳，再查 `apps/common/src/components`
- 只有当当前路由实际来自 `~common` 时，才把 `common` view 内的实现当成第一参考
- 不要把“挂了 common views”误判成“所有业务组件都优先从 common 找”

### T3：multi-source route app
- 先确认当前页面来自哪个挂载目录
- `wanmore`：先判断页面来自 `src/views/common`、`src/views/manager`、`src/views/user` 哪一层
- `metis`：先判断页面来自本地 `src/views`、`~common`、`~cbdp`，还是 `VITE_ROUTER_MODULES` 挂载的其他 app 来源
- 确认 route ownership 后，再在对应来源内找相邻页面和同语义实现
- 不允许在 route ownership 不清楚时直接跳到 `apps/common/src/components` 或通用组件层

### T4：standalone route app
- 当前 app `src/views/components` 与 `src/components` 优先
- 页面壳是否复用 `common`，必须以当前代码实际 import 和相邻页面为准
- 不把 common-route 结构和 common-view 页面组合强行套进来

## 页面壳优先组件
以下组件依然是 `project-mamba` 中高频共享壳，但只能在完成 app 判型和 route ownership 判定后使用：
- 页面主容器：`apps/common/src/components/MainBox/src/MainBox.vue`
- 页面头部与主操作区：`HeaderBox`
- 独立内容区块：`apps/common/src/components/CardBox/src/CardBox.vue`
- 详情页导航：`apps/common/src/components/DetailTabs/src/DetailTabs.vue`
- 单页详情头：`apps/common/src/components/DetailHeader/src/DetailHeader.vue`
- 卡片列表容器：`apps/common/src/components/ListCardBox/src/ListCardBox.vue`
- 列表单项：`apps/common/src/components/ListCardItem/src/ListCardItem.vue`
- Schema 表单容器：`apps/common/src/components/InstanceForm/src/InstanceForm.vue`

## 页面类型优先组合
这些组合同样是高频默认组合，但不是无条件适用于所有 app：
- 列表页：`MainBox + HeaderBox + ScrollBox + FilterBox + CurdTable`
- 卡片列表页：`MainBox + HeaderBox + ScrollBox + FilterBox + ListCardBox`
- 详情页：`MainBox + HeaderBox + DetailTabs + router-view`，结构化字段优先 `DetailInfo`
- 创建 / 编辑页：优先 `InstanceForm`，多步骤再查 `InstanceStepPage` / 同目录现有 schema 写法

在 T3 / T4 中，如果相邻页面已经证明不用这套壳，先跟随该 app 的实际页面模式。

## 字段映射与展示
- 状态 / 枚举：优先最近的 `constant.ts`，展示优先 `ConstantStatus`、`ColumnFactory.Dict()`、`getConstantLabel()`
- 时间：优先 `dateFormatter()` 或 `ColumnFactory.Date()`，不要在页面里散写格式化
- 结构化详情：优先 `DetailInfo`
- 表单字段：优先 `SchemaItemFactory`
- 文件 / 对象存储路径：先查当前目标 app `src/components` 是否已有表单集成组件
- 标签集合：优先 `OverflowTag` 或现有卡片 tags 槽位
- 金额 / 容量 / 数值：优先统一 formatter，如 `volumeFormat()`、`amount()`、`countFormat()`

## 表格规则
- 列定义优先 `packages/utils/src/CurdTable/ColumnFactory.ts`
- 普通文本列优先 `ColumnFactory.Column(...).TooltipMinWidth(...)`
- 枚举列优先 `ColumnFactory.Dict(...)`
- 日期列优先 `ColumnFactory.Date(...)`
- 只有列工厂表达不了时，才退到自定义 slot / formatter

## 常量与 i18n
- 当前模块已有 `constant.ts` 时优先就近复用；没有时再用应用级 `src/utils/constant.ts`
- 新增或修改枚举时，同时检查当前 app 对应的 `src/locales/zh-cn/constant.ts` 和 `src/locales/en/constant.ts`
- 筛选项、表单选项、详情回显、表格列展示必须共用同一份 options
- `zh-cn` / `zh-CN` 文案值保持 UTF-8 中文直写，不使用 `\uXXXX` 转义；英文 locale 保持英文原文。若出现乱码，先修复编码链路，不用转义规避；只有 Unicode 字符范围匹配等技术场景可以例外，单个中文字符或中文标点不属于例外。
- 如果当前 app 已有状态常量惯例，沿用现有 `type`、`effect`、`border`、`icon` 结构
- 如果 `main.ts` 实际使用的是 `@common/locales`，则共享 locale 变更按跨 app 影响处理

## 样式与 bootstrap 规则
- 样式入口文件名不能想当然：有的 app 用 `tailwind.css`，有的用 `tailwindcss.css`
- i18n、auth、install、directives、globals、store 以当前 app `src/main.ts` 的真实 wiring 为准
- 对 `zguan`、`hashrate`、`wanmore` 这类 bootstrap 更本地化或存在跨 app alias 的项目，不要把 `common` 的初始化链直接套过去；先看当前 `main.ts`

## Font token and prototype adaptation
- Before copying typography from an AGIOne prototype into `project-mamba`, inspect the target app's actual font variables and local font assets. Do not assume prototype font names are available in the target app.
- Do not assume `apps/common/src/assets/scss/vars.scss` exists. Locate the actual style entry and token file from the target app's `src/main.ts`, local `assets/scss/*`, and imported shared styles before choosing font tokens.
- When the target app actually defines or imports `--el-font-family` / `--ui-font-body`, treat them as the default UI font for prose, labels, buttons, filters, alerts, tags, and normal business text.
- Use `--ui-font-mono` only for technical identifiers and machine-readable values: image names, registry paths, IDs, code-like strings, numeric capacity values, timestamps, and similar table cells where scan alignment matters. Pair numeric mono text with `font-variant-numeric: tabular-nums` when alignment is required.
- Use `--ui-font-heading` only for heading semantics. If the configured heading family, such as Manrope, has no local font asset or app-level import, expect fallback to `--el-font-family` and do not force prototype-only font names locally.
- When a prototype uses `Inter Variable`, `Manrope Variable`, `IBM Plex Mono`, `PingFang SC`, or `Microsoft YaHei`, copy only size, weight, line-height, color, spacing, and smoothing details unless the target app already provides or explicitly imports the same font resources.
- For public components such as `PageAlert`, prefer project font tokens (`var(--el-font-family)`, `var(--ui-font-body)`, `var(--ui-font-mono)`) over hard-coded prototype font stacks. Preserve the prototype's visual rhythm while staying inside the target project's font source of truth.

## 加载态规则
- `ListCardBox` 已内建 `ListLoadingBox`，卡片列表优先复用
- `CurdTable` 自带 loading 遮罩与表头占位，表格场景默认不用额外 skeleton
- 表单回填和分页器通常不需要额外 skeleton
- KPI 区或详情大块空白区若会塌高，再补同目录 `XxxLoadingBox.vue`

## 原生 HTML 兜底
- 只有在确认当前页面实现、当前 app 业务组件层、共享壳组件层、`easybill-ui` 和 Element Plus 都不满足时，才允许写原生 HTML
- 不允许静默退回原生 HTML；必须先明确提示缺的组件能力、为什么现有体系不够、原生 HTML 只负责哪一小段结构
