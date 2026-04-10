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

## 当前主入口
- `prototype.md`
- `page-design.md`
- `page-analysis.md`
- `schema-to-ui.md`
- `frontend-implementer.md`
- `ui-visual-review.md`
- `ux-analysis.md`
- `translate-terms.md`