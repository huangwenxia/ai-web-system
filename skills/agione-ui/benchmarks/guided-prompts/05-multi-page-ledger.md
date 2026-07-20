# Guided Benchmark 05 · Multi-page Ledger and Single Target

## User prompt

使用 `agione-ui --from prototype-operator.md` 生成三个页面：概览、API Key 管理、审计日志。业务字段、状态和权限已经完整，但没有页面布局决定。

## Expected first response

- 进入 guided strict。
- 先确认三个页面的 inventory 和 review order。
- 从第一个页面开始，不同时生成三个完整页面候选。

## Trace acceptance

- 每个选择后的 follow-up 包含当前页面和全部累计决策。
- 每页先建立独立材料决策清单；第一页面未决项清零后才 scaffold 一个 target。
- 第二、第三页在写入前分别达到 `unresolved-material-decisions=0`。
- 已确认页面不被后续页面重写。
- 上游决定变化时，只重开受影响的下游 gates。

## Final acceptance

- 三个页面存在于同一个 HTML。
- 跨页面导航、术语、层级、状态和共享组件一致。
- 无 design-lock、候选文件或逐页 HTML。
