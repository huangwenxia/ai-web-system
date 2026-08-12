---
name: agione-swagger-sync
description: 定向同步 project-mamba 的 AGIOne Swagger 生成 API。用户说“同步 Swagger”“生成接口”“更新 packages/api”“接口已在 dev/test/xia 但前端没有”“删除 API bridge”时使用。支持 dev、test 和个人 xia.agione.opr 聚合源，要求确认目标前端分支、限制生成路径、审查生成 diff，并用生成 API 替代手写 request。
---

# AGIOne Swagger 定向同步

## 工作流

1. 确认目标前端仓库、分支和 worktree；禁止把修改落到用户指定分支之外。
2. 确认接口实际存在于目标 Swagger 原始文档。
3. 选择来源：
   - `dev`：仓库 `package.json` 的 dev 聚合地址。
   - `test`：仓库 `package.json` 的 test 聚合地址。
   - `xia`：临时使用 `http://xia.agione.opr/v3/api-docs/swagger-config`，完成后恢复 `package.json` 原始字节。
4. 必须指定生成路径，如 `/general/cloud`；禁止默认全量同步。
5. 运行 `scripts/sync-swagger.mjs`。个人地址不得留在 Git diff。
6. 审查所有生成文件。保留目标 Swagger 中真实存在的同路径契约变化，不手改生成文件掩盖差异。
7. 将业务代码改为调用生成的 `Api.<module>...`；删除为缺失接口新增的手写 request/bridge。历史 bridge 仅在仍有独立类型兼容理由时保留。
8. 运行目标文件 ESLint、类型检查（若基线失败则区分既有错误）、编码检查和 `git diff --check`。不运行前端 build，除非用户明确要求。

## 命令

```powershell
node <skill-dir>/scripts/sync-swagger.mjs `
  --repo=C:/Users/xia/.codex/worktrees/test-hashrate-web `
  --expected-branch=test-hashrate-web `
  --source=xia `
  --path=/general/cloud
```

`--source` 允许 `xia`、`dev`、`test`。脚本只负责安全执行已有生成器；业务调用替换和 diff 审查由 Agent 完成。

## 硬约束

- 个人 Swagger 地址不得提交到 `package.json`、`.env` 或业务代码。
- 生成路径匹配不到 API 时必须失败。
- 不为了绕过 Swagger 同步新增页面级 `request(...)`。
- 不覆盖用户已有修改；生成前后都检查工作树和目标文件 diff。
- 不自动提交或推送。
