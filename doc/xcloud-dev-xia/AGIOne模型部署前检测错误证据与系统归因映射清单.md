# AGIOne 模型部署前检测错误证据与系统归因映射清单

- 文档状态：当前实现口径
- 最后核验：2026-08-21
- 适用范围：Hashrate 部署前预检四项结果、归因码、状态和操作说明
- 关联设计：[模型部署就绪性与准入归因设计](./模型部署就绪性与准入归因设计.md)
- 账号域参考：[AGIOne 云账号错误证据与系统归因映射清单](./AGIOne云账号错误证据与系统归因映射清单.md)

## 1. 文档边界

部署前预检是 Hashrate 的部署流程检查，不是 XCloud 的云账号健康巡检。预检固定返回四个独立检测项；每个归因码只能归属于自己的检测项。前端必须按 `checkCode + status + reasonCode` 展示结果，不得根据文案猜测归因，也不得把一个检测项的操作说明套到另一个检测项。

正式部署仍需由后端重新执行准入校验，不能使用前端缓存的旧检测结果。

## 2. 四个固定检测项与责任边界

| `checkCode` | 检测项 | 只负责什么 | 不负责什么 |
| --- | --- | --- | --- |
| `ACCOUNT_CREDENTIAL` | 云账号凭证 | 账号是否存在、云类型是否匹配、账号连接和凭证认证 | 产品 License、云产品授权、规格库存、资源配额 |
| `PRODUCT_AUTHORIZATION` | 产品与授权 | License 额度、云产品访问权限、产品授权请求 | 凭证字段维护、模型配置、规格库存、资源配额 |
| `MODEL_DEPENDENCIES` | 模型与依赖 | 模型、模型来源、框架、版本、云配置和规格配置 | 账号认证、产品授权、云商实时库存和配额 |
| `RESOURCE_QUOTA` | 资源与配额 | 规格、库存、账户资源配额和配额探针 | 凭证维护、产品授权、模型依赖 |

不可串用的硬规则：

- `CREDENTIAL_AUTH_FAILED` 只能出现在 `ACCOUNT_CREDENTIAL`；操作是接入管理处理凭证。
- `CLOUD_PRODUCT_ACCESS_DENIED` 只能出现在 `PRODUCT_AUTHORIZATION`；操作是云服务商侧处理产品访问权限。
- `RESOURCE_QUOTA_INSUFFICIENT`、`RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`、`RESOURCE_QUOTA_REQUEST_FAILED`、`RESOURCE_QUOTA_MAPPING_MISSING` 只能出现在 `RESOURCE_QUOTA`。
- 资源项的 `RESOURCE_CHECK_SKIPPED_*` 只表示资源检查没有执行，不表示配额不足，也不把根因改写成账号或产品失败。

## 3. 结果信封、状态与准入

单项结果至少包含：`checkCode`、`status`、`reasonCode`、`reasonMessage`、`reasonParams`、`errorCode`、`actionHint`、`checkedAt`。异步任务总体返回 `precheckId`、任务状态和四项结果。`precheckStatus` 只描述异步任务生命周期，不再重复聚合检测项结论。

单项状态：

| 状态 | 含义 |
| --- | --- |
| `RUNNING` | 该项仍在检测 |
| `PASSED` | 已取得通过证据 |
| `BLOCKED` | 已取得明确问题证据，大概率导致部署失败，但预检不阻止用户继续创建 |
| `UNVERIFIED` | 能力未实现或云商技术请求失败，未取得确定结论 |
| `ERROR` | 检测过程异常；由 `reasonCode` 区分云商未归因异常与 AGIOne 平台异常 |
| `SKIPPED` | 因前置检测项问题，本项没有执行 |

任务状态固定为 `CHECKING / COMPLETED / FAILED`：`CHECKING` 继续轮询；任务正常跑完统一为 `COMPLETED`，具体结论只看四项结果；异步任务调度或执行中断为 `FAILED`。不再返回总体 `PASSED / BLOCKED / UNVERIFIED`，也不再使用 `acceptUnverifiedRisk` 控制创建。

异步任务调度或执行异常时，任务状态为 `FAILED`。后端会把仍为 `RUNNING` 的检测项统一转为 `ERROR`，并写入 `DETECTION_INTERNAL_ERROR`、原因说明“部署环境检测任务执行异常”和操作说明；前端 Mock 必须使用同一后端原因文案，继续在对应检测项展示归因，不额外显示一条没有归属检测项的“检测任务失败”提示。

