# targets.json 配置详解（自动化保真闭环）

> **通用 vs 举例**：字段定义、mask/probe 写法、跨角色 auth 机制都是**通用**的；文中的 operator targets、`capture-fast.mjs` 角色（创作者/运营…）、nav 选择器、`:8030`/`:8088` URL 都是 **AGIOne FO 案例**，按你的原型与环境替换。

`scripts/fidelity/compare.mjs` 读 `targets.json`（数组，每个元素 = 一页对比配置），对原型和实现各截图、遮蔽动态数据、pixel-diff、抓 computed-style delta，产出 `report/`。完整可运行示例见 `scripts/fidelity/targets.example.json`（operator 6 页真实配置）。

## 字段

| 字段 | 说明 |
|---|---|
| `name` | 页面标识，决定输出文件名 `report/shots/<name>-*.png` |
| `viewport` | `{width,height}`，两边一致（通常 1440×900） |
| `fullPage` | 整页截图（默认 true）。整页高度不一致会进 height 报警 = 结构性缺件 |
| `settleMs` | 截图前等待（ms）。有 ECharts/动画的页面给到 3000~3500 |
| `proto` | 原型侧：`url` / `click` / `waitFor` / `mask` |
| `impl` | 实现侧：`url` / `waitFor` / `waitForGone` / `mask` |
| `mask` | 顶层共享 mask（proto+impl 都涂），放动态数据区 |
| `probe` | `{别名: selector}`，抓关键结构元素的 computed style 做精确 delta |

### proto / impl 子字段
- `url`：原型是静态服地址（`http://localhost:8088/operator/operator-v3-premium.html`）；实现是 dev server 路由（`http://localhost:8030/billing/admin/...`）。
- `click`（仅原型常用）：单文件原型靠 sidebar 切页，进页后点导航。例：`"button.nav-item:has-text('Reconciliation')"`。
- `waitFor`：能证明目标页已渲染的 selector（原型用 section 文案锚点，实现用根 class）。
- `waitForGone`（仅实现）：等加载遮罩消失，**否则会截到 loading 态** → 误报。固定写 `".<page-root> .el-loading-mask"`。

## 两条核心写法

### 1. mask = 对称遮蔽动态数据
真实数据 ≠ 原型 mock，逐像素必然差。把**数字/日期/图表/表格 body** 在**两边都**涂掉，让 mismatch% 只衡量**布局/样式**而非 live 值。原型和实现共享类名（实现是从原型 port 的），一份 mask 常两边通用；两边各自多出来的用 `proto.mask` / `impl.mask` 补。

```json
"mask": [".type-display-sm", ".card-box__body", ".el-table__body-wrapper", ".el-pagination"]
```

### 2. probe = 同时命中原型和实现的双侧选择器
probe 抓 style/geometry（与文案无关，免疫动态数据）。原型和实现类名多数相同；不同处用**逗号选择器**两边都覆盖，并用 `section.main-box:not([style*='display: none'])` 把原型限定到**当前可见页**（单文件原型多页共存 DOM）：

```json
"probe": {
  "headerTitle": "section.main-box:not([style*='display: none']) .header-box__title, .operator-reconciliation .header-box__title",
  "cardBox":     "section.main-box:not([style*='display: none']) .card-box, .operator-reconciliation .card-box"
}
```

> 给实现根节点加稳定 class（如 `.operator-reconciliation`）能让 probe/waitFor/waitForGone 都好写。

## 输出怎么读
- `report/fidelity-report.md`：mismatch% + height + 每个 probe 的 style delta（`fontSize: proto=52px impl=40px` → 直接把实现改成 proto 值）。
- `shots/<name>-sidebyside.png`：proto ｜ impl 并排（**视觉 agent 一眼看出哪不像**）。
- `shots/<name>-diff.png`：masked 差异图，🟣 品红=被遮蔽动态数据→忽略，其它颜色才是真差异。
- `shots/<name>-proto.png` / `-impl.png`：全分辨率单图，看细节。

停止条件：**硬门 = style delta=0 且 height match 且并排目检 OK**；mismatch<2% 是参考信号（残差先按 `troubleshooting.md` §8 分类，真数据/locale 残差可接受）。详见 `scripts/fidelity/GOAL-MODE.md`。

## 跨角色 auth + 状态对齐（实战必踩）
不同角色的页面要对应角色登录，**用错角色会被路由守卫重定向**（operator auth 进 `/provider/*` → 跳 admin Customer Accounts；EU 进 → 跳 `/my/account`）——此时 side-by-side 的 impl 侧是「跑错页」，不是页面坏了。
- **`node capture-fast.mjs <角色>`**（dev 有 `VITE_FAST_LOGIN_USERS` + `VITE_LOGIN_DEMO=1` 才行）：`创作者`=provider / `运营`=operator / `普通用户`=EU / `管理员`=admin。走登录页角色卡 → 存 storageState 到 auth.json，免手动登录。**auth.json 一次只一个角色，切角色重跑该脚本即可**。
- **状态对齐**：fast-login 新会话默认 **en + light**，正好对齐原型默认（`lang = ref('en')` + `isDark = ref(false)`）——多数情况无需再切。坑：手动登录的浏览器会话可能带账号偏好（如 provider_onepro 默认 zh + dark），与 comparator 的 fast-login 会话不一致；**一切以 comparator 实际渲染为准**（看 side-by-side 是哪个语言/主题，别凭 Preview 会话推断）。
- **`setup`（proto 多步预点击）**：proto 需要先切语言/主题或多级导航时，在 `proto`/`impl` 加 `"setup": [选择器1, 选择器2]`（在 `click` 前依次点）。原型开关：`button.nav-icon-btn[title='Language']`（切语言）、`button.nav-icon-btn[title='Toggle theme']`（切主题）。
- **nav 图标常不唯一**（如 settlements 与 topupOrders 都用 `receipt`，`:first()` 会点错）→ 切语言后用**文案选择器** `button.nav-item:has-text('<nav文案>')`，别用图标选择器。
