# skills

这里是工作流执行协议层，面向 Codex、Claude Code 或其他终端工具的可复用任务协议（Skills）。

## 维护原则
- Skill 负责说明一类任务应该如何执行，而不是只做入口提示。
- 不在 Skill 中重复定义标准正文。
- `commands` 负责入口，`skills` 负责协议，两者要有明确边界。

## 双层结构

当前 `skills` 的升级方向不是简单地把“专业维度”全部合并掉，而是形成两层：

- 任务型主 skill：对应用户真实工作流入口，负责识别主任务、组织闭环、选择默认主链路。
- 专业型子 skill：对应原型、结构、视觉、UX、实现等专业能力，负责把具体环节做专业。

约束如下：

- 任务型主 skill 不能替代专业能力判断，只负责分流和编排。
- 专业型子 skill 不因为有了任务型主 skill 就立刻删除；只要它仍然被多个任务复用，就继续保留。
- 如果一个 skill 既是稳定任务入口，又具备明确专业边界，可以同时具备两种属性，例如 `translate-terms-skill`。
- 默认由全局 rule 先判断任务类型，再决定调用哪个主 skill 或哪些专业 skill 组合。

## 推荐目录结构
当前仓库中的 skill 建议统一按以下结构维护：

```text
skill-name/
  SKILL.md
  docs/
  templates/
  scripts/
```

说明：
- `SKILL.md`：主协议文件，负责触发条件、执行协议、输出要求、handoff、guardrails
- `docs/`：只放补充性的检查清单、细则说明、边界说明
- `templates/`：只放输出模板、配置模板、最小样板
- `scripts/`：仅在该 skill 确实需要可执行辅助脚本时才新增

不要把所有内容都堆进 `SKILL.md`，也不要为了凑结构创建空目录。

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
1. 先维护 `standards` 和 `rules`，把任务分流和默认约束写清。
2. 再维护任务类型判断矩阵，确保主入口和专业能力的映射稳定。
3. 再维护 `skills`，优先收敛任务型主 skill 的边界。
4. 最后再同步到真实终端安装目录。

## 当前过渡状态

当前仓库处于“已有一条任务型主入口 + 多条专业型子 skill”的混合阶段。

### 已落地的任务型主 skill

- `existing-project-feature-skill`
- `existing-project-fix-skill`
- `product-review-skill`
- `translate-terms-skill`

### 当前保留的专业型子 skill

- `prototype-skill`
- `schema-to-ui-skill`
- `frontend-implementer-skill`
- `page-analysis-skill`
- `page-design-skill`
- `translate-terms-skill`
- `ui-visual-review-skill`
- `ux-analysis-skill`

`translate-terms-skill` 当前同时具备任务入口和专业能力两种属性。

在这些主入口没有完全收敛之前，不强行删除现有专业 skill，而是由全局 rule、任务矩阵和已落地主 skill 共同分流。

## 当前结构要求
- 高复杂度 skill 默认应补 `docs/` 和 `templates/`
- `docs/` 与 `templates/` 的内容必须在 `SKILL.md` 中被引用，否则不要新增
- 技能协议优先复用 `docs/原始准则来源/` 中可验证、可抽象的内容，但不要把项目特例直接当通用规则搬入主正文