浏览器断网、网关无响应或请求未取得后端响应不属于部署预检结果，也不是后端 `reasonCode`。这类链路异常沿用平台通用请求错误和重新检测操作，不进入四项归因目录，也不计入部署预检归因案例。

## 4. 统一操作说明

部署预检操作说明统一将“重新检测”放在句末；同一条说明不在开头和结尾重复出现。未归因云商错误不返回操作说明。固定底部提示不属于操作说明，保持原文不变。

`LICENSE_CAPACITY_EXCEEDED` 使用专属说明：“恢复额度后，重新检测”。

后端使用固定的动作键，前端将其映射为统一短说明：

| 动作键 | 统一说明 | 适用范围 |
| --- | --- | --- |
| `accountManagement` | 请前往云账号接入管理处理，完成后重新检测。 | 凭证认证、账号侧身份问题 |
| `cloudProductAccess` | 请在云服务商侧处理产品访问权限，完成后重新检测。 | 产品未授权 |
| `modifyConfiguration` | 请修改部署配置后重新检测。 | 账号选择、模型依赖、规格或库存问题 |
| `requestProviderQuota` | 请在云服务商侧申请或调整资源配额，完成后重新检测。 | 已取得配额不足证据 |
| `contactProvider` | 请在云服务商侧处理相关问题，完成后重新检测。 | 云商返回未分类产品业务错误或需云商侧排查 |
| `retry` | 待相关服务恢复后，重新检测。 | 请求失败、超时、服务暂不可用 |
| `contactAdmin` | 若问题持续，请联系平台管理员处理，处理完成后重新检测。 | 平台配置缺失、未分类平台错误 |
| `resolveAccountPrerequisite` | 请先处理云账号前置问题，完成后重新检测。 | 资源项受账号前置影响未执行 |
| `resolveProductPrerequisite` | 请先处理产品授权前置问题，完成后重新检测。 | 资源项受产品授权影响未执行 |
| 无动作键 | 暂未支持获取当前云商资源配额，可以自行确认风险，不影响部署。 | `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`；不阻止继续创建 |

产品授权问题不得提示前往接入管理修改云账号凭证；资源配额不支持实时检测不得提示联系管理员或修改凭证。

## 5. 账号与凭证（`ACCOUNT_CREDENTIAL`）

| 证据 | `reasonCode` | 状态 | 操作 |
| --- | --- | --- | --- |
| 当前租户找不到目标账号 | `DEPLOYMENT_CLOUD_ACCOUNT_NOT_FOUND` | `BLOCKED` | `modifyConfiguration` |
| 所选账号云类型不匹配 | `DEPLOYMENT_CLOUD_ACCOUNT_TYPE_MISMATCH` | `BLOCKED` | `modifyConfiguration` |
| 账号就绪性服务失败 | `ACCOUNT_READINESS_SERVICE_UNAVAILABLE` | `ERROR` | `retry` |
| XCloud 明确返回凭证或身份认证失败 | 保留 XCloud 的账号域原因码（如 `CREDENTIAL_AUTH_FAILED`） | 通常 `BLOCKED` | `accountManagement` |
| XCloud 返回可重试的账号技术异常 | 保留 XCloud 账号域原因码 | `UNVERIFIED` | `accountManagement` 或后端登记的重试动作 |
| XCloud 已确认来自云商但无法进一步归因 | `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` / `PROVIDER_ERROR_UNCLASSIFIED` | `ERROR` | `reasonMessage` 统一为“系统未归因”；详情展示安全过滤后的云商原始错误；不返回操作说明 |
| XCloud 检测配置、内部程序或平台代理异常 | `DETECTION_CONFIGURATION_MISSING` / `DETECTION_INTERNAL_ERROR` / `PROXY_UNAVAILABLE` | `ERROR` | 按后端操作说明处理 |

Hashrate 只做租户归属、云类型和部署页动作转换，不复制 XCloud 分类器，不从异常文本重新推断凭证错误。账号不存在或云类型不匹配属于部署配置问题，不能机械跳到接入管理。

## 6. 产品与授权（`PRODUCT_AUTHORIZATION`）

