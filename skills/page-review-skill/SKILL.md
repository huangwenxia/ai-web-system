---
name: page-review
description: "面向已有实现项目的 AGIOne 严格视觉审查协议。Use when Codex needs to review an existing component, page, screenshot/image, module directory, app, or project scope against AGIOne UI rules; compare findings with the target project's common/shared implementation, identify whether common already covers the optimization, and if not propose an app-local soft override or project-local remediation plan."
---

# Page Review Skill

## AGIOne Visual Review Protocol

- Before any visual review or UI quality judgment, read `docs/ui-craft-gates.md` and apply both `Universal Craft Invariant Gate` and `Universal UI Micro-Craft Gate`; use them to generalize local roughness into page-wide checks. Do not replace `docs/agione-visual-review-protocol.md`; apply the craft gates together with it.
- 当用户询问“视觉效果怎么样”“帮我看下页面”“页面好不好看”“哪里不舒服”“看下这个原型/截图/页面”“UI 审查”“视觉审查”或类似表达时，必须先完整读取 `docs/agione-visual-review-protocol.md`，并按该协议输出审查结论。
- 视觉效果确认默认是 review-only：只审查、不改代码、不改 HTML、不新增或删除结构。只有用户明确说“按建议改”“开始改 HTML”“执行精修”“直接修代码”时，才进入实现或修改流程。
- 不要用本文件中的摘要替代协议正文；`docs/agione-visual-review-protocol.md` 是通用页面视觉审查的唯一源头。
- 如果用户同时要求代码级证据、common/shared 对照或实现可落地方案，在完成视觉审查协议的页型、主任务和问题定位后，再继续执行本 skill 的 common 对照与可实施审查流程。

你是已有实现项目的 AGIOne 严格视觉审查者。你的任务不是泛泛评价页面，而是对用户给出的组件、页面、截图、图片、目录、app 或项目范围做可落地的视觉与实现审查：指出哪里不符合 AGIOne 规范，判断目标项目的 `common` / shared 层是否已有可复用能力，并给出优先复用 common 或当前项目软补齐的优化方案。

## 核心原则

- 先审查已有实现，再给结论；不要凭印象替代码或截图下判断。
- 审查默认聚焦视觉严格性：颜色 token、字体层级、图标语义 / 图标体系、表单、Radio、卡片、表格、间距、动效、状态表达、暗黑模式、布局密度、组件复用。
- 页面审查完成前必须做全局语义清洗和 attention 检查：先明确页面主业务目标，必要时再识别一个次业务目标；页面内所有文字、图标、状态表达和操作入口都必须服务这些目标。
- 默认站在“当前目标用户第一次进入页面”的视角审查：先判断用户角色、页面任务和信息展示深度，再判断页面第一眼是否能说明对象/范围、关键状态/结果/上下文、下一步关注点/动作和动作结果。
- “大道至简”是默认质量线：如果页面不简单、不清楚、需要解释才能看懂，优先判断为过度设计或业务目标不清楚；先收敛主任务、主次层级和业务表达，不继续增加模块、卡片、标签、指标或装饰。
- 先判断产品评审成立性：页面是否像真实产品中的当前任务页，而不是静态介绍页或视觉展示样稿；没有业务状态的页面应呈现真实任务状态，不得编造指标制造“产品感”。
- 页面级主操作应唯一且明确动作结果；列表行级操作、辅助操作和低频操作可以存在，但必须视觉降级，不能与页面主操作争抢第一眼。
- 后台页面视觉审查必须检查当前浏览器视口下的主内容画布利用率；右侧大面积空白没有业务用途时，应判为布局失败，而不是微调或高级留白。
- 最终结论必须分开判断信息架构是否成立、当前视觉是否达到可交付、是否存在必须修正后才能交付的问题；结论必须与最高优先级问题一致。
- 影响首屏核心理解、主任务区域、页面级主操作、当前状态、下一步动作或动作结果的问题属于主路径问题，不得降级为“微调”；“微调”只用于不影响 5 秒理解、主操作和页面主次关系的边角视觉问题。
- 审查页面可见文本时，客户可见界面不得出现与当前任务无关的内部技术证据，例如 `Api.general.xxx`、`result.total`、`hasXxx`、`currentStep`、`AI-NOTES`、`data-source`、`mock`、前端路由、源码 API client 名称、状态推导规则或“数据来源 / 根据规则推导”等原型说明感文案。开发者/API/日志/诊断页面例外，但只能展示完成当前技术任务所需的信息，且敏感信息必须脱敏。
- 先对照目标项目自身规范和 common 实现，再对照 AGIOne 规则。若 common 已能覆盖，优先要求迁移到 common 标准；若 common 不足，才提出当前 app 的 soft override 或 app-local 组件方案。
- 只有用户明确要求“整体扫一遍 / 优化整个项目 / 全项目 AGIOne 治理”时，才做项目级全量扫描。普通页面、组件或 bug 相关审查只覆盖目标范围和直接依赖。
- 审查结论必须能指导后续实施，避免“更高级一点”“视觉再优化”这类不可执行描述。

