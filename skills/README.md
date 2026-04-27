# skills

这里是工作流执行协议层，面向 Codex、Claude Code 或其他终端工具的可复用任务协议（Skills）。

## 维护原则
- Skill 负责说明一类任务应该如何执行，而不是只做入口提示。
- 不在 Skill 中重复定义标准正文。
- `commands` 负责入口，`skills` 负责协议，两者要有明确边界。

## 当前结构

当前仓库已经不再维护早期拆分的 `prototype` / `schema-to-ui` / `page-design` / `page-analysis` / `ui-visual-review` / `ux-analysis` / `product-review` 这组 skill。

当前真实生效的技能拓扑收敛为：

### 任务型主 skill

- `existing-project-feature-skill`
- `existing-project-fix-skill`
- `page-review-skill`
- `translate-terms-skill`

### 专业型 / 执行型 skill

- `agione-ui-skill`：唯一 UI 原型生成入口
- `frontend-implementer-skill`：页面与组件实施、修复、重构落地
- `mamba-dark-mode-override`：深色模式专项排查与修正
- `translate-terms-skill`：同时承担 A-2 主入口与专业能力

## 当前工作流约束

- A-1 新功能开发的实施阶段，一定建立在已确认原型之上。
- 如果已有外部原型、设计稿或已确认页面，直接进入 `existing-project-feature-skill` 编排实施。
- 如果还没有原型，不再走旧的 `prototype -> schema-to-ui -> page-design` 链，而是先通过 `agione-ui-skill` 生成并确认原型，再进入实施。
- A-0 独立审查统一收敛到 `page-review-skill`，不再拆成多条结构 / 视觉 / UX 独立 skill。

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
3. 再维护 `skills`，优先保持主 skill 与现有工具流一致。
4. 最后再同步到真实终端安装目录。

## 当前结构要求
- 高复杂度 skill 默认应补 `docs/` 和 `templates/`
- `docs/` 与 `templates/` 的内容必须在 `SKILL.md` 中被引用，否则不要新增
- 技能协议优先复用 `docs/原始准则来源/` 中可验证、可抽象的内容，但不要把项目特例直接当通用规则搬入主正文
