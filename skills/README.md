# skills

这里是工作流执行协议层，面向 Codex、Claude Code、Cursor、Trae 等终端工具维护可复用任务协议。

## 维护原则

- Skill 负责说明一类任务应该如何执行，而不是只做入口提示。
- 共享约束优先内嵌到真正消费它的 skill，不再维护独立标准目录层。
- 仓库不再单独维护 `commands/` 作为入口层；需要显式调用时，直接以 skill 名称和 `SKILL.md` 作为稳定约定。

## 当前结构

当前仓库已经不再维护早期拆分的 `prototype` / `schema-to-ui` / `page-design` / `page-analysis` / `ui-visual-review` / `ux-analysis` / `product-review` 这组独立技能入口。

当前真实生效的技能拓扑为：

### 任务型主 skill

- `existing-project-feature-skill`
- `existing-project-fix-skill`
- `page-review-skill`
- `translate-terms-skill`

### 专业型 / 执行型 skill

- `agione-ui`：唯一 UI 原型生成入口
- `frontend-implementer-skill`：页面与组件实施、修复、重构落地
- `mamba-dark-mode-override`：深色模式专项排查与修正
- `translate-terms-skill`：同时承担 A-2 主入口与专业能力

## 当前工作流约束

- A-1 新功能开发的实施阶段，一定建立在已确认原型之上。
- 如果已有外部原型、设计稿或已确认页面，直接进入 `existing-project-feature-skill` 编排实施。
- 如果还没有原型，先通过 `agione-ui` 生成并确认原型，再进入实施。
- A-0 独立审查统一收敛到 `page-review-skill`，不再拆成多条结构 / 视觉 / UX 独立入口。

## 推荐目录结构

```text
skill-name/
  SKILL.md
  docs/
  templates/
  scripts/
```

说明：

- `SKILL.md`：主协议文件，负责触发条件、执行协议、输出要求、handoff、guardrails
- `docs/`：补充性的检查清单、细则说明、边界说明
- `templates/`：输出模板、配置模板、最小样板
- `scripts/`：只在该 skill 确实需要可执行辅助脚本时新增

## 与 Cursor Rule 的关系

在 Cursor 中：

- Cursor 的 Rule 机制更适合承接环境级默认约束、目录级自动附加规则和项目级行为
- 当前仓库统一把这层内容维护在 `rules/`
- `skills/` 更适合继续保留任务执行协议

也就是说：

- Rule 偏环境和默认行为
- Skill 偏任务步骤和执行协议

## 当前定位补充

- `skills/*/SKILL.md` 是跨智能体复用的执行协议层。
- 不等于所有目标工具都会原生把它们识别成内建 Skill。
- 如果目标工具暂不支持本地 Skill 自动加载，仍应保留 `skills/` 作为协议源，再由工具的原生 skill 机制、手动调用约定或仓库内说明去消费。

## 推荐维护顺序

1. 先维护 `rules/`
2. 再维护任务类型判断矩阵，确保主入口和专业能力映射稳定
3. 再维护 `skills/`
4. 最后同步到真实终端安装目录

## 当前结构要求

- 高复杂度 skill 默认应补 `docs/` 和 `templates/`
- `docs/` 与 `templates/` 的内容必须在 `SKILL.md` 中被引用，否则不要新增
- 技能协议优先复用 `docs/原始准则来源/` 中可验证、可抽象的内容，但不要把项目特例直接当通用规则搬入主正文
