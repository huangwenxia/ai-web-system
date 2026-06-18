# Token And Style Policy

本文件承接 `frontend-implementer-skill` 中样式、token、Tailwind、Element Plus 与 AGIOne 的细则。只在任务涉及可见 UI、样式边界、主题兼容或组件封装时读取。

## Token 分层
- 项目语义、自定义壳层、页面结构和业务容器优先使用 `--ui-*`。
- Element Plus 原生组件的 anatomy、fill、placeholder、disabled、overlay、border 和原生状态优先使用 `--el-*` 或既有 Element Plus 行为。
- 不用 `--ui-*` 重建 Element Plus 原生 anatomy，也不用 `--el-*` 替代项目级页面语义 token。
- 目标 app 的 token 文件必须从 `src/main.ts`、本地 `assets/scss/*` 和实际 import 链确认；不要假设某个固定 `vars.scss` 路径存在。

## Tailwind 与 scoped 样式
- 布局、间距、尺寸、对齐、普通排版优先 Tailwind utility class；布局结构默认使用 flex。
- `flex`、`flex-wrap`、`gap-*`、`min-w-0`、`items-center`、`justify-between` 等普通 flex 布局能力优先写在 template class 里，不为它们新增自定义 CSS class。
- 响应式布局优先由内容驱动换行：用 flex 的自然换行和收缩能力解决，例如 `flex-wrap`、`flex-basis`、`min-w-0`、`min-w-*`、`max-w-*`、`gap-*`、`ml-auto` 和可换行文本；断点只用于布局语义确实需要变化的少数场景，不用多个相近 viewport 断点强行控制换行。
- 高度受限的 flex column 里，标题 / 摘要 / 工具条 / tabs / 底部操作等稳定高度区域必须用 `shrink-0` / `flex-shrink: 0` 保住自身高度；可滚动内容区再用 `flex-1 min-h-0` 承接剩余空间。
- 固定宽度只用于操作区、图标按钮组、操作列等动作区域；业务文本、标题、描述、状态说明和数据内容区优先 `min-w-0 flex-1` + 换行 / 省略，不用固定宽度硬控排版。
- 禁止新增 CSS Grid 布局：不要使用 Tailwind `grid`、`inline-grid`、`grid-cols-*`、`grid-rows-*`、`col-span-*`、`row-span-*`、`grid-flow-*` 等 grid utility，也不要使用 CSS `display: grid`、`grid-template-*`、`grid-auto-*`、`grid-column`、`grid-row` 等属性。
- 复杂选择器、container query、伪类 / 伪元素、第三方组件深层覆盖、浮层壳层、主题状态和复杂响应式断点，使用 scoped SCSS 或项目既有样式入口；但 scoped SCSS 里也不能新增 CSS Grid 布局。
- `<style>` 必须 `scoped`。如果 scoped 样式只是普通布局、间距、尺寸、圆角或排版声明，优先改为 Tailwind utility；保留 scoped 样式时，应该是因为深层覆盖、伪类 / 伪元素、媒体 / container query、动画或难以表达的主题状态。
- 严禁在组件或页面 `<style scoped>` 中使用 `:global(...)` / `:global (...)` 逃逸 scoped 边界，也不得用它覆盖 `.el-dialog`、`.el-dialog__body`、`.el-form-item` 等 Element Plus 内部类或页面外层壳层；这类写法会造成全局样式污染，必须改为组件局部类、组件 props / wrapper class、`popper-class`、`FormDialog.show` 参数或经批准的共享样式入口。
- 响应式结构应优先按自身容器宽度稳定自适应；不要只依赖 viewport `@media` 在页面 viewport 不变、内容区变窄时切换 row / card / toolbar 结构，也不要用人为断点替代内容驱动换行。
- 新增或改造页面 / 组件不得通过 `<style src>`、`import './*.scss'`、`@import`、`@use` 等方式外部引用样式；组件私有样式必须留在当前 `.vue` 的 `<style scoped>` 内。
- 禁止为了单页面效果把布局职责转回一批自定义 CSS class。
- 无理由禁止新增裸十六进制颜色、魔法间距、魔法高度。

## Element Plus 与原生 HTML
- 功能型交互优先项目已有封装、Element Plus 和 `easybill-ui`。
- 原生 HTML 只用于纯结构 / 布局语义容器，或现有组件体系确实没有对应能力的小范围结构。
- 页面或组件自身需要滚动容器时，必须使用 `el-scrollbar`；不要用原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll`、`::-webkit-scrollbar`、`scrollbar-width/color`、`scrollbar-*` / `no-scrollbar` 类自行实现或美化 scrollbar。
- 如果已有 Element Plus / 项目表格、列表、卡片容器内建滚动能力，优先使用其内建 props 或封装能力，不再额外套原生滚动容器。
- 带 `el-dropdown`、`el-popover`、`el-tooltip`、`el-select` 等 popper 浮层时，优先在组件内部通过 `popper-class` 和组件自身样式接管浮层壳层、宽度、圆角、边框、阴影和菜单项交互。
- 不优先依赖页面外层覆盖修补 Element Plus 浮层样式。

## 交互语义分层
- 先区分动作语义、可用状态和视觉实现。
- 主操作、危险操作等语义一旦成立，应保持语义稳定。
- 当前不可操作通过 `disabled`、`loading`、禁用原因和对应样式表达，不把 `primary` / `danger` 临时改成 `default` 来回避视觉问题。

## AGIOne 约束在已有项目中的边界
- 只有用户明确要求“整体扫一遍 / 优化整个项目 / 做 AGIOne 规范治理”时，才执行全项目扫描治理。
- 普通新增功能、bug 修复或局部改造，只在当前改动范围和直接依赖组件内遵循 AGIOne 视觉底线。
- 若 `common` 已有 token、组件、utility 或全局样式，优先复用 common 标准。
- 若 `common` 不存在对应能力，且需求只服务当前 app，优先 app-local soft override 或 app-local 组件，不为单项目效果污染共享层。
- 只有同一语义展示模式或样式能力明确跨项目复用，且命名、状态、主题适配边界稳定时，才考虑上提到 `common`。

## 组件新增判定
- 当现有组件组合无法达到目标效果，或虽然能实现但会导致代码明显混乱、冗余、可读性差时，允许新增组件。
- 页面私有放页面局部 `components/`；模块复用放模块级目录；app 级复用放当前 app 的 `src/components/` 或既有 app-local 公共目录。
- 跨 app 稳定复用才考虑 `apps/common` 或 `@repo`。