| 证据 | `reasonCode` | 状态 | 操作 |
| --- | --- | --- | --- |
| AI Infra License 明确拒绝新增实例 | `LICENSE_CAPACITY_EXCEEDED` | `BLOCKED` | `restoreLicense` |
| License 服务异常 | `LICENSE_SERVICE_UNAVAILABLE` | `ERROR` | `retry` |
| 云商明确拒绝产品访问（包括产品未授权） | `CLOUD_PRODUCT_ACCESS_DENIED` | `BLOCKED` | `cloudProductAccess` |
| 云商返回未分类产品错误 | `CLOUD_PRODUCT_ERROR_UNCLASSIFIED` | `ERROR` | `reasonMessage` 统一为“系统未归因”；详情展示安全过滤后的云商原始错误；不返回操作说明 |
| 产品探针为空、抛异常或技术请求失败 | `PROVIDER_REQUEST_FAILED` | `UNVERIFIED` | `retry` |

产品授权和云账号凭证是两个检测项。产品已授权后，后续资源检查与云账号凭证没有直接关系；如果资源检查因产品请求失败而未执行，必须使用资源项派生码，不得把产品码复制到资源项。

## 7. 模型与依赖（`MODEL_DEPENDENCIES`）

| 证据 | `reasonCode` | 状态 | 操作 |
| --- | --- | --- | --- |
| 模型不存在 | `MODEL_NOT_FOUND` | `BLOCKED` | `modifyConfiguration` |
| 框架版本不存在 | `FRAMEWORK_VERSION_NOT_FOUND` | `BLOCKED` | `modifyConfiguration` |
| 框架类型与版本不匹配 | `FRAMEWORK_TYPE_MISMATCH` | `BLOCKED` | `modifyConfiguration` |
| 框架不支持目标云类型或地域 | `FRAMEWORK_DEPLOYMENT_SCOPE_MISMATCH` | `BLOCKED` | `modifyConfiguration` |
| 缺少目标云配置 | `MODEL_CLOUD_CONFIG_MISSING` | `BLOCKED` | `contactAdmin` |
| 缺少目标框架版本配置 | `MODEL_FRAMEWORK_CONFIG_MISSING` | `BLOCKED` | `modifyConfiguration` |
| 缺少目标规格配置 | `MODEL_SPECIFICATION_CONFIG_MISSING` | `BLOCKED` | `modifyConfiguration` |
| 缺少模型来源 | `MODEL_SOURCE_MISSING` | `BLOCKED` | `contactAdmin` |
| 公共模型缺少云端模型标识 | `PUBLIC_MODEL_ID_MISSING` | `BLOCKED` | `contactAdmin` |
| 查询模型依赖发生异常 | `MODEL_DEPENDENCY_CHECK_ERROR` | `ERROR` | `contactAdmin` |

模型项只反映模型和依赖证据，不因账号、授权或配额项失败而改写。

## 8. 资源与配额（`RESOURCE_QUOTA`）

### 8.1 规格与库存

| 证据 | `reasonCode` | 状态 | 操作 |
| --- | --- | --- | --- |
| 目标规格不存在 | `SPECIFICATION_NOT_FOUND` | `BLOCKED` | `modifyConfiguration` |
| 规格存在但当前无库存 | `SPECIFICATION_SOLD_OUT` | `BLOCKED` | `modifyConfiguration` |
| 规格探针请求失败 | `PROVIDER_REQUEST_FAILED` | `UNVERIFIED` | `retry` |

### 8.2 账户资源配额

| 证据 | `reasonCode` | 状态 | 操作 |
| --- | --- | --- | --- |
| 云商没有真实配额接口或当前适配器未支持 | `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED` | `UNVERIFIED` | 无；不阻止继续创建 |
| 配额接口请求失败或响应无法确认 | `RESOURCE_QUOTA_REQUEST_FAILED` | `UNVERIFIED` | `retry` |
| 当前规格无法映射到云商配额项 | `RESOURCE_QUOTA_MAPPING_MISSING` | `UNVERIFIED` | `contactAdmin` |
| 云商明确返回配额不足 | `RESOURCE_QUOTA_INSUFFICIENT` | `BLOCKED` | `requestProviderQuota` |
| 云商明确返回配额充足 | 无失败原因，资源项 `PASSED` | `PASSED` | 无 |

“暂不支持实时配额检测”只说明平台当前没有可用的真实证据，不是配额不足，也不是账号凭证问题；它不会阻止提交部署。当前前端应显示“暂未支持获取当前云商资源配额，可以自行确认风险，不影响部署”。

### 8.3 前置失败的派生归因

派生码表示资源项没有执行，不代表资源项自身失败：

