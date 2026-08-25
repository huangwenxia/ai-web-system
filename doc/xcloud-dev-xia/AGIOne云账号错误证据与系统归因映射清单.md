# AGIOne 云账号错误证据与系统归因映射清单

## 1. 文档目的

本文说明 AGIOne 云平台管理中，已接入云账号的健康巡检如何把不同云服务商返回的原始证据，转换为 AGIOne 平台中间错误码，再统一为前端可依赖的系统归因码。

本文回答四个问题：

1. 云商实际返回了什么。
2. AGIOne 适配器把它转换成了什么内部错误码。
3. 统一检测模块最终归因为什么。
4. 用户看到什么中文含义，应该执行什么操作。

## 2. 基线与范围

- 核验日期：2026-08-14。
- 代码基线：`E:\work\agione-backend\metis-xcloud` 当前本地工作树。
- 当前工作树包含尚未提交的 `PROVIDER_ACCESS_DENIED`、`PROVIDER_ERROR_UNCLASSIFIED`、云商证据摘要等改动，本文按当前代码事实记录。
- 业务范围：接入管理列表中已接入云账号的定时巡检与手动同步状态。
- 不包含：模型部署前的就绪性检测、账单/订单同步、云资源管理和云产品能力接口等其他业务调用的错误码。

## 3. 三层错误模型

```text
云商原始证据
HTTP 状态 / SDK 错误码 / SDK 异常 / 响应内容
        ↓ 各云商适配器识别
AGIOne 平台中间错误码
BusinessException.code 或统一技术错误码
        ↓ 公共分类器归一化
AGIOne 系统归因码
reasonCode + reasonParams + actionType
```

### 3.1 云商原始证据

由云服务商或底层网络运行时提供，包括：

- HTTP 状态，例如 `401`、`403`、`429`、`5xx`。
- 云商 SDK 错误码，例如 `InvalidClientTokenId`、`InvalidAccessKeyId.NotFound`。
- SDK 异常，例如 `StsException`、`ServiceResponseException`、`HttpResponseException`。
- 网络异常，例如 `UnknownHostException`、`ConnectException`、`SSLException`。
- 云商错误消息和请求标识。

不同云商的原始错误码不一致，相同 HTTP 状态也不能脱离具体接口直接认定为完全相同的业务原因。

### 3.2 平台中间错误码

由 AGIOne 后端定义，不是云商返回值。它通常存放在 `BusinessException.code` 中，用于隔离不同云商 SDK 的差异。

例如：

```text
AWS 返回 InvalidClientTokenId
        ↓ AWS 适配器
aws.key.secret.error
        ↓ 公共分类器
CREDENTIAL_AUTH_FAILED
```

### 3.3 系统归因码

由 AGIOne 统一检测模块定义，是前端、产品文案和后续操作应该依赖的稳定契约。不同云商的不同原始错误，可以归入同一个系统归因。

## 4. 云商覆盖范围

`Platform` 当前登记 25 类平台，但“登记为平台”不等于“已经建立云账号身份/凭证健康检测映射”。

| 覆盖状态 | 云商/平台 | 说明 |
| --- | --- | --- |
| 已有专属健康检测适配器 | 阿里云、AWS、华为云、Google Cloud、Infracube（算模方） | 已能调用云商身份或凭证接口，并按本文规则统一归因 |
| 平台枚举存在，但当前未检索到专属 `CloudAccountComponent` 健康检测实现 | 腾讯云、Azure、天翼云、云聚、VMware、OpenStack、百度云、UCloud、阿里金融云、云聚 SaaS、上海超算、阿里小飞天、华为云 Stack、上海电信、火山云、天翼智能边缘云、万模、新华三、浪潮、天翼云算力网关 | 当前不能声称已建立完整的“原始证据 → 中间码 → 系统归因”映射；若进入统一检测且找不到组件，会走平台检测异常 |

## 5. 各云商完整映射

### 5.1 阿里云

检测接口：STS `GetCallerIdentity`。

