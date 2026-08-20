# AGIOne 模型部署前检测错误证据与系统归因映射清单

## 1. 文档目的

本文说明 AGIOne 模型部署前检测如何把 XCloud 账号检测结果、Hashrate 本地配置事实、License 结果和云商规格查询结果，统一转换为前端可依赖的系统归因与处理动作。

本文只回答五个问题：

1. 部署前检测实际取得了什么证据。
2. 当前后端把证据转换成了什么结果码。
3. 系统最终应该归因为什么。
4. 该归因是否阻断部署。
5. 部署页统一显示哪一种操作和操作说明。

本文不讨论页面布局、视觉样式和原型设计。

## 2. 基线与范围

- 核验日期：2026-08-19。
- Hashrate 基线：`hashrate-dev-xia`，已接入 XCloud `checkReadiness`。
- XCloud 基线：`xcloud-dev-xia`，已提供无副作用只读检测。
- 业务入口：`POST /cloudInferenceJob/deployment-precheck`。
- 正式部署入口：`POST /cloudInferenceJob/confirmDeploy`。
- 检测范围：账号与凭证、产品与授权、模型与依赖、资源与配额。
- 不包含：云账号列表健康巡检、部署创建后的异步运行错误、容器启动和模型服务健康检查。

配套参考：

- [AGIOne 云账号错误证据与系统归因映射清单](./AGIOne云账号错误证据与系统归因映射清单.md)
- [模型部署就绪性与准入归因设计](./模型部署就绪性与准入归因设计.md)

## 3. 三层归因模型

```text
原始检测证据
XCloud 检测结果 / 本地配置事实 / License 结果 / 云商 SDK 或 HTTP 结果
        ↓ 检测提供方识别
平台中间结果
XCloud reasonCode / Hashrate 当前 code / 云商规格 reasonCode
        ↓ Hashrate 部署归因器统一
部署前检测系统归因
reasonCode + reasonMessage + admissionStatus + actionType + actionHint
```

### 3.1 原始检测证据

原始证据来自真实检测执行，不由前端推测：

- XCloud 返回的账号身份、凭证或技术检测结果；
- 当前租户下是否存在目标云账号；
- 云账号与目标云类型是否一致；
- License 服务是否明确拒绝新增实例；
- 模型、框架版本、云类型、地域、规格和模型来源配置是否匹配；
- 云商规格列表是否包含目标规格；
- 目标规格是否售罄；
- 云商返回的 HTTP 状态、SDK 错误码、网络异常和脱敏请求标识。

### 3.2 平台中间结果

平台中间结果用于隔离不同检测提供方的实现差异：

- 账号与凭证沿用 XCloud 的 `reasonCode / errorCode / reasonParams`；
- Hashrate 当前使用 `ACCOUNT_NOT_READY`、`LICENSE_EXCEEDED`、`MODEL_CONFIG_MISSING`、`SPEC_NOT_FOUND`、`SPEC_SOLD_OUT`、`TECHNICAL_UNVERIFIED` 等粗粒度结果码；
- 云商规格适配器当前使用 `CREDENTIAL_INVALID`、`PRODUCT_UNAUTHORIZED`、`SPEC_NOT_FOUND`、`SPEC_SOLD_OUT`、`TECHNICAL_ERROR`、`NOT_SUPPORTED`。

前端不得直接根据这些中间码拼接文案或决定能否部署。

### 3.3 部署前检测系统归因

部署前检测系统归因是前端稳定依赖的业务契约。后端只返回原因和操作说明，不返回动作类型：

```text
checkCode
status: PASSED / BLOCKED / UNVERIFIED
reasonCode
reasonMessage
reasonParams
errorCode
actionHint
checkedAt
```

Hashrate 负责聚合总体 `PASSED / BLOCKED / UNVERIFIED`。是否显示按钮、显示哪个按钮、跳到哪里，全部由前端按 `reasonCode` 和单项 `status` 控制。

## 4. 部署页统一操作目录

后端只返回统一操作说明 `actionHint`。部署页只允许以下 4 种处理动作，由前端决定是否显示：

