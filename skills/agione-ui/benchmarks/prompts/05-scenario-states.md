# agione-ui Benchmark 05 · Prototype State Machine

请使用 `agione-ui --direct` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/05-scenario-states.html`

页面：租户侧「模型部署任务」列表页，需要给 PM 评审多个状态。

业务要求：
- 标准列表页结构：HeaderBox + FilterBox + DataTable。
- 必须使用 shell-sample 自带的右下角紫色圆形悬浮入口；点击后通过内置业务状态面板的 Select 切换。不要在 TopNav、Sidebar、main、PageHeader 内自造 `.scenario-bar`、`.demo-switcher`、`.mode-tabs` 或类似切换 UI。
- 状态机需要 5 个状态：正常、加载中、空态、部署失败、权限不足。
- 切换状态时只更新业务状态；不得恢复旧的 TopNav chip/review banner，也不要在业务区重复造“演示模式”提示。
- 正常态表格列：任务名、模型、镜像版本、资源规格、状态、创建人、更新时间、操作。
- 加载态：表格或内容区显示 loading skeleton/spinner。
- 空态：用 EmptyState，文案指向首动作「创建部署任务」。
- 部署失败态：显示错误状态和可重试操作。
- 权限不足态：显示无权限说明，不显示危险操作。

必须覆盖的 mock 数据：
- 正常态至少 6 行。
- 至少 1 个任务为 Running，1 个为 Failed，1 个为 Pending。
- 操作包含查看日志、重试、停止；停止为危险操作。

验收重点：
- 默认只显示右下角圆形悬浮图标，状态只用展开后的内置业务状态 Select 切换。
- 无自造 scenario/state UI。
- 状态切换不改变 chrome 结构。
- 每个状态都有业务意义，不只是换一段文案。
