# Project Mamba Implementation Profile

本文件承接 `mamba-prototype-implementation` 中命中 `project-mamba` 或同构仓库时的专属实施约束。

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

## 新页面功能开发顺序
命中 `project-mamba` 新页面 / 新功能模块时，先确认原型与上下文，再定组件边界、数据归属和胶囊目录，最后落代码和组装 `index.vue`。不得先写一个大页面再补拆分。

强制顺序：原型确认 → app / route ownership / 复用扫描 → 页面结构拆分 → 数据归属设计 → 胶囊目录落位 → 业务容器组件实现 → 纯视觉组件实现 → `index.vue` 组装 → 自动校验 → AI 语义复查。最终检查表必须覆盖每一步；缺任一步时不能视为交付完成。默认自动校验不包含 build。

## 实施前门禁复核模式
当用户明确要求“严格复查”“先不要急着改代码”或“先不要改代码”时，`project-mamba` 页面不得先改代码，必须先输出四张表：
- 现有组件 / 工具 / 目录复用校验表：每个自定义 UI、每个 `v-for`、tag / badge / status、dialog / form / table / filter 都要给出搜索命令、关键词、命中候选、采用或未复用原因。
- 原型对比表：按头部、筛选区、卡片区、弹窗、空 / 加载 / 错误态、图标语义 / 图标体系逐块对比原型与当前实现，说明差异、影响和最小整改项。
- Vue 结构自检：判断页面是否过重、组件拆分是否合理、状态 / 接口 / 常量是否放对目录，首要检查 `src/views/**/index.vue` 与同目录主 `.vue` 是否仍清晰可扫读。
- 自动检查结果：覆盖类型检查、实现检查、结构检查、编码检查和 diff check；无法运行的检查必须说明原因，不得空写通过。

实施前门禁复核至少 3 轮（3 遍）：
- 第 1 轮：复用与原型差异复查。聚焦现有组件 / 工具 / 目录复用证据、原型逐块差异、图标语义、表格 / 表单 / 弹窗 / `v-for` 是否已有项目能力可复用。
- 第 2 轮：结构与数据归属复查。聚焦页面入口是否过重、业务容器和纯视觉组件边界、数据是否跟着业务组件走、胶囊目录和 props / emits / `defineModel` 边界是否清晰。
- 第 3 轮：校验计划与阻断项复查。聚焦 checked files 是否覆盖入口和抽离文件、将运行哪些自动检查、哪些 warning/error 会阻断实施、最小整改路径是否明确。

第 3 轮仍发现阻断项时，不得进入代码实施；继续追加第 4 轮 / 第 5 轮，直到阻断项收敛为明确实施项或用户确认的取舍。

发现问题后才进入最小修改；修改后必须重新跑自动检查，并更新四张表或最终代码校验表中的整改结果。

## 新功能最终代码校验
命中 `project-mamba` 新功能页面时，交付前必须完成自动检查和 AI 语义校验两层闭环。

### 自动检查
- 运行 `skills/mamba-prototype-implementation/scripts/check-project-mamba-implementation.mjs`，必须显式传入本次目标文件，或在最终输出列出脚本实际 checked files；空检查不得视为通过。
- 运行项目可用的类型检查命令；如果仓库没有可用 typecheck 脚本，最终输出必须说明缺口和替代检查。
- 禁止主动运行构建命令，例如 `pnpm build`、`npm run build`、`yarn build`、`vite build`、`pnpm --filter <app> build`、`pnpm build:<app>`。构建由前端负责人在人工查看页面、确认无问题后手动提交；除非用户本次明确要求 AI 运行 build，否则最终输出记录 build 未运行。
- 运行 `skills/mamba-prototype-implementation/scripts/verify-encoding.mjs` 检查本次目标文件或目录，覆盖 UTF-8 BOM 与常见乱码；空检查不得视为通过，除非明确使用 `--allow-empty` 并说明原因。
- 运行 diff check：至少执行 `git diff --check`，并人工审视本次 diff 是否只包含目标修改。
- 页面入口结构清晰 / 冗杂抽离审视是首要 AI 语义门禁；新增功能或页面的 `src/views/**/index.vue` / 同目录主 `.vue` 如果承载过多页面区块、状态分支、交互细节和样式壳层，必须先抽出页面私有组件并在最终检查表列出。
- 自动检查硬指标：
  - 新增 `.vue` 物理总行数不超过 250 行
  - 函数 70 行以内最佳，100 行为上限；超过 100 行必须拆分
  - Vue SFC 必须使用 `<script setup>`