| 云商原始证据 | 原始证据中文 | AGIOne 中间错误码 | 中间码中文 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `InvalidAccessKeyId.NotFound` | AccessKey ID 不存在 | `aliyun.key.secret.error` | 阿里云 Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | `UPDATE_CREDENTIALS` 更新凭证 | 请编辑云账号，修正凭证信息 |
| `SDK.InvalidAccessKeySecret` | AccessKey Secret 无效 | `aliyun.key.secret.error` | 阿里云 Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| 错误码包含 `Throttling` | 请求被限流 | `cloud.account.provider.rate.limited` | 云服务请求受限 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| 错误码包含 `ServiceUnavailable` 或 `InternalError` | 云服务暂不可用/云商内部异常 | `cloud.account.provider.service.unavailable` | 云服务暂时不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 错误码包含 `AccessDenied`、`Forbidden`、`NotAuthorized` 或 `NoPermission` | 云端访问被拒绝 | `cloud.account.provider.access.denied` | 访问被拒绝 | `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他 `ClientException` | 云商已返回错误，但系统没有更细分类 | `cloud.account.provider.error.unclassified` | 云服务请求异常 | `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `NotApplicable` | 当前身份检测不适用 | `cloud.account.check.validate.exception` | 检测执行异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| STS 响应无法解析 | 云商响应格式异常 | `cloud.account.provider.response.invalid` | 云服务身份响应异常 | `PROVIDER_RESPONSE_INVALID` | 云服务身份响应异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| 响应中没有 `AccountId` | 无法确定云账号主体 | `cloud.account.identity.unresolved` | 无法确认云账号主体 | `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | 更新凭证 | 请编辑云账号，修正凭证信息 |

### 5.2 AWS

检测接口：STS `GetCallerIdentity`。

| 云商原始证据 | 原始证据中文 | AGIOne 中间错误码 | 中间码中文 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `InvalidClientTokenId` | Access Key ID 或令牌无效 | `aws.key.secret.error` | AWS Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `SignatureDoesNotMatch` | 请求签名不匹配 | `aws.key.secret.error` | AWS Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `UnrecognizedClientException` | 客户端身份无法识别 | `aws.key.secret.error` | AWS Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `ExpiredToken` | 临时令牌已过期 | `aws.key.secret.error` | AWS Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `IncompleteSignature` | 请求签名不完整 | `aws.key.secret.error` | AWS Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `429` 或 `ThrottlingException` | 请求被限流 | `cloud.account.provider.rate.limited` | 云服务请求受限 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `5xx` | AWS 服务端异常 | `cloud.account.provider.service.unavailable` | 云服务暂时不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `403` | AWS 拒绝当前身份访问 | `cloud.account.provider.access.denied` | 访问被拒绝 | `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他 `StsException` | AWS 已返回错误，但系统没有更细分类 | `cloud.account.provider.error.unclassified` | 云服务请求异常 | `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 非 `StsException` 的其他异常 | SDK 构建、调用或本地执行异常 | `aws.validate.error` | AWS 校验异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| HTTP 非 200 或返回账号为空 | 无法确定 AWS 账号主体 | `cloud.account.identity.unresolved` | 无法确认云账号主体 | `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | 更新凭证 | 请编辑云账号，修正凭证信息 |

### 5.3 Google Cloud

检测方式：解析 Service Account JSON，并在线刷新 Google Credentials。

| 云商原始证据 | 原始证据中文 | AGIOne 中间错误码 | 中间码中文 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project ID 为空 | 项目 ID 未填写 | `google.account.project.id.empty` | Google Cloud Project ID 不能为空 | `CREDENTIAL_FORMAT_INVALID` | 凭证格式不正确 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| Service Account 为空 | 服务账号凭证未填写 | `google.account.service.account.empty` | Google Service Account 凭证不能为空 | `CREDENTIAL_FORMAT_INVALID` | 凭证格式不正确 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| JSON 结构、类型、私钥或邮箱不合法 | Service Account JSON 无效 | `google.account.service.account.invalid` | Google Service Account 凭证无效 | `CREDENTIAL_FORMAT_INVALID` | 凭证格式不正确 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| JSON 中 `project_id` 与填写值不同 | 项目与服务账号不匹配 | `google.account.project.id.mismatch` | Project ID 与 Service Account 所属项目不一致 | `CREDENTIAL_PROJECT_MISMATCH` | 项目 ID 与服务账号不一致 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `401` | Google 凭证认证失败 | `google.account.authentication.failed` | Google Service Account 凭证认证失败 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `403` | Google 拒绝访问 | `cloud.account.provider.access.denied` | 访问被拒绝 | `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `429` | Google 请求限流 | `cloud.account.provider.rate.limited` | 云服务请求受限 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `5xx` | Google 服务端异常 | `cloud.account.provider.service.unavailable` | 云服务暂时不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他 `HttpResponseException` | Google 已返回 HTTP 错误，但系统没有更细分类 | `cloud.account.provider.error.unclassified` | 云服务请求异常 | `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 配置代理且发生连接失败 | 代理无法完成 Google 连接 | `cloud.account.proxy.unavailable` | 云服务代理不可用 | `PROXY_UNAVAILABLE` | 网络代理不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 没有明确 HTTP 响应的其他异常 | Google SDK 或平台执行异常 | `google.account.validate.error` | Google 校验异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |

