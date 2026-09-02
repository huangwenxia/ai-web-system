# AGIOne（产品品牌） Muses（缪斯） 当前业务功能与流程深度剖析

> 分析对象：`E:\work\agione-muses`（项目目录）（项目目录）
>
> 代码基线：`88b7632ae8a8a41a459ba94c52652bea82dfd333`（代码提交哈希），`v.12`（版本十二）
>
> 分析日期：2026-09-01
>
> 工作模式：Design Mode（设计分析模式）
>
> 结论边界：本文描述代码与仓库文档能够证明的当前能力，不等同于真实用户验收或生产运行证明。

## 1. 执行结论

AGIOne（产品品牌） Muses（缪斯） 的真实产品定位已经不是“输入 Prompt（提示词） 后生成一条视频”，而是一套面向视频生产的可检查工作系统：用户在 Project（项目） 中发起 Session（生产会话），系统把需求解析成由 Skill（技能） 固化的 Plan（执行计划），经 Producer（制片人）、Writer（编剧）、Director（导演）、Art Director（美术指导）、QA（质量审核）、Asset（素材）、Editor（剪辑师） 等生产阶段生成可版本化 Artifact（生产产物） 和 Asset（素材），再通过 FFmpeg/ffprobe（视频装配工具与媒体探测工具） 形成有证据约束的最终视频，最后由管理员采用为项目当前版本或发布到 Works（作品）。

当前架构最有价值的不是模型调用本身，而是三条控制链已经成形：

1. **业务意图控制链**：用户要求 → LLM（大语言模型） 参数解析 → Skill（技能） 解析 → 可审查 Plan（执行计划） → 生成合同。
2. **生产执行控制链**：Plan Step（计划步骤） → Action（动作） → Task（任务） → Provider Call（模型提供方调用） / Local Tool（本地工具） → Artifact（生产产物） / Asset（素材） → Event（事件）。
3. **结果可信控制链**：生成前 QA（质量审核） → 视频生成批准合同 → FFmpeg（视频装配工具） 装配 → ffprobe（媒体探测工具） 证据 → 明确版本发布。

但当前不能得出“端到端业务已交付”的结论。最强可辩护状态是：

- 架构与主要运行入口已实现；
- 部分纯逻辑与契约测试已通过；
- 全量测试基线未通过；
- 未观察到真实 Provider（模型提供方）、真实运营人员、真实发布消费方完成闭环的 E4（四级证据：真实角色操作） 证据；
- 视频参考输入、网页资料归档、Session（生产会话） 级分析产物归属等关键语义仍存在实现与文档分叉。

因此当前成熟度应表述为：**Runtime（运行时） Implemented（运行时已实现）/ 部分 Mechanically Validated（机械验证通过）/ Awaiting Operational Validation（等待真实运营验证）**。

## 2. 系统意图、目标用户与关键任务

### 2.1 系统意图

把视频生产从一次性生成请求，转化为可规划、可审查、可复用、可返工、可追溯、可发布的生产项目。

### 2.2 当前目标用户

| 用户 | 当前代码中的身份 | 主要任务 | 权限边界 |
| --- | --- | --- | --- |
| 平台管理员 | `admin`（管理员角色） + `platformAdmin=true`（平台管理员标记为真） | 管租户、平台默认设置、SSO（单点登录），同时使用自己所属租户的生产能力 | 不能通过请求头进入其他租户生产空间 |
| 租户操作员 | `admin`（管理员角色） | 管本租户项目、Session（生产会话）、Skill（技能）、模型、素材、生产、导出与发布 | 不能查看其他租户；不能改平台级设置 |
| 作品消费者 | 当前仍需登录的 `requireUser`（要求已登录用户） | 浏览、播放、下载本租户已发布作品 | 没有独立 viewer（只读查看者角色） 运营模型；修改和删除作品仍需 admin（管理员角色） |

仓库文档声明 viewer（只读查看者角色） 与成员管理已退出，但 `tenant_memberships`（租户成员关系表） 表、相关类型及兼容方法仍保留。这些应理解为历史兼容结构，不是当前客户可见功能。

### 2.3 用户的核心任务

目标用户进入系统后，应能完成以下闭环：

配置模型与提供方 → 创建项目 → 发起生产会话 → 分析需求并匹配技能 → 执行七阶段生产 → 生成前审片与返工 → 生成分段视频与声音 → 剪辑与导出证据 → 采用为项目当前版本或发布为作品 → 播放与下载

## 3. 业务域全景

