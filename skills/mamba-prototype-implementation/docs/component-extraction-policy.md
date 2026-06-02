# Component Extraction Policy

本文件承接 Vue3 + Element Plus + Tailwind 项目中的组件拆分、抽离、落点判断、API 设计与目录组织。新功能页面、页面级原型变更、组件变厚或视觉稿颗粒度较多时读取。

## 核心原则
- 先抽不变的结构 / 交互骨架，不抽业务数据和业务动作。
- 组件抽离的首要宗旨是让最终页面结构清晰、职责可读、代码不冗杂混乱；如果当前实现已经让页面主模板难以扫读、状态分支和交互细节缠在一起，或重复壳层导致可读性明显下降，必须认真审视是否抽成组件，而不是继续在原文件里堆判断和样式。
- 对新增功能或页面而言，`src/views/**/index.vue` 与同目录主 `.vue` 的结构清晰度是首要大校验；这些入口文件应只保留页面编排，稳定 UI 区块必须优先抽到同目录 `components/`。
- 先放近处，再逐级上提；先稳定契约，再进入公共层。
- 目录要帮助定位上下文。复杂组件按“组件胶囊”聚合 `.vue`、私有 hook、types、constants、私有子组件，不把相关文件散到多个上层目录。
- 页面层负责业务编排、接口请求、筛选条件、表格刷新和路由跳转；组件层负责稳定 UI 骨架、局部交互和输入输出。
- 实现完成后必须自检：`components/` 根目录不能出现一堆同一功能前缀的平铺文件；新增模块如果有 `index.vue` 以外的 hook / type / constants，必须有同名胶囊目录；每个胶囊目录必须有清晰入口 `index.vue` 或 `index.ts`；页面根 `index.vue` 只做编排，不承载细节 UI，不直接 import 一堆兄弟组件。

## 递归三轮复查铁律
组件抽离不是“入口页瘦下来就结束”。每次新增功能页面、页面级原型变更或组件抽离后，脚本必须先做至少 3 轮递归覆盖检查，确保入口文件、一级子组件、子组件内部文件都纳入 checked files；随后由 AI 在最终检查表中给出每轮语义结论：
- 第 1 轮：入口文件 / 主 `.vue`。检查是否只保留页面编排；页面壳、筛选区、状态列表、卡片列表、详情区等稳定 UI 块是否已抽离；是否优先复用项目已有组件、Hook、utils。
- 第 2 轮：已抽离的一级子组件。逐个检查结构是否清晰、是否继续混入重复视觉壳 / 交互壳 / 浮层触发器 / 选项渲染、是否存在进一步子组件或 `useXxx.ts` 抽离可能、样式是否优先 Tailwind。
- 第 3 轮：子组件内部的子组件、私有 hooks、types、utils。检查相关文件是否收敛在同名胶囊目录，API 是否小而清晰，是否仍有可复用项目能力未使用。

第 3 轮必须没有新的抽离候选；如果脚本发现缺失 checked files，先补齐后重跑；如果 AI 语义复查仍发现结构混乱、复用遗漏、样式可迁 Tailwind 或胶囊目录问题，先整改，再继续第 4 轮、第 5 轮，直到一轮全绿。最终输出必须列出三轮检查结果，不能只说“已抽离”。

## 数据获取与 hook 拆分铁律
禁止把页面所有数据都塞进一个 `usePage` / `useXxx` 大 hook。数据跟着业务组件走，页面只管结构和跨组件编排；纯视觉组件只吃 props，大 hook 只负责共享流程，不负责替所有子组件取数。