- `locale`、`schema`、纯配置组件可以排除 `.vue <= 250` 硬门禁；最终输出必须说明排除原因。
- 源码必须按 UTF-8 保存，目标是“不乱码且可读”；不要用 `\uXXXX` Unicode escape 作为防乱码手段。中文文案、`zh-CN` / `zh-cn` locale value、枚举 label、状态文案和业务展示常量必须直接写可读中文。正则里的单个中文字符或中文标点也优先直写（如 `/[,，]/`）；只有 Unicode 字符范围匹配等技术场景可以保留 `\uXXXX`（如 `/[\u4e00-\u9fff]/` 或 `new RegExp('[\\u4e00-\\u9fff]')`），并在最终输出说明。
- `verify-encoding.mjs` 只负责 UTF-8 / BOM / 常见乱码；中文 Unicode escape 是否违规由 `check-project-mamba-implementation.mjs` 与最终 AI 语义校验共同兜底。
- 旧文件默认不因历史超限阻断；如果用户明确要求优化旧文件，本次必须纳入拆分或瘦身计划。
- 当用户明确指定旧文件优化，或旧 `.vue` 是本次新功能主承载页面时，运行脚本必须追加 `--strict-vue-lines`，把 250 行限制应用到所有被检查的 `.vue` 文件。

### AI 语义校验
- 新增组件或 `useXxx.ts` 前，先检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`；最终输出必须列出检索范围、命中候选和未复用原因。
- 弹出层表单、抽屉表单、popover 表单不得默认手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`；先查项目已有弹窗表单、抽屉表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块已有 modal/form 封装和 `easybill-ui`。确实无法复用时，才能基于 Element Plus 组合实现，并在最终输出列出命中候选和未复用原因。
- 表格不得默认手写 `el-table` 或原生 `<table>`；先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`packages/utils/src/CurdTable` 的 `ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层。表格主能力不在 `apps/common/src/utils`；只有涉及导入导出时，才检查 `apps/common/src/utils/genericExportImport.ts` 等 common utils。确实无法复用时，才能基于 Element Plus 表格实现，并在最终输出列出命中候选和未复用原因。
- 模板中出现任何 `v-for` 前，必须先查项目已有组件或同语义封装，尤其是 tag/badge 集合、选项列表、字段 fragments、列表项、卡片列表和 `OverflowTag` 这类能力；确实没有合适封装时才允许手写循环，最终输出必须说明检索范围、命中候选和未复用原因。
- 图标必须纳入门禁复核：先识别原型使用的图标体系和具体语义名称，再核对当前 app 已安装图标库、项目共享 UI 是否已有图标封装、当前实现是否只是用了近似图标。原型明确指定图标体系且项目未依赖时，优先判断是否应在当前 app 显式补依赖；不能静默用 Element Plus 近似图标替代。最终输出列出原型图标、实现图标、依赖来源、采用或偏离原因。
- 页面模板中 loading、error、empty、permission、filtered-empty、list-body 等 `v-if` / `v-else-if` / `v-else` 状态分支超过 3 个，或单个状态块超过约 30 行时，必须优先抽成页面私有状态展示组件或内容区子组件；页面保留数据和事件编排，子组件承接状态 UI。
- 组件抽离、目录落点、胶囊目录和 API 设计以 `docs/component-extraction-policy.md` 为准；半通用半业务组件只抽稳定交互骨架，不抽业务数据和业务动作。
- 数据获取按“数据归属组件”拆分：禁止一个 `usePage` / `useXxx` 大 hook 管全页数据；业务容器组件自己请求自己的接口或 mock，自己维护 loading / empty / error / refresh；页面 `index.vue` 只保留 route query / params、页面级主流程状态、真正跨兄弟组件共享的最小状态和跨组件事件编排；纯视觉组件只接收 props，禁止 import Api / router / store / mock service。`usePage` / `useXxx` 返回值超过 8-10 个或同时返回多组列表、loading、弹窗表单、路由跳转、多个请求、多组 options / tags / cards / table data 时，必须拆分或说明例外。
- 抽离前列出将抽离代码块、组件 / Hook 名称、目标目录、职责和抽离原因；涉及组件 API 时补充 `props` / `emits` / `defineModel` 边界。最终输出要说明抽离前预案与实际落地是否一致，不一致时说明原因。
- 抽离大页面块后继续检查抽出的页面块组件：重复视觉壳、交互壳、浮层触发器、选项渲染或操作按钮不得留在同一组件内反复复制，应再抽成小子组件。
- 抽离后执行递归三轮复查：脚本先做 3 轮递归覆盖检查，第 1 轮覆盖入口文件，第 2 轮覆盖一级子组件，第 3 轮覆盖子组件内部的子组件 / hooks / types / utils；随后 AI 在最终检查表中分别给出三轮语义结论，检查结构清晰、已有项目组件复用、进一步抽离可能、样式 Tailwind 优先和胶囊目录。第 3 轮仍发现问题时必须整改并继续加轮。
- 若组件私有逻辑需要抽 `useXxx.ts`、局部 `types.ts`、`constants.ts` 或 `utils.ts`，使用组件同名目录收纳，并以 `index.vue` 作为组件入口；同名胶囊目录下禁止 `Foo.vue`，必须改为 `index.vue`。页面级或模块级共享逻辑才放在页面 / 模块目录。
- 实现完成后必须做胶囊目录强自检：`components/` 根目录不能出现一堆同一功能前缀的平铺文件；新增模块如果有 `index.vue` 以外的 hook / type / constants，必须有同名胶囊目录；每个胶囊目录必须有 `index.vue` 或 `index.ts`；页面根 `index.vue` 不承载细节 UI，不直接 import 一堆兄弟组件。
- 拆分落点按复用半径决定：页面私有就近放当前页面目录；同模块多个页面复用放模块级目录；当前 app 多模块复用放 app 级 `commons` / `components`；跨 app 稳定复用才考虑 `apps/common` 或 `@repo`。
- 组件能力优先项目已有封装、Element Plus 和 `easybill-ui`；布局、间距和尺寸优先 Tailwind utility；布局结构默认使用 flex，响应式优先通过 `flex-wrap`、`flex-basis`、`min-w-*`、`max-w-*`、`gap-*`、`ml-auto` 自然换行和收缩，断点只用于布局语义确实变化的少数场景；禁止新增 Tailwind grid utility 或 CSS Grid 属性；`<style>` 必须 `scoped`，简单布局 / 间距 / 尺寸 / 排版声明优先迁到 template Tailwind class，复杂容器自适应、hover / focus 状态和深层覆盖再放 scoped SCSS；原生 HTML 只用于合适的视觉结构或现有能力缺口。
- 页面或组件自身需要滚动容器时，必须使用 `el-scrollbar` 或项目已有内建滚动组件；禁止自行使用原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll` 或自定义 scrollbar 样式。
- Vue 3 实现优先 `<script setup>`、TypeScript、`defineModel` 和 `computed`；`watch` 只处理副作用，不维护可推导状态。
- `defineProps` 简单场景可用泛型；复杂数组、对象、联合类型、业务类型数组或需要 default / required / validator 时，使用对象写法配合 `PropType`。`PropType` 与业务类型必须使用 `import type`。
- 抽离组件如 props 引用了外部业务类型、`./types` 或相对路径导入类型，不使用 `defineProps<ExternalType>()` 做 props 推导；改用运行时 props 对象 + `PropType`，避免 SFC 编译宏或 `anonymous.vue` 场景解析失败。
- 数组 / 对象 props 的 `default` 必须使用工厂函数；有 `default` 时通常不写 `required: false`，`required: true` 不写 `default`。
- props 命名必须有业务语义；子组件不得直接修改 props 或 props 对象 / 数组的深层值，需要编辑时复制本地状态或使用 `defineModel`。
- 最终输出必须给出达标 / 未达标检查表：topology 结果、checked files、首要校验：页面入口结构清晰 / 冗杂抽离审视、数据归属组件 / hook 拆分、胶囊目录强校验、递归三轮抽离复查、`.vue <= 250`、复用检查证据、图标语义 / 图标体系复查、浮层表单复用检查、表格复用检查、`v-for` 复用检查、状态分支抽离、路由工具选择、UTF-8 / 中文直写 / Unicode escape、抽离预案与实际落地、函数长度、Vue 3 语法、Tailwind / Element Plus 使用、flex 布局 / 禁用 grid、flex 自然响应式 / 少断点、容器自适应、滚动容器 / scrollbar、边界状态、类型检查、实现检查、结构检查、编码检查、diff check、build 未运行说明、验证命令。
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
- `zh-cn` / `zh-CN` 文案值保持 UTF-8 中文直写，不使用 `\uXXXX` 转义；英文 locale 保持英文原文。若出现乱码，先恢复编码链路，不用转义规避；只有 Unicode 字符范围匹配等技术场景可以例外，单个中文字符或中文标点不属于例外。
- 如果当前 app 已有状态常量惯例，沿用现有 `type`、`effect`、`border`、`icon` 结构
- 如果 `main.ts` 实际使用的是 `@common/locales`，则共享 locale 变更按跨 app 影响处理

