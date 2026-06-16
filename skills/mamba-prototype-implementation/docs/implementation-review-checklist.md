# 实现与改造检查清单

本文件补充 `mamba-prototype-implementation` 在已确认原型实施与校验阶段的检查项。

## 接收参数检查
- 是否明确目标文件、目标页面或目标模块
- 是否明确任务类型：原型落码 / 页面新增 / 页面变更 / 原型差异整改
- 是否已有复现步骤、报错信息、设计输入或已确认原型
- 是否已识别需要遵循的 project-mamba 公共 skill、当前仓库约束和本 skill 校验脚本

## 任务分类检查
- 当前任务是否属于已确认原型实施与校验
- 输入前提是否足够支撑直接落代码
- 如果原型关键决策未确认，是否先补齐字段、动作、状态或布局决策，而不是自行发明

## 实施前门禁复核检查
- 用户要求“严格复查”“先不要急着改代码”或“先不要改代码”时，是否在任何代码编辑前进入实施前门禁复核并先输出四张表
- 实施前门禁复核是否至少完成 3 轮（3 遍）：第 1 轮查复用证据和原型差异，第 2 轮查 Vue 结构、数据归属和胶囊目录，第 3 轮查自动检查计划、checked files、阻断项和最小整改路径
- 第 3 轮仍发现阻断项时，是否继续追加第 4 轮 / 第 5 轮复核并先补齐结论，而不是进入代码实施
- 现有组件 / 工具 / 目录复用校验表是否覆盖每个自定义 UI、每个 `v-for`、tag / badge / status、dialog / form / table / filter，并给出搜索命令、关键词、命中候选、采用或未复用原因
- 原型对比表是否按头部、筛选区、卡片区、弹窗、空 / 加载 / 错误态、图标语义 / 图标体系逐块对比原型与现有实现，说明差异、影响和最小整改项
- Vue 结构自检是否覆盖页面是否过重、组件拆分是否合理、状态 / 接口 / 常量是否放对目录，以及 `index.vue` / 同目录主 `.vue` 是否仍保持页面编排清晰
- 自动检查结果是否覆盖类型检查、实现检查、结构检查、编码检查和 diff check；无法运行时是否说明具体原因，而不是写“通过”
- 发现问题后是否只做最小修改，并在修改后重新跑上述自动检查和必要的语义复查

## 上下文定位检查
- 是否已查到目标组件 / 页面 / composable / util / constant / type 的来源
- 是否已查到关键调用方、被引用方或路由入口
- 如果命中 `project-mamba`，是否已先读取当前 app 的 `vite.config.ts` 与 `src/main.ts`
- 如果命中 `project-mamba`，是否已判定 app 拓扑与当前页面的 route ownership
- 是否已用当前代码核对 `project-mamba-app-topology-matrix.md`；如矩阵冲突，是否以当前代码为准并列为回写候选
- 如果本次修改 `apps/*/vite.config.ts` 或 `apps/*/src/main.ts`，是否同步检查 topology matrix 是否需要更新
- 命中新功能或 route ownership 不清楚时，是否运行 `scripts/verify-project-mamba-topology.mjs --app=<app> --suggest`；修改 `vite.config.ts` / `main.ts` 时是否运行全量 topology 检查
- topology 结果是否不是 `unknown`、不是空 route source、不是运行目录错误；drift 是否已阻断继续依赖旧矩阵
- 如果修改公共层，是否已判断兼容性影响

