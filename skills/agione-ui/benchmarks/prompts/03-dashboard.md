# agione-ui Benchmark 03 · Dashboard

请使用 `agione-ui` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/03-dashboard.html`

页面：平台运营侧「GPU 资源池监控大盘」。

业务要求：
- 这是 dashboard/监控大盘页，必须走 dashboard 契约并读取 dashboard 规则。
- 页面标题：`GPU 资源池监控` / `GPU Pool Monitoring`。
- 顶部有筛选行：时间范围、集群、资源池、计费口径。
- 至少 2 个 dashboard section，每个 section 必须有 `.ds-section-header`。
- 第一组为 3 张 hero overview card，使用 44px hero 数字，不要混入普通 KpiCard。
- 第二组为 4 张 stat card，允许 4 列，但必须是 dashboard `.ds-stat-card` 语义，不是 KpiCard。
- 图表至少包含：折线/面积图、柱状图、donut、gauge。
- 每张 chart-card 必须有 chart type badge；gauge 几何使用 dashboard 查表或等价模板，不要心算乱画。
- 图表使用 inline SVG/CSS，不引入图表库。
- Header 警示使用 PageHeader statusLabel，不要自造 alert-badge/status-badge 头部装饰。
- 7d/30d 切换用 `.tabs-segmented`。

必须覆盖的 mock 数据：
- 利用率 94.6%，显示为高风险。
- 队列等待任务 37 个。
- 可用 GPU 128 卡，总 GPU 640 卡。
- 一个空态 gauge，表示某资源池暂无数据。

验收重点：
- dashboard 4 列例外只用于 `.ds-stat-card`。
- 非 dashboard KpiCard 不超过 3。
- 无自造 dashboard 之外的场景切换 UI。
- dark/light 都应依赖 token，不硬编码图表颜色。