- 业务容器组件自己获取自己的数据：后端接口数据在该业务组件内部请求；mock 数据放在该业务组件内部或同胶囊目录的 `mock` / `constants` 中；loading / empty / error / refresh 由该业务组件自己维护。
- 页面 `index.vue` 只保留结构性编排和少量跨组件状态：route query / route params、页面级主流程状态、真正被多个兄弟组件共享的最小状态、跨组件事件编排。
- 纯视觉组件不请求接口：`Pill`、`IconCapsule`、`MetricCell`、`CardItem`、`EmptyState`、`RecommendPlanCard` 这类只接收 props；它们只负责展示，不知道接口、路由、store、mock。
- 业务组件可以组合纯视觉组件：例如 `RecommendPlanPanel` 自己请求推荐方案并维护 `planList` / `planLoading` / `selectedPlan`，`RecommendPlanCard` 只展示单个方案，`RecommendMetricCell` / `RecommendPill` 只展示视觉片段。

如果一个 hook 同时返回以下多类数据，就必须拆分：A 组件的数据列表和 loading、B 组件的数据列表和 loading、弹窗表单数据、路由跳转、多个接口请求、多组 options / tags / cards / table data。页面级 hook 最多负责“共享状态与流程编排”，不能替代组件自己的数据层。

实现完成后检查：
- `index.vue` 不能 destructure 一长串子组件私有数据。
- `usePage` / `useXxx` 返回值超过 8-10 个，必须说明为什么不拆；超过 10 个默认视为需要拆分。
- 每个业务组件的数据获取、loading、empty、error 是否在组件内部闭环。
- 纯视觉组件不得 import Api / router / store / mock service。
- mock 和真实接口的切换应在业务组件或其同名胶囊 hook 内完成。

## 抽离前判断
按候选单元逐项判断：
- 不变量：结构、交互骨架、视觉语言、状态反馈是否稳定。
- 可变量：文案、图标、options、状态映射、slot 内容、选中后业务动作、接口请求。
- 复用范围：当前组件 / 当前页面 / 当前模块 / 当前 app / 跨 app。
- 契约稳定度：props、emits、slots、`defineModel` 是否能小而明确。

不要只看“长得像”就抽。语义不同但外观相似的东西不要共用一个组件。

## 落点规则
- 当前组件私有：放组件同名胶囊目录。
- 当前页面多个组件共享：放页面根部的 `hooks/`、`types.ts`、`constants.ts`、`events.ts` 或页面级 `components/`。
- 当前模块多个页面共享：放模块级 `components/` / `hooks/`。
- 当前 app 多模块共享：放当前 app 的公共组件或 commons 目录。
- 跨 app 且契约稳定：才考虑 `apps/common`、`easybill-ui` 或 `@repo`。
- 纯逻辑复用：`useXxx.ts`；纯格式化：`formatters.ts`；事件总线语义：`events.ts`，不要叫 `utils/bus.ts`。

## 目录模式
薄组件只有在没有私有 hook / type / constants、没有私有子组件、也没有同功能前缀集群时才允许平铺：

```txt
components/
├── SearchBox.vue
└── DeployScopePanel.vue
```

满足任意两个条件时改成组件胶囊：
- 组件超过 150 行。
- 有私有 `useXxx.ts`。
- 有私有 `types.ts` / `constants.ts` / `helpers.ts`。
- 有 2 个以上私有子组件。
- 有复杂 props / emits / slots / `defineModel`。
- 有独立交互状态。

推荐胶囊结构：

```txt
components/
└── ModelStoreFilters/
    ├── index.vue
    ├── useModelStoreFilters.ts
    ├── types.ts
    ├── constants.ts
    └── components/
        ├── ModelFilterPopover.vue
        ├── FilterOpenToggle.vue
        └── TagMenu.vue
```

同名胶囊目录下禁止再放同名 `.vue`，例如 `components/ModelStoreFilters/ModelStoreFilters.vue` 不合规；Vue 入口必须是 `components/ModelStoreFilters/index.vue`。非 Vue 纯逻辑胶囊可以用 `index.ts` 作为入口。

页面根只保留编排；共享内容只有在确实属于页面 / 模块级编排时才留在页面根部。细节 UI 的 hook / type / constants 必须跟随对应胶囊：

