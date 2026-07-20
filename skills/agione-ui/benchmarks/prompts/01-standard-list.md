# agione-ui Benchmark 01 · Standard List

请使用 `agione-ui --direct` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/01-standard-list.html`

页面：Provider 侧「结算批次管理」列表页。

业务要求：
- 左侧菜单当前项为「财务管理 / 结算批次」。
- 页面主标题：`结算批次管理` / `Settlement Batches`。
- 标准列表页结构：HeaderBox + FilterBox + DataTable。
- FilterBox 放在 HeaderBox slot 内，不要包 CardBox，不要自造 filter-card/search-card。
- 筛选项：批次号、结算月份、状态、供应商名称。
- 右侧主操作：生成结算批次、导出。
- 表格列：批次号、结算月份、供应商数、订单数、应结金额、状态、创建时间、操作。
- 状态：草稿、待确认、已确认、已作废；表格状态必须使用 StatusBadge 或 Tag 语义样式。
- 操作：查看、确认、作废；作废必须表现为危险操作。
- 金额和单位不可换行。
- 不需要 dashboard；顶部最多 3 个 KPI，如果需要更多统计请用 MetricsStrip。

必须覆盖的 mock 数据：
- 至少 6 行表格。
- 至少 1 行「待确认」、1 行「已作废」。
- 金额使用 CNY，示例：`¥128,430.50`。

验收重点：
- 无副标题。
- 无裸 `<el-radio>`。
- 无 CardBox 包 FilterBox。
- 无 4 个 KpiCard 砌墙。