| 前置情况 | 产品项 | 资源项 | 资源项操作 |
| --- | --- | --- | --- |
| 云账号未就绪 | `PRODUCT_AUTHORIZATION_PREREQUISITE_FAILED`（`SKIPPED`） | `RESOURCE_CHECK_SKIPPED_ACCOUNT_NOT_READY`（`SKIPPED`） | `resolveAccountPrerequisite` |
| 产品授权明确失败 | 保留 `CLOUD_PRODUCT_ACCESS_DENIED` | `RESOURCE_CHECK_SKIPPED_PRODUCT_NOT_READY`（`SKIPPED`） | `resolveProductPrerequisite` |
| 产品请求未知失败 | 保留 `CLOUD_PRODUCT_ERROR_UNCLASSIFIED` | `RESOURCE_CHECK_SKIPPED_PRODUCT_REQUEST_FAILED`（`SKIPPED`） | 根因项和连带跳过项均不返回操作说明，只展示云商原始错误详情 |

不能使用旧的单一 `RESOURCE_CHECK_PREREQUISITE_FAILED` 覆盖以上三种根因，也不能展示“资源配额不足”。

## 9. 云商中间结果映射

云商适配器的中间码由 Hashrate 预检编排转换，前端不直接消费：

| 中间结果 | 部署归因 |
| --- | --- |
| `CREDENTIAL_INVALID` | 产品项 `CLOUD_PRODUCT_ACCESS_DENIED`；资源项 `RESOURCE_CHECK_SKIPPED_ACCOUNT_NOT_READY` |
| `PRODUCT_UNAUTHORIZED` | 产品项 `CLOUD_PRODUCT_ACCESS_DENIED`；资源项 `RESOURCE_CHECK_SKIPPED_PRODUCT_NOT_READY` |
| `PRODUCT_ERROR_UNCLASSIFIED` | 产品项 `CLOUD_PRODUCT_ERROR_UNCLASSIFIED`；资源项 `RESOURCE_CHECK_SKIPPED_PRODUCT_REQUEST_FAILED` |
| `SPEC_NOT_FOUND` | 资源项 `SPECIFICATION_NOT_FOUND` |
| `SPEC_SOLD_OUT` | 资源项 `SPECIFICATION_SOLD_OUT` |
| `TECHNICAL_ERROR` | 产品/资源项 `PROVIDER_REQUEST_FAILED` 或配额 `RESOURCE_QUOTA_REQUEST_FAILED` |
| `NOT_SUPPORTED` / `realTimeChecked=false` | 规格/库存能力未支持时返回 `REALTIME_RESOURCE_CHECK_NOT_SUPPORTED`；规格通过但配额能力未支持时返回 `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED` |

技术错误优先于“不支持”判断，不能把真实请求失败误报为能力未支持。

## 10. 当前云商证据矩阵

| 云商 | 当前资源/配额证据 | 当前结论 |
| --- | --- | --- |
| Infracube | 已接入 `/service/resquota/my`，可返回真实配额结果；同时支持规格/库存探针 | 可返回 `PASSED`、`RESOURCE_QUOTA_INSUFFICIENT` 或配额请求/映射异常 |
| AWS | 尚未接入实时规格/资源配额探针 | 规格能力未支持时为 `REALTIME_RESOURCE_CHECK_NOT_SUPPORTED`；配额未支持时为 `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`，均不阻止继续创建 |
| Google | 尚未接入实时规格/资源配额探针 | 规格能力未支持时为 `REALTIME_RESOURCE_CHECK_NOT_SUPPORTED`；配额未支持时为 `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`，均不阻止继续创建 |
| 阿里云 | 已有规格探针，尚未接入部署预检真实配额接口 | `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`，不阻止继续创建 |
| 华为云 | 已有规格探针，尚未接入部署预检真实配额接口 | `RESOURCE_QUOTA_CHECK_NOT_SUPPORTED`，不阻止继续创建 |

“未接入真实配额接口”是当前平台适配能力状态，不表示官网没有配额能力，也不表示各云商 SDK 一定没有能力；后续可按云商官方 API/SDK 接入并补充映射和证据测试。

## 11. 前端任务与结果处理矩阵

| 任务状态 | 页面行为 |
| --- | --- |
| `CHECKING` | 展示四项检测进度，继续轮询 |
| `COMPLETED` | 停止轮询，按四个检测项展示结果；预检不控制前端是否发送创建请求 |
| `FAILED` | 停止轮询；未完成检测项以 `ERROR / DETECTION_INTERNAL_ERROR` 展示 |