### 5.4 华为云

检测接口：IAM `KeystoneListAuthDomains`，必要时校验 `userId`。

| 云商原始证据 | 原始证据中文 | AGIOne 中间错误码 | 中间码中文 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HTTP `401` | AK/SK 认证失败 | `huawei.key.secret.error` | 华为云 Key 或 Secret 无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `403` | IAM 访问被拒绝 | `cloud.account.provider.access.denied` | 访问被拒绝 | `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `429` | 请求被限流 | `cloud.account.provider.rate.limited` | 云服务请求受限 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `5xx` | 华为云服务端异常 | `cloud.account.provider.service.unavailable` | 云服务暂时不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他 `ServiceResponseException` | 华为云已返回错误，但系统没有更细分类 | `cloud.account.provider.error.unclassified` | 云服务请求异常 | `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `ConnectionException` | 无法连接华为云接口 | `cloud.account.provider.request.failed` | 云服务请求失败 | `PROVIDER_REQUEST_FAILED` | 云服务请求失败 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他异常 | SDK、本地配置或检测程序异常 | `huawei.validate.error` | 华为云校验异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| IAM 没有返回 Domain | 无法确定华为云账号主体 | `cloud.account.identity.unresolved` | 无法确认云账号主体 | `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | 更新凭证 | 请编辑云账号，修正凭证信息 |

### 5.5 Infracube（算模方）

检测方式：调用区域分页查询接口验证访问凭证。该适配器当前为“仅验证凭证”，不解析外部云账号主体。

| 云商原始证据 | 原始证据中文 | AGIOne 中间错误码 | 中间码中文 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HTTP `401` | 访问凭证未通过认证 | `infracube.key.secret.error` | Infracube 访问凭证无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `403` 且消息包含 `AccessKeyInvalid` | Access Key 无效 | `infracube.key.secret.error` | Infracube 访问凭证无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| HTTP `403` 且消息包含 `SignatureInvalid` | 签名无效 | `infracube.key.secret.error` | Infracube 访问凭证无效 | `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| 其他 HTTP `403` | 接口访问被拒绝 | `cloud.account.provider.access.denied` | 访问被拒绝 | `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `429` | 请求被限流 | `cloud.account.provider.rate.limited` | 云服务请求受限 | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| HTTP `5xx` | Infracube 服务端异常 | `cloud.account.provider.service.unavailable` | 云服务暂时不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他非成功状态 | 云商已返回业务错误，但系统没有更细分类 | `cloud.account.provider.error.unclassified` | 云服务请求异常 | `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 返回对象为 `null` | 云商响应结构无效 | `cloud.account.provider.response.invalid` | 云服务身份响应异常 | `PROVIDER_RESPONSE_INVALID` | 云服务身份响应异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| 调用抛出可识别网络异常 | 连接、超时、DNS、TLS 等问题 | 见第 6 节 | 对应网络中间码 | 对应技术归因 | 对应中文 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| 其他运行时/本地异常 | SDK 或检测程序异常 | `cloud.account.check.validate.exception` 或异常本身 | 检测执行异常 | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无定向操作 | 若问题持续，请联系平台管理员处理 |

## 6. 跨云商网络与技术异常映射

这部分不依赖某个云商的业务错误码，而是从异常链或统一平台中间码识别。