| 页面操作 | 统一操作说明 `actionHint` | 前端何时显示 |
| --- | --- | --- |
| 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 | 已选云账号本身的身份、凭证、主体或账号侧连通问题；以及云产品访问未授权 |
| 修改部署配置 | 请修改部署配置后重新检测 | 模型、框架版本、地域、规格或云账号选择不匹配 |
| 重新检测 | 请稍后重新检测 | 页脚主/次操作；限流、超时、调用失败等可重试技术异常 |
| 联系平台管理员 | 若问题持续，请联系平台管理员处理 | License 超额、平台配置缺失、检测能力未实现或平台内部错误 |

### 4.1 账号与凭证的场景转换规则

XCloud 云账号健康页可以显示“刷新连通状态”类操作。部署前检测页不得复用该操作及其说明。

只要问题属于“当前已选云账号本身”，无论 XCloud 返回的是凭证失败还是账号侧技术错误：

- 保留 XCloud 的 `reasonCode / reasonMessage / reasonParams / errorCode`
- `actionHint` 统一写成“请前往云账号接入管理处理，完成后返回当前页面重新检测”
- 前端显示“前往接入管理”，不显示“刷新连通状态”

以下情况不属于“已选账号本身的问题”，因此不前往接入管理：

- 账号不存在或不属于当前租户：要求修改部署配置并重新选择账号；
- 已选账号云类型与部署方案不一致：要求修改部署配置；
- Hashrate 调用 XCloud 服务本身失败且 XCloud 没有返回账号归因：按技术异常重新检测或联系平台管理员。

### 4.2 不属于处理动作的页面控制

“确认风险并继续部署”是总体状态为 `UNVERIFIED` 时的页面级准入控制，不是某个检测项的处理动作。

以下情况禁止出现风险继续：

- 任一检测项为 `BLOCKED`；
- 已取得明确凭证无效、授权不足、License 超额、模型配置缺失、规格不存在或规格售罄证据。

## 5. 固定检测项与归因职责

| `checkCode` | 中文 | 证据提供方 | 归因 Owner | 主要操作 |
| --- | --- | --- | --- | --- |
| `ACCOUNT_CREDENTIAL` | 账号与凭证 | XCloud；Hashrate 租户和云类型校验 | 账号原因由 XCloud 维护，Hashrate 转换部署页操作 | 前往接入管理、修改部署配置、重新检测 |
| `PRODUCT_AUTHORIZATION` | 产品与授权 | common-service License；云商产品访问结果 | Hashrate | 前往接入管理、重新检测、联系平台管理员 |
| `MODEL_DEPENDENCIES` | 模型与依赖 | Hashrate 模型、框架和来源配置 | Hashrate | 修改部署配置、联系平台管理员、重新检测 |
| `RESOURCE_QUOTA` | 资源与配额 | Hashrate 云商部署适配器 | Hashrate | 修改部署配置、重新检测、联系平台管理员 |

当前 `RESOURCE_QUOTA` 名称包含“配额”，但现有代码只真实检查部分云商规格与库存。未调用真实配额 API 时，不得归因为“配额充足”或“配额不足”。

## 6. 账号与凭证映射

### 6.1 Hashrate 本地账号事实

| 原始证据 | 当前中间码 | 系统归因码 | 系统归因中文 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 当前租户下找不到 `cloudAccountId` | `ACCOUNT_NOT_READY` | `DEPLOYMENT_CLOUD_ACCOUNT_NOT_FOUND` | 所选云账号不可用 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 账号云类型与部署方案不一致 | `ACCOUNT_NOT_READY` | `DEPLOYMENT_CLOUD_ACCOUNT_TYPE_MISMATCH` | 所选云账号与目标云类型不一致 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 查询 XCloud 账号服务失败且没有取得账号归因 | `TECHNICAL_UNVERIFIED` | `ACCOUNT_READINESS_SERVICE_UNAVAILABLE` | 暂时无法检查云账号状态 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |

### 6.2 复用 XCloud 账号归因

以下系统归因码由 XCloud 产生。Hashrate 不复制分类器，只转换部署页操作。

