# 实现与改造检查清单

本文件补充 `frontend-implementer-skill` 在实现、修复和重构阶段的检查项。

## 接收参数检查
- 是否明确目标文件、目标页面或目标模块
- 是否明确任务类型：实现 / bug 修复 / 重构 / 文档补全
- 是否已有复现步骤、报错信息、设计输入或已确认原型
- 是否已识别需要遵循的项目约束和 ai-web-system 反馈机制

## 任务分类检查
- 当前任务是实现、bug 修复、重构，还是文档补全
- 输入前提是否足够支撑直接落代码
- 如果是新功能开发，是否已经有已确认原型；没有则是否回退到 `existing-project-feature-skill` 或 `agione-ui`

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

## 实现检查
- 是否优先复用现有组件、模式和目录结构
- 页面容器逻辑、区块逻辑和子组件逻辑是否分离
- 数据映射是否符合页面结构和业务语义
- 是否存在 `watch` 维护派生状态、模板逻辑过重、props/emits 边界不清的问题
- 是否遵守页面层决策容器、子组件只负责内容的原则
- 如果存在“规格碎片 / 轻量字段碎片 / 非标签型局部 badge”这类展示，是否先判定其语义，而不是直接套 tag / badge 组件；语义口径见 `docs/semantic-display-patterns.md`
- 如果涉及 Element Plus 浮层（dropdown / popover / tooltip / select 等），是否优先在组件内部配合 `popper-class` 处理浮层壳层和交互，而不是先用页面外层覆盖修补
- 是否先区分当前样式问题属于项目语义层（`--ui-*`）还是 Element Plus 原生 anatomy / 状态层（`--el-*`），并在正确 token 层修改，而不是把两套 token 混用成视觉补丁
- 如果当前任务已有明确原型，是否先核对实现结果与原型在布局、间距、边框、圆角、hover/focus 背景、字体颜色等可观察细节上的一致性，再判断是否需要主题兼容修正
- 如果交互视觉看起来不对，是否先区分语义层（type / intent）、状态层（disabled / loading / reason）和渲染层（button / menu / popper 样式），而不是直接跨层改配置
- 新增组件 / Hook 前，是否已检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`，并记录检索范围、命中候选和未复用原因
- 弹出层表单、抽屉表单、popover 表单是否先查项目已有弹窗表单、抽屉表单、Schema 表单、`InstanceForm` / `InstanceStepPage`、当前模块 modal/form 封装和 `easybill-ui`；如手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`，是否说明命中候选和未复用原因
- 表格是否先查项目已有 `CurdTable` / `DataTable` / 表格 wrapper、`ColumnFactory`、`useCurdTable`、当前模块表格配置和当前 app / `apps/common` 组件层；是否明确表格主能力不在 `apps/common/src/utils`，只有导入导出场景才查 `apps/common/src/utils/genericExportImport.ts` 等 common utils；如手写 `el-table` / `<table>`，是否说明命中候选和未复用原因
- 每个 `v-for` 是否已先查项目已有组件或同语义封装；原生标签上的 `v-for` 是否说明为什么不能复用 tag/badge 集合、选项渲染、字段 fragments、列表项或 `OverflowTag` 等已有能力
- 页面模板是否堆了过多 `v-if` / `v-else-if` / `v-else` 状态分支；loading / error / empty / permission / filtered-empty / list-body 等分支超过 3 个或状态块过长时，是否抽成页面私有状态展示组件或内容区子组件
- 抽离前是否已列出将抽离代码块、组件 / Hook 名称、目标目录、职责、抽离原因和必要的 `props` / `emits` / `defineModel` 边界；最终是否对照抽离前预案与实际落地差异
- 抽离前是否已按 `docs/component-extraction-policy.md` 明确不变量、可变量、复用半径、目录落点和 API 契约
- 最终页面结构是否清晰、职责是否可读；如果代码呈现冗杂混乱、主模板难以扫读、状态分支和交互细节缠在一起，是否已认真审视并执行组件抽离或说明保留原因
- 大页面块抽离后，是否再次检查抽离出的页面块组件内部是否仍有重复视觉壳、交互壳、浮层触发器、选项渲染或操作按钮；存在重复时是否继续抽成更小子组件
- 组件私有 hook / types / utils 是否与对应 `.vue` 放进组件同名目录；页面级或模块级共享逻辑才允许放在页面 / 模块目录
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
- 简单 flex 布局是否写在 template class；复杂容器自适应、hover / focus 和深层覆盖是否才进入 scoped SCSS
- 内容区宽度变化但 viewport 不变时，row / card / toolbar 是否按自身容器宽度稳定自适应，而不是只靠 `@media` 改结构
- 页面或组件自身出现滚动容器时，是否使用 `el-scrollbar` 或项目已有内建滚动组件；是否避免原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll` 和自定义 scrollbar 样式

## 边界状态检查
- 加载态
- 空态
- 错误态
- 权限态
- 禁用态

## `project-mamba` 自动检查
- 命中 `project-mamba` 新功能页面时，是否运行 `scripts/check-project-mamba-implementation.mjs`，且显式传入目标文件或列出 checked files
- 是否运行 `scripts/verify-encoding.mjs` 覆盖本次目标文件或目录；是否存在 UTF-8 BOM、常见乱码或空检查误判
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，是否运行 `scripts/check-component-structure.mjs --strict`
- 自动检查是否覆盖本次新增 / 修改文件；空检查是否被视为失败，或是否使用 `--allow-empty` 并说明原因
- 自动检查未通过时，是否先整改硬指标再交付
- 旧 `.vue` 是本次新功能主承载页面时，是否使用 `--strict-vue-lines`
- `locale`、`schema`、纯配置组件如被排除，是否说明排除原因
- 源码是否保持 UTF-8 且无明显乱码；中文文案、`zh-CN` / `zh-cn` locale value、枚举 label 和状态文案是否直接写可读中文；是否避免用 `\uXXXX` Unicode escape 作为防乱码手段；正则中的单个中文字符或中文标点是否直写；如为 Unicode 字符范围匹配等技术例外是否说明原因

## 风险检查
- 修改范围是否过大
- 是否触达共享组件或公共函数
- 是否需要叠加独立 `page-review-skill`

## 输出前检查
- 是否说明了风险与最小验证建议
- 是否判断了是否值得回写
- 是否明确区分回写层级：`skills/` / `rules/` / Claude memory / 当前任务结论
