# skills

这里是工作流入口层，面向 Codex、Claude Code 或其他终端工具的工作流入口模板（Skills）。

## 维护原则
- 入口模板只负责说明先读哪些标准，再执行什么任务。
- 不在 Skill 中重复定义标准正文。
- 主维护层在 `commands` 和 `skills`，部署层只是同步结果。

## 推荐维护顺序
1. 先维护 `commands`。
2. 再维护 `skills`。
3. 最后同步到真实终端安装目录。

## 当前主入口
- `prototype-skill`
- `schema-to-ui-skill`
- `frontend-implementer-skill`
- `page-analysis-skill`
- `page-design-skill`
- `translate-terms-skill`
- `ui-visual-review-skill`
- `ux-analysis-skill`