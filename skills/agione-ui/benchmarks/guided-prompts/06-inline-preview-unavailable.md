# Guided Benchmark 06 · Inline Preview Unavailable

## User prompt

当前 Agent 没有 conversation-native inline visual 能力。使用 `agione-ui` guided strict 设计一个结算批次列表页。

## Expected behavior

- 不因为缺少 inline visual 而退化成一次性生成。
- 在操作系统临时目录生成最小可比较的 strict snippets，并通过可用浏览器或截图面展示。
- 候选只帮助决策，不替代最终真实 target 渲染。
- 用户选择后删除 scratch 候选。
- 不在项目目录写候选、截图、design-lock 或比较页。

## Final acceptance

- 只保留一个最终目标 HTML。
- 最终目标仍通过 strict evaluator。
