# xcloud-dev-xia 云账号健康检测改动评估反馈

## 1. 评估范围

- 评估日期：2026-08-03
- 对比分支：`origin/dev...origin/xcloud-dev-xia`
- `origin/dev`：`a6f523b`
- `origin/xcloud-dev-xia`：`0f71270`
- 分支关系：`xcloud-dev-xia` 直接基于 `dev` 增加 4 个提交，无分叉
- 改动规模：82 个文件，约 4573 行新增、333 行删除
- 主要范围：
  - 云账号保存前预检
  - 云账号身份与凭证检测
  - AI 云产品访问与权限检测
  - 健康状态快照
  - 原因码、恢复动作和国际化文案
  - 阿里云、AWS、Google Cloud、华为云适配

## 2. 总体结论

增加云账号预检、健康状态和故障指引的方向有实际价值，但当前实现把以下三种不同语义统一放进了“云账号健康”：

1. 云账号凭证是否有效。
2. 某个 AI 云产品是否开通、是否有只读访问权限。
3. 目标业务在指定地域是否真正具备部署能力。

这三层不能使用同一个健康结论。

当前版本容易把合法云账号误判为 `ACTION_REQUIRED`，同时也不能证明账号具备真实部署能力。因此不建议按照当前形态整体合并到 `dev`。

建议拆分为：

- XCloud 云账号身份验证。
- 按业务和地域计算的云产品能力就绪检测。

## 3. 建议保留的设计

以下部分设计合理，可以继续保留：

- `POST /cloud/account/precheck` 保存前预检接口。
- 身份凭证和产品能力分项返回检测结果。
- 编辑凭证时禁止切换到另一个云主账号。
- AK/SK、扩展凭证的掩码回填和响应脱敏。
- 结构化原因码、建议动作及中英文文案。
- 技术检测失败时保留上一次有效结论。
- 云商检测在数据库事务外执行。
- 保存时增加并发更新保护。
- 账号创建或修改后发送监控通知，通知失败不回滚账号数据。

## 4. 合并前必须调整的问题

### 4.1 拆分账号验证和产品能力就绪

XCloud 云账号验证应只判断：

- 凭证能否完成身份认证。
- 凭证对应哪个云主账号、项目或 Domain。
- 凭证是否明确失效、停用或格式错误。
- 编辑后的凭证是否仍属于原绑定账号。

以下检测不应作为通用云账号健康条件：

- 阿里云 PAI Workspace、EAS。
- AWS SageMaker。
- Google Vertex AI。
- 华为云 ModelArts。

这些属于特定业务能力，应按业务和地域单独计算。

建议状态模型：

```text
CloudAccountVerification
- VERIFIED
- INVALID
- UNVERIFIED
- VERIFYING

CloudCapabilityReadiness
- READY
- ACTION_REQUIRED
- UNKNOWN
- UNSUPPORTED
- STALE
```

### 4.2 阿里云身份检测 API 选择不合理

当前 `AliyunAccountComponent.validateAccount()` 使用 `QueryBillOverview` 获取账号 ID。

存在的问题：

- 该接口属于账单查询能力，不是专门的身份确认接口。
- 合法 RAM 用户可能具备 PAI/EAS 权限，但没有费用中心或账单查询权限。
- 此类凭证会在身份检测阶段被误判，最终无法保存账号。

建议改用阿里云 STS `GetCallerIdentity`：

- 不依赖账单权限。
- 可以返回当前调用者所属的 `AccountId`。
- 可以返回当前调用主体类型和 ARN。
- 语义上与 AWS STS `GetCallerIdentity` 一致。

### 4.3 产品检测缺少业务和地域作用域

当前代码只读取全局默认检测地域：

```text
Aliyun  cn-shanghai
AWS     cn-north-1
Google  us-central1
Huawei  cn-north-4
```

全局默认地域不能代表真实业务是否可用。例如账号在默认地域未开通产品，但在目标业务地域已经具备完整能力。

能力检测至少应携带：

```text
tenantId
cloudType
cloudAccountId
businessId
regionId
capabilityType
```

示例：

```text
capabilityType = HASHRATE_INFERENCE
```

检测地域必须来自目标业务的实际地域授权，不能由服务环境统一决定。

### 4.4 只读列表 API 不能证明真实部署能力

