# agione-ui Benchmark 07 · Edit Increment

请使用 `agione-ui --direct --edit` strict 模式走增量改路径。

前置文件：`{OUTPUT_DIR}/01-standard-list.html`

输出文件：`{OUTPUT_DIR}/07-edit-increment.html`

操作要求：
- 先复制前置文件为输出文件，再按 `--edit` 工作流修改输出文件。
- 只能改 `<main>` 业务区、必要的 i18n key 和 setup 业务数据；不要重写 shell-sample chrome。
- 不要 Read 整个 HTML；按 AGIONE_EDIT_* 锚点局部读取和编辑。
- 不要触碰 LOGO_DARK / LOGO_LIGHT / TopBar / Sidebar chrome 锁定区。

增量需求：
- 在「结算批次管理」列表页表格上方新增一个「本月结算摘要」区域。
- 摘要区域展示 3 个指标：预计应结金额、待确认批次数、异常批次数。
- 不要新增第 4 个 KpiCard；如果需要补充说明，用 KvCard 或普通文本。
- 摘要区域下方新增一条轻量 Alert：提示「本月仍有 2 个异常批次待处理」。
- 表格列和现有筛选条件保持不变。
- 新增文案必须补齐中英双语。

必须覆盖的 mock 数据：
- 预计应结金额 `¥1,284,300.50`。
- 待确认批次数 `7`。
- 异常批次数 `2`。
- Alert 文案中英双语都存在。

验收重点：
- Logo 两段 base64 仍完整。
- 右下角状态机 baseline 仍包含 fixed `.state-machine-control`、圆形 `.state-machine-trigger`、按需展开的 `.state-machine-switcher`、`v-model="activeScenario"` 和基于 `scenarios` 的 Select options，且无旧 `demo-mode-chip` / `demo-banner`。
- 只增量改变业务区，不重写 chrome。
- 无副标题、无 CardBox 包 FilterBox、无 4 个 KpiCard。
