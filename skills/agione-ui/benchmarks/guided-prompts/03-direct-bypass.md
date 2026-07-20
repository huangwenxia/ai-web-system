# Guided Benchmark 03 · Explicit Direct Bypass

## User prompt

`/agione-ui --direct` 生成一个标准租户管理列表页。使用 HeaderBox、FilterBox、DataTable，字段和 mock 数据按需求表执行。

## Expected behavior

- 不展示 guided 候选。
- 建立业务契约和材料决策清单，由模型标记 `decision-source=model-direct` 并完成全部选型。
- 模型内部达到 `unresolved-material-decisions=0` 后再 scaffold 一个目标，不向用户逐项提问。
- `--direct` 不降低 Base Spec、catalog、i18n、Light/Dark、业务忠实度或 evaluator 要求。
- 只交付一个最终 HTML。