当前产品检测调用：

| 云商 | 当前探针 |
| --- | --- |
| 阿里云 | `ListWorkspaces`、`ListServices` |
| AWS | SageMaker `ListEndpoints` |
| Google | Service Usage、Vertex AI Endpoint List |
| 华为云 | ModelArts API Key List |

这些探针最多证明凭证能够调用某个只读列表接口，不能证明具备完整部署能力。

可能产生两种误判：

- 假阴性：账号可以完成实际业务，但没有列表权限。
- 假阳性：列表调用成功，但缺少创建服务、执行角色、对象存储、网络、配额或其他依赖能力。

建议根据真实部署链路定义能力检查项，不要把单个 List API 成功直接解释为“账号健康”或“部署就绪”。

### 4.5 技术故障不应直接阻止账号保存

当前身份检测发生以下异常时，会同步重试三次，之后设置 `accountSavable=false`：

- 网络连接失败
- DNS 解析失败
- 请求超时
- 代理不可用
- 云商服务异常
- 云商限流

这会导致云商短暂抖动时用户无法录入账号。

建议保存规则调整为：

| 检测结果 | 保存行为 |
| --- | --- |
| 凭证明确无效 | 阻止保存 |
| 凭证属于另一个云账号 | 阻止保存 |
| 云身份已经接入 | 阻止保存 |
| 账号名称重复 | 阻止保存 |
| 网络超时或 DNS 异常 | 允许保存为 `UNVERIFIED` |
| 云商限流或 5xx | 允许保存为 `UNVERIFIED` |
| 产品未开通或权限不足 | 允许保存，在能力状态中提示 |

云产品能力检测应在保存后通过 `@HyperoneJob` 异步执行，不应放在同步保存请求中连续访问多个云商接口。

### 4.6 当前状态模型会制造误告警

当前对外健康状态只有：

```text
HEALTHY
ACTION_REQUIRED
```

但是代码同时规定：

- 历史账号没有快照时默认 `ACTION_REQUIRED`。
- 适配器未实现产品探针时返回 `SKIPPED`，最终仍保存为 `ACTION_REQUIRED`。
- 技术原因无法完成检测时，用户仍然容易看到需要处理。

这会造成大量无法解释的告警。

建议区分：

- 尚未检测。
- 正在检测。
- 身份验证通过。
- 凭证确定无效。
- 技术原因无法判断。
- 当前云不支持该能力检测。
- 检测结果已经过期。

### 4.7 需要重新确认云账号唯一性规则

分支新增数据库约束：

```sql
UNIQUE (cloud_type, account_id)
```

该约束意味着同一个云主账号不能关联两个 Metis 租户。

应用约束前需要确认：

- 代理商或转售商是否会共享云主账号。
- 运营商账号与终端账号是否可能映射到同一云身份。
- 父子账号和审核关联是否允许重复云主账号。
- 同一云账号是否允许服务多个业务租户。

Google 还存在特殊问题：当前使用 `projectId` 作为 `accountId`，会导致同一项目中的不同 Service Account 无法分别接入。

建议先定义每个云商的稳定身份键，再决定唯一约束范围：

- 全平台唯一。
- 租户内唯一。
- 业务内唯一。
- 云主体和凭证主体组合唯一。

## 5. 云商适配逐项评价

### 5.1 阿里云

账号身份检测不合理，必须优先调整：

- 不应使用账单 API 判断账号身份。
- 建议使用 STS `GetCallerIdentity`。

PAI/EAS 检测可以保留为业务能力检测，但必须：

- 使用目标业务地域。
- 区分产品未开通、缺少权限和技术失败。
- 不阻止云账号保存。

### 5.2 AWS

使用 STS `GetCallerIdentity` 识别账号身份是合理的。

SageMaker `ListEndpoints` 只能作为某个权限检查项，不能作为完整的 SageMaker 就绪结论。真实部署还需评估执行角色、模型存储、镜像、网络和配额等依赖。

### 5.3 Google Cloud

解析 Service Account JSON、校验 `project_id` 并在线刷新 Token 的方向基本合理。

需要调整：

- 唯一身份不能只使用 `projectId`。
- 建议至少使用 `projectId + clientEmail` 表达凭证主体。
- `serviceusage.services.get` 和 `aiplatform.endpoints.list` 只代表特定权限。
- Vertex AI 能力必须绑定目标地域和业务。

