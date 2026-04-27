# 中文翻译专项（i18n）

对指定 Vue 文件中的硬编码中文字符串进行 i18n 国际化处理。

---

## 职责边界

| 相关技能       | 本技能负责 | 交给其他技能                                                        |
| -------------- | ---------- | ------------------------------------------------------------------- |
| `ux.md`        | -          | UX 分析（信息层级、操作路径、反馈机制、认知负担、一致性、边界状态） |
| `ui.md`        | -          | UI 准则库（间距系统、字体层级、颜色使用、组件规范等）               |
| `prototype.md` | -          | 业务逻辑和交互设计                                                  |
| `页面设计.md`  | -          | 视觉设计（HTML 静态原型）                                           |
| `frontend.md`  | -          | 前端开发                                                            |
| `页面分析.md`  | -          | UX/UI 分析（交给 `ux.md` 和 `ui.md`）                               |

---

## 工作流程

```
需求文档 → prototype.md（业务逻辑和交互设计）→ 页面设计.md（视觉设计）→ frontend.md（前端开发）
 ↓ ui.md（UI 准则库）
 ↓ translate.md（i18n 国际化处理，可并行）
```

本技能在工作流程中的位置：在 `frontend.md` 的前端开发过程中，对 Vue 文件中的硬编码中文字符串进行 i18n 国际化处理。

---

## 接收参数说明

`/translate` 命令支持两种调用方式：

1. **传入目录路径**（如 `apps/hashrate/src/views/index/op/model/`）
   → 先扫描该目录下所有 `.vue` 文件，检测哪些文件还有未翻译的中文
   → 展示扫描报告，再逐文件执行翻译

2. **传入单个文件路径**（如 `apps/hashrate/src/views/index/op/model/index.vue`）
   → 直接执行标准翻译流程（Step 1–5）

---

## Step -1：路径扫描（传入目录时必须执行）

> 当参数为**目录**时，在执行任何翻译前，先完成以下扫描。

### 扫描目标

找出目录下所有 `.vue` 文件中**尚未被 `t()` 包裹的硬编码中文**。

### 扫描方法（两步过滤，快速定位真实未翻译行）

#### 第一步：Grep 排除注释行

使用 Grep 工具，用以下模式搜索——**直接在正则层面跳过注释行**：

```
^\s*(?!//|/\*|\*|<!--).*[\u4e00-\u9fa5]
```

该模式的含义：

- `^\s*` — 行首允许有缩进
- `(?!//|/\*|\*|<!--)` — **负向前瞻**：排除以 `//`、`/*`、`*`（块注释续行）、`<!--` 开头的行
- `.*[\u4e00-\u9fa5]` — 行内含中文字符

> 这一步可过滤掉 **90%+ 的注释假阳性**（JS 单行注释、块注释、JSDoc、HTML 注释均被排除）。

#### 第二步：人工排除已翻译行

对第一步 Grep 的结果，逐行判断，忽略以下两类：

| 类型            | 特征                                                | 示例                    |
| --------------- | --------------------------------------------------- | ----------------------- |
| 已用 `t()` 包裹 | 行内含 `t("...中文...")` 或 `$t("...中文...")`      | `{{ t("op.xx._key") }}` |
| JSDoc 内联注释  | 形如 `/** 中文说明 */` 出现在 TypeScript 类型定义中 | `/** 模型名称 */`       |

> ⚠️ **特别注意**：与变量拼接的中文（如 `{{ variable }}中文`）也是硬编码，**必须翻译**。
>
> 示例：
>
> ```vue
> <!-- ❌ 未翻译 -->
> <div>{{ data.cpuCores }}核/{{ data.memory }}GB</div>
>
> <!-- ✅ 已翻译 -->
> <div>{{ data.cpuCores }}{{ t("op.model.policy._cpu_cores_unit") }}/{{ data.memory }}GB</div>
> ```

#### 第三步：剩余行 = 真实未翻译

第二步过滤后剩余的行，才是真正需要 i18n 处理的硬编码中文。

> **实际效果对比**：旧方式（纯 `[\u4e00-\u9fa5]`）扫描 58 个文件得到 333 行；新方式同样范围下，真实未翻译仅 2 个文件共 3 行。

### 扫描结果展示

以表格或列表形式输出：