## 新页面开发顺序检查
- 是否先完成需求 / 原型确认，再进入代码实现；页面主任务、区块、状态、弹窗、筛选、卡片、表格、空 / 加载 / 错误态是否明确
- 是否完成项目上下文和复用扫描；自定义 UI、`v-for`、tag / badge / status、dialog / form / table / filter、icon 是否都有搜索证据
- 是否先设计页面结构拆分、数据归属和胶囊目录，再创建文件和落代码
- 是否先实现业务容器组件和纯视觉组件，最后组装 `index.vue`
- 是否在实现落地后整理页面局部纯工具函数：`valueOrEmpty`、`normalizeText`、格式化、解析、兜底展示等无副作用函数进入当前目录 `utils/index.ts`，必要类型进入 `types/index.ts`
- 是否在实现完成后同时跑自动校验和语义复查，而不是只跑其中一部分
- 是否未主动运行 build；若最终未运行 build，是否说明“构建由前端负责人人工查看页面并确认后手动提交”
- 可见 UI 修改后，是否刷新目标页面并确认页面正常渲染、核心内容未丢失；无法刷新时是否说明原因

## 实现检查
- 是否优先复用现有组件、模式和目录结构
- 页面容器逻辑、区块逻辑和子组件逻辑是否分离
- 数据映射是否符合页面结构和业务语义
- 是否存在 `watch` 维护派生状态、模板逻辑过重、props/emits 边界不清的问题
- 是否遵守页面层决策容器、子组件只负责内容的原则
- 页面主文件是否只保留数据编排、`computed`、事件处理和组件组装；纯工具函数是否不依赖 Vue 响应式状态、不直接调接口、不操作路由、不改变后端接口调用、字段来源和业务行为
- 本地工具 / 类型引用是否使用显式入口 `./utils/index`、`./types/index`；抽离后是否检查所有引用点并删除旧重复函数、废弃文件
- 如果存在“规格碎片 / 轻量字段碎片 / 非标签型局部 badge”这类展示，是否先判定其语义，而不是直接套 tag / badge 组件；语义口径见 `docs/semantic-display-patterns.md`
- 如果涉及 Element Plus 浮层（dropdown / popover / tooltip / select 等），是否优先在组件内部配合 `popper-class` 处理浮层壳层和交互，而不是先用页面外层覆盖修补
- 是否先区分当前样式问题属于项目语义层（`--ui-*`）还是 Element Plus 原生 anatomy / 状态层（`--el-*`），并在正确 token 层修改，而不是把两套 token 混用成视觉补丁
- 图标是否完成原型语义与依赖复查：原型图标体系 / 具体图标名、当前 app 已安装图标库、共享 UI 图标封装、当前实现图标映射、是否新增依赖或偏离原型，是否都已列明；不允许静默用近似图标替代明确原型图标
- 如果当前任务已有明确原型，是否先核对实现结果与原型在布局、间距、边框、圆角、hover/focus 背景、字体颜色等可观察细节上的一致性，再判断是否需要主题兼容修正
- 如果交互视觉看起来不对，是否先区分语义层（type / intent）、状态层（disabled / loading / reason）和渲染层（button / menu / popper 样式），而不是直接跨层改配置
- 新增组件 / Hook 前，是否已检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`，并记录检索范围、命中候选和未复用原因
- 涉及路由跳转、详情链接、菜单链接或 `getRouteUrl` 时，是否先查当前 app / 当前模块已有封装和相邻用法；当前项目内部跳转优先项目内封装，跨 app、共享组件或公共跳转才使用公共 `@repo/utils` 封装。`hashrate` 中本地 `@hashrate/utils/global` 的 `getRouteUrl(path)` 用于 hashrate 内部路径，公共 `@repo/utils` 的 `getRouteUrl(app, path)` 用于跨 app 或需要显式 app 参数的公共跳转。
- 表单类弹出层是否严格使用 `FormDialog.show`；是否检索 `FormDialog.show`、项目已有弹窗表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块 modal/form 封装和 `easybill-ui`；如出现手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`，是否已判定为未达标；非表单 / 纯确认可说明不适用，项目无 `FormDialog.show` 时必须阻断或请用户确认
- 表格是否先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层；是否明确表格主能力不在 `apps/common/src/utils`，只有导入导出场景才查 `apps/common/src/utils/genericExportImport.ts` 等 common utils；如手写 `el-table` / `<table>`，是否说明命中候选和未复用原因
- 每个 `v-for` 是否已先查项目已有组件或同语义封装；原生标签上的 `v-for` 是否说明为什么不能复用 tag/badge 集合、选项渲染、字段 fragments、列表项或 `OverflowTag` 等已有能力
- 页面模板是否堆了过多 `v-if` / `v-else-if` / `v-else` 状态分支；loading / error / empty / permission / filtered-empty / list-body 等分支超过 3 个或状态块过长时，是否抽成页面私有状态展示组件或内容区子组件
- 首要校验：新增功能或页面的 `src/views/**/index.vue` / 同目录主 `.vue` 是否仍保持页面编排清晰；顶部选择区、筛选面板、状态列表、卡片列表、详情区等稳定 UI 块是否已抽成同目录页面私有组件
- 数据归属组件强校验：是否避免一个 `usePage` / `useXxx` 大 hook 管全页数据；业务容器组件的数据获取、loading、empty、error、refresh 是否在组件内部闭环；页面 `index.vue` 是否只保留 route、共享状态和跨组件事件编排
- `index.vue` 是否避免 destructure 一长串子组件私有数据；`usePage` / `useXxx` 返回值超过 8-10 个时是否拆分或说明原因
- 纯视觉组件是否只接收 props；`Pill` / `IconCapsule` / `MetricCell` / `CardItem` / `EmptyState` / `PlanCard` 等是否没有 import Api / router / store / mock service
- 胶囊目录强校验：`components/` 根目录是否避免同功能前缀平铺；有 hook / type / constants 的新增模块是否进入同名胶囊目录；胶囊目录是否有 `index.vue` 或 `index.ts`；组件胶囊是否使用 `index.vue` 而不是 `Foo.vue`
- 页面根 `index.vue` 是否只做编排；是否避免承载细节 UI 或直接 import 一堆兄弟组件
- 抽离前是否已列出将抽离代码块、组件 / Hook 名称、目标目录、职责、抽离原因和必要的 `props` / `emits` / `defineModel` 边界；最终是否对照抽离前预案与实际落地差异
- 抽离前是否已按 `docs/component-extraction-policy.md` 明确不变量、可变量、复用半径、目录落点和 API 契约
- 最终页面结构是否清晰、职责是否可读；如果代码呈现冗杂混乱、主模板难以扫读、状态分支和交互细节缠在一起，是否已认真审视并执行组件抽离或说明保留原因
- 大页面块抽离后，是否再次检查抽离出的页面块组件内部是否仍有重复视觉壳、交互壳、浮层触发器、选项渲染或操作按钮；存在重复时是否继续抽成更小子组件
- 是否执行递归三轮抽离复查：脚本是否先完成 3 轮递归覆盖检查并把入口文件、一级子组件、子组件内部文件纳入 checked files；AI 是否在最终检查表中分别给出第 1 轮入口文件、第 2 轮一级子组件、第 3 轮子组件内部文件的语义结论；每轮是否检查结构清晰、已有项目能力复用、进一步抽离可能、Tailwind 样式优先和胶囊目录；第 3 轮仍有问题时是否继续加轮整改
- 组件私有 hook / types / constants / utils 是否与对应 `index.vue` 放进组件同名目录；页面级或模块级共享逻辑才允许放在页面 / 模块目录
- 新增 `.vue` 是否控制在 250 行以内；旧文件若被用户指定优化，是否纳入瘦身或拆分计划
- 函数是否 70 行以内为最佳、100 行为上限；复杂且接近上限的函数顶部是否有一句功能说明，且没有废话注释
- 是否优先使用 `<script setup>`、TypeScript、`defineModel`、`computed`；`watch` 是否只用于副作用
- `defineProps` 是否按场景选择泛型或对象写法；复杂数组 / 对象 / 联合类型 / 业务类型数组是否使用 `PropType`
- 抽离组件是否避免 `defineProps<ExternalType>()` 或泛型 props 直接引用 imported type；外部业务类型 props 是否改为运行时 props 对象 + `PropType`
- `PropType` 与业务类型是否使用 `import type`
- 数组 / 对象 props 的 `default` 是否使用工厂函数；是否避免 `required: false` 与 `default` 的重复语义
- props 命名是否表达业务语义；子组件是否避免直接修改 props 或 props 对象 / 数组的深层值
- 布局样式是否优先 Tailwind utility；交互型能力是否优先项目组件、Element Plus 或已有封装；原生 HTML 是否只用于合适的视觉结构或能力缺口
- 布局是否使用 flex；是否避免 Tailwind grid utility 和 CSS Grid 属性
- 响应式是否优先使用 `flex-wrap`、`flex-basis`、`min-w-*`、`max-w-*`、`gap-*`、`ml-auto` 等自然换行和收缩能力；若 `check-project-mamba-implementation.mjs` 提示 clustered viewport media breakpoints，是否已整改或说明保留的是语义断点
- `<style>` 是否使用 `scoped`；简单 flex / gap / margin / padding / width / height / font 等样式是否写在 template Tailwind class；复杂容器自适应、hover / focus 和深层覆盖是否才进入 scoped SCSS
- 内容区宽度变化但 viewport 不变时，row / card / toolbar 是否按自身容器宽度稳定自适应，而不是只靠 `@media` 改结构
- 页面或组件自身出现滚动容器时，是否使用 `el-scrollbar` 或项目已有内建滚动组件；是否避免原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll` 和自定义 scrollbar 样式

## 边界状态检查
- 加载态
- 空态
- 错误态
- 权限态
- 禁用态

## `project-mamba` 自动检查
- 命中 `project-mamba` 新功能页面时，是否运行 `scripts/check-project-mamba-implementation.mjs`，且显式传入入口文件和所有本地抽离子组件，或列出 checked files；若脚本提示 local child component 未纳入检查，是否补齐后重跑
- 是否运行项目可用的类型检查命令；若仓库没有可用脚本，是否说明缺口和替代检查
- 是否没有运行 `pnpm build`、`npm run build`、`yarn build`、`vite build`、`pnpm --filter <app> build`、`pnpm build:<app>` 等构建命令；除非用户本次明确要求，否则 build 不作为 AI 默认验证
- 是否运行 `scripts/verify-encoding.mjs` 覆盖本次目标文件或目录；是否存在 UTF-8 BOM、常见乱码或空检查误判
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，是否运行 `scripts/check-component-structure.mjs --strict`
- 是否运行 diff check（至少 `git diff --check`，并人工审视本次 diff 是否只包含目标修改）
- 是否刷新目标页面并确认正常渲染；浏览器检查不替代自动检查，自动检查也不替代页面刷新
- 自动检查是否覆盖本次新增 / 修改文件；空检查是否被视为失败，或是否使用 `--allow-empty` 并说明原因
- 自动检查未通过时，是否先整改硬指标再交付
- 旧 `.vue` 是本次新功能主承载页面时，是否使用 `--strict-vue-lines`
- `locale`、`schema`、纯配置组件如被排除，是否说明排除原因
- 源码是否保持 UTF-8 且无明显乱码；中文文案、`zh-CN` / `zh-cn` locale value、枚举 label 和状态文案是否直接写可读中文；是否避免用 `\uXXXX` Unicode escape 作为防乱码手段；正则中的单个中文字符或中文标点是否直写；如为 Unicode 字符范围匹配等技术例外是否说明原因

## 风险检查
- 修改范围是否过大
- 是否触达共享组件或公共函数
- 是否需要追加独立视觉 / 交互验收，或由用户确认项目标准与原型之间的取舍

## 输出前检查
- 是否说明了风险与最小验证建议
- 是否判断了是否值得回写
- 是否明确区分当前任务结论、待回写项目规则、待回写 skill 资源和长期偏好