### 5.4 华为云

通过 IAM 获取 Domain 识别账号身份的方向可以保留。

ModelArts API Key List 不适合作为整体 ModelArts 能力判断。建议根据 Hashrate 实际使用的 ModelArts 接口和授权链路重新定义能力检查。

硬编码 ModelArts 错误码时还需要：

- 补充官方依据或线上响应样本。
- 明确错误码版本和适用地域。
- 未识别错误不得直接归类为凭证问题。

## 6. 当前工程交付缺口

当前版本在进入 `dev` 前还需要处理：

- 强制启用测试后，`hyperone-account-local` 共执行 36 个用例，35 个通过、1 个失败。
- 失败用例预期 `PROVIDER_REQUEST_FAILED`，实际返回 `PROVIDER_READ_TIMEOUT`，代码和测试契约不一致。
- `CloudAccountResponseMaskerTest` 编译成功，但 Surefire 实际执行数为 0。
- `cloudAccount_detect` 没有发现配套菜单或权限初始化。
- 三份数据库 SQL 没有发现 Flyway/Liquibase 自动迁移机制，需要明确发布执行顺序。
- OP `/cloud/account` 列表没有调用 `healthSnapshotService.enrich()`。
- 只有终端用户列表和详情接口装配了健康快照。
- 定义了 `SCHEDULED`，但没有实际的 `@HyperoneJob` 周期检测任务。
- 最新 `project-mamba origin/test` 尚未接入预检接口、手动健康检测和健康状态字段。

已验证的工程结果：

- `git diff --check` 通过。
- 账号 model/api/local/web 模块可以编译。
- 阿里云、AWS、Google、华为云适配模块及依赖共 16 个 Maven 模块打包成功。

## 7. 建议的拆分交付方式

### 第一阶段：云账号身份验证

建议先交付：

- 多云身份确认。
- 保存前预检。
- 凭证绑定保护。
- 凭证及扩展凭证脱敏。
- `VERIFIED / INVALID / UNVERIFIED / VERIFYING` 状态。
- 确定性凭证错误阻止保存。
- 技术错误允许保存并进入后台重试。
- 阿里云身份检测切换至 STS。
- 重新确认多租户账号唯一性。

### 第二阶段：业务能力就绪

单独交付：

- `tenantId + cloudAccountId + businessId + regionId + capabilityType` 作用域。
- PAI/EAS、SageMaker、Vertex AI、ModelArts 能力适配。
- 基于真实部署调用链的检查项。
- `@HyperoneJob` 周期检测。
- 手动重新检测。
- 最近有效检测时间、结果过期和历史记录。
- 前端状态展示及修复入口。

## 8. 建议验收标准

### 云账号身份验证

- 没有账单权限的合法阿里云 RAM 凭证可以正常通过身份验证。
- AWS、阿里云、华为云能够返回稳定的云账号身份。
- Google 能区分同一项目下不同 Service Account。
- 编辑凭证后云主账号发生变化时必须阻止保存。
- 网络超时或云商限流不会被误报为凭证无效。
- 技术故障时账号可保存为 `UNVERIFIED`。
- 历史账号不会默认全部显示为需要处理。

### 业务能力就绪

- 检测必须关联明确的业务和地域。
- 默认地域通过不能代表其他地域通过。
- 列表权限通过不能直接代表部署能力通过。
- 不支持该能力的云返回 `UNSUPPORTED`，不能返回通用异常。
- 技术故障返回 `UNKNOWN`，不能覆盖最近一次有效业务结论。
- 前端能够展示检测时间、结论来源和明确的修复动作。

## 9. 最终建议

本次改动要解决的问题有实际价值，但当前实现更接近“AI 产品只读 API 探针”，还不能作为通用的云账号健康检测。

建议不要直接整体合并：

1. 保留账号身份验证、安全增强和保存前预检。
2. 修正阿里云身份检测。
3. 调整技术故障下的保存策略。
4. 重新确认账号唯一性。
5. 将 AI 产品能力检测按租户、云账号、业务、地域和能力类型重新建模。

完成上述拆分后，这项能力才能真正减少接入失败和运维排障成本，而不是引入新的误报和状态解释成本。
