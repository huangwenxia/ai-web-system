# UI Craft Gates

This document is the source-of-truth for detailed UI craft checks. Keep global user rules short and point here instead of copying these gates into `rules/user-rule.md`.

Use this document before delivering UI prototypes, visual reviews, and visible frontend implementation. Apply both gates as a final visible-result check; automated validators, DOM correctness, token compliance, and component completeness do not replace it.

## Universal Craft Invariant Gate · 通用 UI 精致度不变量

所有 UI 交付、原型设计、页面实现和视觉审查，无论触发哪个具体 skill，都必须按“不变量”审查，而不是按组件名审查。页面布局、业务内容、组件形态可以变化，但精致 UI 的底层要求相通。

当用户指出某一个局部粗糙时，禁止只为该局部补一条组件规则。必须先抽象出它违反的通用不变量，并用该不变量反查整个页面中所有相似问题。

### 0. 禁止以实现正确代替视觉正确

以下都不能作为通过理由：

- DOM 结构合理。
- 语义表达完整。
- token 使用正确。
- type class 使用正确。
- flex / grid / align-items 写了。
- 组件状态齐全。
- 整体信息架构成立。

这些只说明“实现没有乱”，不说明“视觉精致”。最终判断必须以可见结果为准：截图上是否像成熟产品，而不是像临时拼接的原型。

### 1. Visual Unit Integrity · 视觉单元完整性

任何一组内容都必须形成明确视觉单元。

检查：

- 用户能否一眼看出哪些元素属于同一组。
- 组内元素是否通过对齐、间距、边界、背景、字号、颜色形成关系。
- 是否只是几个元素排在一起，但没有整体感。
- 是否像临时拼接、脚注、表格字段、散装说明。

失败表现：

- 元素各自成立，但放在一起松散。
- 文字、图标、状态、按钮没有归属关系。
- 局部像“摆上去了”，不像“设计完成了”。

### 2. Optical Alignment · 光学对齐

所有对齐必须按视觉观感判断，而不是按 CSS 盒模型判断。

检查：

- 文字可见黑区是否处在容器视觉中心。
- 图标和文字是否在同一视觉中线。
- 多段文字放在同一行、同一容器、同一视觉单元中时，是否有上浮或下沉。
- 中文、英文、数字、符号混排时，视觉中心是否稳定。
- baseline / center / cap-height 是否看起来协调。

失败表现：

- CSS 写了居中，但肉眼看偏上、偏下、贴边、漂浮。
- 同一行元素看似对齐，实际字面黑区不在一条视觉线上。
- 图标、文字、数字、tag 各自有不同的垂直节奏。

### 3. Typography Compatibility · 字体盒模型兼容性

同一视觉单元内的文字必须在字号、行高、字重、字面高度上兼容。

检查：

- 同一局部内是否混用了不兼容的 text class。
- 小字号文字是否被过大的 line-height 撑出漂浮感。
- 数字、中文、英文是否因为字体 metrics 不同导致视觉错位。
- 字重差是否服务层级，而不是造成粗糙。
- 文字是否像被硬塞进容器。

失败表现：

- 字体 class 都合规，但组合后不精细。
- 两段文字逻辑上同组，视觉上却不同高。
- 文字在容器中上下留白不均。

### 4. Proportion Contract · 比例契约

组件高度、文字大小、图标尺寸、圆角、内边距必须成比例。

检查：

- 容器是否过高或过矮。
- 圆角是否与高度匹配。
- 图标是否比文字重。
- 内边距是否让内容显得松、挤、漂、胖、薄。
- 状态、按钮、输入、卡片等局部是否有成熟产品的比例感。

失败表现：

- 小字配大胶囊。
- 大圆角配窄内容。
- 图标压过文字。
- 边框和文字距离不舒服。
- 看起来像默认样式或临时样式。

### 5. Relational Spacing · 关系间距

间距必须表达信息关系，而不是平均分布。

检查：

- 同组元素是否更近，跨组元素是否更远。
- 上下间距是否符合阅读顺序。
- 横向间距是否让用户理解归属。
- 局部留白是否支撑内容，而不是制造空洞。
- 页面是否因为平均排布像表格、PPT 或占位稿。

失败表现：

- 每个元素都很规整，但整体没有关系。
- 该聚的没聚，该分的没分。
- 内容像被均匀撒开。

### 6. Surface Responsibility · 表面职责

背景、边框、阴影、色块必须有明确职责。

检查：

- 这层背景是在表达分组、状态、当前项、可操作，还是只是装饰。
- 这条边框是否帮助理解关系。
- 阴影是否服务层级，而不是制造“卡片感”。
- 删除某个表面后，信息关系是否仍然成立。

失败表现：

- 为了设计感加框、加灰底、加色块。
- 表面比内容更显眼。
- 多层边界重复表达同一个关系。
- 看起来“规范”，但不高级。

### 7. State Craft · 状态表达精致度

状态必须清楚、克制、精细。

检查：

- 状态是否帮助用户判断当前情况。
- 状态视觉重量是否符合重要性。
- 状态元素是否有稳定高度、对齐、留白、颜色层级。
- 状态是否像成熟组件的一部分，而不是贴上去的标签。

失败表现：

- 状态只是普通文字。
- 状态变成粗糙色块。
- 状态抢过主信息。
- 状态和主体内容没有形成整体。

### 8. Finished-Product Test · 成品感测试

交付前必须把页面拆成多个局部，逐块问：

