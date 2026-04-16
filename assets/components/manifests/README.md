# components/manifests

组件 Manifest 存放处。

## 模板文件

- `component.manifest.template.json` - 组件 Manifest 模板

## 使用方法

```bash
# 创建新组件的 Manifest
node scripts/asset-tools/create-manifest.mjs --type=component --name=MyComponent

# 校验所有 Manifest
node scripts/asset-tools/verify-manifests.mjs --dir=components/manifests
```

## 字段说明

| 字段 | 说明 |
|------|------|
| `name` | 组件名称 |
| `type` | 固定为 `component` |
| `status` | `draft` → `candidate` → `official` → `synced` |
| `version` | 版本号 |
| `source` | 来源信息 |
| `compatibility` | 兼容性信息 |
| `sync` | 同步控制 |
| `review` | 评审结论 |
| `tags` | 标签 |
| `promotionHistory` | 晋升历史（自动记录） |

## 状态流转

```
draft → candidate → official → synced
```

| 状态 | 说明 |
|------|------|
| `draft` | 刚生成，尚未进入评审 |
| `candidate` | 具备初步复用价值，等待成熟度评审 |
| `official` | 已成为知识库正式资产 |
| `synced` | 已同步进入真实项目 |