```
扫描路径：apps/hashrate/src/views/index/op/model/

发现以下文件包含未翻译中文：
┌─────────────────────────────────────────────┬──────────────┐
│ 文件                                         │ 未翻译行数   │
├─────────────────────────────────────────────┼──────────────┤
│ index.vue                                   │ 12 行        │
│ components/ModelForm.vue                    │ 5 行         │
│ components/ModelCard.vue                    │ 3 行         │
└─────────────────────────────────────────────┴──────────────┘

共 3 个文件，20 处未翻译中文。
```

如果目录下所有文件均已翻译，输出：

```
✅ 该路径下所有 Vue 文件均已完成 i18n 处理，无需翻译。
```

### 扫描后的行动

- 若发现未翻译文件，询问用户：**"是否对以上所有文件执行翻译？还是只处理某几个？"**
- 按用户确认的范围，逐文件依次执行下方的标准翻译流程（Step 1–5）
- 每完成一个文件，告知进度（如"已完成 1/3：index.vue"）

---

## 项目 i18n 基本信息

### Step 0：快速定位 locales 目录

**不需要广泛探索**——根据传入路径，用以下确定性算法直接推算出 locales 位置，然后用 Glob 一次验证。

#### 算法：从输入路径推导 locales 路径

1. **找到 `src/` 节点**：在传入路径中定位 `src/` 片段（monorepo 项目通常在 `apps/<name>/src/` 处）
2. **拼接 locales 路径**：取 `src/` 及之前的所有部分，追加 `locales/`

```
输入路径：apps/hashrate/src/views/index/op/model/policy/
                        ↑ src/ 节点
locales 路径：apps/hashrate/src/locales/          ← 直接得到
```

```
输入路径：apps/hashrate/src/components/OssSelector/
                        ↑ src/ 节点
locales 路径：apps/hashrate/src/locales/          ← 同上
```

3. **用 Glob 一次验证**：`<locales路径>/**/*.ts` — 若有结果则定位成功，列出所有语言文件。

#### 算法：从文件路径推导 locale 模块文件

根据文件在 `src/` 下的第一层目录，确定写入哪个 locale 模块文件：

| 文件所在位置               | 对应 locale 模块文件                       |
| -------------------------- | ------------------------------------------ |
| `src/views/index/op/...`   | `zh-cn/op.ts` + `en/op.ts`                 |
| `src/views/index/user/...` | `zh-cn/user.ts` + `en/user.ts`             |
| `src/components/...`       | `zh-cn/components.ts` + `en/components.ts` |
| 其他                       | 查看 locales 目录下实际文件名后决定        |

#### 算法：从文件路径推导 key 的对象层级（仅作初始估算，必须用 Step 2 验证）

```
文件路径（src/ 之后的部分）：views/index/op/access/guide/index.vue
                                           ↑          ↑
                                        模块(op)    功能路径(access.guide)

→ 估算 key 路径前缀：op.access.guide._xxx
```

```
文件路径：views/index/user/model/deployment/create/index.vue
→ 估算 key 路径前缀：user.model.deployment.create._xxx

文件路径：components/OssSelector/src/OssSelector.vue
→ 估算 key 路径前缀：components.OssSelector._xxx（或参考同目录已有 key 的层级）
```

> ⚠️ **路径推导是估算，不是事实。** locale 文件的实际对象层级才是唯一真相。
> 推导结果只用于 Step 2 中定向搜索，不能直接用于写 `t()` 调用。

#### 陷阱：路径片段重复（同名目录嵌套）

当文件路径中出现**同名目录连续或间隔出现**时，locale 的实际对象层级往往比路径多一级，**极易推导出错**：

```
文件路径：views/index/op/model/guide/index.vue
                           ↑
              "model" 是 op 的子模块目录

locale 实际结构（op.ts）：
  op:
    model:          ← 对应目录 op/model/
      model:        ← op.ts 内部再嵌套一层 model（子页面分组）
        guide:      ← 才是 guide 所在层
          _page_title: ...

→ 正确 key 前缀：op.model.model.guide._xxx   ✅
→ 仅看路径推导：op.model.guide._xxx          ❌（少一层 model，翻译不生效）
```

**触发规则**：路径中出现形如 `op/<X>/<X>/` 或 `op/<X>/...` 且 locale 文件中 `<X>` 下还有同名子 key 时，必须以实际文件内容为准。

---

### 本项目（project-mamba）的已知配置

- **locale 文件位置**：`apps/hashrate/src/locales/`
  - 中文：`zh-cn/op.ts`、`zh-cn/components.ts`、`zh-cn/user.ts` 等
  - 英文：`en/op.ts`、`en/components.ts`、`en/user.ts` 等
