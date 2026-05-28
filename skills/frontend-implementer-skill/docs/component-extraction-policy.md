# Component Extraction Policy

本文件承接 Vue3 + Element Plus + Tailwind 项目中的组件拆分、抽离、落点判断、API 设计与目录组织。新功能页面、页面级重构、组件变厚或视觉稿颗粒度较多时读取。

## 核心原则
- 先抽不变的结构 / 交互骨架，不抽业务数据和业务动作。
- 先放近处，再逐级上提；先稳定契约，再进入公共层。
- 目录要帮助定位上下文。复杂组件按“组件胶囊”聚合 `.vue`、私有 hook、types、constants、私有子组件，不把相关文件散到多个上层目录。
- 页面层负责业务编排、接口请求、筛选条件、表格刷新和路由跳转；组件层负责稳定 UI 骨架、局部交互和输入输出。

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
薄组件继续平铺：

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

页面共享内容留在页面根部：

```txt
store/
├── index.vue
├── types.ts
├── constants.ts
├── events.ts
├── hooks/
│   └── useDeployScopes.ts
└── components/
```

避免把当前组件私有文件散到：

```txt
components/Foo.vue
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