| 业务域 | 核心对象 | 业务责任 | 主要入口 | 当前判断 |
| --- | --- | --- | --- | --- |
| 身份与租户 | Tenant（租户）、User（用户）、Auth Session（登录会话）、SSO State（单点登录状态） | 登录、租户隔离、租户启停、密码与 SSO（单点登录） | `/api/auth/*`（应用程序接口路径）、`/api/tenants/*`（应用程序接口路径） | 主体实现存在 |
| 平台设置 | Platform Settings（平台设置） | 默认语言、主题、SSO（单点登录） 配置 | `/api/platform-settings`（应用程序接口路径） | 平台管理员专属 |
| 生产空间 | Production Space（生产空间） | 租户内部生产隔离与文件根目录 | `/api/tenant-production-space`（应用程序接口路径） | 一租户一个；新增接口明确拒绝 |
| 项目管理 | Project（项目）、Project Context（项目上下文） | 长期生产容器、归档、当前版本 | `/api/projects/*`（应用程序接口路径） | 生命周期完整度较高 |
| 会话与对话 | Agent Session（智能体生产会话）、Message（消息）、Context（上下文） | 一次探索、生成、返工或 QA（质量审核） 尝试 | `/api/agent-sessions/*`（应用程序接口路径） | 是工作台中心对象 |
| Skill（技能） 系统 | Skill（技能）、Version（版本）、Installation（安装关系）、Knowledge（知识） | 决定生产流程、约束、Gate（审核节点） 与修订策略 | `/api/skills/*`（应用程序接口路径） | 版本化与租户安装已实现 |
| 生产计划 | Plan（执行计划）、Plan Step（计划步骤）、Gate（审核节点） | 把 Skill（技能） 与视频参数编译成可执行 DAG（有向无环图） | SessionService（生产会话服务） + SkillCompiler（技能编译器） | 是业务合同核心 |
| Agent（智能体） 执行 | Action（动作）、Checkpoint（执行检查点）、Observation（执行观察结果） | 提议、审批、执行、暂停、恢复、重试 | Harness（执行器） / ReAct（推理与动作循环） | 运行控制已细化 |
| 模型能力 | Provider（模型提供方）、Model（模型）、Model Selection（模型用途选择） | 密钥、能力目录、默认用途、调用适配 | `/api/providers/*`（应用程序接口路径）、`/api/models/*`（应用程序接口路径） | Provider（模型提供方） 与 Model（模型） 分离合理 |
| 素材 | Asset（素材）、Asset Group（素材分组） | 上传、第三方搜索下载、生成素材、素材库 | `/api/assets/*`（应用程序接口路径） | 当前输入只支持图片 |
| 生产产物 | Artifact（生产产物）、Shot（镜头）、Shot Attempt（镜头生成尝试） | 文档版本、镜头、生成尝试与来源追踪 | Project（项目） / Session resources（生产会话资源） | 结构丰富，部分归属有缺口 |
| 审核与返工 | Review（审片记录）、Finding（审片问题）、Revision Plan（修订计划） | 找根因阶段、局部重做、复用未受影响结果 | QA（质量审核） + revision planner（修订规划器） | 是产品差异化能力 |
| 导出与发布 | final.mp4（最终视频文件）、Export Evidence（导出证据）、Marketplace（作品市场） | 装配、验证、复制为独立发布资源 | `/export`（导出接口）、`/publish`（发布接口）、`/marketplace`（作品市场接口） | 发布前证据约束较强 |
| 运行可观测性 | Task（任务）、Span（调用链片段）、Provider Call（模型提供方调用）、Event（事件） | 进度、重试、租约、故障诊断、SSE（服务器推送事件） | `/runtime`（运行详情接口）、`/events`（事件流接口） | 数据结构和入口存在 |

## 4. 核心业务对象与真相边界

### 4.1 对象层级

租户 → 内部生产空间 → 项目 → 项目上下文与多个生产会话。每个生产会话关联计划快照、固定技能版本、计划步骤、动作、任务、模型调用、产物、素材、镜头尝试、审片结论、事件和执行检查点；管理员采用完成的生产会话后，项目上下文才切换到该版本。

### 4.2 单一真相源

| 业务问题 | 真相源 | 不应作为真相源的对象 |
| --- | --- | --- |
| 用户本轮到底要什么 | 当前 Session（生产会话） 的有序用户消息与 Prompt（提示词） | Project（项目） 的历史 Prompt（提示词）、后续 Agent（智能体） 文案 |
| 本轮执行什么流程 | 已编译并固定版本的 Plan（执行计划） | 当前 Skill（技能） 最新版本、前端显示顺序 |
| 使用哪个模型与参数 | Plan（执行计划） 的 `videoDecision`（视频规划决策） 及批准后的 review summary（审核摘要） | Provider（模型提供方） 默认值、Agent（智能体） 产物里的自由文本 |
| 口播与字幕是什么 | Writer（编剧） 冻结的 `speechContract`（冻结口播合同） | Director（导演） 或生成 Prompt（提示词） 再次猜测的文字 |
| 生成哪一段视频 | `segment-NNN-generation.json`（分段生成合同数据） + sourceShotIds（来源镜头编号） | 单纯按 storyboard（分镜表） 每行直接调用 Provider（模型提供方） |
| 哪次生成产生了资源 | Action（动作） → Task（任务） → Asset（素材） / Artifact（生产产物） 来源链 | 文件名、目录位置或最新修改时间 |
| 项目当前采用哪个结果 | Project Context（项目上下文） 的 adopted Session（生产会话） | 最近完成的 Session（生产会话） |
| 哪个文件可以发布 | 显式选择的 `final.mp4`（最终视频文件） 及匹配的 export evidence（导出证据） | 任意项目视频或仅状态为 completed（已完成） 的 Session（生产会话） |

### 4.3 Project（项目） 与 Session（生产会话） 的边界

- Project（项目） 是长期业务容器，保存标题、描述、标签、基础创作请求和当前采用版本。
- Session（生产会话） 是一次可区分的生产尝试，可表示 exploration（探索类型）、generation（生成类型）、revision（修订类型）、qa（质量审核类型） 或 retry（重试类型）。
- 同一 Project（项目） 可有多个 Session（生产会话）；完成不等于采用。
- 只有管理员显式点击“采用”，完成态 Session（生产会话） 才成为 Project Current Version（项目当前版本）。
- 新采用会把旧版本标为 `superseded`（已被替代），但不删除旧产物。
- 发布不隐式依赖“已采用”：发布入口要求显式指定经过证据校验的 `final.mp4`（最终视频文件）。这是另一条独立的权威动作。

## 5. 端到端主流程

### 5.1 登录、租户与初始化

1. 用户通过本地用户名/密码或 AGIOne（产品品牌） SSO（AGIOne（产品品牌） 单点登录） 登录。
2. 本地登录解析用户与所属租户；SSO（单点登录） 可绑定既有用户，未知身份会创建租户、登录用户和内部生产空间。
3. 禁用租户不能登录；SSO（单点登录） 用户不会因为用户名为 `admin`（管理员角色） 而取得平台管理员身份。
4. 服务通过 Cookie（浏览器登录凭据） 识别登录会话，并以 home tenant（用户所属租户） 固定运行上下文。
5. 每个租户只有一个内部 Production Space（生产空间）；创建额外空间的 API（应用程序接口） 固定返回业务错误。
6. 平台管理员只能管理租户账户，不能借 `X-Agione-Tenant`（租户请求头） 切换到其他租户生产数据。

异常出口：未登录为 401；角色不符为 403；跨租户资源通过安全边界返回不可见或拒绝。

