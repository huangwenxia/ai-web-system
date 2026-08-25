---
name: agione-prototype-to-production
description: >
  把 agione-ui 单文件 HTML 原型逐状态、逐视口高保真落到 project-mamba 生产页面，接真实 API、真实数据、
  app-local i18n 和项目共享组件，并用可测量的截图、computed-style、结构、状态矩阵与真实浏览器验收闭环到
  无未解释样式偏差。用户要求“逐帧复刻”“pixel-perfect”“按原型还原”“port 进 project-mamba”
  “实现这个 HTML 原型”“页面和原型不一致”，或基于定稿原型新建、修改、审查 apps/*/src/views 页面时使用。
  本 skill 仅面向生产项目 project-mamba；agione-sandbox 使用 agione-prototype-port。
---

# 原型到 project-mamba 生产页：逐帧复刻协议

把“逐帧复刻”当作硬目标，不把共享组件、框架默认样式或一个宽松的 mismatch 百分比当作降级理由。

静态页面执行逐状态、逐视口的像素级复刻；存在动效时核对关键帧、时长、缓动、方向和最终位置。若当前工具只验证了静态截图，必须把连续动画标为“未验证”，不得宣称逐帧完成。

## 1. 权威顺序

发生冲突时按以下顺序处理：

1. 业务需求、真实 API、后端语义和数据契约。
2. 目标仓库 `AGENTS.md`、repo-local skills、组件源码、路由和构建配置。
3. 原型的视觉、布局、交互状态与非注解型产品文案。
4. Agent 自行推断。

原型仍是**样式复刻的最高权威**。只有业务语义、工程红线、可访问性或真实数据可以形成例外；每个例外都要记录证据和影响。不要用“项目通常这样写”覆盖原型实测样式。

## 2. 开工输入与必读

先确定：

- 原型 HTML、目标页面/路由、目标 app 和允许修改的目录。
- 用户角色、后端环境，以及默认语言、主题和视口。
- 本轮必须覆盖的状态：默认、hover、focus、active、disabled、loading、empty、展开、弹窗或流程步骤。

然后按顺序读取：

1. 目标仓库从根到目标文件适用的全部 `AGENTS.md`。
2. repo-local `ui-spec`、`mamba-page-development`；实际使用 EasyBill 组件时再读对应组件手册。
3. 原型目标 section、样式变量、交互脚本和状态切换逻辑。
4. 邻近成熟页面、实际组件源码、目标 app `package.json`、生成 API/types 和后端契约。
5. 写第一版前读取 `references/vue-porting-patterns.md`，确认 CRUD、生产查询或 bespoke 诊断页分型。

易漂移的包名、单位、命令和示例路径必须以目标仓库当前文件为准。具体核对方法见 `references/project-mamba-adaptation.md`。

## 3. Gate A：工程与业务正确性

在调样式前先保证页面是真的：

- 只展示真实 API 数据；无数据走真实 empty state，严禁 mock 兜底。
- 使用生成 API/types 或已验证的 typed adapter；不猜字段、枚举、参数或嵌套结构。
- 区分按账期、滚动窗口、分页、筛选等接口语义，只传契约允许的参数。
- 使用目标 app 的 locale 模块和完整 i18n key；不得删存量翻译、硬编码中英文或造页面内双语字典。
- 按当前项目规范选择图标包、单位、路由助手和验证命令，不从本 skill 的历史案例反推当前规则。
- 标准 CRUD 优先共享组件；生产查询页和只读诊断页按分型选择实现。共享组件只是实现手段，默认样式不一致时仍要 scoped 调整到原型实测值。
- 原型评审注解、实现说明和内部标签不进入生产；功能性提示、错误、空态和操作说明按业务要求保留。
- 本次新增或实质修改的前端逻辑必须添加中文注释：业务规则、状态流转、接口编排、数据转换、权限与边界判断、异步竞态、副作用和不直观兜底要说明处理原因、触发条件、关键约束或结果；简单自解释的导入、类型、常量、直接赋值、模板和样式无需机械注释，禁止逐行复述语法。
- 原型没有但查询真实数据必需的筛选可以增加；纯装饰、多余工具栏和无业务依据的功能不得增加。

发现业务或工程冲突时先解决 Gate A，不得用遮罩、CSS 或假数据隐藏问题。

## 4. Gate B：逐帧视觉保真

### 4.1 样式合同

在每个适用状态和视口对齐：

- 布局：位置、尺寸、顺序、间距、对齐、滚动、overflow、响应式断点。
- 排版：font-family、font-size、font-weight、line-height、letter-spacing、text-transform、white-space。
- 盒模型：padding、margin、gap、border、radius、shadow、宽高。
- 视觉：颜色、透明度、渐变层次、背景图、辉光和装饰效果。
- 图标：SVG path、viewBox、尺寸、stroke、stroke-width、fill 和颜色。
- 交互：hover、focus、active、disabled、loading、empty、选中、展开、弹窗和步骤切换。
- 动效：关键帧、时长、延迟、缓动、方向和最终状态。

项目 token 渲染结果能够匹配时优先使用 token；页面特有的品牌装饰允许使用 scoped local variables 复刻。语义状态色、可访问性和全局 token 不得为单页保真而破坏。

### 4.2 自动测量

能跑 Playwright 时使用 `scripts/fidelity/`：

```bash
SKILL_DIR=/absolute/path/to/agione-prototype-to-production
PROJECT_DIR=/absolute/path/to/project-mamba
cp -r "$SKILL_DIR/scripts/fidelity" "$PROJECT_DIR/tools/fidelity"
cd "$PROJECT_DIR/tools/fidelity"
pnpm install --frozen-lockfile
npx playwright install chromium
cp targets.example.json targets.json
node compare.mjs <page>
node compare.mjs <page> --gate
```

配置前读取 `references/target-config.md`；循环纪律读取 `scripts/fidelity/GOAL-MODE.md`。

工具输出三类信号：

- 未遮罩 side-by-side：判断结构、缺件、多余元素和整体观感。
- masked pixel diff：定位非动态区域的像素差异；mismatch% 只作定位信号。
- computed-style probes：精确比较已配置元素的样式、几何和 SVG 签名。

`style delta = 0` 只表示**已配置探针**清零，不代表整页自动通过。mask 只能排除动态像素，不能豁免被遮区域的列结构、图表结构、空态、交互或真实语义；这些必须用探针、未遮罩截图和运行态检查补齐。

无法运行 Playwright 时使用 `scripts/compare-elements.js`，并读取 `references/comparison-method.md`。手动 Tier 不得降低验收范围。

### 4.3 状态矩阵

至少验证原型和任务实际支持的状态：

- `zh/en × light/dark`。
- 任务指定的桌面与窄屏视口。
- 默认态与所有可达交互态。
- 真实数据态、空态、加载态和错误态。

不是所有页面都必须机械生成所有组合；未适用的状态要标为 N/A，未测试的状态要标为 NOT TESTED，不能静默跳过。

## 5. Gate C：真实运行态验收

视觉闭环后使用 `agione-page-check` 验证真实前端：

- 正确角色、shost/backend、最终 URL、菜单与权限链。
- 真实请求、控制台错误、路由跳转和完整工作流。
- 极端数据、长文本/大数字、无数据、错误态和遮挡/overflow。
- 中英文、light/dark、hover/focus 和原型保真证据。

未完成 Gate C 时只能报告“视觉实现完成”，不得报告“production-ready”。权限或数据问题按对应 skill 处理后重新验收。

## 6. 停止条件

一页只有同时满足以下条件才算完成：

1. Gate A 的契约、类型、i18n、真实数据和项目验证命令通过。
2. 所有 required probe 命中且无未接受差异，元素数量和必需结构一致。
3. 全页高度/目标容器几何一致，未遮罩并排目检无未解释偏差。
4. 状态矩阵全部为 PASS、N/A 或有证据的 ACCEPTED RESIDUAL；不存在 NOT TESTED。
5. Gate C 真实运行态验收通过。

允许的残差仅限：真实动态值、已证明的业务语义差异、不可控字体抗锯齿/亚像素差异或不同图表渲染器的内部像素差异。业务需要的额外 affordance 必须有证据。所有可控样式差异都必须修复。

每页输出：修改文件、验证矩阵、mismatch 参考值、probe 覆盖和差异、accepted residual、运行态证据、未覆盖项。没有证据时不要写“1:1”“逐帧完成”或“production-ready”。

## 7. 落地节奏

1. 先做一个代表性标杆页，完成三类 Gate。
2. 用户确认标杆页后复用方法批量处理，其余页面仍逐页跑 Gate B/C。
3. 一次只修一组可解释差异，复测后再继续；连续两轮无改善时停止并记录根因，不扩大 mask 或伪造数据。

## 8. 禁止事项

- 不把“看着差不多”、共享组件已使用或 mismatch 低于某数字当作完成。
- 不修改原型、全局 token、依赖或无关页面来让比较结果变好。
- 不注入 mock，不删除真实字段，不回退正确业务语义。
- 不把 FO/Financial 单页事故当作所有 app 的固定规则。
- 不忽略被 mask 的区域、未测试状态、错误登录页或 selector 超时。
- 不在未验证连续动效时声称“逐帧动画一致”。

## 9. 按需参考

| 文件 | 何时读取 |
|---|---|
| `references/project-mamba-adaptation.md` | 每次开工，核对当前项目规则与命令 |
| `references/vue-porting-patterns.md` | 写第一版前，选择页面与表格分型 |
| `references/target-config.md` | 配置自动截图、状态和 probe |
| `scripts/fidelity/GOAL-MODE.md` | 执行自动迭代闭环 |
| `references/comparison-method.md` | Playwright 不可用时手动比对 |
| `references/troubleshooting.md` | 自动闭环失败或信号矛盾时 |
| `references/landmark-page-issues.md` | 收尾 review，查历史高频偏差 |
