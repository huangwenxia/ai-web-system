# ai-web-system

这是整个 AI Web 协作体系的总工作区。

它不是单独的标准库，也不是单独的 Skill 仓库，而是把标准本体、工作流入口、Agent 执行层、Cursor 规则层、未来产品层、示例层和总说明层放在一个统一目录下。

## 目录说明
- `standards`
  存标准本体。这里的核心资产是 `ai-web-standards`。
- `commands`
  存跨工具可复用的命令提示词模板。
- `skills`
  存面向 Codex、Claude Code 或其他终端工具的工作流入口模板。
- `agents`
  存专项 agent 的职责说明、提示词、协作协议和输入输出边界。
- `.cursor`
  存 Cursor 项目级规则和 User Rule 模板。
- `scripts`
  存用于自动化部署和同步的脚本。
- `apps`
  如果后续做可视化工作台或后台界面，放在这里。
- `examples`
  存示例任务、示例输入输出和最佳实践。
- `docs`
  存整体说明、路线图、架构图和层级关系文档。

## 当前原则
- 标准只写在 `standards`。
- `commands` 和 `skills` 负责入口与执行协议，不重新定义标准正文。
- `agents` 负责角色边界，不负责成为规则权威。
- `.cursor/rules` 负责 Cursor 环境下的项目级默认约束。
- `docs/原始准则来源` 只做来源档案，不直接作为当前规则本体。

## 编码约束
为避免再次出现中文乱码，仓库现在统一采用以下规则：
- 所有文本文件默认使用 UTF-8。
- 默认行尾使用 LF，`*.ps1` 保持 CRLF。
- 新增或批量改写文本前，优先保留 UTF-8 无 BOM。
- 可执行巡检命令：`node scripts/verify-encoding.mjs .`

相关文件：
- `.editorconfig`
- `.gitattributes`
- `.vscode/settings.json`
- `scripts/verify-encoding.mjs`

## Git 管理
仓库已经接入 GitHub，并建议按轻量知识库方式管理。

建议先看：
- `docs/01-治理与规范/Git协作规范.md`
- `docs/01-治理与规范/文档链接与路径规范.md`

日常常用命令：

```powershell
git status
node scripts/verify-encoding.mjs .
git add .
git commit -m "docs: 更新说明文档"
git push
```

## Cursor 规则
当前仓库已经补上第一版 Cursor 项目规则。

建议先看：
- `.cursor/README.md`
- `.cursor/user-rule.template.md`
- `docs/00-总览/Cursor规则分层与协同架构.md`

## 建议阅读顺序
建议先看：
1. `standards/README.md`
2. `docs/00-总览/体系总览.md`
3. `docs/00-总览/四层关系.md`
4. `docs/00-总览/Cursor规则分层与协同架构.md`
5. `docs/01-治理与规范/Git协作规范.md`
6. `docs/01-治理与规范/文档链接与路径规范.md`
7. `docs/01-治理与规范/任务类型判断矩阵.md`
8. `docs/01-治理与规范/能力去重与映射矩阵.md`
9. `skills/README.md`
10. `agents/README.md`