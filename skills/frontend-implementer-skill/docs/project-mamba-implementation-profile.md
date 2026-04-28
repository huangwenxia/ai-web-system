# Project Mamba Implementation Profile

本文件承接 `frontend-implementer-skill` 中命中 `project-mamba` 或同构仓库时的专属实施约束。

## 复用入口检查
- 不允许只看设计稿直接落代码；先把页面类型、容器组合、字段类型、常量来源和工具来源对齐到已有实现，再决定是否新增。
- 组件选型先判断职责层级，而不是机械按来源列表套顺序：
  - 页面壳 / 布局容器
  - 当前业务页面的语义区块
  - 当前项目的业务复用组件
  - 通用业务控件
  - 基础交互控件
- 在正式选型前，先检查当前页面、同路由相邻页面和相邻模块有没有同语义实现；有则优先复用现成业务块。
- 页面壳、滚动区、卡片壳、详情导航这类布局组件默认先查 `apps/common/src/components`。

## 页面壳优先组件
- 页面主容器：`apps/common/src/components/MainBox/src/MainBox.vue`
- 页面头部与主操作区：`HeaderBox`
- 独立内容区块：`apps/common/src/components/CardBox/src/CardBox.vue`
- 详情页导航：`apps/common/src/components/DetailTabs/src/DetailTabs.vue`
- 单页详情头：`apps/common/src/components/DetailHeader/src/DetailHeader.vue`
- 卡片列表容器：`apps/common/src/components/ListCardBox/src/ListCardBox.vue`
- 列表单项：`apps/common/src/components/ListCardItem/src/ListCardItem.vue`
- Schema 表单容器：`apps/common/src/components/InstanceForm/src/InstanceForm.vue`

## 页面类型优先组合
- 列表页：`MainBox + HeaderBox + ScrollBox + FilterBox + CurdTable`
- 卡片列表页：`MainBox + HeaderBox + ScrollBox + FilterBox + ListCardBox`
- 详情页：`MainBox + HeaderBox + DetailTabs + router-view`，结构化字段优先 `DetailInfo`
- 创建 / 编辑页：优先 `InstanceForm`，多步骤再查 `InstanceStepPage` / 同目录现有 schema 写法

## 组件来源判断顺序
- 当前页面 / 相邻模块已有同语义业务块
- `apps/<current-project>/src/views/components`
- `apps/<current-project>/src/components`
- 页面壳 / 布局容器优先 `apps/common/src/components`
- 通用业务控件优先 `easybill-ui`
- 基础控件最后才落到 Element Plus
- 以上都不满足时，才允许退到原生 HTML，并先说明为什么现有组件体系不够

## 字段映射与展示
- 状态 / 枚举：优先最近的 `constant.ts`，展示优先 `ConstantStatus`、`ColumnFactory.Dict()`、`getConstantLabel()`
- 时间：优先 `dateFormatter()` 或 `ColumnFactory.Date()`，不要在页面里散写格式化
- 结构化详情：优先 `DetailInfo`
- 表单字段：优先 `SchemaItemFactory`
- 文件 / 对象存储路径：先查当前目标项目 `src/components` 是否已有表单集成组件
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
- 新增或修改枚举时，同时检查 `src/locales/zh-cn/constant.ts` 和 `src/locales/en/constant.ts`
- 筛选项、表单选项、详情回显、表格列展示必须共用同一份 options
- 如果当前项目已有状态常量惯例，沿用现有 `type`、`effect`、`border`、`icon` 结构

## 加载态规则
- `ListCardBox` 已内建 `ListLoadingBox`，卡片列表优先复用
- `CurdTable` 自带 loading 遮罩与表头占位，表格场景默认不用额外 skeleton
- 表单回填和分页器通常不需要额外 skeleton
- KPI 区或详情大块空白区若会塌高，再补同目录 `XxxLoadingBox.vue`

## 原生 HTML 兜底
- 只有在当前页面实现、`apps/<current-project>/src/views/components`、`apps/<current-project>/src/components`、`apps/common/src/components`、`easybill-ui` 和 Element Plus 都确认不满足时，才允许写原生 HTML
- 不允许静默退回原生 HTML；必须先明确提示缺的组件能力、为什么现有体系不够、原生 HTML 只负责哪一小段结构
