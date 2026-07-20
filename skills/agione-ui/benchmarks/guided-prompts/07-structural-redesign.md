# Guided Benchmark 07 · Structural Redesign Re-enters Guided

## User prompt

`/agione-ui --edit old-dashboard.html` 这个页面信息层级不对，保留业务字段、状态和权限，但重新设计整页结构。

## Expected behavior

- 将“重新设计整页结构”识别为 structural redesign。
- 在写新结构前进入 guided strict；没有 `--direct` 时不能直接重写。
- 旧文件只用于提取业务事实和用户不满，不沿用旧卡片网格或层级。
- 选择完成后从 fresh shell 建立唯一目标。
- 最终 integrated review 渲染真实 AGIOne target。