### 5.2 模型与 Provider（模型提供方） 准备

1. 管理员先创建 Provider（模型提供方），配置 Base URL（基础地址）、作用域、API Key（接口密钥） 与说明。
2. 再在 Provider（模型提供方） 下创建 Model（模型），声明类型、外部 Model ID（模型编号）、能力和调用集成协议。
3. Model（模型） 能力决定可被哪个用途选择：LLM（大语言模型）、text-to-video（文生视频）、image-to-video（图生视频）、TTS（文字转语音） 等。
4. 租户生产空间配置默认用途；运行时优先使用默认选择，再寻找同租户内能力匹配的模型。
5. Provider（模型提供方） 和 Model（模型） 测试会持久化最近结果；配置变更应清除旧测试结论。
6. Provider Key（模型提供方密钥） 只保存在服务端 secret（密钥） 表，API（应用程序接口）、Artifact（生产产物）、日志和观测摘要不得返回明文。

业务阻断：当前生产 Session（生产会话） 在没有可用 LLM（大语言模型） 时直接创建冲突 Plan（执行计划） 并进入 `blocked`（已阻断）；缺视频模型或必要 TTS（文字转语音） 时，Plan（执行计划） 保留但带 blocking（阻断性） reasons（阻断原因），不能确认执行。

### 5.3 创建项目与发起 Session（生产会话）

1. 管理员创建 Project（项目），填写标题、创作请求、描述和标签。
2. Project（项目） 默认只是中性容器，不选择固定“项目类型”。
3. 在 Work（工作台） 中选择 Project（项目），创建新 Session（生产会话） 或继续既有 Session（生产会话）。
4. Session（生产会话） 保存本轮 Prompt（提示词）、图片引用、执行模式、类型、父 Session（生产会话）、作用域和 Project Context（项目上下文） 快照。
5. HTTP（超文本传输协议） 创建接口立即返回 pending（待处理） Session（生产会话）；链接读取和语义解析在后台进行，避免阻塞对话提交。
6. 用户消息先写入有序 Message（消息） 与 Context（上下文），再进入计划解析。

当前输入边界：上传与 Session reference（生产会话引用） 只允许图片。虽然类型和部分文档保留 video reference（视频参考） 语义，但运行入口明确阻止视频引用。

### 5.4 问题分析、网页资料与 Skill（技能） 解析

1. 系统先写入 `source-analysis.json`（素材与产品能力分析数据） 的素材/产品能力分析。
2. Prompt（提示词） 中存在公开 HTTPS（安全超文本传输协议） 链接时，服务检查域名与 DNS（域名解析系统），阻断本地或私网地址，限制响应大小与内容类型。
3. 页面正文被抽取、清洗，并由 LLM（大语言模型） 按当前视频需求整理；LLM（大语言模型） 不可用时使用本地兜底摘要。
4. 摘要追加到本轮规划 Prompt（提示词），但自动路径不会把网页正文创建为素材库 Asset（素材）。
5. LLM（大语言模型） 解析总时长、分辨率、比例、音频偏好；失败时可使用兼容回退。
6. SkillResolver（技能解析器） 先处理显式 `@Skill`（显式指定技能）（显式指定技能），再按关键词、输入类型和场景评分自动匹配。
7. 选择一个 Workflow Skill（工作流技能），并可附加 Capability（能力） / Review（审片记录） / Revision Skill（修订技能）。
8. 若没有可执行 Workflow（工作流） 或出现冲突，创建空 Plan（执行计划），Session（生产会话） 进入 blocked/conflict（已阻断或存在冲突），等待用户补充需求。
9. 系统写入 `analysis.md`（问题分析文档），记录原始需求、识别结果和命中的 Skill（技能）。

关键原则：Skill（技能） 决定生产合同，Project（项目） 不决定生产合同；显式 `@` 高于自动匹配；运行中的 Plan（执行计划） 固定 Skill Version（技能版本），不跟随 Skill（技能） 后续升级。

### 5.5 Plan（执行计划） 编译与执行启动

1. SkillCompiler（技能编译器） 把 Workflow（工作流） DAG（工作流有向无环图） 转成全局唯一的 Plan Step（计划步骤）。
2. 视频能力规划器根据输入类型选择 text-to-video（文生视频） 或 image-to-video（图生视频）。
3. 用户显式总时长优先；模型声明 `maxDurationSeconds`（模型最大生成时长秒数） 时才按模型能力切段。
4. 编译器插入 Problem Analysis（问题分析） 与生成前 QA（质量审核），并移除生成后的重复 QA（质量审核）。
5. 若需要独立 TTS（文字转语音），则在 QA（质量审核） 之后、Editor（剪辑师） 之前插入 TTS（文字转语音） 依赖。
6. Plan（执行计划） 固化 Skill（技能）、版本、Gate（审核节点）、revision（修订类型） policy（修订策略）、视频参数、阻断原因、复用步骤与生产预检。
7. react-harness（推理与动作执行器） 的合法 Plan（执行计划） 会立即确认并启动；`video_only`（仅视频并在媒体生成前确认的模式） 只在媒体生成前暂停一次，`automatic`（全自动执行模式） 不暂停。

典型计划顺序：

问题分析 → 制片 → 编剧 → 导演 → 美术指导 → 生成前审片 → 素材与视频生成；需要独立语音时，审片后并行生成语音；最后进入剪辑时间线、视频装配和导出质量验证。

具体 Skill（技能） 可改变 DAG（有向无环图），但生成前 QA（质量审核）、媒体确认、装配与证据边界会由编译器补齐或约束。

### 5.6 四个文本生产阶段

