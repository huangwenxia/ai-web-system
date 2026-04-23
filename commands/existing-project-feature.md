# existing-project-feature

用于直接触发 A-1“既有项目中新功能模块页面 / 组件开发”主工作流。

## 适合什么时候用
- 既有项目里要新增页面、模块、区块或组件。
- 只有接口和业务说明，需要先补齐业务、结构、边界和视觉承接。
- 已有设计稿 / 已确认页面，需要基于项目规范和 `project-mamba` 快速落代码。

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
1. 先判断当前属于 `api_to_page` 还是 `design_to_code`。
2. 先定位现有项目上下文、目录结构、复用组件和 `project-mamba` 复用机会。
3. 如果只有接口，先补齐业务目标、页面骨架、字段映射和边界状态，再进入实现。
4. 如果已有设计稿，只做必要校验和边界补齐，不擅自改动已确认主方向。
5. 最终输出结构、设计、实现和验证建议组成的闭环结果。

## 交接规则
- 发现任务其实是 bug 修复 / 代码优化 -> 转 `existing-project-fix`
- 发现任务其实是独立产品级审查 -> 转 `product-review`
- 发现任务主要是翻译或 i18n -> 转 `translate-terms`

不要在这个 command 文件里重写完整主 workflow 协议。
更完整的执行细则由 `existing-project-feature-skill` 承担。
