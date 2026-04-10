# Scripts

这里存放用于自动化部署和同步的脚本。

## 当前脚本

### 同步全局终端入口.ps1

**作用**：将 ai-web-system 的内容同步到各种 AI 终端工具的全局配置目录。

**功能**：

- 同步 Claude Code 的 slash commands 到 `~/.claude/commands`
- 同步 Codex 的 skills 到 `~/.codex/skills`
- 处理 ACL 权限问题（Windows 系统）
- 输出同步结果和可用性提示

**使用方法**：

```powershell
# 基本同步
powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & 'E:\work\ai-web-system\scripts\同步全局终端入口.ps1'"

# 如果遇到 Codex ACL 权限问题，使用修复参数
powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & 'E:\work\ai-web-system\scripts\同步全局终端入口.ps1' -RepairCodexAcl"
```

**什么时候运行**：

- 将 ai-web-system 移动到另一个文件夹后
- 将 ai-web-system 移动到另一台电脑后
- 修改了 commands 或 skills 目录下的内容后

**注意事项**：

- 始终在 ai-web-system 目录下编辑源文件，而不是在全局目录中
- Cursor 和 Roo 的同步功能目前是占位符，尚未实现
- 如果后续新增别的终端，应先把对应同步规则补进这个脚本

### verify-encoding.mjs

**作用**：巡检仓库中的文本文件是否出现编码风险。

**当前会检查**：
- UTF-8 BOM
- 已知乱码特征字符

**使用方法**：

```powershell
node E:\work\ai-web-system\scripts\verify-encoding.mjs E:\work\ai-web-system
```

**建议什么时候运行**：
- 批量改写中文文档后
- 通过脚本生成文本资产后
- 准备同步到其他 AI 终端前

## 维护原则

- 脚本只负责同步或校验，不隐式改写源文件内容
- 源文件始终在 ai-web-system 目录中维护
- 不允许只改全局目录、不回写 ai-web-system
- 涉及文本写入时，优先明确指定 UTF-8