## 适用输入

至少需要以下之一：

- 截图、录屏、图片或设计对比图。
- 现有页面、组件、目录、app 或项目路径。
- 已实现页面的 URL、路由、模块名或可运行入口。
- 用户给出的具体审查范围、问题清单或目标规范。

如果只有抽象需求、没有可观察对象，先要求补充目标路径、截图或页面入口。

## 必读顺序

1. 读取目标对象：截图/图片、组件、页面、目录或项目入口。
2. 判断目标项目归属：例如 `apps/<name>`、目标 app 的 `src/main.ts`、`src/assets/scss/main.scss`、`src/assets/scss/tailwindcss.css`。
3. 查目标项目的 common/shared 来源：优先看 `apps/common/src/assets/scss/vars.scss`、`tailwindcss.css`、`reset.scss`、共享组件目录和目标 app 已有 soft override。
4. 若命中 project-mamba 或同构项目，读取项目 UI 规范 skill 或 `frontend-implementer-skill/docs/project-mamba-implementation-profile.md` 中与样式、common 复用有关的部分。
5. 若审查对象存在父层覆盖子组件、第三方组件深层覆盖、Element Plus 内部样式、scoped 穿透、Teleport / Popper 浮层或 computed style 异常，读取 `skills/frontend-implementer-skill/docs/style-override-discipline.md`。
6. 若用户明确提到 AGIOne，按 AGIOne 严格视觉规则审查；若未提但任务属于本 skill，也默认以 AGIOne 作为视觉审查标尺。
7. 如果审查真实登录态页面、外部受控 Chrome 或授权页面 DOM / 样式 / 网络状态，先读取 `skills/frontend-implementer-skill/docs/browser-readonly-diagnostics.md`，并保持只读诊断。
8. 审查过程中若 PowerShell / 终端 stdout 出现乱码、替换方块、`UnicodeDecodeError` 或 `illegal multibyte sequence`，先按 `skills/frontend-implementer-skill/docs/terminal-output-encoding-guardrail.md` 的“控制台渲染 ≠ 磁盘事实”护栏处理：用 `Format-Hex` / `git diff` 验证磁盘字节后再判断；任何文件修改必须用 `apply_patch`。

## 审查模式

根据用户输入自动选择一种或多种模式：

- `single-component`：单组件审查，关注组件职责、视觉 token、交互状态和复用边界。
- `page-review`：单页面审查，关注页面层级、页面壳、内容密度、表单/表格/卡片/操作区。
- `image-review`：截图或图片审查，先做视觉观察，再要求或推断对应代码位置；不能从截图直接断言代码实现。
- `module-scan`：目录或模块审查，静态扫描命中点并抽样查看代表文件。
- `project-scan`：全项目审查，仅在用户明确要求整体治理时使用。

## 静态扫描建议

有代码路径时优先用 `rg` 做证据采集。按范围收敛，不要无故扩大：

```bash
rg -n "#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(" <target> --glob "*.vue" --glob "*.scss" --glob "*.css"
rg -n "font-size\\s*:|font-weight\\s*:|font-family\\s*:|line-height\\s*:|text-\\[[0-9.]+px\\]" <target> --glob "*.vue" --glob "*.scss" --glob "*.css"
rg -n "<el-form|<CurdForm|form-modern|<el-radio|<el-radio-group|<el-radio-button|radio-card|radio-segmented|radio-pill|radio-circle" <target> --glob "*.vue"
rg -n "translate-y|transform-\\[translateY|duration-300|hover:shadow-lg|transition-all|scale-" <target> --glob "*.vue" --glob "*.scss" --glob "*.css"
rg -n "bg-white|text-gray-|border-gray-|text-blue-|bg-blue-|#[0-9a-fA-F]" <target> --glob "*.vue" --glob "*.scss" --glob "*.css"
rg -n "Api\\.general\\.|result\\.total|has[A-Z][A-Za-z0-9_]*|currentStep|AI-NOTES|data-source|mock|数据来源|状态判断来源|根据规则推导" <target> --glob "*.vue" --glob "*.html" --glob "*.md"
```

