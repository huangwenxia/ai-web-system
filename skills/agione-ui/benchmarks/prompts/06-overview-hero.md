# agione-ui Benchmark 06 · Overview Hero

请使用 `agione-ui --direct` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/06-overview-hero.html`

页面：租户侧「API 调用概览」。

业务要求：
- 这是轻量 overview，不是 dashboard；不要读取 dashboard partial，不要使用 `.ds-stat-card`。
- 页面标题：`API 调用概览` / `API Usage Overview`。
- 顶部要有一个主业务 hero：展示本月调用量、环比变化、剩余额度、主操作「查看调用明细」。
- hero 可以有一句业务上下文，但不要把每个 section 都写成 Eyebrow + Title + Desc + Points 的营销韵律。
- 顶部 KPI 最多 3 个；如果需要更多指标，用 MetricsStrip 或 KvCard。
- 页面中部有两块 CardBox：最近调用异常、热门 API。
- 最近调用异常展示 3 条事件，含错误码、影响次数、最近发生时间。
- 热门 API 展示 5 个 API 名称和调用量，单位不可换行。
- 不要添加副标题；状态消歧用 statusLabel 或 Tag。
- 图标只用于 affordance 或状态，不要每个标题都配装饰图标。

必须覆盖的 mock 数据：
- 本月调用量 `12.8M`。
- 剩余额度 `3.2M calls`。
- 至少一个 API 错误率超过 5%。
- 至少一个 API 调用量为 0，表示本月未使用。

验收重点：
- overview 不退化成 4+ KpiCard 砌墙。
- Hero 是主焦点，但其他 section 不堆营销式说明。
- 无副标题、无左侧色条、无自造装饰图标。
