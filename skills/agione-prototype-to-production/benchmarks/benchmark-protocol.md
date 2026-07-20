# Skill 回归 Benchmark 协议

本流程是**半自动**的：固定 prompt 和检查项由仓库提供，但仍需要一个独立 Agent 接收原型/目标仓库完成任务，再由评审者核对原始代码、截图、日志和报告。不要把 prompt 存在误写成“已自动测试”。

## 执行

1. 为每个 case 准备一份匹配页型的定稿 HTML 原型和隔离的 project-mamba 工作副本。
2. 给执行 Agent 只提供对应 prompt、原型、任务范围和 skill，不泄露预期 finding。
3. 保存实现 diff、构建日志、fidelity JSON/PNG、运行态证据和最终报告。
4. 评审 `manifest.json` 中该 case 的 assertions，并把结果写成：

```json
{
  "schemaVersion": 1,
  "cases": [
    {
      "id": "01-crud-list",
      "status": "PASS",
      "findings": [],
      "evidence": ["artifacts/01/git.diff", "artifacts/01/fidelity-report.json"]
    }
  ]
}
```

5. 首个可信完整结果作为 baseline；后续用 `node compare-benchmark-results.mjs baseline.json current.json` 检查新增 finding、状态退化和缺失 case。

`PASS` 必须有非空 evidence。执行 Agent 的自述不能替代原始证据。尚未运行的 case 写 `NOT_RUN`，不得填 PASS。
结果状态只允许 `PASS`、`FAIL`、`NOT_RUN`；`FAIL` 必须至少包含一个带唯一 `id` 的 finding。重复 case/finding ID、空 evidence 或未知状态会被当作结果格式错误并以退出码 2 拒绝。