```txt
store/
├── index.vue
├── types.ts        # 页面级共享类型，不能是某个组件私有类型
├── constants.ts    # 页面级共享常量，不能是某个组件私有常量
├── hooks/          # 页面级编排 hook，不放组件私有逻辑
│   └── useDeployScopes.ts
└── components/
    └── ScopeList/
        ├── index.vue
        ├── useScopeList.ts
        ├── types.ts
        └── constants.ts
```

避免把当前组件私有文件散到：

```txt
components/Foo.vue
components/Foo/Foo.vue
utils/useFoo.ts
utils/types.ts
utils/bus.ts
```

## 半通用半业务组件
遇到 `el-popover + radio group` 筛选标签、dropdown action list、tooltip 状态文本、字段 fragments 等组件时，先拆三层：
- 视图层：固定基础骨架和状态样式；图标、标题、触发器局部内容、选项附加说明用 slot。
- 交互层：内部维护开关、选中同步、回显文本、清空 / 确认等通用交互。
- 数据层：业务方传入 options、状态映射和业务回调；组件不请求接口、不读业务 store、不知道业务字段含义。

命名按语义，不按实现：
- 推荐：`SingleSelectFilter`、`FilterOptionPopover`、`PopoverFilterSelect`、`FieldValueFragments`。
- 避免：`PopoverRadioButton`、`TagSelect`、`RadioPopover`，除非它们真是实现细节组件且只私有使用。

## 状态分支抽离
页面模板出现成组 `v-if` / `v-else-if` / `v-else` 时，先判断它是不是稳定的内容区状态机。满足任意一项就优先抽成页面私有组件：
- 同一区块同时承载 loading、error、empty、permission、filtered-empty、list-body 中的 3 个以上分支。
- 多个分支重复同一套居中、图标、空态、按钮或重试壳层。
- 状态分支把主页面模板撑厚，导致真实列表项、筛选区或操作区难以扫读。
- 状态 UI 有独立交互，例如 retry、clear filter、select scope、expand detail。

推荐落点：页面私有 `components/ScopeListBody.vue`、`components/ModelScopePanel.vue`，或组件胶囊内的 `components/StatePanel.vue`。父页面保留接口请求、筛选条件、权限判断和业务事件；子组件只通过 props / emits 接收状态、列表数据和局部操作。

## API 设计
组件 API 必须小而清晰：
- 输入：只暴露必要 props。
- 输出：事件命名表达用户意图或状态变化。
- 双向绑定：优先 `defineModel`。
- 扩展：slot 承接视图差异，不承接业务数据处理。
- 类型：复杂数组、对象、联合类型、业务类型数组使用 `PropType`，并 `import type`。
- 外部类型：抽离组件的 props 类型如果来自 `./types`、相对路径、`@/types` 或业务模型导入，不直接依赖 `defineProps<ExternalType>()`；使用运行时 props 对象 + `PropType`，避免 SFC 编译阶段解析外部类型失败。
- 默认值：数组 / 对象 props 的 `default` 必须用工厂函数。

## 抽离清单
抽离前输出：
- 候选组件名。
- 将抽离代码块。
- 不变量 / 可变量。
- 复用范围和建议落点。
- props / emits / slots / `defineModel`。
- 是否需要私有 `useXxx.ts`、`types.ts`、`constants.ts`。
- 是否已有组件、hooks、utils 可复用：记录检索范围、检索关键词、命中候选、采用或未复用原因。
- 最终落地时对照抽离前预案；如果组件名、目录、职责或 API 有变化，说明变化原因。

## 上提机制
- 第一次：页面私有实现。
- 第二次：跨文件复用时迁移到页面或模块级。
- 第三次：跨模块复用且契约稳定时迁移到 app 级。
- 跨 app 复用且无业务规则时，再考虑公共组件库。

不要因为“未来可能复用”直接上公共层。业务频繁变化时，私有胶囊比过早公共化更稳。
