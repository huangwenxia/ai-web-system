# asset-tools

知识库资产治理相关脚本。

---

## 脚本列表

| 脚本 | 作用 |
|------|------|
| `create-manifest.mjs` | 为组件/页面/pattern 创建 Manifest |
| `verify-manifests.mjs` | 校验 Manifest 完整性和一致性 |
| `promote-asset.mjs` | 晋升资产状态 |
| `validate-asset-compatibility.mjs` | 校验依赖兼容性 |
| `sync-asset-to-project.mjs` | 同步资产到真实项目 |
| `collect-writeback-items.mjs` | 汇总回写记录 |
| `sync-candidate-to-hashrate-preview.mjs` | 同步到预览区（hashrate） |
| `sync-page-draft-to-hashrate-preview.mjs` | 同步页面草稿到预览区 |

---

## 通用特性

- **无硬编码路径**：所有路径基于项目根目录解析
- **支持相对路径**：可使用相对路径或绝对路径
- **详细日志**：提供清晰的执行结果反馈
- **错误处理**：包含完整的错误检查和提示

---

## create-manifest.mjs

创建新的 Manifest 文件。

```bash
# 创建组件 Manifest
node create-manifest.mjs --type=component --name=MyCard

# 创建页面 Manifest
node create-manifest.mjs --type=page --name=Dashboard

# 创建 Pattern Manifest
node create-manifest.mjs --type=pattern --name=CardGrid
```

---

## verify-manifests.mjs

校验 Manifest 文件的完整性和一致性。

```bash
# 校验所有 Manifest
node verify-manifests.mjs

# 校验指定目录
node verify-manifests.mjs --dir=components/manifests
```

**检查项**：
- JSON 格式有效性
- 必填字段是否存在
- status 是否为有效值
- 资产文件是否存在
- 日期格式是否正确

---

## promote-asset.mjs

晋升资产状态。

```bash
# 晋升为 candidate
node promote-asset.mjs --manifest=MyCard.manifest.json --status=candidate

# 晋升为 official
node promote-asset.mjs --manifest=MyCard.manifest.json --status=official
```

**状态流转**：
```
draft → candidate → official → synced
```

---

## validate-asset-compatibility.mjs

校验资产依赖是否与目标项目兼容。

```bash
node validate-asset-compatibility.mjs --manifest=MyCard.manifest.json
```

**前提**：目标项目需要有 `package.json`。

---

## sync-asset-to-project.mjs

将资产同步到真实项目。

```bash
node sync-asset-to-project.mjs \
  --source=components/candidates/MyCard.vue \
  --manifest=components/manifests/MyCard.manifest.json \
  --target=components/MyCard.vue
```

**前提条件**：
- `manifest.sync.allowed` 必须为 `true`
- `manifest.status` 必须为 `official` 或 `synced`

---

## collect-writeback-items.mjs

汇总所有触发了回写动作的资产。

```bash
# 简洁汇总
node collect-writeback-items.mjs

# 详细格式
node collect-writeback-items.mjs --format=detail

# JSON 格式
node collect-writeback-items.mjs --format=json
```

---

## 维护原则

- 脚本只负责同步或校验，不隐式改写源文件内容
- 涉及文本写入时，优先明确指定 UTF-8
- 使用 `utils.mjs` 提供的公共工具确保代码一致性