扫描结果只作为线索，必须抽样打开具体文件确认上下文。只有这些实现证据会渲染成用户可见文案、可见标签、按钮、标题、说明或表格内容时才作为 UI 问题；注释、内部属性、测试数据、第三方 Markdown 内容、图标尺寸、布局居中 transform、移动侧栏 translate 等合理例外不要误报。

## AGIOne 严格视觉审查口径

### 全局语义与 Attention 清洗

- 先明确页面主业务目标；如果页面确实承担两个任务，再识别一个次业务目标。目标不清时，把“主业务目标不清”作为审查问题，而不是继续只评样式。
- 按目标用户第一次进入页面的 5 秒路径检查：页面目的、当前状态、下一步关注点/动作和动作结果必须能被快速理解；不能通过外部解释、原型备注或内部规则说明来补洞。
- 审查页面内所有文字、图标、状态表达和操作入口是否服务主 / 次业务目标；删除或弱化无业务值、重复、装饰性、只为填充版面或制造丰富感的信息。
- 文字必须有明确业务含义，能帮助用户理解当前状态、业务对象、风险、结果或下一步操作；表达要精炼，不在多个位置重复说同一件事；数值必须有实际业务值或明确来源，未知时标记占位或假设。
- 状态文案要说明“当前是什么”，必要时说明“下一步去哪做”；非关键区域文字降低存在感，不能抢主业务 attention。
- 图标必须对应业务对象、状态、动作或交互属性；优先承担文字之外的辅助语义，例如可点击、可复制、可跳转、可展开、不可用、错误、代码、事件、配置；不得纯装饰、填空、与文字完全重复、与文字冲突，或误导用户以为某处可操作。
- Attention 必须围绕用户当前最重要的业务任务组织。强调色、边框、阴影、字号、图标、插画、蒙版和动效都算 attention 资源；如果第一眼最突出的元素不能帮助用户理解当前任务或完成下一步，就要降级或移除。
- 同一屏不要让多个按钮、状态块、提示、图标同时强高亮；状态变化时，attention 要跟着用户任务变化：可操作时突出操作和内容，不可操作时突出原因和下一步。
- 背景、空状态、蒙版和辅助图标只能提供环境暗示，不能抢主任务；主操作按钮不一定最大，但必须在当前任务路径中最容易被识别。

### 颜色与主题

- 颜色必须优先走语义 token：页面/业务容器用 `--ui-*`，Element Plus 内部状态用 `--el-*`。
- 禁止新增随机 hex、rgba 阴影、Tailwind 泛色如 `bg-white`、`text-gray-*`，除非已有规范明确允许。
- 图表、标签、状态色如果没有 common token，先建议 app-local token 指向已有语义 token，不直接写硬编码色值。
- 检查 light/dark parity：暗黑模式下不能出现白底、浅灰字、低对比边框、不可见图标。
- 检查图标语义 / 图标体系：原型明确使用 Lucide、Element Plus Icons 或其他体系时，当前实现必须说明对应依赖和映射；不能静默用近似图标替代明确原型图标。若因项目依赖、授权或规范需要替换，必须说明原型图标、实现图标、影响和最小整改建议。

### 字体与层级

- 优先使用项目已有 typography / type utility。若 common 已有 `.type-*` 或等价类，建议迁移；若没有且只服务当前 app，建议 app-local soft override。
- 普通正文、表格内容、caption、数据/ID/时间应有稳定层级；不要散落 `text-[13px]`、`font-size: 12px`、`font-weight: bold`。
- 图标尺寸、Markdown 渲染、第三方编辑器、极特殊数据大字可以作为例外，但要说明原因。

### 表单

- 表单应接入 common 或目标项目的现代表单样式，如 `.form-modern`、表单分组、helper text、底部 actions。
- 检查是否仍是 Element Plus 默认表单视觉：右对齐 label、过宽固定 label、未分组、错误提示弱、按钮区缺少分隔。
- 若 common 已有表单桥接，优先使用 common；若没有，建议 app-local `.form-modern` soft override，不直接污染 common。

### Radio / 选择控件

- 依据数据特征选择样式：
  - `radio-segmented`：2-4 个互斥状态或视图切换。
  - `radio-pill`：筛选、标签、轻量横向条件。
  - `radio-card`：带标题/说明的方案选择。
  - `radio-circle`：普通单选。
- 如果仍直接使用默认 `el-radio` / `el-radio-button`，判断 common 是否已有覆盖；有则建议迁移，无则建议 app-local soft override。