- **引入方式**（组件内）：
  ```ts
  import i18n from "@/locales";
  const { t } = i18n.global;
  ```
- **调用方式**：`t("op.access.guide._step_connect_platform")`，key 路径与 locale 文件对象层级一一对应

---

## Key 命名规范

### 自动生成 key（工具生成文件，勿手改格式）

- 格式：`_` + 6位随机字母数字，如 `_104djo`、`_1lekvl`
- 适用：已有页面的 key，由 i18n extractor 工具批量生成，**不要手动修改这类 key 的名称**

### 手动添加 key（新增翻译块时使用）

**核心原则：见名知义。** key 名称本身就应能表达它对应的文案内容或用途。

格式：`_<语义描述>`，使用 snake_case 英文，清晰描述文案含义。

**常用语义分类与命名模式：**

| 文案类型          | 命名模式                         | 示例                                                    |
| ----------------- | -------------------------------- | ------------------------------------------------------- |
| 页面标题          | `_page_title`                    | `_page_title` → "接入管理 · 快速开始"                   |
| 页面副标题/引导语 | `_page_subtitle`                 | `_page_subtitle` → "按照以下步骤完成..."                |
| 步骤标签          | `_step_<动作>`                   | `_step_connect_platform` → "接入云平台"                 |
| 步骤描述          | `_step_<动作>_desc`              | `_step_connect_platform_desc` → "注册私有云或公有云..." |
| 操作按钮          | `_btn_<动作>`                    | `_btn_configure` → "去配置"                             |
| 表单字段标签      | `_<字段名>`                      | `_name`、`_status`、`_platform_type`                    |
| 输入框占位符      | `_<字段名>_placeholder`          | `_name_placeholder` → "请输入名称"                      |
| 普通描述文字      | `_<主题>_desc` 或 `_description` | `_description` → "策略描述"                             |
| 成功提示          | `_<动作>_success`                | `_create_success`、`_delete_success`                    |
| 确认弹窗文案      | `_<动作>_confirm`                | `_delete_confirm` → "确定删除...吗？"                   |
| 错误/异常信息     | `_error_<原因>`                  | `_error_guide_load_failed`                              |
| 完成/结果提示     | `_msg_<状态>`                    | `_msg_all_done` → "🎉 所有步骤已完成..."                |
| 警告提示          | `_warn_<原因>`                   | `_warn_same_cloud`                                      |

**参考已有的优秀实例**（`model.strategy` / `model.policy`）：

```ts
_add_strategy; // ✅ 一眼知道：新建策略按钮
_delete_confirm; // ✅ 一眼知道：删除确认文案
_name_placeholder; // ✅ 一眼知道：名称输入框占位符
_step_1; // ✅ 步骤1标签
_step_1_group; // ✅ 步骤1分组标题
_primary_route; // ✅ 主路由字段
_create_success; // ✅ 创建成功提示
```

**对比旧风格（禁止新增）：**

```ts
_ap0001; // ❌ 不知道是什么，需要查文件才能理解
_ap0002; // ❌ 同上
```

### Key 路径层级规则

路径 = locale 文件的对象嵌套层级，与路由/目录结构对应：

```
op.access.guide._step_connect_platform
│   │      │     └── 语义化 key（见名知义）
│   │      └── 功能块（对应子目录或组件）
│   └── 一级模块（op.ts 的顶层 key）
└── 文件名（op → op.ts）
```

---

## 标准翻译流程（针对单个文件）

> - 传入**目录**时：先执行 Step -1 扫描，再对每个文件依次执行以下步骤。
> - 传入**单个文件**时：直接从 Step 1 开始。
> - 如尚未探索项目 i18n 结构，先执行上方"Step 0：探索项目 i18n 结构"。

### Step 1：读取目标文件，收集所有硬编码中文

扫描 `<script setup>` 和 `<template>` 中的：

- 字符串字面量（含模板字符串内的中文）
- `console.error/warn/log` 的中文提示
- 模板中直接写的中文文本节点
- **与变量拼接的中文**（如 `{{ variable }}中文`）

> ⚠️ **常见遗漏场景**：单位、符号等与变量拼接的中文，如 `{{ cpuCores }}核`、`{{ memory }}GB`（GB是国际单位可保留，但"核"必须翻译）

**若 Step 1 发现无硬编码中文**（Vue 文件已全部使用 `t()` 调用），**不能直接结束**，必须继续执行 Step 1.5。

