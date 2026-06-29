# agione-ui Benchmark 04 · Form + Drawer

请使用 `agione-ui` strict 模式生成一个单文件 HTML 原型。

输出文件：`{OUTPUT_DIR}/04-form-drawer.html`

页面：Admin 侧「额度策略」管理页，含创建策略抽屉。

业务要求：
- 主页面为标准列表页：HeaderBox + FilterBox + DataTable。
- 点击「新建策略」打开右侧 Drawer。
- Drawer 标题：`新建额度策略` / `Create Quota Policy`。
- 表单必须使用 form-modern 或现有表单组件约束，不要散装 label/input。
- 字段：策略名称、适用组织、资源类型、GPU 上限、CPU 上限、有效期、审批方式、是否启用。
- 审批方式是单选：自动审批、管理员审批、超过阈值审批。必须使用 agione-ui radio variant，不要使用裸 `<el-radio>`。
- 是否启用使用 switch 或 checkbox，不要用两个按钮伪装开关。
- GPU/CPU 上限是数字输入，单位不可换行。
- Drawer 底部操作：取消、保存策略。
- 表单包含错误态示例：策略名称为空、GPU 上限超过组织配额。

必须覆盖的 mock 数据：
- 列表至少 5 行。
- 至少 1 条禁用策略、1 条超过阈值审批策略。
- Drawer 默认打开，方便评测表单布局。

验收重点：
- 无裸 `<el-radio>`。
- 表单分组不用 CardBox 乱包。
- 错误文案说清楚发生什么和怎么处理。
- Drawer 尺寸和内容在 1440px 与移动宽度下不应溢出。
