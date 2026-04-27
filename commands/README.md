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

## 当前定位补充
- `commands/*.md` 是 slash command 入口的适配层和维护源之一。
- 这不等于所有目标工具都已经原生加载这些命令。
- 如果某个工具还没有稳定识别本地命令目录，`commands/` 仍然可以作为统一入口协议继续维护。

## 当前主入口
- `existing-project-feature.md`
- `existing-project-fix.md`
- `page-review.md`
- `translate-terms.md`

## 当前保留的执行型入口
- `frontend-implementer.md`

## 当前约束
- UI 原型生成统一由 `agione-ui-skill` 承担，不再在本仓库维护 `prototype`、`schema-to-ui`、`page-design` 这类旧入口。
- 独立页面审查统一由 `page-review` 承担，不再拆成 `page-analysis`、`ui-visual-review`、`ux-analysis`。