| 阶段 | 业务责任 | 标准产物 | 明确不负责 |
| --- | --- | --- | --- |
| Producer（制片人） | 锁定主题、受众、目标、主体、时长、必含/禁用、事实 | `brief.md`（制片简报） | 镜头表、运镜、逐句口播、模型分段路由 |
| Writer（编剧） | 剧情动作、情绪、精确口播与画面文字 | `script.md`（编剧脚本）、`speech-contract.json`（冻结口播合同） | 重新定义视频参数或 Provider（模型提供方） 分段 |
| Director（导演） | shot（镜头） ID（镜头编号）、时长、构图、镜头、起止状态、节拍 | `storyboard.md`（分镜文档） | 改写已冻结口播、编造产品能力 |
| Art Director（美术指导） | 视觉风格、主体一致性、色彩与连续性 | `style.md`（视觉风格文档） | 新增剧情事实或营销承诺 |

这些产物是互补合同，不要求互相复制。下游阶段获得按阶段裁剪的知识与上游上下文，避免把完整 Skill Knowledge（技能知识） 和所有文档重复塞入每次 Provider（模型提供方） Prompt（模型提供方提示词）。

### 5.7 生成前 QA（质量审核） 与返工闭环

1. QA（质量审核） 读取四个文本阶段的完整产物与冻结 speechContract（口播合同）。
2. 系统为每个可执行视频窗口编译 `segment-NNN-generation.json`（分段生成合同数据）。
3. 确定性 Preflight（执行前检查） 检查 shot（镜头） ID（镜头编号）、全局锁、口播、时长、参数和生成合同完整性。
4. QA（质量审核） LLM（质量审核语言模型） 审核业务事实、锁冲突、虚构能力与内容质量，但不直接接收 generationSegments（生成分段）。
5. 任何非空 findings（问题集合） 都被视为失败，即使模型错误地返回 passed（审核通过）。
6. 系统从 findings（问题集合） 或 failedStages（失败阶段集合） 找到最上游根因阶段。
7. 失败阶段及所有下游步骤重置为 pending（待处理）；未受影响且依赖完整的步骤可复用。
8. 相同原因重复或达到有界重试后，不直接失败，而是暂停为 `qa_repair`（质量问题修复确认），等待操作员决定修复或停止。
9. QA（质量审核） 通过后才允许 TTS（文字转语音） 与视频生成。

这是项目最重要的结构性能力之一：问题不固定在“审片页面”解决，而是回到 Producer（制片人）、Writer（编剧）、Director（导演） 或 Art Director（美术指导） 的 owner（负责人） stage（责任阶段）。

### 5.8 视频生成、分段与连续性

1. Planner（规划器） 根据 Session（生产会话） 当前需求确定总时长、分辨率、比例、音频和模型。
2. 没有模型时长上限时不编造 5 秒或 15 秒上限。
3. 有上限时先形成模型可执行窗口；Director（导演） 完成后再把镜头行装入这些窗口。
4. 一个 2–3 秒 storyboard（分镜表） 行通常只是窗口内 beat（动作节拍），不是一次独立 Provider（模型提供方） 调用。
5. 新 Director（导演） shot（导演镜头） 使用 independent-shot（独立镜头）；同一 shot（镜头） 因模型时长被切开时才使用 tail-frame continuation（尾帧续接）。
6. tail-frame continuation（尾帧续接） 需要上一段尾帧与 image-to-video（图生视频） 能力，否则阻断。
7. Asset（素材） 阶段复用 QA（质量审核） 已审查的 segment snapshot（分段快照），不应重新改写批准 Prompt（提示词）。
8. 每次生成写 Task（任务）、Action（动作）、Provider（模型提供方） Task（任务） ID（模型提供方任务编号）、Asset（素材）、Shot Attempt（镜头生成尝试） 和事件。
9. 异步 Provider（模型提供方） 通过配置的 poll（轮询） path（轮询路径） 轮询；重启后可从 Checkpoint（执行检查点） 与 providerTaskId（模型提供方任务编号） 恢复，避免重复提交。
10. 生成结果必须有可下载 HTTPS（安全超文本传输协议） URL（安全超文本地址）；只有显式 `mock://`（内部模拟模型协议） 适配器可产生 mock（模拟数据） 资源。

### 5.9 Editor（剪辑师）、导出 QA（质量审核） 与交付承诺

1. Editor（剪辑师） 先写 `timeline.md`（剪辑时间线文档），作为可读装配说明。
2. `assemble_video`（视频装配工具） 使用实际注册的分段 Asset（素材） 通过 FFmpeg（视频装配工具） 拼接；不是从 timeline（时间线） 文本解析输入。
3. `qa_export`（导出质量验证工具） 使用 ffprobe（媒体探测工具） 检查文件存在、文件大小、正时长、视频流和音频流。
4. 成功写 `export-evidence.json`（导出验证证据数据）；失败写 blocking（阻断性） `export-review.md`（导出问题审片文档）。
5. 只有证据通过后，delivery promise（交付承诺） 才从 pending/blocked（待处理或已阻断） 转为 fulfilled（已履约）。
6. 缺少 FFmpeg（视频装配工具）、ffprobe（媒体探测工具）、源文件或有效媒体时不得静默发布。

### 5.10 采用、发布与消费

采用和发布是两个不同的权威动作：

- **采用**：管理员把 completed（已完成） Session（生产会话） 设为 Project（项目） 当前版本；旧版本保留并标为 superseded（已被替代）。
- **发布**：管理员显式选择 `final.mp4`（最终视频文件）；服务查找与该 Artifact（生产产物） 绑定的 export evidence（导出证据），重新计算 SHA-256（文件摘要算法），确认文件未变化后复制到 marketplace（作品市场） 自有目录。
- **消费**：已登录用户可在 Works（作品） 中播放和下载；Range（分段范围请求） 请求支持视频拖动播放。
- **维护**：管理员可改作品标题/描述或删除 listing（作品条目）；删除 listing（作品条目） 不删除生产文件。

发布资源与原 Project/Session（项目与生产会话） 解耦，因此源项目删除后仍能继续读取已发布作品。

## 6. 返工、版本与删除流程

### 6.1 Follow-up（后续消息） 与新计划

