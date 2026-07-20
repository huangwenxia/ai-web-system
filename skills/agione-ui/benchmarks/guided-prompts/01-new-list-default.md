# Guided Benchmark 01 · New List Defaults to Guided

## User prompt

使用 `agione-ui` 设计一个 Provider 侧 API Key 管理页。角色、字段和行为已确认：

- 页面字段：名称、Key ID、状态、创建时间、最近使用时间、过期时间。
- 筛选：名称、状态。
- 状态：启用、已禁用、已过期；已过期是独立状态。
- 操作：创建、复制 ID、停用、启用、重命名、删除。
- 创建字段：名称、有效期、访问范围。
- 有效期：30 天、90 天、1 年，默认 90 天，不允许永不过期。
- 访问范围：只读、标准 API 调用，默认标准 API 调用。
- 密钥明文只在创建成功后显示一次。

## Expected first response

- 进入 guided strict，不创建项目文件。
- 先给出当前页面的完整材料决策清单，至少覆盖页面骨架、列表信息表示、筛选密度、行操作、创建承载方式和一次性密钥成功态。
- 标记 pending / auto-selected / not-applicable，并给出 unresolved-material-decisions 数量。
- 每轮只为一个 pending 决策提供 2-3 个 strict-valid 候选。
- 通过可用的 conversation-native visual 展示候选，不能只列文字选项。
- 每个候选说明真实取舍，并推荐一个。
- 不生成完整 HTML，不路由到 `agione-ui-explore`。

## Trace acceptance

- 每次只确认一个材料级决策组。
- 一个选择只锁定当前命名决策，不得推断整个页面或其他组件已经确认。
- 每次选择后说明锁定范围、仍未锁定内容、下一个决策和新的未决数量。
- 每个后续交互携带累计 decision ledger。
- HeaderBox、DataTable、StatusBadge 等确定性组件不制造假选择。
- 所有业务字段、操作和一次性密钥规则保持不变。

## Final acceptance

- 仅创建一个目标 HTML。
- 只有 unresolved-material-decisions=0 后才允许 scaffold。
- 最终确认使用真实 AGIOne target 渲染，不把通用候选样例当作保真依据。
- 目标通过 strict evaluator。
