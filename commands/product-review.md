# product-review

用于直接触发 A-0“产品级审查与持续优化”主工作流。

## 适合什么时候用
- 需要抠页面、组件或链路细节。
- 需要判断一个页面为什么乱、为什么不丝滑、为什么不好用。
- 需要对既有页面做结构 / 视觉 / UX 的综合质量复核。

## 不适合什么时候用
- 任务主要是新增开发，还没完成结构或实现。
- 任务主要是 bug 修复，根因还没修完。
- 任务主要是纯翻译、术语统一或 i18n 改造。

## 执行前先读
- `rules/00-global-task-scope.mdc`
- `standards/01-视觉标准`
- `standards/02-布局标准`
- 必要时读取 `standards/04-组件标准`

## 执行要求
1. 先判断当前更偏 `structure_review`、`visual_review`、`ux_review` 还是 `mixed_review`。
2. 先识别页面主任务和核心用户目标，不脱离业务只看样式。
3. 汇总结构、视觉、体验和实现问题，按严重度排序。
4. 输出可执行修正方向，并区分立即修、后续优化和观察项。
5. 只有用户允许直接改代码时，才继续进入实现修正流。

## 交接规则
- 任务主要是新增开发 -> 转 `existing-project-feature`
- 任务主要是 bug 修复或代码优化 -> 转 `existing-project-fix`
- 用户要求直接落代码修正 -> 转 `frontend-implementer`

不要在这个 command 文件里重写完整主 workflow 协议。
更完整的执行细则由 `product-review-skill` 承担。
