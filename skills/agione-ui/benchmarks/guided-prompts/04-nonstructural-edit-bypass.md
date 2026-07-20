# Guided Benchmark 04 · Non-structural Edit Stays Direct

## User prompt

`/agione-ui --edit provider-list.html` 将主操作按钮“新增 Provider”改成“创建 Provider”，同步中英文，不改布局、字段、状态或交互。

## Expected behavior

- 走 direct incremental edit，不进入 guided review。
- 只读取必要锚点和小窗口。
- 保留页面结构、mock 数据、其他文案、Logo 和 chrome。
- 修改同一个指定目标，不创建版本文件。
- 重跑完整 evaluator。
