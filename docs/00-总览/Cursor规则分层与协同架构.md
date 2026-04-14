# Cursor 规则分层与协同架构

## 目标
明确 `ai-web-system` 在 Cursor 中的规则分层，避免把 rule、command、skill、agent 混成一层。

## 当前分层
建议按两层理解 rule：

### 1. 用户级全局 rule
放在：
- Cursor `User Rule`
- `.cursor/user-rule.template.md`

职责：
- 约束跨项目都成立的工程行为
- 例如先判断是不是开发任务、修改前先确认上下文、优先复用现有结构

不负责：
- 某个项目的视觉规范
- 某个任务流的详细步骤
- 某个技能的执行协议

### 2. 项目级 rule
放在：
- `rules/`
- `.cursor/rules/`

职责：
- 约束当前项目内稳定成立的开发行为
- 例如既有项目的前端开发约束、bug 修复与优化约束、文档约束、workbench 约束、回写治理约束

不负责：
- 承载 workflow
- 重写 skill 协议
- 充当 slash command 入口

## 其他层的职责
### `standards/`
规则来源，回答什么叫对。

### `commands/`
显式任务入口，回答用户如何触发一类任务。

### `skills/`
执行协议，回答任务按什么步骤执行。

### `agents/`
角色边界与多 Agent 协作协议，回答谁负责什么、如何分工。

### `rules/`
项目级规则维护源，先在这里维护，再同步到 `.cursor/rules/`。

### `.cursor/rules/`
Cursor 投影层，让项目级规则在 Cursor 中自动生效。

## 当前规则结构
当前项目级 rule 只保留真正的约束文件：
- `00-global-task-scope.mdc`
- `10-existing-frontend-dev.mdc`
- `20-bugfix-and-optimization.mdc`
- `30-markdown-docs.mdc`
- `40-workbench.mdc`
- `50-writeback-governance.mdc`

## 已移除的旧 workflow rule
以下旧文件已经不再适合作为 rule 维护：
- `00-core-workflow.mdc`
- `01-task-routing.mdc`
- `10-frontend-domain.mdc`
- `50-prototype-workflow.mdc`
- `51-schema-to-ui-workflow.mdc`
- `52-frontend-implementer-workflow.mdc`
- `53-page-review-workflow.mdc`

原因：
- 它们在教模型“任务该怎么做”
- 这部分已经与 `commands/` 和 `skills/` 重叠
- 保留在 rule 层会继续导致职责混乱

## 推荐维护顺序
1. `standards/`
2. `rules/`
3. `.cursor/rules/`
4. `commands/`
5. `skills/`
6. `agents/`
7. `docs/`

## 结论
当前架构中：
- rule 只做约束
- command 做入口
- skill 做协议
- agent 做分工

只要继续按这个边界维护，规则层就不会再和 skill 层重叠。