- 这个局部像成熟 SaaS 产品里的成品组件吗？
- 它是否有完整感，而不是拼接感？
- 文字、图标、状态、边框、背景是否光学协调？
- 放大看是否仍然精细？
- 是否存在“逻辑对了，但视觉没做完”的地方？

只要任一局部有粗糙感，就不能交付。

### 9. Defect Generalization Rule · 缺陷泛化规则

当用户指出一个具体问题时，必须执行：

1. 识别它违反的通用不变量。
2. 不要只修该元素。
3. 用同一个不变量扫描当前页面所有局部。
4. 输出或修复同类问题。
5. 如果只能写出“某组件怎么改”，说明抽象失败，必须重新上提到通用 craft 规则。

### 总原则

UI 细节不是组件规则的集合，而是视觉不变量的集合。布局会变，内容会变，组件会变，但以下标准不变：

- 视觉单元完整。
- 光学对齐准确。
- 字体盒模型兼容。
- 比例成熟。
- 间距表达关系。
- 表面有职责。
- 状态表达精细。
- 没有临时拼接感。

## Universal UI Micro-Craft Gate

Before delivering any UI, inspect every visible micro-element, including text, icon, badge, tag, chip, button, field, tab, step label, status marker, table cell, card header, form label, and inline hint.

Core rule:
Design-system compliance is only the baseline. A UI element passes only when its semantic role, attention level, visual carrier, geometry, typography, and optical alignment match the current context.

### 1. Role First

For each visible element, first name its role:

- Primary action
- Secondary action
- Current item
- State
- Result
- Object label
- Field value
- Helper text
- Navigation item
- Grouping marker
- Decoration

If the role is unclear, remove or rewrite it.
If the role is clear, choose visual strength based on that role.

### 2. Attention Strength Ladder

Do not decide only “show / hide” or “tag / no tag”.
Choose the smallest visual strength that still communicates the role.

Use this ladder:

- Level 0: remove
- Level 1: plain muted text
- Level 2: colored text, small dot, or subtle icon
- Level 3: soft tag / quiet chip with light background or light border
- Level 4: strong badge with filled background
- Level 5: button / primary action / dominant block

The chosen level must match the semantic importance.

Examples of failure:
- A secondary status uses Level 4 visual treatment.
- A current item uses only Level 1 and loses recognition.
- A label looks like a button.
- A state marker attracts more attention than the actual next action.

### 3. Visual Carrier Budget

Every emphasis is a cost. Count all carriers used by an element:

- color
- background
- border
- radius
- padding
- font weight
- icon
- dot
- shadow
- size
- motion

For secondary elements, use only 1-2 carriers.
For current / active elements, usually use 2-3 carriers.
For primary actions, stronger treatment is allowed.

If color + background + border + bold + icon + large padding appear together on a non-primary element, fail.

### 4. Shape And Geometry Fit

Shape must match role and size.

Check:
- height
- padding
- radius
- border strength
- text length
- icon/dot size
- gap with neighboring text

Failure conditions:
- A small tag looks like a button.
- A chip looks like an oval sticker.
- A rectangular tag feels too hard or default.
- Padding makes the element inflated.
- Radius makes the element childish or cheap.
- Shape is more noticeable than the information.

Repair by tuning shape intensity before changing the whole design:
text-only → colored text/dot → soft tag → strong badge.

### 5. Optical Alignment

CSS centering is not enough. Judge by eye.

Check:
- text optical center inside its container
- Chinese glyph visual center
- baseline relation with nearby text
- icon/dot center relative to text
- tag height relative to line height
- vertical position after font rendering

If the element looks 0.5-1px high/low, fail.
Fix with height, line-height, padding, transform, or a different type class.

### 6. Typography Fit

Typography must match role, not convenience.

Check:
- Is the text too bold for its role?
- Is a caption using a header/table style?
- Is auxiliary text visually louder than the object name?
- Are same-role items consistent?
- Does the font weight make a small component look crude?

Small status text usually prefers regular or medium weight, not bold.
A tag can look rough even if token-compliant when text weight is too heavy.

### 7. Context Fit

Never judge the element in isolation.

Ask:
- Does it belong to the nearby text?
- Does it visually attach to the right object?
- Does it compete with the main action?
- Does it help scan the current state?
- Does it look refined inside the actual density of this page?

An element can be correct alone and wrong in context.
If it looks pasted on, fail.

### 8. State Responsibility

State markers must use the minimum effective signal.

For current / active:
- must be recognizable
- should not look like a primary button unless clickable

For completed:
- should usually recede
- avoid strong green backgrounds unless completion itself is the main message

For pending / inactive:
- should be quieter than current
- avoid equal visual weight with active state

If all states are equally loud, fail.

### 9. Final Micro-Craft Pass

Before delivery, zoom mentally into every small component and ask:

- Does this look intentionally designed, or like a default component?
- Is the visual strength exactly enough, not too much and not too little?
- Would a designer object to the radius, padding, weight, or centering?
- Does the element still look good after removing one emphasis carrier?
- If I change it from tag to text, does it lose necessary recognition?
- If I change it from text to tag, does it become too heavy?

If the best answer is “somewhere between”, choose a middle intensity pattern such as soft tag, text + dot, light border, or reduced padding instead of swinging between extremes.

Do not deliver while any visible element has crude weight, wrong radius, poor optical centering, inflated padding, mismatched state strength, or unclear semantic responsibility.
