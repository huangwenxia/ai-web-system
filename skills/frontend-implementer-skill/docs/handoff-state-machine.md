# Handoff State Machine

本文件用于快速判断 `frontend-implementer-skill` 是否继续执行，还是转交其他 skill。只有链路不清楚时读取。

```mermaid
flowchart TD
  A["用户任务进入"] --> B{"是否已有明确原型 / 现有代码 / bug 复现 / 重构目标？"}
  B -- "没有，新功能仍在业务或页面骨架阶段" --> C["转 existing-project-feature-skill 或 agione-ui"]
  B -- "有" --> D{"主任务类型"}
  D -- "新功能实现" --> E["frontend-implementer 执行实现"]
  D -- "bug 修复 / 局部优化" --> F["frontend-implementer 执行修复；必要时由 existing-project-fix 编排"]
  D -- "翻译 / 术语 / i18n 为主" --> G["转 translate-terms-skill"]
  D -- "独立结构 / 视觉 / UX 审查" --> H["转 page-review-skill"]
  E --> I{"实现中发现原型缺口或结构风险？"}
  I -- "是" --> C
  I -- "否" --> J{"是否命中 project-mamba 新功能？"}
  J -- "是" --> K["运行自动检查脚本 + 最终代码校验表"]
  J -- "否" --> L["按普通实现输出模板交付"]
  K --> M{"是否需要独立审查？"}
  L --> M
  M -- "是" --> H
  M -- "否" --> N["输出风险、验证建议、回写候选"]
```

## 判定口径
- 新功能但原型未确认，不进入落码。
- 实现过程中暴露翻译问题，可以叠加 `translate-terms-skill`，不必打断主链路。
- 只有当问题本身变成结构、视觉或 UX 诊断，才转 `page-review-skill`。
- 命中 `project-mamba` 时，拓扑和 route ownership 未确认之前，不进入正式组件选型。
