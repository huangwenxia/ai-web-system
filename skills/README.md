# skills

这里是工作流入口层，面向 Codex、Claude Code 或其他终端工具的工作流入口模板（Skills）。

## 维护原则
- 入口模板只负责说明先读哪些标准，再执行什么任务。
- 不在 Skill 中重复定义标准正文。
- 主维护层在 `commands` 和 `skills`，部署层只是同步结果。

## 与 Cursor Rule 的关系
在 Cursor 中：
- `.cursor/rules` 更适合承接环境级默认约束、目录级自动附加规则和项目级行为
- `skills/` 更适合继续保留为“任务执行协议”的来源

也就是说：
- Rule 偏环境和默认行为
- Skill 偏任务步骤和执行协议

## 推荐维护顺序
1. 先维护 `commands`。
2. 再维护 `skills`。
3. 再决定是否需要抽取到 Cursor Rule。
4. 最后同步到真实终端安装目录。

## 当前主入口
- `prototype-skill`
- `schema-to-ui-skill`
- `frontend-implementer-skill`
- `page-analysis-skill`
- `page-design-skill`
- `translate-terms-skill`
- `ui-visual-review-skill`
- `ux-analysis-skill`