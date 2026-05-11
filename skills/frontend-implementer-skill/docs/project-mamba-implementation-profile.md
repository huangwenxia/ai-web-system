# Project Mamba Implementation Profile

本文件承接 `frontend-implementer-skill` 中命中 `project-mamba` 或同构仓库时的专属实施约束。

## 先判定 app 拓扑，不把所有 apps 当成同一种项目
- `project-mamba` 的 app 不是单一拓扑。
- 进入实现前，必须先读当前 app 的 `vite.config.ts` 和 `src/main.ts`，必要时再读 router 入口，确认：
  - 路由来源是只来自当前 app，还是同时挂载了 `common` / 其他 app 的 views
  - 页面壳、i18n、auth、install、directives、globals、store 来源于本 app 还是共享层
  - 当前 app 的样式入口文件名是 `tailwind.css` 还是 `tailwindcss.css`
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
- `metis`：同时挂载 `common` views 和 `cbdp` views。
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
- 页面类型：列表 / 卡片列表 / 详情 / 创建编辑 / 多步骤 / 组合容器
- 页面壳来源：当前 app / `apps/common/src/components` / 其他共享层
- 业务组件层级：页面壳 / 业务区块 / 当前 app 业务复用 / 通用业务控件 / 基础控件
- 字段映射
- 常量来源
- 工具来源
- 加载策略

如果这些关键项答不上来，就继续查当前 app 相邻模块和已挂载视图来源，不直接进入落码。

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
- `metis`：先判断页面来自本地 `src/views`、`~common` 还是 `~cbdp`
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
- 如果当前 app 已有状态常量惯例，沿用现有 `type`、`effect`、`border`、`icon` 结构
- 如果 `main.ts` 实际使用的是 `@common/locales`，则共享 locale 变更按跨 app 影响处理

## 样式与 bootstrap 规则
- 样式入口文件名不能想当然：有的 app 用 `tailwind.css`，有的用 `tailwindcss.css`
- i18n、auth、install、directives、globals、store 以当前 app `src/main.ts` 的真实 wiring 为准
- 对 `zguan`、`hashrate`、`wanmore` 这类 bootstrap 明显更本地化或跨 app 引用的项目，不要把 `common` 的初始化链直接套过去

## Font token and prototype adaptation
- Before copying typography from an AGIOne prototype into `project-mamba`, inspect the target app's actual font variables and local font assets. Do not assume prototype font names are available in the target app.
- For `hashrate` and apps using `apps/common/src/assets/scss/vars.scss`, treat `--el-font-family` / `--ui-font-body` as the default UI font for prose, labels, buttons, filters, alerts, tags, and normal business text.
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
