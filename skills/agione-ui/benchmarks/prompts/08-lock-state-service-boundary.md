# agione-ui Benchmark 08 · Lock State Service Boundary

请使用 `agione-ui --direct` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/08-lock-state-service-boundary.html`

页面：租户侧「模型服务」页面。当前工作区尚未启用 AGIOne 一站式模型部署与 API 发布服务，需要展示加锁态。

业务要求：
- 顶部保留两个 type 页：`On-Prem` 和 `On-Cloud`。
- `On-Prem` 和 `On-Cloud` 是两个独立的 deployment service，不是同一个混合服务，也不是模型类型。
- 当前 type 页未启用时，主内容区展示半屏锁定态；核心说明直接放在页面上，不使用弹窗承载说明。
- 页面需要说明：当前服务未启用、启用后能部署运行模型并发布 API、已在 AGIOne 外部环境部署完成的模型应通过 BYOK 接入。
- 联系方式展示邮箱 `Ecosys@oneprocloud.com`，只保留一个主 CTA。
- 需要支持中英文和 light/dark。

文案边界：
- 英文标题必须明确是 deployment service 未启用，不要写成 `On-Prem Model Deployment Required` 这类容易被理解为 `On-Prem model` 的名词链。
- 英文中 `On-Prem` / `On-Cloud` 如果作为服务主体，必须显式带 `Deployment Service` 或等价表达。
- 不要出现 "local and cloud mixed deployment"、"hybrid local cloud"、"separate service status"、"next steps" 这类混合/内部流程口径。
- 不要出现 `prototype` / `demo` / `逻辑说明` / `原型说明` / `调用接口前置判断` 等对客无意义文案。
- 英文态文案可以完整表达产品口径；如果拥挤，优先通过布局承载，不要擅自压缩成短句。

视觉要求：
- 锁定态可以使用信封加锁、门禁、锁定面板等 L3 自定义视觉，但必须 light/dark 都能清楚识别。
- 自定义视觉不要只复用 `bg-card` / `bg-muted` / `primary-subtle` 到所有层；必要时拆 paper/body/flap/lock 等语义色层。
- 一屏只有一个主 attention：未启用原因 + 解锁价值 + 联系入口。
- 能力点最多 3 条，不要重复按钮，不要放无客户行动价值的状态卡。

验收重点：
- On-Prem 和 On-Cloud 始终是两个独立 type 页。
- 锁定态对客表达清楚，不暴露实现逻辑。
- 英文服务名没有把 service 和 model 混淆。
- BYOK 边界表达正确。
- dark mode 下锁定视觉不变成黑块或高饱和装饰。
