# existing-project-feature

用于直接触发 A-1“既有项目中新功能模块页面 / 组件开发”主工作流。

## 适合什么时候用
- 既有项目里要新增页面、模块、区块或组件。
- 已有设计稿、原型稿、HTML 原型或已确认页面，需要基于项目规范和 `project-mamba` 快速落代码。
- 当前还没有原型，但明确要先通过 `agione-ui-skill` 生成并确认原型，再进入实施。

## 不适合什么时候用
- 任务主要是 bug 修复、代码优化或回归修补。
- 任务主要是独立产品级审查或抠细节。
- 任务主要是纯翻译、术语统一或 i18n 改造。

## 执行前先读
- `rules/00-global-task-scope.mdc`
- `rules/10-existing-frontend-dev.mdc`
- `standards/01-视觉标准`
- `standards/02-布局标准`
- `standards/03-数据映射标准`
- `standards/04-组件标准`

## 执行要求
1. 先判断当前是否已经有已确认原型。
2. 如果没有原型，不直接实施，先转到 `agione-ui-skill` 生成并确认原型。
3. 先定位现有项目上下文、目录结构、复用组件和 `project-mamba` 复用机会。
4. 如果已有原型或设计稿，只做必要校验和边界补齐，不擅自改动已确认主方向。
5. 最终输出实施决策、实现结果和验证建议组成的闭环结果。

## 交接规则
- 还没有原型 -> 转 `agione-ui-skill`
- 发现任务其实是 bug 修复 / 代码优化 -> 转 `existing-project-fix`
- 发现任务其实是独立产品级审查 -> 转 `page-review`
- 发现任务主要是翻译或 i18n -> 转 `translate-terms`

不要在这个 command 文件里重写完整主 workflow 协议。
更完整的执行细则由 `existing-project-feature-skill` 承担。