前端不得因为 `checkCode=RESOURCE_QUOTA` 就显示“去接入管理”，不得因为 `checkCode=PRODUCT_AUTHORIZATION` 就显示“修改云账号凭证”。

底部提示文案固定，后续不得改写，只能调整显示条件：

- `COMPLETED` 且四项全部 `PASSED` 时，显示：“部署前检查只能证明当前已验证范围内满足准入条件，不能证明云端一定创建成功。”
- `COMPLETED` 且存在 `BLOCKED`、`UNVERIFIED`、非平台前置 `SKIPPED` 或云商未归因 `ERROR`，同时不存在 AGIOne 平台异常时，显示：“为提升部署成功率，建议排查并解决问题，再重新检测。当前仍可创建部署任务，若部署失败，可前往「我的部署」详情查看原因并处理。”
- `FAILED`、前端本地请求失败，或存在 `ACCOUNT_READINESS_SERVICE_UNAVAILABLE`、`DETECTION_CONFIGURATION_MISSING`、`DETECTION_INTERNAL_ERROR`、`LICENSE_SERVICE_UNAVAILABLE`、`MODEL_DEPENDENCY_CHECK_ERROR`、`PROXY_UNAVAILABLE` 等 AGIOne 平台异常时，不显示底部提示。
- 云商未归因异常显示红色 `ERROR`，`reasonMessage` 统一为“系统未归因”；安全过滤后的云商原始错误通过 `reasonParams.providerErrorCode / providerErrorMessage / providerRequestId` 作为详情展示，`actionHint` 必须为空。它仍属于可显示第二条固定提示的场景。

前端静态 Mock 只覆盖当前后端真实归因契约：47 个可达归因码由 43 个根归因码和 4 个派生归因码组成；下拉提供 43 个根归因案例，以及 `FAILED_TASK`、`MIXED`、`PASSED`、`PROVIDER_REQUEST_FAILED_PROVIDER` 4 个组合场景，共 47 个案例。三个云商未归因码均展示红色 `ERROR`、统一原因“系统未归因”、云商原始错误详情和第二条固定底部提示，且不展示操作说明；六个 AGIOne 平台异常码展示红色 `ERROR` 且不显示底部提示；四个派生归因码展示 `SKIPPED`，底部提示跟随根因。不得人为构造 `BACKEND_NEW_REASON_CODE` 或“返回未知问题”作为业务归因案例。XCloud 返回未登记原因时，Hashrate 统一收敛为 `ACCOUNT_READINESS_SERVICE_UNAVAILABLE`；后端新增正式归因码时，必须同步提供 `reasonMessage`，需要用户操作时再提供 `actionHint`，并更新前端契约后再进入 Mock。URL 中保存的 Mock 场景必须按当前契约校验；已删除或未登记的旧值统一回落为 `FAILED_TASK` 并替换 URL，禁止继续在下拉框显示废弃值。

## 12. 当前实现与待接入能力

当前实现事实：

- `checkFlavorAvailability` 继续只负责规格和库存；配额通过 `checkQuotaAvailability` 与 `checkDeploymentResourceAvailability` 组合。
- 预检编排位于 `CloudInferenceJobPrecheckService`，正式部署会再次校验。
- Infracube 已实现 `/service/resquota/my` 调用；AWS、Google、阿里、华为的真实配额探针仍待接入。
- 当前测试已覆盖账号前置、产品前置、配额不支持、配额不足、请求失败和映射缺失等归因码。

待接入能力：

- AWS、Google、阿里、华为真实配额 API/SDK 调用；
- 各云商配额项映射、单位换算、区域/账户维度和不足证据；
- 真实环境验证和前端预检 API 接入；
- 只有取得真实证据后，才能启用对应云商的 `RESOURCE_QUOTA_INSUFFICIENT` 或资源项 `PASSED`。

## 13. 代码事实来源

- `CloudInferenceJobPrecheckService.java`：四项编排、归因和动作键；
- `CloudInferenceJobPrecheckItemVo.java`、`CloudInferenceJobPrecheckVo.java`：结果契约；
- `InferenceJobComponent.java`：云商规格/配额组合契约；
- `InfracubeInferenceJobComponentImpl.java`：Infracube 规格、库存和 `/service/resquota/my`；
- `CloudInferenceJobPrecheckServiceTest.java`：派生归因和配额状态测试；
- XCloud `CloudAccountHealthService.checkReadiness`：账号就绪性来源。

本文仅声明静态代码和已有测试源码对齐；未声明真实云环境、浏览器联调或部署发布已验证。
