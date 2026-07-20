# Fidelity target 配置

`scripts/fidelity/compare.mjs` 读取 JSON 数组。每个 target 描述同一页面的原型侧、实现侧、动态 mask、必需 probe、状态矩阵和机械 Gate。

完整起点见 `scripts/fidelity/targets.example.json`。

## 目录

- 页面字段
- proto / impl 字段
- 状态矩阵
- Probe
- Mask
- Gate 与退出码

## 页面字段

| 字段 | 说明 |
|---|---|
| `name` | 唯一文件名，只用字母、数字、点、下划线和连字符 |
| `viewport` | 两侧一致的 `{width,height}` |
| `fullPage` | 默认 `true`；整页高度差是结构信号 |
| `settleMs` | 等数据、字体和图表稳定的时间 |
| `proto` / `impl` | 双侧 URL、登录、状态、导航和等待配置 |
| `mask` | 双侧共享的动态像素 selector |
| `probe` | 必需样式、几何、结构或 SVG 探针 |
| `states` | 可选状态矩阵；展开成 `<name>--<state>` |
| `gate` | 可选 console/mismatch 机械限制 |

## proto / impl 字段

- `url`：HTTP(S)、`file:`，或相对 fidelity 目录的本地 HTML 路径。
- `waitFor`：证明目标页已正确渲染的**可见**稳定 selector；双侧必填，缺失会在配置阶段退出，超时直接 ERROR。
- `waitForGone`：loading mask 等必须消失的 selector；超时直接 ERROR。
- `storageState`：相对 fidelity 目录或绝对路径。实现侧默认尝试 `auth.json`。
- `requiresAuth`：为 `true` 时缺失 storage state 直接 ERROR，避免误截登录页。
- `state.localStorage` / `state.sessionStorage`：在页面脚本前写入精确 key/value；对象值会 JSON 序列化，`null` 表示删除。
- `state.htmlClasses` / `removeHtmlClasses`：补充或删除 `<html>` class。先确认应用真实状态机制，不能只改 class 冒充状态切换。
- `setup`：字符串表示 click；对象支持 `click`、`hover`、`focus`、`waitFor`，可带 `timeout`、`settleMs` 和 `optional`。
- `click` / `hover` / `focus`：单步兼容写法。
- `mask`：该侧额外动态区域。

`waitFor` 必须同时证明“路由正确”和“目标内容已出现”。只等 `.main-box`、`.el-table` 等跨页通用 selector 不够。

## 状态矩阵

`states` 继承 target 的 proto/impl/mask/probe，再叠加本状态配置：

```json
"states": [
  {
    "name": "en-light",
    "impl": {
      "state": {
        "localStorage": {
          "__REPLACE_LOCALE_KEY__": "en",
          "__REPLACE_THEME_KEY__": "light"
        },
        "removeHtmlClasses": ["dark"]
      }
    }
  },
  {
    "name": "dialog-open",
    "proto": { "setup": [{ "type": "click", "selector": "button:has-text('Create')" }] },
    "impl": { "setup": [{ "type": "click", "selector": "button:has-text('Create')" }] }
  }
]
```

把占位 key 换成目标 app 初始化代码中的真实 key/value 格式。状态不适用时从矩阵移除并在验收记录写 N/A，不要静默漏测。

## Probe

旧写法仍可用，会比较完整默认字段集并只取第一个可见元素：

```json
"pageTitle": ".page-title"
```

严格写法支持双侧 selector、重复元素和字段白名单：

```json
"cards": {
  "proto": "section.prototype-page .metric-card",
  "impl": ".production-page .metric-card",
  "all": true,
  "required": true,
  "fields": ["fontFamily", "fontSize", "lineHeight", "backgroundImage", "boxShadow", "borderRadius", "width", "height"]
},
"icons": {
  "selector": ".metric-card svg",
  "all": true,
  "fields": ["width", "height", "svgViewBox", "svgSignature", "stroke", "strokeWidth", "fill"]
}
```

- `required` 默认 `true`；任一侧缺失会失败。
- `all` 默认 `false`；重复卡片、行、按钮和 icon 必须设为 `true`，按 DOM 顺序比较并检查数量。
- `compareText: true` 会增加 `text` 字段；动态文案不要开启。
- `visibleOnly` 默认 `true`，避免单文件原型隐藏页面污染结果。
- `fields` 不写时比较字体、排版、背景、盒模型、布局、`left/top/width/height`、transition/animation 属性和 SVG 签名的默认全集。
- `svgSignature` 同时包含 shape 几何和每个 shape 的 computed `stroke` / `strokeWidth` / `fill`，可发现颜色写在子节点而不是 `<svg>` 根节点上的差异。

探针要覆盖所有视觉家族，而不是只放一个标题和第一张卡。mask 过的表格、图表和动态卡片必须另配 shell/表头/legend/空态等 probe。

## Mask

只遮蔽真实值不可避免不同的像素，例如金额、日期、图表数据点和表格 body 文案。两侧必须对称。

不要：

- mask 整个页面或整张业务卡后直接宣称保真。
- mask 原型有而实现缺失的结构。
- 为压 mismatch 扩大 mask。

被 mask 区域仍要在未遮罩 side-by-side、probe 和 Gate C 中检查结构与交互。

## Gate 与退出码

`node compare.mjs --gate` 默认检查 required probe、元素数量、字段差异和 full-page height。

```json
"gate": {
  "failOnConsoleError": true,
  "maxMismatchPct": 2
}
```

`maxMismatchPct` 默认不启用；只有动态残差已稳定分类、mask 设计可靠时才配置。

- `0`：机械 Gate 无差异，报告状态仍是 `REVIEW_REQUIRED`，必须目检与运行态验收。
- `1`：机械差异存在。
- `2`：配置、导航、auth、selector 或截图准备失败。

报告同时写 `report/fidelity-report.md` 和 `report/fidelity-report.json`。