| 原始证据 | 原始证据中文 | 平台中间/技术错误码 | 系统归因码 | 系统归因中文 | 自动重试 | 健康页操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `HttpConnectTimeoutException` | 建立连接超时 | `PROVIDER_CONNECT_TIMEOUT` | `PROVIDER_CONNECT_TIMEOUT` | 连接云服务超时 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `ConnectException` | TCP/网络连接失败 | `PROVIDER_CONNECTION_FAILED` | `PROVIDER_CONNECTION_FAILED` | 无法连接云服务 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `SocketTimeoutException`、`HttpTimeoutException` | 等待云商响应超时 | `PROVIDER_READ_TIMEOUT` | `PROVIDER_READ_TIMEOUT` | 云服务响应超时 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `UnknownHostException` | 域名无法解析 | `PROVIDER_DNS_RESOLUTION_FAILED` | `PROVIDER_DNS_RESOLUTION_FAILED` | 云服务域名解析失败 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `SSLException` | TLS/证书握手失败 | `TLS_HANDSHAKE_FAILED` | `TLS_HANDSHAKE_FAILED` | 无法与云服务建立安全连接 | 否 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `cloud.account.provider.rate.limited` | 云商限流 | `PROVIDER_RATE_LIMITED` | `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `cloud.account.provider.service.unavailable` | 云商服务不可用 | `PROVIDER_SERVICE_UNAVAILABLE` | `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `cloud.account.provider.request.failed` | 云商请求失败 | `PROVIDER_REQUEST_FAILED` | `PROVIDER_REQUEST_FAILED` | 云服务请求失败 | 最多 3 次 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `cloud.account.proxy.unavailable` | 网络代理不可用 | `PROXY_UNAVAILABLE` | `PROXY_UNAVAILABLE` | 网络代理不可用 | 否 | 同步状态 | 问题排查并解决后，可执行同步状态复测 |
| `cloud.account.detection.configuration.missing` | 检测服务缺少配置 | `DETECTION_CONFIGURATION_MISSING` | `DETECTION_CONFIGURATION_MISSING` | 系统检测配置异常 | 否 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| `cloud.account.provider.response.invalid` | 云商响应无法解析 | `PROVIDER_RESPONSE_INVALID` | `PROVIDER_RESPONSE_INVALID` | 云服务身份响应异常 | 否 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| `cloud.account.component.not.found` | 当前云商没有检测组件 | `DETECTION_INTERNAL_ERROR` | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 否 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| `cloud.account.check.validate.exception`、`aws.validate.error`、`google.account.validate.error`、`huawei.validate.error` | 检测程序或 SDK 异常，且没有可靠云商业务证据 | `DETECTION_INTERNAL_ERROR` | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 否 | 无定向操作 | 若问题持续，请联系平台管理员处理 |
| 其他未识别的非业务异常 | 平台无法识别的运行时异常 | `DETECTION_INTERNAL_ERROR` | `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 否 | 无定向操作 | 若问题持续，请联系平台管理员处理 |

## 7. 非云商返回的健康状态映射

这些原因不是云商返回的，而是 AGIOne 根据本地数据和检测结果生成。

| AGIOne 原始事实 | 平台中间错误码/检测结果 | 系统归因码 | 系统归因中文 | 操作 | 操作说明 |
| --- | --- | --- | --- | --- | --- |
| 当前凭证解析出的账号 ID 与原绑定账号不同 | `cloud.account.binding.mismatch`，兼容旧码 `aliyun.account.changed.error`、`aws.account.changed.error`、`huawei.account.changed.error` | `CREDENTIAL_ACCOUNT_MISMATCH` | 当前凭证不属于原绑定云账号 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| 无法从凭证解析云账号身份 | `cloud.account.identity.unresolved` | `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| 云账号缺少初始化健康快照 | 无云商中间码，由快照服务生成 | `HEALTH_SNAPSHOT_MISSING` | 状态待同步 | 同步状态（页面级命令） | 初始化快照缺失，可执行同步状态重新检测 |

## 8. 系统归因码总目录

