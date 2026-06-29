# agione-ui Benchmark 02 · Detail Tabs + Back

请使用 `agione-ui` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/02-detail-tabs-back.html`

页面：Provider 侧「结算批次详情」。

业务要求：
- 页面主标题：`2026-06 结算批次详情` / `Settlement Batch 2026-06`。
- 详情页必须使用 PageHeader，返回入口固定在标题左侧：`返回` / `Back`。
- 不要在页面顶部另放独立返回按钮，不要同时使用 Breadcrumb 和 back-label。
- 无副标题；批次状态用 PageHeader statusLabel 表示。
- 有 5 个一级 tab：概览、订单明细、供应商分摊、调整记录、操作日志。
- 5 个 tab 使用详情页 underline tab（lux-tabs-page / Tabs underline），不要用 5 个 segmented 按钮。
- 概览 tab：展示 5 个元数据项，使用 MetricsStrip 或 KvCard，不要用 KpiCard 展示创建时间/创建人。
- 订单明细 tab：表格列包含订单号、客户、资源类型、用量、金额、状态。
- 调整记录 tab：展示两条调整记录，含调整原因、调整前后金额、操作人。
- 操作日志 tab：展示时间线或表格，不要用装饰性图标堆叠。

必须覆盖的 mock 数据：
- 批次状态：`待确认` / `Pending confirmation`。
- 至少一个金额为负数的调整项。
- 至少一个订单状态为异常或待复核。

验收重点：
- 返回只出现在标题左侧。
- 无副标题残留。
- 详情元数据不用 KpiCard。
- tab 数量多时不用 segmented control。
