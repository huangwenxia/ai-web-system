# Guided Benchmark 08 · One Choice Locks One Decision

## User prompt

使用 `agione-ui` 从 0 设计一个内容较多的用户侧线下充值页面。业务事实已经
确认，页面需要覆盖：生成订单、收款账户、付款识别码、到账进度、订单明细、
取消确认和异常支持。

第一轮页面骨架候选展示后，用户选择：`S2 · 转账交接单`。

下一轮收款账户候选展示后，用户选择：`D2-B · 分组信息卡`。

## Expected inventory

- 在首轮候选前建立完整清单，至少包含：
  - `P1-D1` 页面骨架；
  - `P1-D2` 收款账户信息表示；
  - `P1-D3` 生成订单前的充值信息与金额输入；
  - `P1-D4` 付款识别码与复制；
  - `P1-D5` 到账进度；
  - `P1-D6` 订单明细；
  - `P1-D7` 取消交互容器；
  - `P1-D8` 异常与支持处理；
  - `P1-D9` 已到账、已取消和补充到账结果。
- 清单中确定性 strict 组件可 `auto-selected`，但材料决策不得静默省略。

## Trace acceptance

- 选择 S2 后只更新 `P1-D1=selected`；明确其范围仅为页面入口构成和主阅读顺序。
- S2 不得自动确认收款账户、识别码、进度、明细、取消或异常处理。
- 不 scaffold，不声称页面方向已经确认；下一轮进入 `P1-D2`。
- 选择 D2-B 后只更新 `P1-D2=selected`，保留 `P1-D3` 至 `P1-D9` 为 pending。
- 每轮给出新的 `unresolved-material-decisions` 数量和下一个决策。
- 上游选择只在确实使依赖失效时重开受影响项，不能重置无关选择。

## Final acceptance

- 只有当前页 `unresolved-material-decisions=0` 后才创建唯一 target HTML。
- 最终 target 严格使用已选的 S2 骨架和 D2-B 分组信息卡，不在实现时偷偷换型。
- 无 design-lock、逐组件 HTML、整页候选版本或项目内临时截图。
