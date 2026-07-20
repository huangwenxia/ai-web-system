# Guided Benchmark 02 · Locked Decisions Do Not Create Fake Choices

## User prompt

使用 `agione-ui --from prototype-provider.md` 生成 Provider 列表页。说明文档已经锁定：

- StandardListPage。
- HeaderBox + FilterBox + DataTable。
- FilterBox 只放名称和状态。
- TableActions 固定为两个行内操作加更多菜单。
- 创建使用 520px Modal。
- 成功态使用一次性密钥复制保护。

## Expected behavior

- 识别相关 UI 决策已经锁定，走 direct strict。
- 不重新询问页面骨架、筛选密度、行操作或 Modal/Drawer。
- 不生成候选预览或 design-lock。
- 只创建一个目标 HTML 并运行最终验证。

## Failure examples

- 为 HeaderBox 与私有标题卡制造选择。
- 为 DataTable 与原生 el-table 制造选择。
- 因未写 `--direct` 而无视文档中已经锁定的 UI 决策。