## 样式与 bootstrap 规则
- 样式入口文件名不能想当然：有的 app 用 `tailwind.css`，有的用 `tailwindcss.css`
- i18n、auth、install、directives、globals、store 以当前 app `src/main.ts` 的真实 wiring 为准
- 对 `zguan`、`hashrate`、`wanmore` 这类 bootstrap 更本地化或存在跨 app alias 的项目，不要把 `common` 的初始化链直接套过去；先看当前 `main.ts`

## 路由工具与跳转封装
- 涉及路由跳转、详情链接、菜单链接或 URL 生成时，先查当前 app、当前模块和相邻页面的既有封装；不要只因为函数同名就替换 import。
- 当前项目 / 当前 app 内部跳转优先沿用项目内封装；跨 app、共享组件、公共菜单或需要显式指定 app 的跳转，才使用公共 `@repo/utils` 封装。
- `hashrate` 中确实同时存在两类 `getRouteUrl`：`@hashrate/utils/global` 的 `getRouteUrl(path)` 面向 hashrate 内部路径；`@repo/utils` 的 `getRouteUrl(app, path)` 面向跨 app 或公共跳转。按跳转语义选择，不混用签名。
- 如果相邻模块已有稳定用法，以相邻模块为第一证据；新增或修改 import 时，在最终检查表说明选择的是项目内封装还是公共封装，以及原因。

## Font token and prototype adaptation
- Before copying typography from a prototype into `project-mamba`, inspect the target app's actual font variables and local font assets. Do not assume prototype font names are available in the target app.
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
