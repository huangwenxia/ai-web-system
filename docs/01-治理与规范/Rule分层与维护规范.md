# Rule 分层与维护规范

## 目标
明确 `ai-web-system` 中 rule 的职责边界，避免再把 rule 写成 skill、workflow 或命令入口。

## 结论
rule 只做“约束”，不做“技能复用”。

更具体地说：
- rule 回答“遇到这类任务时，哪些约束必须成立”
- command 回答“用户如何触发这类任务”
- skill 回答“这类任务按什么协议执行”
- agent 回答“谁负责执行，以及如何协作”

如果某份规则开始包含：
- 明确的步骤清单
- 何时转交给哪个 skill
- handoff / workflow / writeback_targets
- 大段任务执行协议

就说明它已经偏向 skill，不应继续放在 rule 中。

## 当前推荐的两层 rule
### 1. 用户级全局 rule
放置位置：
- Cursor `User Rule`
- 维护模板：`.cursor/user-rule.template.md`

适合内容：
- 先判断是不是开发任务
- 修改前先确认上下文和影响范围
- 优先复用现有结构和约束
- 输出以可执行为导向
- 非开发问题直接正常回答

不适合内容：
- 某个项目的目录结构
- 某个组件库的视觉规范
- 某个任务流的详细步骤

### 2. 项目级 rule
放置位置：
- `rules/`
- `.cursor/rules/`

适合内容：
- 当前项目的前端开发约束
- bug 修复与优化约束
- 文档路径约束
- workbench 约束
- 回写治理约束

不适合内容：
- prototype、schema-to-ui、page-analysis 之类的技能协议
- command 入口文案
- agent 的角色说明

## 本次清理掉的重复 rule 类型
以下类型已从项目级 rule 中移除：
- `00-core-workflow`
- `01-task-routing`
- `10-frontend-domain`
- `50-prototype-workflow`
- `51-schema-to-ui-workflow`
- `52-frontend-implementer-workflow`
- `53-page-review-workflow`

原因：
- 它们在教模型“该怎么做任务”
- 这部分已经与 `skills/` 和 `commands/` 重叠
- 保留在 rule 层会继续造成职责混乱

## 当前项目级 rule 结构
- `00-global-task-scope.mdc`
- `10-existing-frontend-dev.mdc`
- `20-bugfix-and-optimization.mdc`
- `30-markdown-docs.mdc`
- `40-workbench.mdc`
- `50-writeback-governance.mdc`

## 维护原则
- 新增 rule 前，先判断它是不是“约束”，而不是“技能协议”
- 如果一个结论只适用于单次任务，不新增 rule
- 如果一个结论需要详细步骤，优先写到 `skills/` 或 `commands/`
- 项目级 rule 先维护在 `rules/`，再同步到 `.cursor/rules/`
