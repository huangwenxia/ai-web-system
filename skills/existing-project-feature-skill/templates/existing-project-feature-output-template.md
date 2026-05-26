# 既有项目新功能开发输出模板

```md
## 所属工作流

- 主类型：A-1 既有项目新功能开发
- 原型来源：external_design / agione_ui_generated
- 原型确认状态：已确认 / 待先生成并确认

## 输入前提

## 上下文归一化

- 目标范围：
- 业务目标：
- 来源材料：
- 约束条件：
- 现有复用模式：
- 是否需要翻译 / i18n：

## 调用的子 Skill 链路

- agione-ui：
- frontend-implementer-skill：
- translate-terms-skill：
- page-review-skill：

## 实施前复用校验表（命中 project-mamba 时）

- 当前目标项目：
- app 拓扑：T1 common-shell source / T2 common-view mixed / T3 multi-source route / T4 standalone route
- route ownership：本地 `src/views` / `~common` / `~cbdp` / 其他
- 拓扑验证：已核对 `vite.config.ts` / `src/main.ts` / router 入口；矩阵是否需回写：
- 页面类型：
- 页面壳：
- 字段映射：
- 常量来源：
- 工具来源：
- 加载策略：
- bootstrap 来源：本地 / `@common` / 跨 app 复用

## 关键原型 / 实施决策

## 当前交付结果

## 边界状态与产品级细节检查

- 加载态：
- 空态：
- 错误态：
- 权限态：
- 禁用态：
- 对齐 / 间距 / 节奏 / 顺滑度：

## 最终代码校验（命中 project-mamba 新功能时）

- 自动检查命令：
- 自动检查结果：通过 / 未通过 / 未运行（说明原因）
- `.vue <= 250`：达标 / 未达标 / 排除（locale / schema / 纯配置 / 旧文件历史超限）
- 复用检查：已查 `easybill-ui` / `apps/common` / 当前项目 `commons` / `views/components` / `@repo/hooks` / 当前项目 `utils`
- 新增组件 / Hook 抽离清单：
- 函数长度：达标 / 未达标
- Vue 3 语法：`<script setup>` / TypeScript / `defineModel` 优先 / `computed` 优先 / `watch` 仅副作用 / `defineProps` 类型与默认值合规
- Tailwind / Element Plus / 原生 HTML 使用：达标 / 未达标
- 未达标整改或例外原因：

## 风险与影响范围

## 最小验证建议

## 是否需要叠加独立审查流

- page-review-skill：

## 回写候选

- 是否回写标准：
- 目标目录：
- 解决问题：
- 适用场景：
- 不适用场景 / 边界：
- 证据来源等级：
- 回写层级：`skills/` / `rules/` / Claude memory / 仅当前任务结论

## Skill 同步升级

- 是否需要更新当前主 skill：
- 是否需要更新子 skill：
- 需更新文件：
- 需更新内容：执行前先读 / docs / templates / handoff / guardrails / 输出模板或检查清单
```
