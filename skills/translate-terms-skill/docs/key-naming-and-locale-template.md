# Key 命名与 Locale 更新模板

本文件补充 `translate-terms-skill` 中关于 key 命名、locale 层级确认和双语同步的规则。

## key 命名原则
手动新增 key 时，优先使用语义化 snake_case，并保持见名知义。

常见命名模式：
- 页面标题：`_page_title`
- 页面副标题：`_page_subtitle`
- 步骤标题：`_step_xxx`
- 步骤说明：`_step_xxx_desc`
- 按钮：`_btn_xxx`
- 字段标签：`_field_name`
- 占位符：`_field_name_placeholder`
- 成功提示：`_xxx_success`
- 错误提示：`_error_xxx`
- 通用消息：`_msg_xxx`

## 禁止事项
- 不要新增 `_ap0001`、`_tmp01` 这类无语义 key
- 不要只凭文件路径猜测 key 层级
- 不要只补 zh-cn，不补 en
- 不要在配置项里只保存 `labelKey` / `titleKey` / `i18nKey`，再把翻译动作延迟到模板、render 函数或通用组件内部

## locale 层级确认
根据输入路径推断 locale 目录可以作为起点，但不能直接当结果。

标准动作：
1. 先根据文件路径定位可能的 locale 文件
2. 打开 locale 文件核实对象嵌套层级
3. 确认真实 key 前缀后再写入 Vue 和 locale

## 中文 value 可读性
- `zh-cn` / `zh-CN` locale value 必须直接写 UTF-8 可读中文，不使用 `\uXXXX` Unicode escape；不能用 Unicode escape 作为防乱码手段。
- 枚举 label、状态文案、按钮文案、提示文案和业务展示常量同样保持中文直写。
- 如果出现乱码，先修复文件编码、读写方式、终端显示编码或生成脚本配置，不要把中文转义成 ASCII。
- 正则里的单个中文字符或中文标点也优先直写（如 `/[,，]/`）；只有 Unicode 字符范围匹配等技术场景可以保留 `\uXXXX`（如 `/[\u4e00-\u9fff]/` 或 `new RegExp('[\\u4e00-\\u9fff]')`），且这类例外必须不是界面文案。

## 双语同步模板
新增 key 时，zh-cn 和 en 应同步更新。

可参考：

```ts
guide: {
  _page_title: "接入管理 · 快速开始",
  _btn_configure: "去配置",
  _error_load_failed: "数据加载失败",
}
```

```ts
guide: {
  _page_title: "Quick Start for Access Management",
  _btn_configure: "Configure",
  _error_load_failed: "Failed to load data",
}
```

## 响应式提醒
如果翻译文案位于动态步骤、卡片列表或配置项中，优先在 `computed` 或等价响应式上下文中直接产出 `label` / `title` / `text` 等展示字段，避免语言切换后文案不更新，也避免把 key 延迟交给渲染层再 `t(key)`。