| XCloud 系统归因码 | XCloud 归因中文 | 部署状态 | 部署页操作 | 部署页统一操作说明 |
| --- | --- | --- | --- | --- |
| `CREDENTIAL_FORMAT_INVALID` | 凭证格式不正确 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `CREDENTIAL_PROJECT_MISMATCH` | 项目 ID 与服务账号不一致 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `CREDENTIAL_ACCOUNT_MISMATCH` | 当前凭证不属于原绑定云账号 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `HEALTH_SNAPSHOT_MISSING` | 状态待同步 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_CONNECT_TIMEOUT` | 连接云服务超时 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_CONNECTION_FAILED` | 无法连接云服务 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_READ_TIMEOUT` | 云服务响应超时 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_DNS_RESOLUTION_FAILED` | 云服务域名解析失败 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_RATE_LIMITED` | 云服务请求受限 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_REQUEST_FAILED` | 云服务请求失败 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROXY_UNAVAILABLE` | 网络代理不可用 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `TLS_HANDSHAKE_FAILED` | 无法与云服务建立安全连接 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `DETECTION_CONFIGURATION_MISSING` | 系统检测配置异常 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PROVIDER_RESPONSE_INVALID` | 云服务身份响应异常 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `DETECTION_INTERNAL_ERROR` | 系统检测异常 | `UNVERIFIED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |

说明：账号类 `UNVERIFIED` 仍可按总体准入策略提供风险继续，但部署页的定向处理入口始终是接入管理，不显示“刷新连通状态”。

## 7. 产品与授权映射

| 原始证据 | 当前中间码 | 目标系统归因码 | 系统归因中文 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| AI Infra License 明确不允许再创建实例 | `LICENSE_EXCEEDED` | `LICENSE_CAPACITY_EXCEEDED` | AI Infra 授权额度不足 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| License 服务调用超时或不可用 | `TECHNICAL_UNVERIFIED` | `LICENSE_SERVICE_UNAVAILABLE` | 暂时无法检查授权额度 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 云商规格探针返回产品访问被拒绝，含华为 ModelArts `401/403` | `PRODUCT_UNAUTHORIZED` | `CLOUD_PRODUCT_ACCESS_DENIED` | 云产品访问未授权 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| 云商返回 429 | 当前压入 `TECHNICAL_UNVERIFIED` | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 云商返回 5xx | 当前压入 `TECHNICAL_UNVERIFIED` | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 云商明确返回错误但证据不足以精确归因 | 当前可能归为 `PRODUCT_UNAUTHORIZED` | `CLOUD_PRODUCT_ERROR_UNCLASSIFIED` | 云产品访问异常 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| SDK、解析或平台内部异常 | `TECHNICAL_UNVERIFIED` | `PRODUCT_CHECK_INTERNAL_ERROR` | 产品授权检测异常 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |

当前华为实现把除 401、429 外的其他 4xx 统一归为 `PRODUCT_UNAUTHORIZED`。目标实现应先保留脱敏云商错误码和 requestId；没有明确权限证据时使用未分类产品错误，不能猜测成某一项具体授权缺失。

## 8. 模型与依赖映射

当前后端把多种配置缺失统一压成 `MODEL_CONFIG_MISSING`。目标实现必须保留实际失败检查点。

| 原始证据 | 当前中间码 | 目标系统归因码 | 系统归因中文 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| `modelId` 查询不到模型 | `MODEL_CONFIG_MISSING` | `MODEL_NOT_FOUND` | 所选模型不存在 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `frameworkVersionId` 查询不到框架版本 | `MODEL_CONFIG_MISSING` | `FRAMEWORK_VERSION_NOT_FOUND` | 所选框架版本不存在 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 框架类型与所选版本不一致 | `MODEL_CONFIG_MISSING` | `FRAMEWORK_TYPE_MISMATCH` | 框架类型与版本不匹配 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 框架版本不支持目标云类型或地域 | `MODEL_CONFIG_MISSING` | `FRAMEWORK_DEPLOYMENT_SCOPE_MISMATCH` | 框架版本不支持当前部署范围 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 模型云配置不存在 | `MODEL_CONFIG_MISSING` | `MODEL_CLOUD_CONFIG_MISSING` | 模型缺少目标云部署配置 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 模型云配置不包含目标框架版本 | `MODEL_CONFIG_MISSING` | `MODEL_FRAMEWORK_CONFIG_MISSING` | 模型未配置所选框架版本 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 模型云配置不包含目标规格 | `MODEL_CONFIG_MISSING` | `MODEL_SPECIFICATION_CONFIG_MISSING` | 模型未配置所选规格 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 目标云类型和地域没有模型来源 | `MODEL_CONFIG_MISSING` | `MODEL_SOURCE_MISSING` | 当前部署范围缺少模型来源 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 华为公共模型缺少 `publicModelId` | `MODEL_CONFIG_MISSING` | `PUBLIC_MODEL_ID_MISSING` | 公共模型缺少云端模型标识 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 查询模型、框架或来源时发生数据库/程序异常 | `TECHNICAL_UNVERIFIED` | `MODEL_DEPENDENCY_CHECK_ERROR` | 模型依赖检测异常 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |

## 9. 资源与配额映射

### 9.1 当前已取得的华为规格证据

| 云商原始证据 | 当前中间码 | 目标系统归因码 | 系统归因中文 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| ModelArts 规格列表中找不到目标 `specId` | `SPEC_NOT_FOUND` | `SPECIFICATION_NOT_FOUND` | 当前地域不支持所选规格 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 目标规格存在但 `soldOut` 或不可用 | `SPEC_SOLD_OUT` | `SPECIFICATION_SOLD_OUT` | 所选规格当前无可用库存 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 目标规格存在且可用 | `PASSED` | 无失败归因 | 资源规格可用 | `PASSED` | 无 | 无 |
| HTTP `401/403` | `PRODUCT_UNAUTHORIZED` | `CLOUD_PRODUCT_ACCESS_DENIED` | 云产品访问未授权 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| HTTP 429、5xx 或 SDK 技术异常 | `TECHNICAL_ERROR` | 对应技术归因 | 对应技术归因中文 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |

### 9.2 当前尚未真实检查的能力

| 原始事实 | 当前中间码 | 目标系统归因码 | 系统归因中文 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 当前云商使用默认 `checkFlavorAvailability`，未执行实时规格检查 | `NOT_SUPPORTED`，最终压入 `TECHNICAL_UNVERIFIED` | `REALTIME_RESOURCE_CHECK_NOT_SUPPORTED` | 当前云类型尚未完成实时资源检查 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 未调用真实云配额 API | `QUOTA_STATUS_UNVERIFIED` | `QUOTA_STATUS_UNVERIFIED` | 云资源配额尚未验证，确认风险后仍可继续部署。 | `UNVERIFIED` | 无单项操作，页脚确认风险后返回部署 | 无 |
| 真实配额 API 明确返回额度不足，目标能力落地后 | 当前未实现 | `QUOTA_INSUFFICIENT` | 云资源配额不足 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| 云商有明确实时容量证据且当前容量不足，目标能力落地后 | 当前未实现 | `CAPACITY_UNAVAILABLE` | 当前资源容量不足 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |

未执行真实配额检测时，前端不能显示“配额已通过”。若仍保留 `RESOURCE_QUOTA` 分组名，应在结果中明确实际检查范围是规格与库存。

## 10. 跨检测项技术异常映射

| 原始证据 | 目标系统归因码 | 系统归因中文 | 自动重试 | 状态 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 建立连接超时 | `PROVIDER_CONNECT_TIMEOUT` | 连接云服务超时 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| TCP 或网络连接失败 | `PROVIDER_CONNECTION_FAILED` | 无法连接云服务 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 等待云商响应超时 | `PROVIDER_READ_TIMEOUT` | 云服务响应超时 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 域名无法解析 | `PROVIDER_DNS_RESOLUTION_FAILED` | 云服务域名解析失败 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 云商限流 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 云商服务端异常 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 可 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| 代理不可用 | `PROXY_UNAVAILABLE` | 网络代理不可用 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| TLS 或证书握手失败 | `TLS_HANDSHAKE_FAILED` | 无法与云服务建立安全连接 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 检测服务缺少配置 | `DETECTION_CONFIGURATION_MISSING` | 系统检测配置异常 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 云商响应无法解析 | `PROVIDER_RESPONSE_INVALID` | 云服务响应异常 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 当前云商检测能力未实现 | `DETECTION_NOT_SUPPORTED` | 当前检测能力尚未支持 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| 未识别的 SDK、数据库或程序异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 否 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |

账号与凭证项是例外：如果以上技术归因由 XCloud 账号检测返回，部署页仍按第 4.1 节统一显示“前往接入管理”；只有 Hashrate 调用 XCloud 本身失败且未取得账号归因时，才显示“重新检测”或“联系平台管理员”。

## 11. 系统归因码总目录

### 11.1 账号域复用码

账号域归因码以 [AGIOne 云账号错误证据与系统归因映射清单](./AGIOne云账号错误证据与系统归因映射清单.md) 为准。部署前检测不复制和修改 XCloud 归因码，只统一转换部署页操作。

部署页转换原则：

```text
XCloud 明确返回账号归因
→ 保留 XCloud reasonCode / reasonMessage / reasonParams / errorCode
→ actionHint 统一转换为“请前往云账号接入管理处理，完成后返回当前页面重新检测”
→ 前端自行显示“前往接入管理”
```

### 11.2 Hashrate 部署域归因码

| 系统归因码 | 中文 | 状态 | 默认操作 | 统一操作说明 |
| --- | --- | --- | --- | --- |
| `DEPLOYMENT_CLOUD_ACCOUNT_NOT_FOUND` | 所选云账号不可用 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `DEPLOYMENT_CLOUD_ACCOUNT_TYPE_MISMATCH` | 所选云账号与目标云类型不一致 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `ACCOUNT_READINESS_SERVICE_UNAVAILABLE` | 暂时无法检查云账号状态 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| `LICENSE_CAPACITY_EXCEEDED` | AI Infra 授权额度不足 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `LICENSE_SERVICE_UNAVAILABLE` | 暂时无法检查授权额度 | `UNVERIFIED` | 重新检测 | 请稍后重新检测 |
| `CLOUD_PRODUCT_ACCESS_DENIED` | 云产品访问未授权 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `CLOUD_PRODUCT_ERROR_UNCLASSIFIED` | 云产品访问异常 | `BLOCKED` | 前往接入管理 | 请前往云账号接入管理处理，完成后返回当前页面重新检测 |
| `PRODUCT_CHECK_INTERNAL_ERROR` | 产品授权检测异常 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `MODEL_NOT_FOUND` | 所选模型不存在 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `FRAMEWORK_VERSION_NOT_FOUND` | 所选框架版本不存在 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `FRAMEWORK_TYPE_MISMATCH` | 框架类型与版本不匹配 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `FRAMEWORK_DEPLOYMENT_SCOPE_MISMATCH` | 框架版本不支持当前部署范围 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `MODEL_CLOUD_CONFIG_MISSING` | 模型缺少目标云部署配置 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `MODEL_FRAMEWORK_CONFIG_MISSING` | 模型未配置所选框架版本 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `MODEL_SPECIFICATION_CONFIG_MISSING` | 模型未配置所选规格 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `MODEL_SOURCE_MISSING` | 当前部署范围缺少模型来源 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `PUBLIC_MODEL_ID_MISSING` | 公共模型缺少云端模型标识 | `BLOCKED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `MODEL_DEPENDENCY_CHECK_ERROR` | 模型依赖检测异常 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `SPECIFICATION_NOT_FOUND` | 当前地域不支持所选规格 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `SPECIFICATION_SOLD_OUT` | 所选规格当前无可用库存 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `REALTIME_RESOURCE_CHECK_NOT_SUPPORTED` | 当前云类型尚未完成实时资源检查 | `UNVERIFIED` | 联系平台管理员 | 若问题持续，请联系平台管理员处理 |
| `QUOTA_INSUFFICIENT` | 云资源配额不足 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |
| `CAPACITY_UNAVAILABLE` | 当前资源容量不足 | `BLOCKED` | 修改部署配置 | 请修改部署配置后重新检测 |

