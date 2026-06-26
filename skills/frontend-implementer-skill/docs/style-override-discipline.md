# Style Override Discipline

当外层组件需要影响嵌套子组件、第三方组件或浮层样式时，先建立 CSS 作用链，再决定改法。禁止在未定位样式来源、作用域和优先级前，通过加 class、加层级、加 `!important` 或反复覆盖来碰运气。

## 触发场景

遇到以下任一情况时，先按本文执行：

- 父组件、页面或业务容器要修改子组件内部样式。
- 需要覆盖 Element Plus、easybill-ui 或其他第三方组件内部结构。
- 涉及 Vue scoped style 的 `:deep()` / `::v-deep`、历史 `:global(...)`、CSS Modules、Shadow DOM 或样式隔离边界。
- 涉及 `el-dropdown`、`el-popover`、`el-tooltip`、`el-select`、`FormDialog.show` 等 Teleport / Popper / overlay 容器。
- 视觉结果与预期不一致，需要用 DevTools matched rules、DOM class/state 或 `getComputedStyle` 判断真实生效样式。

## 先定位作用链

修改前先确认以下事实：

1. 确认目标元素
   - 找到真实 DOM 节点、组件层级、运行时 class、属性、状态 class、伪类状态和 data-v scoped 属性。
   - 区分目标元素本体、子节点、伪元素、Teleport 到 `body` 下的浮层节点。

2. 确认样式来源
   - 判断样式来自子组件自身、父组件、全局样式、项目 shared/common、UI 库默认样式、主题 token、CSS variable、运行时 class、浏览器默认样式还是内联 style。
   - 对 Element Plus / Popper 浮层，必须确认浮层 DOM 实际挂载位置和 `popper-class` / wrapper class 是否传入目标节点。

3. 确认生效机制
   - 检查 cascade、specificity、source order、inheritance、`!important`、CSS variable fallback、cascade layers、media/container query、暗黑模式选择器和 scoped 编译后的选择器。
   - 不把“选择器写在父组件里”默认等同于“能影响子组件”；先确认 scoped 边界和 DOM 挂载位置。

4. 验证最终计算结果
   - 优先用 DevTools matched rules 看每条候选声明是否命中、被谁覆盖、为什么被覆盖。
   - 必要时用 `window.getComputedStyle(el)` 验证最终值；对 CSS variables 同时检查变量定义点和最终展开值。
   - 若终端或浏览器输出疑似编码异常，按 `terminal-output-encoding-guardrail.md` 先验证磁盘事实，不做基于控制台渲染的修复。

## 决策顺序

按以下顺序选择改法：

1. 优先使用子组件或 UI 库已暴露的正式接口：props、class API、style API、CSS variables、theme token、slot、`popper-class`、`FormDialog.show` 选项或项目封装参数。
2. 如果样式表达的是子组件可复用能力，优先补充子组件 API、token 或内部实现，不从父层硬改私有 DOM。
3. 如果样式只属于当前业务场景，使用当前组件局部 wrapper class 或局部 scoped 样式，选择器必须短、稳定、可解释。
4. 如果多个页面都需要同一规则，先找 shared/common 是否已有 token、utility 或组件能力；没有时提出共享入口或 token 收敛方案。
5. 只有在确认目标 DOM 稳定、作用域最小且没有正式扩展点时，才允许父层通过受限选择器影响子组件。

## 禁止行为

- 未看 matched rules / computed style 就继续叠加覆盖。
- 用 `!important`、更长选择器、更多父级 class 作为默认修复手段。
- 用 `:global(...)` / `:global (...)` 逃逸 scoped 边界。
- 为局部页面效果覆盖 `.el-dialog`、`.el-dialog__body`、`.el-form-item`、popper shell 或页面外层容器等全局/第三方内部类。
- 从父组件依赖子组件私有 DOM 深层结构；如果必须使用 `:deep()`，必须能说明目标节点稳定、影响范围和替代方案为何不可用。
- 只凭视觉猜测或控制台渲染文本判断样式来源。
- 为了修视觉表现改变动作语义，例如把 `type`、`disabled`、`loading`、业务状态当成样式开关。

## 允许的局部覆盖

局部覆盖必须同时满足：

- 有明确的业务归属和组件归属。
- 选择器限制在当前组件 wrapper、当前浮层 `popper-class` 或已公开的子组件根 class 内。
- 不污染 sibling 页面、其他 app、shared/common 或 UI 库全局实例。
- 覆盖声明数量少，能解释每条声明的来源冲突和目标效果。
- 修改后能通过 DOM / matched rules / `getComputedStyle` 或浏览器截图验证。

推荐形态：

```vue
<ChildPanel class="order-detail-panel" />
```

```scss
.order-detail-panel {
  --panel-title-color: var(--ui-text-primary);
}
```

或者在子组件已公开结构时：

```scss
.order-detail-panel :deep(.child-panel__title) {
  color: var(--ui-text-primary);
}
```

使用第二种前必须确认 `.child-panel__title` 是稳定的公开结构或项目可控结构；第三方库内部类默认不视为公开结构。

## 交付说明

样式覆盖属于非平凡改动时，最终说明或检查表中要包含：

- 根因：原样式来自哪里，为什么当前值生效。
- 改法：为什么在这一层修改，而不是改 token、子组件 API 或 shared/common。
- 范围：影响哪些组件、浮层或页面，为什么不会外溢。
- 验证：使用了 matched rules、`getComputedStyle`、浏览器检查、截图或静态证据中的哪一种。