### Step 1.5：校验 en locale key 完整性（Vue 已翻译时必须执行）

> **背景**：zh-cn 有 key、Vue 用了 `t()`，但 en locale 缺少对应 key，会导致英文模式下显示原始 key 路径。这类问题肉眼不易察觉，必须主动检测。

**操作流程：**

1. **提取 Vue 文件中所有 `t()` 引用的 key**
   用 Grep 搜索 Vue 文件中所有 `t("...")`，收集完整 key 路径列表（如 `op.model.policy._basic_info`）

2. **定位对应的 locale 块**
   根据 key 路径前缀（如 `op.model.policy`），在 `zh-cn` 和 `en` 两个 locale 文件中定位对应的对象块

3. **对比两个 locale 块的 key 集合**
   读取 zh-cn 和 en 该块的全部 key，找出 **en 中缺少但 zh-cn 中存在**的 key

4. **补全 en locale**
   将所有缺失 key 按英文翻译原则补写到 en locale 文件对应位置

> ⚠️ **注意**：不仅要补 Vue 文件直接引用的 key，还要补该 locale 块内所有缺失的 key——其他组件可能也引用了同块的 key。

### Step 2：读 locale 文件，确认 key 的实际归属层级

**不能仅凭路径推导，必须打开 locale 文件核实。**

1. 根据上方算法估算出 key 路径前缀（如 `op.model.guide`）
2. 用 Grep 在目标 locale 文件中搜索该路径的末段关键词（如搜索 `guide:`）
3. 查看搜索结果所在的**实际对象嵌套位置**，得出真实前缀

```ts
// Grep 搜索：guide:
// 搜索结果在 op.ts 中：
model: {
  model: {        // ← 实际多一层！
    guide: {      // ← 找到了
      _page_title: "...",
    }
  }
}
// → 真实前缀：op.model.model.guide  （而非估算的 op.model.guide）
```

如该层级**尚不存在**（新增功能），则以估算路径为基础，在两个 locale 文件中同步新建。

### Step 3：为每条中文字符串分配 key

#### 3a：先搜索——确认是否已有对应 key（必须执行，禁止跳过）

对每条待翻译的中文文本，**在写任何新 key 之前**，先用 Grep 在 zh-cn locale 文件中搜索该文本：

```
Grep 搜索：<待翻译文本>
目标文件：apps/hashrate/src/locales/zh-cn/<模块>.ts
```

**判断结果（三种情况）：**

| locale 搜索结果    | Vue 文件是否已用该 key           | 操作                                       |
| ------------------ | -------------------------------- | ------------------------------------------ |
| 找到完全匹配的文本 | ✅ 已引用正确 key                | **任务已完成**，无需任何修改，告知用户     |
| 找到完全匹配的文本 | ❌ 未引用（或引用了旧/错误 key） | **复用该 key**，仅更新 Vue 文件的 key 引用 |
| 未找到             | —                                | 进入 3b，新建 key                          |

**真实案例：**

```
需求：{ label: t("user.model.deployment._satv34"), ... } 的 label 应显示"模型 ID"

步骤1 → Grep 搜索 "模型 ID" 于 zh-cn/user.ts
        命中：第 105 行  _model_id: "模型 ID"

步骤2 → 读 Vue 文件，检查该 label 当前引用的 key
        已是：t("user.model.deployment._model_id")

结论 → 命中第一行：任务已完成，无需任何修改 ✅
```

> ⚠️ 即使当前 Vue 文件已有 `t()` 调用但 key 名语义错误（如旧 `_satv34` 对应了错误文案），
> 也应先搜索正确文案是否已有 key，复用后直接替换 Vue 中的 key 引用，**不新建重复 key**。

#### 3b：新建 key（搜索无结果时）

- 使用**语义化 snake_case**（见上方 Key 命名规范），禁止使用序号式命名（`_ap0001`）
- 在 zh-cn 和 en 两个 locale 文件中同步添加（见 Step 4）

### Step 4：更新 zh-cn 和 en 两个 locale 文件

两个文件同步更新，缺一不可。英文翻译原则：

- 按钮文字：动词开头，简短（Configure / Authorize / Add）
- 描述文字：完整句子，首字母大写
- 标题：标题大小写（Title Case）
- 错误/日志信息：与中文语义完全对应

### Step 5：更新 Vue 文件

1. 在 `<script setup>` 顶部添加（如未引入）：
   ```ts
   import i18n from "@/locales";
   const { t } = i18n.global;
   ```