跨检测项技术归因码统一使用第 10 节目录，不为每个检测项重复创建同义技术码。

## 12. 状态与部署准入映射

| 单项状态 | 含义 | 总体影响 | 是否显示处理动作 |
| --- | --- | --- | --- |
| `PASSED` | 必要检测已执行并通过 | 无阻断 | 否 |
| `BLOCKED` | 已取得确定性阻断证据 | 总体必为 `BLOCKED` | 是 |
| `UNVERIFIED` | 技术异常或能力未实现，未取得确定结论 | 无 `BLOCKED` 时总体为 `UNVERIFIED` | 是 |
| `SKIPPED` | 因前项阻断而未执行 | 不额外改变总体状态 | 否 |

总体状态优先级：

```text
BLOCKED > UNVERIFIED > PASSED
```

| 总体状态 | 是否可直接部署 | 是否可确认风险继续 |
| --- | --- | --- |
| `PASSED` | 是 | 不需要 |
| `BLOCKED` | 否 | 否 |
| `UNVERIFIED` | 否 | 是，必须显式确认 `acceptUnverifiedRisk=true` |

正式 `confirmDeploy` 必须重新执行同一套准入检查，不能使用前端缓存的旧检测结论。

## 13. 后端返回字段与操作转换示例

### 13.1 XCloud 原始账号结果

