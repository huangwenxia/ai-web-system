# 实现与改造检查清单

本文件补充 `frontend-implementer-skill` 在实现、修复和重构阶段的检查项。

## 接收参数检查
- 是否明确目标文件、目标页面或目标模块
- 是否明确任务类型：实现 / bug 修复 / 重构 / 文档补全
- 是否已有复现步骤、报错信息、设计输入或已确认原型
- 是否已识别需要遵循的项目约束和 ai-web-system 反馈机制

## 任务分类检查
- 当前任务是实现、bug 修复、重构，还是文档补全
- 输入前提是否足够支撑直接落代码
- 如果是新功能开发，是否已经有已确认原型；没有则是否回退到 `existing-project-feature-skill` 或 `agione-ui`

## 上下文定位检查
- 是否已查到目标组件 / 页面 / composable / util / constant / type 的来源
- 是否已查到关键调用方、被引用方或路由入口
- 如果命中 `project-mamba`，是否已先读取当前 app 的 `vite.config.ts` 与 `src/main.ts`
- 如果命中 `project-mamba`，是否已判定 app 拓扑与当前页面的 route ownership
- 如果修改公共层，是否已判断兼容性影响

## 实现检查
- 是否优先复用现有组件、模式和目录结构
- 页面容器逻辑、区块逻辑和子组件逻辑是否分离
- 数据映射是否符合页面结构和业务语义
- 是否存在 `watch` 维护派生状态、模板逻辑过重、props/emits 边界不清的问题
- 是否遵守页面层决策容器、子组件只负责内容的原则
- 如果存在“规格碎片 / 轻量字段碎片 / 非标签型局部 badge”这类展示，是否先判定其语义，而不是直接套 tag / badge 组件；语义口径见 `docs/semantic-display-patterns.md`
- 如果涉及 Element Plus 浮层（dropdown / popover / tooltip / select 等），是否优先在组件内部配合 `popper-class` 处理浮层壳层和交互，而不是先用页面外层覆盖修补
- 是否先区分当前样式问题属于项目语义层（`--ui-*`）还是 Element Plus 原生 anatomy / 状态层（`--el-*`），并在正确 token 层修改，而不是把两套 token 混用成视觉补丁
- 如果当前任务已有明确原型，是否先核对实现结果与原型在布局、间距、边框、圆角、hover/focus 背景、字体颜色等可观察细节上的一致性，再判断是否需要主题兼容修正
- 如果交互视觉看起来不对，是否先区分语义层（type / intent）、状态层（disabled / loading / reason）和渲染层（button / menu / popper 样式），而不是直接跨层改配置

## 边界状态检查
- 加载态
- 空态
- 错误态
- 权限态
- 禁用态

## 风险检查
- 修改范围是否过大
- 是否触达共享组件或公共函数
- 是否需要叠加独立 `page-review-skill`

## 输出前检查
- 是否说明了风险与最小验证建议
- 是否判断了是否值得回写
- 是否明确区分回写层级：`skills/` / `rules/` / Claude memory / 当前任务结论