- 等待确认时，明确同意/拒绝语句直接路由到批准或拒绝，不创建新的创作轮次。
- 普通 follow-up（后续消息） 追加到有序对话上下文，再重新解析参数和 Skill（技能）。
- 若旧 Plan（执行计划） 为空或 conflict（存在冲突），follow-up（后续消息） 会重新编译生产步骤，不能以空 Plan（执行计划） 完成。
- 同 Prompt（提示词） 的新 Session（生产会话） 可复用成功步骤，但只有依赖链也全部复用时，下游步骤才允许复用。

### 6.2 Artifact（生产产物） 编辑

- 管理员编辑 Markdown/JSON（Markdown（轻量标记文档） 文档或 JSON（结构化数据格式） 数据） 产物时，不覆盖旧文件，而是创建新 Artifact（生产产物） Version（产物版本）。
- `export-evidence.json`（导出验证证据数据） 禁止编辑。
- 保存后将该步骤保留为 succeeded（执行成功），只把后续步骤重置并重新执行。
- 正在执行时先停止当前运行；旧的待批准视频动作会被取消，防止使用旧内容生成。

### 6.3 Shot（镜头） 与 QA（质量审核） 修订

- Finding（审片问题） 记录类别、严重度、证据、修复阶段和受影响 shot（镜头）。
- Revision Plan（修订计划） 计算 affected（受影响步骤）、reused（已复用步骤）、reassembled（重新装配步骤） 与 QA（质量审核） 范围。
- shot（镜头） 级返工只重做受影响镜头和下游装配/审核。
- 上游文本产物变化会沿 Plan（执行计划） 依赖图使下游失效。

### 6.4 Session（生产会话） 与 Project（项目） 删除

- 执行中的 Session（生产会话） 或有活动 Task（任务） 的 Session（生产会话） 不能删除；先 stop（停止） 会取消活动 Task（任务）。
- 删除 Session（生产会话） 只删执行元数据，不删 Artifact（生产产物） / Asset（素材）。
- Project（项目） 必须先 archive（归档） 才能删除。
- 默认强制删除 Project（项目） 时保留资源，并移到 `orphaned-resources`（孤立资源目录）（孤立资源目录）；只有用户显式选择不可逆删除才删除资源记录。
- Marketplace（作品市场） 使用独立复制文件，不随 Project（项目） 删除。

## 7. 素材与 Skill（技能） 支撑流程

### 7.1 素材库

- 当前直接上传只接受图片，单文件上限为 50 MB（兆字节）。
- 素材名称在同一分组内必须唯一。
- 第三方搜索当前开放 Pixabay（第三方图片平台）、Pexels（第三方图片平台） 图片；Coverr/（第三方视频素材平台及其）视频源被阻断。
- 下载后复制到租户素材库，不依赖第三方 CDN（内容分发网络） 持续可用。
- 生成图片可提升为素材库资源；文本和视频不能通过该入口提升。
- 素材库 Asset（素材） 没有 Project/Session/Task/Action（项目、生产会话、任务与动作） 所有权，源项目删除后仍保留。

### 7.2 Skill（技能） 生命周期

1. Built-in Skill（内置技能） 由迁移同步，Manifest/Knowledge hash（技能清单与知识摘要值） 变化时追加版本，不覆盖历史版本。
2. 租户自定义 Skill（技能） 通过引导式多轮问答形成预览，再保存为正式 Skill（技能）。
3. Manifest（技能清单） 包含触发器、输入输出、DAG（有向无环图）、工具白名单、执行限制、Gate（审核节点）、revision（修订类型） policy（修订策略） 与 scene contract（场景合同）。
4. Knowledge（知识） 包含职责、SOP（标准作业程序）、规则、红线、检查表、失败模式、示例和交接。
5. 第三方 Skill（技能） 默认 quarantined（已隔离待审核），需管理员激活。
6. Jimeng（即梦平台） 私有来源明确不可调用，UI（用户界面） 保持不可用。
7. Skill（技能） simulation（技能模拟） 只运行到生成前 QA（质量审核），不发起视频生成；结果可用于调优关键词与边界。

## 8. 状态机与权威动作

### 8.1 Session（生产会话） 状态

草拟中 →（缺少语言模型、技能冲突或模型阻断）→ 已阻断；草拟中 →（计划合法并启动）→ 执行中；执行中 →（仅视频模式在媒体生成前暂停）→ 等待确认；等待确认 →（批准或修复后继续）→ 执行中；等待确认 →（用户拒绝）→ 已停止；执行中可进入已完成、失败或已停止；失败后可重试失败动作并返回执行中；已阻断状态可在补充需求后返回草拟中重新规划。

### 8.2 不能被测试夹具替代的动作

| 动作 | 必需执行者 | 代码可验证什么 | 真实验收还需要什么 |
| --- | --- | --- | --- |
| 批准视频生成 | 租户管理员 | Action（动作） 状态、批准合同、Checkpoint（执行检查点） 恢复 | 真实管理员理解汇总后明确批准 |
| 接受 QA（质量审核） 风险或决定返工 | 租户管理员 | Gate/Action（审核节点与动作） 路由与状态变化 | 真实业务判断与可接受风险依据 |
| 采用 Project（项目） 当前版本 | 租户管理员 | adopted/superseded（已采用或已被替代） 与 Context（上下文） 更新 | 真实项目 owner（负责人） 对结果的选择 |
| 发布作品 | 租户管理员 | export evidence（导出证据）、hash（摘要值）、文件复制 | 真实发布意图与内容合规确认 |
| 最终用户接受视频 | 作品消费者/客户 | 播放与下载机制 | 真实观看、业务接受和持续运行反馈 |

这些动作即使有自动化测试，也只能证明机制，不证明真实权威行为发生。

## 9. 证据与成熟度矩阵

证据等级：E0（零级证据：声明）=声明；E1（一级证据：文档或代码结构）=文档/代码结构；E2（二级证据：机械测试）=机械测试；E3（三级证据：合成端到端测试）=合成端到端；E4（四级证据：真实角色操作）=真实角色操作；E5（五级证据：重复生产运行）=重复生产运行。

