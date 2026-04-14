# skills

这里是工作流执行协议层，面向 Codex、Claude Code 或其他终端工具的可复用任务协议（Skills）。

## 维护原则
- Skill 负责说明一类任务应该如何执行，而不是只做入口提示。
- 不在 Skill 中重复定义标准正文。
- `commands` 负责入口，`skills` 负责协议，两者要有明确边界。

## 与 Cursor Rule 的关系
在 Cursor 中：
- `.cursor/rules` 更适合承接环境级默认约束、目录级自动附加规则和项目级行为
- `skills/` 更适合继续保留为“任务执行协议”的来源

也就是说：
- Rule 偏环境和默认行为
- Skill 偏任务步骤和执行协议

## 当前定位补充
- `skills/*/SKILL.md` 是跨智能体复用的执行协议层。
- 这不等于所有目标工具都会原生把它们识别成内建 Skill。
- 如果目标工具暂不支持本地 Skill 自动加载，仍应保留 `skills/` 作为协议源，再由 `commands/` 或工具适配层投影出去。

## 推荐维护顺序
1. 先维护 `standards` 和 `.cursor/rules`。
2. 再维护 `commands`。
3. 再维护 `skills`。
4. 再决定是否需要抽取到 Cursor Rule。
5. 最后同步到真实终端安装目录。

## 当前主入口
- `prototype-skill`
- `schema-to-ui-skill`
- `frontend-implementer-skill`
- `page-analysis-skill`
- `page-design-skill`
- `translate-terms-skill`
- `ui-visual-review-skill`
- `ux-analysis-skill`
