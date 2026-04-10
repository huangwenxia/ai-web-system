# ai-web-system

这是整个 AI Web 协作体系的总工作区。

它不是单独的标准库，也不是单独的 Skill 仓库，而是把标准本体、工作流入口、Agent 执行层、未来产品层、示例层和总说明层放在一个统一目录下。

## 目录说明
- `standards`
  存标准本体。这里的核心资产是 `ai-web-standards`。
- `commands`
  存跨工具可复用的命令提示词模板。
- `skills`
  存面向 Codex、Claude Code 或其他终端工具的工作流入口模板。
- `scripts`
  存用于自动化部署和同步的脚本。
- `agents`
  存专项 agent 的职责说明、提示词、协作协议和输入输出边界。
- `apps`
  如果后续做可视化工作台或后台界面，放在这里。
- `examples`
  存示例任务、示例输入输出和最佳实践。
- `docs`
  存整体说明、路线图、架构图和层级关系文档。

## 当前原则
- 标准只写在 `standards`。
- `commands` 和 `skills` 只能引用标准，不再定义第二套规则。
- `agents` 只负责执行，不负责成为规则权威。
- 产品层现在可以为空，等标准和工作流稳定后再扩展。

## 编码约束
为避免再次出现中文乱码，仓库现在统一采用以下规则：
- 所有文本文件默认使用 UTF-8。
- 默认行尾使用 LF，`*.ps1` 保持 CRLF。
- 新增或批量改写文本前，优先保留 UTF-8 无 BOM。
- 可执行巡检命令：`node scripts/verify-encoding.mjs E:\work\ai-web-system`

相关文件：
- `.editorconfig`
- `.gitattributes`
- `.vscode/settings.json`
- `scripts/verify-encoding.mjs`

## Git管理
仓库已经接入 GitHub，并建议按轻量知识库方式管理。

建议先看：
- `docs/Git协作规范.md`

日常常用命令：

```powershell
git -C E:\work\ai-web-system status
node E:\work\ai-web-system\scripts\verify-encoding.mjs E:\work\ai-web-system
git -C E:\work\ai-web-system add .
git -C E:\work\ai-web-system commit -m "docs: 更新说明文档"
git -C E:\work\ai-web-system push
```

## 建议阅读顺序
建议先看：
1. `standards/README.md`
2. `docs/体系总览.md`
3. `docs/四层关系.md`
4. `docs/Git协作规范.md`
5. `skills/README.md`
6. `agents/README.md`