| 能力 | 直接证据 | 最强证据 | 当前结论 |
| --- | --- | --- | --- |
| 租户、登录、SSO（单点登录） | 路由、Repository（数据仓储层）、Schema（数据结构定义）、测试 | E1（一级证据：文档或代码结构）；相关 E2（二级证据：机械测试） 本轮测试未整体通过 | 已实现，未机械闭环 |
| Project/Session（项目与生产会话） 生命周期 | API（应用程序接口）、持久化方法、UI（用户界面） 采用入口、测试 | E1（一级证据：文档或代码结构）；部分测试存在但全量红 | 已实现，需修复验证环境并复验 |
| Skill（技能） 解析与版本固定 | Resolver（解析器）、Compiler（编译器）、Version（版本） 表、通过的纯逻辑测试 | 部分 E2（二级证据：机械测试） | 核心合同较清楚 |
| 七阶段生产 | Plan（执行计划） 编译、Agent/Tool（智能体与工具） 执行代码、Artifact writer（产物写入器） | E1（一级证据：文档或代码结构） + 部分 E2（二级证据：机械测试） | 运行已实现，未证明真实出片 |
| QA（质量审核） 根因回流 | Review（审片记录） parser（解析器）、revision planner（修订规划器）、Action（动作） 路由 | 部分 E2（二级证据：机械测试） | 结构成立 |
| 视频 Provider（模型提供方） 调用 | Adapter（适配器）、poll（轮询）、Task（任务）、Provider Call（模型提供方调用） | E1（一级证据：文档或代码结构）；运行集成断言本轮失败 | 不能声称端到端通过 |
| FFmpeg（视频装配工具） 导出证据 | assemble（装配）、qa_export（导出质量验证工具）、发布前 hash（摘要值）校验 | E1（一级证据：文档或代码结构） + 局部 E2（二级证据：机械测试） | 机制较强，未观察真实媒体验收 |
| 发布与播放 | Marketplace（作品市场） API（应用程序接口）、独立文件、Range（分段范围请求） 响应 | E1（一级证据：文档或代码结构） | 未观察真实消费方 E4（四级证据：真实角色操作） |
| 多机 Worker（后台执行进程） 恢复 | lease（执行租约）、heartbeat（执行心跳）、worker（后台执行进程） 入口 | E1（一级证据：文档或代码结构）；相关测试本轮失败 | 不应称稳定生产能力 |

### 9.1 本轮测试事实

- 命令：`pnpm test`（运行全部测试）
- 结果：47 个测试文件，22 个通过、25 个失败。
- 断言：559 项，350 项通过、209 项失败。
- 主导失败：Windows（微软视窗操作系统） 临时目录清理出现大量 `EPERM`（操作系统权限拒绝错误），使许多测试在 afterEach（每项测试后的清理钩子） 或资源操作阶段失败。
- 同时存在独立断言失败，例如部分 runtime Session（运行时生产会话） 未达到 expected completed（预期已完成）、Artifact（生产产物） 编辑返回码不符、模型能力接口状态不符。
- 因此不能把全部失败都归因于测试清理，也不能把 350 个通过项等同于整套 E2（二级证据：机械测试） 通过。

## 10. 关键问题与 owner（负责人） 层分析

### P0-1（最高优先级问题一）：分析产物没有稳定的 Session（生产会话） 来源归属

**Observed Symptom（观察到的现象）**：`analysis.md`（问题分析文档） 与 `source-analysis.json`（素材与产品能力分析数据） 由 ArtifactWriter（产物写入器） 创建时没有传 `sessionId`（生产会话编号）、`actionId`（动作编号） 或 `skillRunId`（技能运行编号），Repository（数据仓储层） 因而把它们保存为 Project（项目） 级 Artifact（生产产物）；但产品合同把 Problem Analysis（问题分析） 描述为当前 Session（生产会话） 的第一阶段，UI（用户界面） 资源读取又强调 Session（生产会话） scoped（按生产会话限定范围）。

**Root Cause（根因）**：Artifact（生产产物） provenance contract（产物来源追溯合同） 在 Analyst/Source Analysis（需求分析与素材分析） 两条写入路径没有执行统一绑定。

**Owner Layer（责任归属层）**：Runtime（运行时） / Persistence（持久化层）。

**Minimum Correction（最小修正）**：让两类产物绑定当前 Session（生产会话）；若分析不是 Action（动作），则至少显式传 `sessionId`（生产会话编号），并定义 follow-up（后续消息） 产生新版本时的归属规则。

**Validation Method（验证方式）**：创建同一 Project（项目） 的两个 Session（生产会话），分别提交不同需求；按 Session（生产会话） 查询 Artifact（生产产物） 时只能看到各自 `analysis.md`（问题分析文档） 与 `source-analysis.json`（素材与产品能力分析数据），Project（项目） 全历史仍可查全部版本。

### P0-2（最高优先级问题二）：全量测试基线未闭合

**Observed Symptom（观察到的现象）**：`pnpm test`（运行全部测试） 整体失败，且除了大量 `EPERM`（操作系统权限拒绝错误） 外还有业务断言不一致。

**Root Cause（根因）**：验证环境的 Windows（微软视窗操作系统） 文件句柄/清理策略不稳定，同时可能存在运行行为回归；当前没有一条独立、可信的全量机械验证链。

**Owner Layer（责任归属层）**：Evidence（证据层） / Test Runtime（测试运行环境）。

**Minimum Correction（最小修正）**：先解决测试资源关闭与清理，再区分清理失败和真实断言失败；重新跑全量并保存机器、Node（服务器脚本运行环境） 版本、FFmpeg（视频装配工具） 状态和结果摘要。

**Validation Method（验证方式）**：全量测试退出码为 0；失败重跑不能依赖手工删除临时目录；关键 runtime integration（运行时集成） 单独可重复通过。

### P0-3（最高优先级问题三）：视频参考输入语义冲突

**Observed Symptom（观察到的现象）**：部分需求文档声明默认 Agent flow（智能体流程） 接受 video references（视频参考），类型与 tool（工具） 也保留 `video_reference2video`（视频参考生成视频工具）；但 Session（生产会话） 初始化、Planner（规划器） 与上传 API（应用程序接口） 明确阻止视频素材，UI（用户界面） 也只允许图片。