```json
{
  "reasonCode": "PROVIDER_READ_TIMEOUT",
  "reasonMessage": "云服务响应超时",
  "retryable": true
}
```

### 13.2 Hashrate 返回部署页的结果

```json
{
  "checkCode": "ACCOUNT_CREDENTIAL",
  "status": "UNVERIFIED",
  "reasonCode": "PROVIDER_READ_TIMEOUT",
  "reasonMessage": "云服务响应超时",
  "actionHint": "请前往云账号接入管理处理，完成后返回当前页面重新检测"
}
```

转换规则只改变页面操作，不改变 XCloud 的账号归因事实。

## 14. 安全边界

- 不返回 AK、SK、Token、Authorization、Password、Private Key 等敏感信息。
- 不返回完整云商响应体、请求头、异常堆栈和未经处理的异常文本。
- `reasonParams` 只保留脱敏、限长的云商错误码、错误摘要和 requestId。
- 前端只依赖 `reasonCode`、`status` 和 `actionHint`，不解析云商原始错误码，也不消费动作类型。
- 账号问题跳转接入管理时只携带非敏感 `cloudAccountId`，接入管理仍需重新校验租户和权限。

## 15. 统一归因原则

1. 云商原始错误码可以不同，部署页统一的是业务归因和处理动作。
2. 账号原因由 XCloud 负责，Hashrate 不复制 XCloud 分类器。
3. 部署页不显示“更新凭证”或“刷新连通状态”，账号类问题统一“前往接入管理”。
4. 操作说明只使用第 4 节四种固定文案，不为单个原因临时创造近义句。
5. 有明确业务证据才返回 `BLOCKED`；技术异常返回 `UNVERIFIED`，不能猜成凭证、授权、配额或容量问题。
6. 未执行真实配额检测时，不得返回配额通过或配额不足。
7. 前项阻断导致后项无法执行时返回 `SKIPPED / BLOCKED_BY_PREVIOUS_CHECK`，不能显示通过。
8. 风险继续是总体准入控制，不是检测项操作。
9. 前端只展示后端提供的原因和操作，不自行维护错误码映射表。

