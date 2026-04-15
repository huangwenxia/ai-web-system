# Locale Entry Template

可用作新增 locale key 时的最小模板参考：

```ts
moduleName: {
  featureName: {
    _page_title: "",
    _page_subtitle: "",
    _btn_confirm: "",
    _btn_cancel: "",
    _empty_desc: "",
    _error_load_failed: "",
    _msg_success: "",
  },
}
```

使用时注意：
- 先确认真实对象层级，再套模板
- 同步更新 zh-cn 与 en
- 优先复用已有 key，不要为套模板而新增重复 key