**Root Cause（根因）**：目标能力合同和当前发布范围没有被同一个 capability flag（能力开关） / version contract（版本合同） 统一管理。

**Owner Layer（责任归属层）**：Semantic（语义层） / Product Scope（产品范围）。

**Minimum Correction（最小修正）**：产品 owner（负责人） 明确本版本究竟“不支持”还是“应支持”。若不支持，清理当前版本文档中的已支持声明并把类型标为 future/legacy（未来能力或旧版兼容）；若支持，则补上传、素材读取、Planner（规划器） 路由、安全限制与验收，不应只放开一个校验。

**Validation Method（验证方式）**：文档、Schema（数据结构定义）、UI（用户界面）、API（应用程序接口）、Planner（规划器） 和测试对同一输入给出一致结果。

### P1-1（高优先级问题一）：网页资料是否进入素材库存在合同分叉

**Observed Symptom（观察到的现象）**：自动链接流程实际返回空 references（引用集合），只把摘要追加进 Prompt（提示词） 并写分析 Artifact（生产产物）；`importUrlContentAsset`（导入网页内容素材函数）（导入网页内容素材函数） 虽存在且有测试，但没有被生产入口调用。部分文档却写成会存为 text Asset（文本素材） 并绑定 Session（生产会话）。

**Root Cause（根因）**：一次性上下文增强与可复用素材导入被混成同一业务描述。

**Owner Layer（责任归属层）**：Semantic（语义层） / Integration（集成层）。

**Minimum Correction（最小修正）**：明确两个动作：默认“读取并用于本轮”不入库；用户显式“保存为素材”才调用 import（导入）。若产品坚持自动入库，则必须把创建的 Asset（素材） reference（素材引用） 合并进 Session（生产会话），而不是只保留摘要。

**Validation Method（验证方式）**：页面文案、事件、素材列表与 Session（生产会话） references（生产会话引用） 对默认/显式保存两种场景保持一致。

### P1-2（高优先级问题二）：文档与实际导航顺序不一致

**Observed Symptom（观察到的现象）**：Requirements（需求文档） 声明 Work（工作台）、Projects（项目）、Works（作品）、Assets（素材）、Skills（技能）、Models（模型）、Settings（设置）；实际 App（应用） 顺序是 Work（工作台）、Works（作品）、Assets（素材）、Skills（技能）、Projects（项目）、Models（模型）、Settings（设置）。

**Root Cause（根因）**：UI（用户界面） 信息架构变更后文档未同步，或文档顺序未真正冻结。

**Owner Layer（责任归属层）**：UI（用户界面） Semantic（界面语义） / Documentation（文档）。

**Minimum Correction（最小修正）**：由产品 owner（负责人） 确认任务优先级：若核心是生产与结果消费，现有顺序可能合理；若 Projects（项目） 是主要管理入口，则调整 UI（用户界面）。随后只保留一个 canonical（唯一标准） 顺序。

### P1-3（高优先级问题三）：模型“全局”语义需要限定

**Observed Symptom（观察到的现象）**：文档称 Model（模型） 是全局目录、可用于每个 tenant production space（租户生产空间）；实际 Model（模型） 通过 Provider（模型提供方） 间接绑定 tenant（租户），API（应用程序接口） 也按当前 tenant Provider（租户模型提供方） 校验。

**Root Cause（根因）**：把“租户内跨 Production Space（生产空间） 全局”写成了容易理解为“平台跨租户全局”。

**Owner Layer（责任归属层）**：Semantic（语义层） / Tenant（租户） Boundary（租户边界）。

**Minimum Correction（最小修正）**：统一表述为“Model（模型） 在所属租户内全局，对该租户 Production Space（生产空间） 可见；不会跨 Tenant（租户） 共享”。

### P2-1（一般优先级问题一）：退出业务仍保留公开类型和持久化结构

viewer（只读查看者角色）、tenant membership（租户成员关系）、旧 Gate（审核节点）、legacy runtime（旧版运行时） 等兼容结构仍存在。保留本身并非错误，但需要清楚分为：当前可见能力、迁移兼容、历史数据读取、待删除代码。否则后续开发容易误把兼容对象重新接回 UI（用户界面）。

## 11. 架构优势与主要风险

### 11.1 已成立的优势

- Project（项目） 与 Session（生产会话） 分开，避免每次尝试都覆盖项目当前结果。
- Skill Version（技能版本） 固定（技能版本固定）到 Plan（执行计划），保证历史运行不被 Skill（技能） 升级改变。
- Provider（模型提供方）、Model（模型）、Model Selection（模型用途选择） 分层，允许能力路由和不同协议适配。
- 生成前 QA（质量审核） 能回到根因阶段，不把所有问题都堆到最终审片。
- speechContract（口播合同）、segment snapshot（分段快照）、approved review summary（已批准的审核摘要） 形成多层不可静默漂移的合同。
- Artifact/Asset（生产产物与素材） 版本与 Action/Task（动作与任务） 来源为局部返工和审计提供基础。
- 发布要求 export evidence（导出证据） 和文件 hash（摘要值），一定程度上阻止“状态成功但文件已变”的错误发布。
- 项目删除默认保留资源、Marketplace（作品市场） 独立复制，数据损失风险较低。

### 11.2 当前最高风险

- 产品核心主张是 Session（生产会话） 可检查，但分析阶段产物来源链不完整。
- 文档增长速度高于语义收敛速度，同一能力在不同段落可能有相反结论。
- 全量测试失败使运行成熟度无法从 E1（一级证据：文档或代码结构） 稳定升级到 E2（二级证据：机械测试）。
- 代码同时容纳 legacy（旧版兼容模式）与 react-harness（推理与动作执行器），若边界继续模糊，会形成两套行为语义。
- Provider/FFmpeg（模型提供方与视频装配工具） 的真实外部闭环没有 E4/E5（四级或五级证据） 证据，不能从 mock（模拟数据） 或单元测试推导生产可用性。
- 当前 `App.vue`（文件名或文件路径） 承载大量页面与业务交互，业务能力继续增长时会增加 UI（用户界面） 状态耦合和回归成本；这是实现风险，不是立即要求重构的架构结论。