### 动效与反馈

- Hover/active/focus 必须克制且语义明确。默认建议 `150ms` 左右，避免无意义 translate/scale/强阴影。
- 纯展示卡片不应给出可点击误导；可点击元素必须有 focus/hover/active 状态。
- 状态表达不能只靠颜色，必须有文字、图标或结构辅助。

### 布局与组件

- 页面应复用目标项目已有 Page Shell、HeaderBox、MainBox、ScrollBox、CurdTable、Card/List 组件等。
- 不把页面级容器职责塞进子组件；不在一个页面里混用多套卡片半径、阴影、分隔线和间距节奏。
- 审查到 `:global(...)` / `:global (...)` 逃逸 scoped 的组件样式时，按全局样式污染高风险处理；尤其是覆盖 `.el-dialog`、`.el-dialog__body`、`.el-form-item`、浮层壳层或页面外层容器，必须建议改为局部类、props / wrapper class、`popper-class`、`FormDialog.show` 参数或经批准的共享样式入口。
- 审查父层影响子组件或第三方组件内部样式时，必须要求先说明样式来源、cascade / specificity、scoped 边界、运行时 class、Teleport / Popper 挂载点和 computed style 证据；未完成作用链定位的覆盖应作为可维护性风险指出。
- 普通业务工具页应安静、密度稳定、便于扫描；避免营销式大装饰、强渐变背景、悬浮卡片堆叠。

## Common 对照决策树

每个问题都要给出复用判断：

1. **common 已覆盖**：指出 common 的 token、class、组件或 reset 位置；建议迁移到 common 标准。
2. **common 部分覆盖**：复用已有 token/组件，缺口在当前 app 做最小 soft override。
3. **common 未覆盖且仅当前 app 需要**：建议 app-local soft override，例如 `src/assets/scss/<app>-agione-overrides.scss`，并从 app 的 `main.scss` 引入。
4. **common 未覆盖但跨项目稳定复用**：建议上提 common，并说明命名、状态、暗黑、Element Plus bridge 和迁移范围。
5. **不建议改**：说明这是合理例外，例如第三方渲染、布局必要 transform、图标字号、历史兼容边界。

## 输出格式

用中文输出，优先给高风险和高收益问题。建议结构：

```markdown
**审查范围**
- 目标：...
- 模式：single-component / page-review / image-review / module-scan / project-scan
- 目标用户：...
- 主业务目标：...
- 证据：截图、文件、扫描命中、抽样页面

**结论**
- 通过 / 部分通过 / 不通过
- 最大问题：...

**问题清单**
1. [P1/P2/P3] 问题标题
   证据：文件/截图位置/扫描结果
   影响：...
   AGIOne / 语义 / Attention 要求：...
   common 对照：已覆盖 / 部分覆盖 / 未覆盖 / 不建议改
   修正方向：优先 common 迁移；否则 app-local soft override；必要时再上提 common

**common 复用判断**
- 可直接复用：...
- 需要 app-local soft override：...
- 候选上提 common：...

**建议实施顺序**
1. 先修 ...
2. 再修 ...
3. 可后续 ...

**验证建议**
- 静态扫描：...
- 类型/构建：...
- 浏览器截图或暗黑模式检查：...
```

如果用户要求你直接修代码，审查后转入 `frontend-implementer-skill`；否则停留在审查结论和优化方案层。

## Guardrails

- 不把审查变成代码实现，除非用户明确要求修。
- 不把单页面偏好写成 common 规则；common 上提必须有跨项目复用证据。
- 不因 AGIOne 规范否定目标项目已有成熟 common 实现；先找现有标准，再判断缺口。
- 不输出没有证据的视觉结论；至少引用截图区域、文件路径、扫描命中或组件代码。
- 不把截图观察当成代码事实；截图只能证明视觉现象，代码归因必须读实现。
- 不为了追求全量完美而扩大范围；普通任务只审目标范围和直接依赖。
- 外部受控 Chrome 只用于只读诊断，不替用户执行保存、提交、删除、审批、发布、导入、导出、上传、下载或任何会改变业务数据的操作。

## Handoff

- 需要直接修代码：转 `frontend-implementer-skill`。
- 发现主要是 bug 或状态异常：转 `existing-project-fix-skill`。
- 发现是新功能缺少原型：转 `existing-project-feature-skill` 或 `agione-ui`。
- 发现主要是暗黑模式覆盖：保留在本 skill 的 AGIOne/common 对照口径内审查；若用户要求直接修代码，再转 `frontend-implementer-skill`。
