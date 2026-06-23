# Component API Cheatsheet

> AGIOne 自定义组件（`<PrototypeComponents>`）+ Element Plus 高频原生组件的 props/slots 签名 + 复合用法 schema。
> 
> AI 使用规则：选定组件后，**先看本文件确认签名 + 复合用法**；除非仍然不够用，**不要 Read 单组件 HTML**。
> 
> Owner-maintained，自动生成。AGIOne 自定义组件 props 部分自动从 shell-sample 抽取；EP 速查、复合用法均手工维护。

_Last build: 2026-05-15 21:44:48_

## 🔧 Element Plus 常用原生组件（不在 PrototypeComponents 里）

> 这些是 EP 库自带组件，AI 直接用 `<el-*>` 标签。下列 props 是 AGIOne 原型最高频用法。
> 完整 API 见 [element-plus.org](https://element-plus.org)。

### `<el-button>`
**Props**: `type`（primary/success/warning/danger/info/default）· `size`（large/default/small）· `plain` · `link` · `disabled` · `loading` · `circle` · `icon`
**Event**: `@click`

### `<el-input>`
**Props**: `v-model` · `placeholder` · `type`（text/textarea/password/number）· `clearable` · `disabled` · `prefix-icon` · `maxlength` · `show-word-limit`
**Slots**: `prefix`, `suffix`, `prepend`, `append`

### `<el-input-number>`
**Props**: `v-model` · `min` · `max` · `step` · `controls-position`（right）· `disabled` · `precision`

### `<el-select>` + `<el-option>`
**Props**: `v-model` · `placeholder` · `clearable` · `filterable` · `multiple` · `collapse-tags` · `disabled`
**el-option**: `label` · `value` · `disabled`

### `<el-date-picker>` / `<el-time-picker>`
**Props**: `v-model` · `type`（date/daterange/month/year）· `placeholder` · `range-separator` · `start-placeholder` · `end-placeholder` · `value-format`

### `<el-checkbox>` / `<el-checkbox-group>`
**Props**: `v-model` · `label`（el-checkbox 内显文字）· `disabled` · `indeterminate` · `border`
**Group**: `v-model`（Array）

### `<el-switch>`
**Props**: `v-model` · `active-text` · `inactive-text` · `active-value` · `inactive-value` · `disabled`

### `<el-pagination>`
**Props**: `v-model:current-page` · `page-size` · `:total` · `layout`（默认 `total, prev, pager, next, sizes, jumper`）· `background`

### `<el-dialog>`
**Props**: `v-model`（visible）· `title` · `width`（如 `520px` 或 `40%`）· `:show-close` · `destroy-on-close` · `append-to-body` · `modal` · `center` · `align-center`
**Slots**: `default`, `header`, `footer`

### `<el-form>` + `<el-form-item>`
> 任何 `<el-form>` 必须包在 `<div class="form-modern">` 里（L1 铁律）
**el-form**: `:model` · `:rules` · `ref` · `label-position="top"`（form-modern 默认）
**el-form-item**: `label` · `prop`（对应 model 字段）· `size="large"`（40px 高，form-modern 必须）· `required`

### `<el-upload>`
**Props**: `action` · `list-type`（text/picture/picture-card）· `multiple` · `accept` · `:limit` · `:before-upload` · `:on-success`
**Slots**: `default`, `tip`

### `<el-tooltip>`
**Props**: `content` · `placement`（top/bottom/left/right + start/end）· `effect`（dark/light）· `disabled`

### `<el-popconfirm>`
**Props**: `title` · `confirm-button-text` · `cancel-button-text` · `confirm-button-type`（danger）· `icon` · `icon-color`
**Event**: `@confirm`

### `<el-table>` + `<el-table-column>`
> 列表页**优先用 `<DataTable>`**（在 PrototypeComponents 内）；仅当 DataTable 不够灵活时降级用 el-table
**el-table**: `:data` · `border` · `stripe` · `row-key` · `@row-click`
**el-table-column**: `prop` · `label` · `width` · `min-width` · `fixed`（left/right）· `sortable`
**Slots in column**: `default`（slot-scope: `{ row, $index }`）

---

## 🎨 AGIOne 自定义组件（`<PrototypeComponents>`）

**Runtime inventory**: `23` components generated from `agione-console-shell-sample-v1.html`.

`<HeaderBox>` `<KpiCard>` `<StatusBadge>` `<EmptyState>` `<Alert>` `<UsageBar>` `<KvCard>` `<DetailSection>` `<TableActions>` `<PageHeader>` `<MetricsStrip>` `<HeroBand>` `<StepPills>` `<ProgressBar>` `<DataTable>` `<Tag>` `<CardBox>` `<Tabs>` `<Avatar>` `<DetailPage>` `<Breadcrumb>` `<FilterBox>` `<I18nField>`

### `<HeaderBox>`
**Props**:
- `title` · `String` · **required**
- ~~`subtitle`~~ 已移除（v6.9.3：所有页面不传副标题）
**Slots**: `actions`, `default`

### `<KpiCard>`
**Props**:
- `title` · `String` · **required**
- `value` · `String | Number` · default: ``
- `icon` · `String` · default: ``
- `iconColor` · `String` · default: `primary`
- `trend` · `String` · default: ``
- `trendType` · `String` · default: `neutral`
**Slots**: `trend`

### `<StatusBadge>`
**Props**:
- `status` · `String` · **required**
- `label` · `String` · default: ``

### `<EmptyState>`
**Props**:
- `icon` · `String` · default: `inbox`
- `title` · `String` · **required**
- `hint` · `String` · default: ``
**Slots**: `action`

### `<Alert>`
**Props**:
- `variant` · `String` · default: `info`
- `title` · `String` · **required**
- `desc` · `String` · default: ``
- `closable` · `Boolean` · default: `false`

### `<UsageBar>`
**Props**:
- `used` · `Number` · **required**
- `total` · `Number` · **required**
- `unit` · `String` · default: ``
- `color` · `String` · default: `auto`
- `showText` · `Boolean` · default: `true`

### `<KvCard>`
**Props**:
- `title` · `String` · default: ``
- `items` · `Array` · default: `() => [...]`
- `labelWidth` · `String` · default: `auto`
- `hover` · `Boolean` · default: `false`
**Slots**: `default`, `headerRight`

### `<DetailSection>`
**Props**:
- `title` · `String` · **required**
**Slots**: `default`, `headerRight`

### `<TableActions>`
**Props**:
- `actions` · `Array` · **required**
- `max` · `Number` · default: `3`

### `<PageHeader>`
**Props**:
- `title` · `String` · **required**
- ~~`subtitle`~~ 已移除（v6.9.3：所有页面不传副标题）
- `eyebrow` · `String` · default: ``
- `eyebrowIcon` · `String` · default: ``
**Slots**: `actions`

### `<MetricsStrip>`
**Props**:
- `items` · `Array` · **required**
- `cols` · `Number` · default: `0`
- `divided` · `Boolean` · default: `true`

### `<HeroBand>`
**Props**:
- `eyebrow` · `String` · default: ``
- `eyebrowIcon` · `String` · default: ``
- `title` · `String` · **required**
- `desc` · `String` · default: ``
- `points` · `Array` · default: `() => [...]`
- `tone` · `String` · default: `primary`
**Slots**: `right`

### `<StepPills>`
**Props**:
- `steps` · `Array` · **required**
- `separator` · `String` · default: `›`

### `<ProgressBar>`
**Props**:
- `value` · `Number` · **required**
- `max` · `Number` · default: `100`
- `state` · `String` · default: `auto`
- `height` · `Number` · default: `6`

### `<DataTable>`
**Props**:
- `data` · `Array` · default: `() => [...]`
- `columns` · `Array` · **required**
- `total` · `Number` · default: `0`
- `page` · `Number` · default: `1`
- `pageSize` · `Number` · default: `10`
- `loading` · `Boolean` · default: `false`
- `emptyText` · `String` · default: `暂无数据 / No data`
- `showPagination` · `Boolean` · default: `true`
- `operationsLabel` · `String` · default: `操作`
- `operationsWidth` · `String | Number` · default: `160`
**Slots**: `operations`

### `<Tag>`
**Props**:
- `color` · `String` · default: `muted`
- `preset` · `String` · default: ``
- `icon` · `String` · default: ``

### `<CardBox>`
**Props**:
- `title` · `String` · default: ``
- `padded` · `Boolean` · default: `false`
**Slots**: `default`, `headerRight`

### `<Tabs>`
**Props**:
- `options` · `Array` · **required**
- `modelValue` · `String | Number` · default: ``
- `variant` · `String` · default: `underline`

### `<Avatar>`
**Props**:
- `src` · `String` · default: ``
- `name` · `String` · default: ``
- `size` · `String` · default: `default`
- `color` · `String` · default: ``

### `<DetailPage>`
**Props**:
- `title` · `String` · **required**
- ~~`subtitle`~~ 已移除（v6.9.3：所有页面不传副标题）
- `tabs` · `Array` · default: `() => [...]`
- `activeTab` · `String | Number` · default: ``
- `showBack` · `Boolean` · default: `true`
**Slots**: `actions`, `default`

### `<Breadcrumb>`
**Props**:
- `items` · `Array` · **required**
- `separator` · `String` · default: `chevron-right`

### `<FilterBox>`
**Props**:
- `variant` · `String` · default: `standard`
- `selectedCount` · `Number` · default: `0`
**Slots**: `default`

### `<I18nField>`
**Props**:
- `modelValue` · `Object` · **required**
- `langs` · `Array` · default: `() => [...]`
- `required` · `Array` · default: `() => [...]`
- `placeholder` · `String | Object` · default: ``

## 🧩 复合用法 / 数据 schema 详解

> props 表说不清的复杂用法（Array 元素 schema / named slot 数据 / Vue 响应式契约）写在这里。

### `<DataTable>` 完整用法

**columns Array 元素 schema**：
```js
const columns = [
  { prop: 'name',   label: '租户名称',  minWidth: 180 },             // 普通文本列
  { prop: 'status', label: '状态',     width: 100, slot: 'status' }, // 用 named slot 自定义渲染
  { prop: 'usage',  label: '使用率',   width: 160, slot: 'usage' },
  { prop: '_actions', label: '操作', width: 160, fixed: 'right', slot: 'actions' }, // 操作列固定右侧
];
```

**模板（自定义 cell 用 named slot，slot props 是 `{ row, $index }`）**：
```html
<DataTable :columns="columns" :data="rows" :total="total" v-model:page="page">
  <template #status="{ row }">
    <StatusBadge :status="row.status" />
  </template>
  <template #usage="{ row }">
    <UsageBar :used="row.used" :total="row.total" />
  </template>
  <template #actions="{ row }">
    <TableActions :actions="[
      { label: '查看', onClick: () => view(row) },
      { label: '删除', onClick: () => del(row), danger: true }
    ]" />
  </template>
</DataTable>
```

**避坑**：
- 不用 `<DataTable>` 而用原生 `<el-table>` = 违反 L1 铁律
- columns 内的 `slot` 字段就是 template 里 `#<slot-name>` 的 key
- 操作列必须 `fixed: 'right'` + 用 `<TableActions>`

### `<EmptyState>` action slot

slot `action` 接 1 个按钮（通常 `<el-button type="primary">`）：
```html
<EmptyState icon="package-x" title="还没有任何套餐" hint="去浏览可购套餐">
  <template #action>
    <el-button type="primary" @click="$router.push('/plans')">浏览套餐</el-button>
  </template>
</EmptyState>
```

### `<KpiCard>` 状态色变体

`iconColor` 控制右上图标色，但**整张卡片状态色**通过额外 class 实现：
```html
<KpiCard title="Success Rate" value="99.85%" icon="check-circle" iconColor="success" />
<!-- 整卡变 success 调：在 shell-sample 定义 .kpi-card--success / --warning / --cool -->
<div class="kpi-card kpi-card--success">...</div>  <!-- 直接写 DOM 而非组件标签时 -->
```

### `<I18nField>` 必备 v-model 结构（v3.16 runtime-component）

```js
form.name = { zh: '', en: '', ja: '', ko: '' };  // v-model 绑定一个对象，每语言一个 key
```
```html
<I18nField
  v-model="form.name"
  :langs="[
    { code: 'zh', label: '中文',   required: true  },
    { code: 'en', label: 'English', required: true  },
    { code: 'ja', label: '日本語',  required: false },
  ]"
  :placeholder="{ zh: '输入中文名', en: 'Enter English name' }"
/>
```

---

## 🧱 css-pattern 组件完整 DOM 骨架

> **type=css-pattern 的组件不是 Vue 标签**，必须按下列骨架写 div + class。
> AI 写时直接 copy 骨架到原型 `<main>` 内。

### `.main-box`（列表/详情页根容器）

```html
<div class="main-box" data-component="main-box">
  <!-- HeaderBox / FilterBox / etc 在这里 -->
  <el-scrollbar>
    <div class="px-7 pb-7" data-scroll-box data-component="scroll-box">
      <!-- 主内容 -->
    </div>
  </el-scrollbar>
</div>
```
必备 CSS（shell-sample 已有）：`.main-box { display: flex; flex-direction: column; height: 100%; }`

### `.form-modern`（包裹所有 `<el-form>`）

```html
<div class="form-modern" data-component="form-modern">
  <el-form :model="form" label-position="top">
    <div class="form-group">
      <div class="form-group__head">
        <i data-lucide="user"></i>
        <span class="form-group__title">基本信息</span>
      </div>
      <el-form-item label="名称" prop="name" size="large">
        <span class="form-helper">label 下方的 12px muted 说明</span>
        <el-input v-model="form.name" />
      </el-form-item>
    </div>
    <div class="form-actions">
      <el-button>取消</el-button>
      <el-button type="primary">保存</el-button>
    </div>
  </el-form>
</div>
```
必需子 class：`.form-group / .form-group__head / .form-group__title / .form-helper / .form-actions`
`<el-form-item>` 必须 `size="large"`（40px 高）。

### `.list-card-item`（卡片列表项，3-5 字段含视觉资产）

```html
<div class="list-card-item-list" data-component="list-card-item-list">
  <div v-for="item in items" :key="item.id" class="list-card-item list-card-item--surface" data-component="list-card-item">
    <div class="list-card-item__avatar">
      <Avatar :name="item.owner" />
    </div>
    <div class="list-card-item__body">
      <div class="list-card-item__title">{{ item.title }}</div>
      <div class="list-card-item__meta">
        <Tag :color="item.tagColor">{{ item.type }}</Tag>
        <span class="type-caption" style="color: var(--ui-text-muted);">{{ item.updatedAt }}</span>
      </div>
    </div>
    <div class="list-card-item__actions">
      <el-button link>查看</el-button>
      <el-button link>编辑</el-button>
    </div>
  </div>
</div>
```
关键 class：`.list-card-item / __avatar / __body / __title / __meta / __actions`
推荐 modifier：`.list-card-item--surface`（白底卡片态）

### `.radio-circle / .radio-pill / .radio-segmented / .radio-card`（Radio 4 variant）

按数据特性选 variant（详见 selection-rules § ⑥）。

**A · `.radio-circle`（默认 90% 场景）**
```html
<div class="radio-circle">
  <label v-for="o in opts" :key="o.v" class="radio-circle__item" :class="{ 'is-active': value === o.v }" @click="value = o.v">
    <span class="radio-circle__dot"></span>
    <span class="radio-circle__label">{{ o.label }}</span>
  </label>
</div>
```

**B · `.radio-pill`（横排紧凑 / 筛选）**
```html
<div class="radio-pill-group">
  <button v-for="o in opts" :key="o" class="radio-pill" :class="{ 'is-active': value === o }" @click="value = o">{{ o }}</button>
</div>
```

**C · `.radio-segmented`（2-4 互斥强切换）**
```html
<div class="radio-segmented">
  <button v-for="o in opts" :key="o" class="radio-segmented__item" :class="{ 'is-active': value === o }" @click="value = o">{{ o }}</button>
</div>
```

**D · `.radio-card`（含副描述，如套餐 / 权限角色）**
```html
<div class="radio-card-group">
  <div v-for="o in opts" :key="o.v" class="radio-card" :class="{ 'is-active': value === o.v }" @click="value = o.v">
    <div class="radio-card__dot"></div>
    <div class="radio-card__name">{{ o.name }}</div>
    <div class="radio-card__desc">{{ o.desc }}</div>
  </div>
</div>
```

### `.form-control-*`（FormControls 自定义控件，少见）

仅在标准 `<el-input>` / `<el-select>` 无法满足时用。优先查 EP 速查 + DataTable schema。具体 class 见 `design-system/components/L2/form-controls.html`（signal=READ，允许查）。

---

## 🛒 商品卡 / SKU 卡通用 mode（L3 标准骨架）

> 适用场景：套餐选择 / SKU 网格 / 模型广场卡片 / 商城商品卡 / 配额包选择 等"用户从多个选项中买/选一个"的页面。
>
> 哲学：**骨架是契约，不是天花板**。下方分"锁定层 / 发挥层 / 反模式"三段——AI 在锁定层之内**必须**遵守，在发挥层**可以**自由叠加质感。

### 🔒 锁定层（最低契约 · 必须遵守）

**字段顺序**：

```
标题 → Save 角标（可选）→ 主数字 → 单价 → 价格 → 副信息 → CTA
```

**视觉层级**（字号 = 信息权重）：

| 元素 | class | 字号 | 说明 |
|------|-------|------|------|
| 主数字（Token 量 / 容量 / 配额 / 主参数）| `.type-display-sm` | 32px / 800 | **卡片视觉焦点 #1** |
| 价格 | `.type-h1` + `color: var(--ui-color-primary)` | 30px / 800 主色 | **视觉焦点 #2**（转化触发） |
| 标题（套餐名 / 商品名）| `.type-h3` | 16px / 600 | 辅助识别 |
| 单价 / 副信息 / 有效期 | `.type-caption` 或 `.type-body-sm` | 12-13px | muted 灰色 |

**结构铁律**：
- CTA = **Primary + 全宽**（`width: 100%`，**不能**短按钮）
- Save 角标 = right-top 绝对定位 + `badge-green` + ≥ 5% 才显示
- 所有 token 走 `var(--*)`，禁止硬编码
- `data-component="sku-card"` 标记

**最小骨架**（AI cp 这个起步，然后叠加质感）：

```html
<article class="sku-card" data-component="sku-card">
  <span v-if="saveRatio >= 0.05" class="sku-card__save">Save {{ saveRatio * 100 }}%</span>
  <h3 class="sku-card__title type-h3">{{ name }}</h3>
  <div class="sku-card__amount type-display-sm">
    {{ amount }}<span class="sku-card__amount-unit">{{ unit }}</span>
  </div>
  <div class="sku-card__unit-price type-caption" style="color: var(--ui-text-muted);">
    {{ unitPrice }}
  </div>
  <div class="sku-card__price-row">
    <span class="sku-card__price type-h1" style="color: var(--ui-color-primary);">{{ price }}</span>
    <span class="sku-card__validity type-caption" style="color: var(--ui-text-muted);">{{ validity }}</span>
  </div>
  <el-button type="primary" class="sku-card__cta" style="width: 100%;">{{ ctaText }}</el-button>
</article>
```

**配套 scoped CSS**（取一个 page-level 前缀如 `bp-`，避免污染）：

```css
.sku-card {
  position: relative;
  background: var(--ui-bg-card);
  border: 1px solid var(--ui-border-default);
  border-radius: var(--ui-radius-xl);
  padding: var(--ui-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-md);
  box-shadow: var(--ui-shadow-sm);
  transition: border-color var(--ui-duration-fast), box-shadow var(--ui-duration-fast);
}
.sku-card:hover { border-color: var(--ui-color-primary); box-shadow: var(--ui-shadow-md); }
.sku-card__save {
  position: absolute; top: var(--ui-space-base); right: var(--ui-space-base);
  background: var(--ui-badge-green-bg); color: var(--ui-badge-green-fg);
  font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: var(--ui-radius-pill);
}
.sku-card__price-row {
  display: flex; align-items: baseline; gap: var(--ui-space-sm);
  padding-top: var(--ui-space-sm); border-top: 1px solid var(--ui-border-soft);
}
.sku-card__validity { margin-left: auto; }
```

### 🎨 发挥层（AI 自由叠加质感）

骨架确保**信息层级正确**，但**视觉气质 / 装饰 / 互动**完全由 AI 发挥。**鼓励**做以下其中几项：

| 维度 | 可选玩法 |
|------|---------|
| 留白节奏 | padding 16 / 20 / 24 自选，gap 自定 |
| Hover 反馈 | 描边变色 / Shadow 升级 / -2px 微浮起 / `--ui-ease-spring` 三选一 |
| 顶部装饰 | 套餐 emoji / Lucide icon / 装饰角标 |
| 推荐档差异 | 加紫色 2px 描边 + "Recommended" 角标 / 加 `--ui-badge-purple-bg` 浅紫底 |
| 价格副信息 | 划线原价、"立省 ¥75"、限时倒计时、"前 100 名半价" |
| 主数字单位排版 | "5M" 紧凑 / "5,000,000" 完整 / 单位行内 / 单位换行 |
| 主色光晕 | 选中态加 `box-shadow: 0 0 0 4px rgba(95, 78, 207, 0.15)` |
| 微动效 | 主数字 `anim-scale-in` 入场 / hover 时主数字 `var(--ui-ease-spring)` 弹一下 |

### ⛔ 反模式（禁止）

- ❌ 把主数字和价格做成 KV-grid 平级 → 视觉焦点丢失
- ❌ CTA 非全宽 / 非 Primary → 弱化转化引导
- ❌ 加 `Active` / `Available` 等冗余 status badge → 商品列表展示 = 已上架，语义重复
- ❌ 字号反层级（标题字号 ≥ 主数字字号）→ 信息权重紊乱
- ❌ Save 角标硬编码颜色 → 必须用 `badge-green`
- ❌ 用 `<KvCard>` 装"价格 + 单价"两个值 → KvCard 是 label-value 详情展示，不是商品卡

### `el-form` 验证完整示例

```js
const formRef = ref();
const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 4, max: 12, message: '4-12 字', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (/[^\w]/.test(value)) callback(new Error('只允许字母数字'));
        else callback();
      }, trigger: 'blur' },
  ],
};

// 提交时
formRef.value.validate((valid) => { if (valid) submit(); });
// 清除单字段验证
formRef.value.clearValidate('name');
```

---