## 16. 当前实现与目标差异

| 项目 | 当前实现 |
| --- | --- |
| 单项字段 | `checkCode / status / reasonCode / reasonMessage / reasonParams / errorCode / actionHint` |
| 账号检测 | Hashrate 先做租户归属和云类型校验，再调用 XCloud `checkReadiness` |
| 规格探针 | 只表达产品接口、规格和库存；不再用华为 `401` 回写账号项 |
| 账号操作 | 后端只给接入管理说明，前端按归因码决定是否显示“前往接入管理” |
| 配额说明 | 规格可用但未查真实配额时返回 `QUOTA_STATUS_UNVERIFIED`，允许确认风险继续 |

## 17. 代码事实来源

Hashrate：

- 预检响应项：`CloudInferenceJobPrecheckItemVo.java`
- 预检总体结果：`CloudInferenceJobPrecheckVo.java`
- 预检编排：`CloudInferenceJobPrecheckService.java`
- 正式部署复核：`CloudInferenceJobServiceImpl.java`
- 云商规格检测契约：`InferenceJobComponent.java`
- 云商规格结果：`FlavorAvailabilityVo.java`
- 华为规格检查：`HuaweiInferenceJobComponentImpl.java`

XCloud：

- 账号检测项：`CloudAccountDetectionItem.java`
- 账号处理动作：`CloudAccountHealthAction.java`
- 账号归因目录：`CloudAccountHealthReasonCode.java`
- 账号统一分类器：`CloudAccountReasonClassifier.java`
- 原因与操作文案：`CloudAccountHealthMessageResolver.java`
- 健康检测契约：`CloudAccountHealthService.java`
- 只读就绪性检测：`CloudAccountHealthService.checkReadiness`