| 系统归因码 | 中文 | 默认操作 | 操作说明 |
| --- | --- | --- | --- |
| `CREDENTIAL_FORMAT_INVALID` | 凭证格式不正确 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `CREDENTIAL_PROJECT_MISMATCH` | 项目 ID 与服务账号不一致 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `CREDENTIAL_AUTH_FAILED` | 云身份与凭证认证失败 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `CLOUD_IDENTITY_ERROR_UNCLASSIFIED` | 暂时无法确认具体身份原因 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `CREDENTIAL_ACCOUNT_MISMATCH` | 当前凭证不属于原绑定云账号 | 更新凭证 | 请编辑云账号，修正凭证信息 |
| `HEALTH_SNAPSHOT_MISSING` | 状态待同步 | 同步状态（页面级命令） | 初始化快照缺失，可执行同步状态重新检测 |
| `PROVIDER_CONNECT_TIMEOUT` | 连接云服务超时 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_CONNECTION_FAILED` | 无法连接云服务 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_READ_TIMEOUT` | 云服务响应超时 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_DNS_RESOLUTION_FAILED` | 云服务域名解析失败 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_RATE_LIMITED` | 云服务请求受限 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_SERVICE_UNAVAILABLE` | 云服务暂时不可用 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_REQUEST_FAILED` | 云服务请求失败 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_ACCESS_DENIED` | 访问被拒绝 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROVIDER_ERROR_UNCLASSIFIED` | 云服务请求异常 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `PROXY_UNAVAILABLE` | 网络代理不可用 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `TLS_HANDSHAKE_FAILED` | 无法与云服务建立安全连接 | 同步状态（页面级命令） | 问题排查并解决后，可执行同步状态复测 |
| `DETECTION_CONFIGURATION_MISSING` | 系统检测配置异常 | 无 | 若问题持续，请联系平台管理员处理 |
| `PROVIDER_RESPONSE_INVALID` | 云服务身份响应异常 | 无 | 若问题持续，请联系平台管理员处理 |
| `DETECTION_INTERNAL_ERROR` | 系统检测异常 | 无 | 若问题持续，请联系平台管理员处理 |

`HEALTH_SNAPSHOT_MISSING` 不代表云商错误或账号不可用，也不新增独立后端或前端健康状态。接口继续返回 `healthStatus=ACTION_REQUIRED`、`detectionActivity=IDLE` 和 `actionType=REFRESH_CONNECTIVITY_STATUS`；状态标签仍显示“需处理”。前端只针对该原因码将原因行显示为 warning 黄色并使用刷新图标，其他 `ACTION_REQUIRED` 的原因行仍使用 error 红色。

> “同步状态”是页面级命令；`HEALTH_SNAPSHOT_MISSING` 可返回现有 `REFRESH_CONNECTIVITY_STATUS` 动作以支持卡片内入口，不代表新增后端状态。其他原因是否提供专属动作仍按原因码契约处理。

## 9. 自动重试与手动同步关系

后端单次检测最多尝试 3 次的范围：

- 连接超时、连接失败、响应超时、DNS 解析失败。
- `cloud.account.provider.request.failed`。
- `cloud.account.provider.rate.limited`。
- `cloud.account.provider.service.unavailable`。

以下情况当前不会自动重试 3 次：

- 凭证认证失败、凭证格式错误、账号主体不匹配。
- 访问被拒绝。
- 未分类云商业务错误。
- 代理不可用、TLS 握手失败。
- 云商响应格式异常、平台检测配置异常、平台内部异常。

“最多自动检测 3 次”只解决本次瞬时失败，不代表外部问题恢复后状态会立即改变。云商服务、权限、网络或限流恢复后，用户仍可通过页面级“同步状态”命令立即发起新一轮检测。

## 10. 后端返回字段与安全边界

健康快照对前端的稳定契约应以系统归因为主：

```json
{
  "reasonCode": "PROVIDER_ERROR_UNCLASSIFIED",
  "reasonMessage": "云服务请求异常：ExampleProviderCode · 脱敏并限长后的云商错误摘要（请求 ID：脱敏请求标识）",
  "reasonParams": {
    "providerErrorCode": "ExampleProviderCode",
    "providerErrorMessage": "脱敏并限长后的云商错误摘要",
    "providerRequestId": "脱敏请求标识"
  },
  "actionType": null,
  "actionHint": null
}
```

字段职责：

