# commands

这里存跨工具可复用的命令入口模板。

## 这一层负责什么
- 约定“先读哪些标准，再执行什么任务”。
- 提供稳定的任务入口语义。
- 让不同工具共享同一套工作流起点。

## 这一层不负责什么
- 不重新定义标准正文。
- 不替代具体 Agent 职责。
- 不直接承担产品层状态管理。
- 不替代 Cursor 项目规则层。

## 与 Cursor Rule 的关系
在 Cursor 中：
- `.cursor/rules` 负责环境级默认约束和项目级自动附加规则
- `commands/` 更适合继续承担“显式任务入口”

也就是说：
- Rule 偏环境
- Command 偏触发

## 当前主入口
- `prototype.md`
- `page-design.md`
- `page-analysis.md`
- `schema-to-ui.md`
- `frontend-implementer.md`
- `ui-visual-review.md`
- `ux-analysis.md`
- `translate-terms.md`