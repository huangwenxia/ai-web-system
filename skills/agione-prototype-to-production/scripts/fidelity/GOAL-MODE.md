# Goal Mode：逐状态复刻原型

目标：只修改任务允许的生产实现，使所有 required states 的结构和可控样式与原型一致，同时保留真实 API、真实数据和当前项目规范。

Comparator 提供机械证据，不提供自动视觉批准：

- `sidebyside.png`：未遮罩真实页面，必须打开目检。
- `diff.png`：动态像素对称 mask 后的定位图。
- `fidelity-report.md/json`：required probe、元素数量、完整样式/SVG 差异、准备错误。

## 一次性准备

```bash
cd tools/fidelity
pnpm install --frozen-lockfile
npx playwright install chromium
cp targets.example.json targets.json
node capture-auth.mjs
```

按 `references/target-config.md` 把 URL、角色、auth、真实 storage key、states、mask 和 probes 配完整。先手动打开两侧 URL，确认原型与实现都在正确页面、语言和主题。

## 迭代循环

1. 测量单页：`node compare.mjs <page>`。
2. 先处理 `ERROR`：auth、最终 URL、waitFor、loading、状态或 selector 不正确时禁止调 CSS。
3. 打开未遮罩 side-by-side，列出缺失、多余、错序和明显视觉偏差。
4. 读取 probe delta，用原型实测值修实现；共享组件默认值不构成豁免。
5. 检查被 mask 区域的真实列、图表结构、空态和交互。
6. 只修一组可解释差异，复跑 `node compare.mjs <page> --gate`。
7. 机械结果变成 `REVIEW_REQUIRED` 后，完成未遮罩目检和对应运行态检查。

连续两轮没有改善时停止修改，把残差写入单独的 `report/accepted-residuals.md`，说明：位置、证据、分类、为什么不可控或为什么业务规范优先。不要把说明追加到会被下一轮覆盖的生成报告。

## 机械状态

- `ERROR`：环境或准备失败，退出码 2。
- `MECHANICAL_FAIL`：required probe、元素数量、字段、结构高度或显式 gate 未通过；`--gate` 退出码 1。
- `REVIEW_REQUIRED`：已配置机械信号清零；仍需未遮罩目检、状态矩阵和 Gate C，不能直接称为 PASS。

## 逐帧停止条件

对每个 required state：

- required probes 全命中、重复元素数量一致、无未接受字段差异。
- full-page/目标容器结构一致。
- 未遮罩 side-by-side 无未解释差异。
- mask 区域已独立验证。
- hover/focus/active/disabled/loading/empty/弹窗等适用状态已验证。
- 动效存在时已核对关键帧、时长、缓动、方向和最终位置；只测静态图时明确写 NOT TESTED。

`mismatch%` 只用于定位。真实值、已证明的业务语义差异、不可控抗锯齿或不同渲染器内部像素可以记录为 residual；任何可控样式差异都必须修。

## 硬规则

- 修改范围来自当前任务，不在 runbook 写死某个 app。
- 目标仓库 `AGENTS.md`、repo-local skills、真实 API/types 和组件源码优先于历史案例。
- 只改生产实现；不改原型、全局 token、依赖、lockfile 或无关页面来改善比较结果。
- 不 mock、不删真实字段、不扩大 mask、不删除 probe 来过 Gate。
- 图标包、单位、locale alias 和验证命令每次从目标仓库重新确认。
- 机械闭环后使用 `agione-page-check` 验证角色、backend/shost、权限、网络、工作流、极端数据和四态；未完成时只能报告“视觉实现完成”。