## 12. 建议的收敛顺序

### 第一阶段：修复可信度基础

1. 修复 Windows（微软视窗操作系统） 测试资源释放与临时目录清理，获得可信全量结果。
2. 修复 analysis/source-analysis（问题分析与素材分析） 的 Session（生产会话） provenance（生产会话来源追溯）。
3. 对视频 reference（引用）、网页资料持久化作产品级单一决策。
4. 同步 Requirements（需求文档）、Platform Functions（平台功能说明）、Schema/UI（数据结构与用户界面） 文案与测试。

### 第二阶段：验证真实主路径

1. 使用真实租户管理员配置真实 LLM（大语言模型）、video model（视频模型）、TTS（文字转语音） 与 FFmpeg（视频装配工具）。
2. 分别验证 text-to-video（文生视频） 与 image-to-video（图生视频）。
3. 验证一次 QA（质量审核） 自动回流和一次人工 qa_repair（质量问题修复确认）。
4. 验证 Session（生产会话） 采用、Artifact（生产产物） 编辑后的下游重跑、单 shot（镜头） 返工。
5. 验证 final.mp4（最终视频文件）、export evidence（导出证据）、hash（摘要值）、发布、播放和下载。
6. 保存真实 actor（执行者）、时间、输入、持久化记录和重启后 read-back（持久化后回读） 证据。

### 第三阶段：形成可发布结论

只有在真实管理员完成批准、采用与发布，真实消费方能播放/下载，并且流程在多次运行中稳定后，才能从“Mechanically Validated（机械验证通过）”升级为“Human Operationally Validated（真实人员运营验证通过）”或“Repeatedly Operational（已重复稳定运行）”。

## 13. 可辩护的最终判断

### 信息架构是否成立

成立。Tenant（租户） → Production Space（生产空间） → Project（项目） → Session（生产会话） → Plan（执行计划） → Action/Task（动作与任务） → Artifact/Asset（生产产物与素材） → Review/Export/Marketplace（审片、导出与作品市场） 的业务对象层次总体清楚，且与“视频项目可检查、可返工、可发布”的产品意图一致。

### 当前业务流程是否达到可直接交付

尚未达到。核心路径代码覆盖较广，但全量测试基线失败、Session（生产会话） 分析产物来源链不完整，且视频参考与网页资料语义存在冲突。

### 是否存在必须修正后才能交付的问题

存在。至少应先闭合 P0-1（最高优先级问题一）、P0-2（最高优先级问题二）、P0-3（最高优先级问题三），并用真实管理员和真实 Provider（模型提供方） 完成一次端到端验收，再对外宣称完整视频生产闭环可交付。

当前最准确的状态标签是：

> **架构方向成立，主要 Runtime（运行时） 已实现；当前属于部分机械验证阶段，需要修正关键来源链与验证基线后再进入真实业务验收。**

## 附录一：主要证据来源

- 产品与功能合同：`docs/requirements.md`（源代码或文档路径）、`docs/platform-functions.md`（源代码或文档路径）
- HTTP（超文本传输协议） 业务入口：`src/server/http/routes/auth.ts`（源代码或文档路径）、`admin.ts`（文件名或文件路径）、`agent.ts`（文件名或文件路径）、`artifacts.ts`（文件名或文件路径）、`marketplace.ts`（文件名或文件路径）
- 持久化模型：`src/server/storage/schema.ts`（源代码或文档路径）、`repository.ts`（文件名或文件路径）
- Session（生产会话） 与生产编排：`src/server/orchestration/session-service.ts`（源代码或文档路径）
- Skill（技能） 选择与计划编译：`src/server/skills/resolver.ts`（源代码或文档路径）、`compiler.ts`（文件名或文件路径）、`builtin.ts`（文件名或文件路径）
- 视频能力与参数：`src/server/orchestration/multimodal-video-planner.ts`（源代码或文档路径）
- Harness（执行器） 与 ReAct（推理与动作循环）：`src/server/orchestration/harness-executor.ts`（源代码或文档路径）、`react-controller.ts`（文件名或文件路径）
- Provider（模型提供方） 与媒体：`src/server/providers/*`（源代码或文档路径）、`src/server/production/export.ts`（源代码或文档路径）、`artifacts.ts`（文件名或文件路径）
- 链接资料：`src/server/assets/url-content.ts`（源代码或文档路径）、`source-analysis.ts`（文件名或文件路径）
- 客户端流程：`src/client/App.vue`（源代码或文档路径）、`src/client/api.ts`（源代码或文档路径）
- 机械验证：`tests/*`（源代码或文档路径） 与本轮 `pnpm test`（运行全部测试） 结果

## 附录二：分析限制

- 仓库 AGENTS（智能体规则文件） 声明 GitNexus（代码图谱工具） 已索引，但当前工作树没有 `.gitnexus`（代码图谱目录）（代码图谱目录） 入口，MCP（模型上下文协议） 也未暴露 GitNexus（代码图谱工具） server（代码图谱服务）。
- 尝试用官方 CLI（命令行工具） 重建索引时，GitNexus（代码图谱工具） 1.6.6 在当前 Node（服务器脚本运行环境） 24 环境遇到 tree-sitter ABI（语法解析器二进制接口） 不兼容；临时 Node（服务器脚本运行环境） 22 未能改变 pnpm（项目包管理工具） 安装脚本使用的宿主 ABI（二进制接口）。
- 因此本轮没有把“图谱未发现调用者”当成安全结论，而是用产品文档、HTTP（超文本传输协议） 入口、Schema/Repository（数据结构与数据仓储层）、核心编排源码和测试契约交叉取证。
- 本轮未启动浏览器、未自动截图、未调用真实 Provider（模型提供方）、未执行 FFmpeg（视频装配工具） 出片，也没有真实用户批准/采用/发布证据。