| 字段 | 提供方 | 用途 |
| --- | --- | --- |
| `reasonCode` | AGIOne 统一分类器 | 前端业务判断、状态展示和统计聚合的稳定依据 |
| `reasonMessage` | AGIOne i18n 与后端组合器 | 用户可见完整原因；有云商证据时已包含系统归因和安全证据摘要 |
| `reasonParams.providerErrorCode` | 云商返回，经 AGIOne 脱敏和限长 | 排障证据，不作为前端业务分支依据 |
| `reasonParams.providerErrorMessage` | 云商返回，经 AGIOne 脱敏和限长 | 为云商错误提供可理解摘要，保留脱敏后的原文，不强制翻译 |
| `reasonParams.providerRequestId` | 云商返回，经 AGIOne 脱敏和限长 | 联系云商工单时辅助定位 |
| `actionType` | AGIOne 统一分类器 | 健康原因需要定向处理时只返回 `UPDATE_CREDENTIALS`；页面级“同步状态”命令不通过该字段表达 |
| `actionHint` | AGIOne i18n | 解释操作时机，不替代操作本身 |

安全约束：

- 不返回完整响应体、请求头、堆栈和未处理的原始异常。
- 不返回 AK、SK、Token、Authorization、Password、Private Key 等敏感数据。
- `providerErrorCode` 最长 96 字符。
- `providerErrorMessage` 脱敏后最长 240 字符。
- `providerRequestId` 最长 128 字符。
- 后端按请求语言组合最终 `reasonMessage`：中文使用 `系统归因：code · message（请求 ID：id）`，英文使用 `System reason: code · message (Request ID: id)`；code 或 message 缺失时只拼接存在的字段。
- `providerErrorCode` 与 `providerErrorMessage` 都不存在时，即使存在 request ID 也不单独追加云商证据；网络、DNS、TLS、本地配置或程序异常等没有云商响应的情况只展示系统归因。
- 前端只展示后端生成的 `reasonMessage`，不再读取 `reasonParams` 二次拼接或自行解析完整云商响应。

## 11. 统一归因原则

1. 云商原始错误码不要求一致，系统统一的是业务语义。
2. 有明确认证证据才归为 `CREDENTIAL_AUTH_FAILED`，不能仅凭模糊异常猜测凭证错误。
3. 明确 403 或访问拒绝证据归为 `PROVIDER_ACCESS_DENIED`，不再与凭证失效混为一类。
4. 云商明确返回错误但无法细分时归为 `PROVIDER_ERROR_UNCLASSIFIED`，不冒充平台内部异常。
5. 没有云商响应证据的 SDK、本地配置、解析或程序错误归为 `DETECTION_INTERNAL_ERROR`。
6. 前端只依赖系统归因码、后端生成的 `reasonMessage` 和 `actionType`；结构化云商原始证据只用于解释和排障，不由展示层二次拼接。
7. 新增云商时，必须在云商适配器中完成“原始证据 → 平台中间码”的映射，并由公共分类器统一输出系统归因，禁止让前端直接识别各云商错误码。

## 12. 代码事实来源

- 平台清单：`metis-xcloud-common/.../Platform.java`
- 统一归因枚举：`hyperone-account-model/.../CloudAccountHealthReasonCode.java`
- 业务错误分类：`hyperone-account-local/.../CloudAccountReasonClassifier.java`
- 网络异常、重试和技术归因：`hyperone-account-local/.../CloudAccountDetectionRetryExecutor.java`
- 健康检测：`hyperone-account-local/.../CloudAccountHealthDetectionService.java`
- 健康快照：`hyperone-account-local/.../CloudAccountHealthSnapshotService.java`
- 云商证据安全处理：`hyperone-plugin-account/.../CloudAccountProviderEvidenceException.java`
- 阿里云适配器：`hyperone-plugin-aliyun/.../AliyunAccountComponent.java`
- AWS 适配器：`hyperone-plugin-aws/.../AwsAccountComponent.java`
- Google Cloud 适配器：`hyperone-plugin-google/.../GoogleCredentialUtil.java`
- 华为云适配器：`hyperone-plugin-huawei/.../HuaweiAccountComponent.java`
- Infracube 适配器：`hyperone-plugin-infracube/.../InfracubeAccountComponent.java`