2. 替换 script 中所有硬编码中文为 `t("...")`
3. 替换 template 中所有硬编码中文为 `{{ t("...") }}`（文本节点）或 `:prop="t('...')"` （属性绑定）
4. `console.error/warn` 中的中文同样替换

---

## 准则维护原则

- **追加新准则/规范时，必须以行业标准和主流做法为依据**（如 Vue I18n 官方文档、i18n 最佳实践、ICU MessageFormat 规范等权威来源），不可仅凭个案经验泛化为通用规则。每条新准则须标注来源，便于溯源和验证

## 注意事项

### import 顺序（prettier 强制）

项目 prettier 对 import 排序有严格要求，添加 `import i18n` 时需插入正确位置：

```ts
// ✅ 正确顺序（@/ 在前，@repo/ 其次，第三方最后，相对路径末尾）
import { CreateSteps } from "@/components";
import i18n from "@/locales";
import { Promotion } from "@element-plus/icons-vue";
import Api from "@repo/api";
import StepCardItem from "./StepCardItem.vue";
```

### computed 中的 t() 注意事项

`computed` 内调用 `t()` 是响应式的（语言切换时自动更新），但 `ref` 初始化时调用 `t()` 不会随语言切换更新：

```ts
// ✅ 响应式，语言切换生效
const steps = computed(() => [
  { label: t("op.access.guide._step_connect_platform") },
]);

// ❌ 非响应式，语言切换后不更新
const steps = ref([{ label: t("op.access.guide._step_connect_platform") }]);
```

### 复用 key

同一组件内含义相同的按钮文字应复用同一个 key，不重复定义：

```ts
// "去配置" 在第1步和第4步都用同一个 _btn_configure
buttonText: t("op.access.guide._btn_configure"),
```

---

## 快速检查清单

翻译完成后逐项确认：

- [ ] **Step 1.5 已执行**：Vue 无硬编码中文时，已对比 zh-cn / en locale 块，补全 en 中缺失的 key（防止英文模式显示原始 key 路径）
- [ ] **Step 2 已读 locale 文件验证实际层级**，未仅凭路径推导写 key（防止 `op.model.guide` vs `op.model.model.guide` 类错误）
- [ ] **Step 3a 已 Grep 搜索每条中文文本**，确认无现有 key 后才新建（防止重复 key）
- [ ] zh-cn 和 en locale 文件都已更新，key 数量一致
- [ ] Vue 文件中无遗漏的硬编码中文（含 console、注释除外）
- [ ] `import i18n` 的位置符合 prettier import 顺序规范
- [ ] 动态步骤/列表用 `computed` 包裹（而非 `ref`），保证响应式
- [ ] 相同文字复用同一 key，未重复定义

---

## 参考示例

以 `apps/hashrate/src/views/index/op/access/guide/index.vue` 为例，`access.guide` 下新增 key 应使用如下语义化命名（**新规范，不再用序号**）：

```ts
// zh-cn/op.ts  →  op.access.guide
guide: {
  _page_title:                        "接入管理 · 快速开始",
  _page_subtitle:                     "按照以下步骤完成云平台接入，开始使用算力资源",
  _step_connect_platform:             "接入云平台",
  _step_connect_platform_desc:        "注册私有云或公有云厂商平台，是后续所有接入操作的基础。",
  _btn_configure:                     "去配置",
  _step_authorize_platform:           "云平台授权",
  _step_authorize_platform_desc:      "将云平台的使用权限授予指定租户，租户授权后方可使用对应云平台的资源。",
  _btn_authorize:                     "去授权",
  _step_connect_account:              "接入账号",
  _step_connect_account_desc:         "为租户绑定云平台的访问凭证（AK/SK 等），系统通过账号拉取并管理云端资源。",
  _btn_add:                           "去添加",
  _step_connect_resource_pool:        "接入资源池",
  _step_connect_resource_pool_desc:   "配置可用的云区域与可用区，启用后资源池将可被业务系统正常使用。",
  _step_authorize_resource_pool:      "资源池授权",
  _step_authorize_resource_pool_desc: "将资源池的访问权限分配给业务单元，完成后业务系统可正式调用云端算力资源。",
  _msg_all_done:                      "🎉 所有步骤已完成，接入配置已就绪！",
  _error_guide_load_failed:           "接入管理向导：数据加载失败",
}
```

**注意**：文件中已存在的旧 key（如 `_ap0001`）保持不变，新增时使用新规范即可。
