# assets

这里存放独立于真实项目的前端资产层，用于承接：

- 组件候选与正式组件
- 页面草稿与可复用页面范式
- 视觉 / 布局 / 交互模式
- 评审记录
- 同步所需 manifest 元数据

---

## 目录结构

```
assets/
├── components/
│   ├── candidates/          # 组件候选区（draft 状态）
│   ├── official/            # 正式组件区（official 状态）
│   └── manifests/           # 组件 manifest
│       ├── *.manifest.json
│       └── component.manifest.template.json
│
├── pages/
│   ├── drafts/              # 页面草稿区
│   ├── reusable/            # 可复用页面范式
│   └── manifests/           # 页面 manifest
│       ├── *.manifest.json
│       └── page.manifest.template.json
│
├── patterns/
│   ├── visual/              # 视觉模式
│   ├── layout/              # 布局模式
│   ├── interaction/         # 交互模式
│   └── manifests/           # Pattern manifest
│       ├── *.manifest.json
│       └── pattern.manifest.template.json
│
└── reviews/                 # 评审记录
    ├── component-reviews/
    ├── page-reviews/
    └── sync-reviews/
```

---

## 资产类型

| 类型 | 说明 | Manifest 模板 |
|------|------|----------------|
| `component` | UI 组件 | `component.manifest.template.json` |
| `page` | 页面 | `page.manifest.template.json` |
| `pattern` | 模式（visual/layout/interaction） | `pattern.manifest.template.json` |

---

## Manifest 字段说明

### 基础字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 资产名称 |
| `type` | string | `component` / `page` / `pattern` |
| `status` | string | 治理状态 |
| `version` | string | 版本号 |

### status 状态流转

```
draft → candidate → official → synced
  ↑___________________________|
```

| 状态 | 说明 |
|------|------|
| `draft` | 刚生成，尚未进入评审 |
| `candidate` | 具备初步复用价值，等待成熟度评审 |
| `official` | 已成为知识库正式资产 |
| `synced` | 已同步进入真实项目 |

### source 来源

| 字段 | 说明 |
|------|------|
| `task` | 来源任务名称 |
| `createdFrom` | 使用的 Skill/Agent |
| `createdAt` | 创建日期 |

### compatibility 兼容性

| 字段 | 说明 |
|------|------|
| `projects` | 兼容的项目列表 |
| `dependencies` | 依赖列表 |
| `forbidden` | 禁止使用的依赖 |

### sync 同步信息

| 字段 | 说明 |
|------|------|
| `allowed` | 是否允许同步 |
| `targetProject` | 目标项目名 |
| `targetPath` | 目标路径 |
| `lastSyncedAt` | 上次同步时间 |

### review 评审结论

| 字段 | 说明 |
|------|------|
| `reusability` | 可复用性 |
| `apiStability` | API 稳定性（component） |
| `visualQuality` | 视觉质量（component） |
| `boundaryCompleteness` | 边界完整性（component） |
| `structureQuality` | 结构质量（page） |
| `completeness` | 完整性（page） |
| `quality` | 质量（pattern） |
| `notes` | 评审备注 |

---

## 快速开始

### 创建 Manifest

```bash
# 创建组件 manifest
node scripts/asset-tools/create-manifest.mjs --type=component --name=MyCard

# 创建页面 manifest
node scripts/asset-tools/create-manifest.mjs --type=page --name=Dashboard

# 创建 pattern manifest
node scripts/asset-tools/create-manifest.mjs --type=pattern --name=CardGrid
```

### 校验 Manifest

```bash
# 校验所有 manifest
node scripts/asset-tools/verify-manifests.mjs

# 校验指定目录
node scripts/asset-tools/verify-manifests.mjs --dir=components/manifests
```

### 晋升资产状态

```bash
# 晋升为 candidate
node scripts/asset-tools/promote-asset.mjs --manifest=MyCard.manifest.json --status=candidate

# 晋升为 official
node scripts/asset-tools/promote-asset.mjs --manifest=MyCard.manifest.json --status=official
```

### 同步到真实项目

```bash
# 先校验兼容性
node scripts/asset-tools/validate-asset-compatibility.mjs --manifest=MyCard.manifest.json

# 同步到项目
node scripts/asset-tools/sync-asset-to-project.mjs \
  --source=components/candidates/MyCard.vue \
  --manifest=components/manifests/MyCard.manifest.json \
  --target=components/MyCard.vue
```

### 汇总回写记录

```bash
# 汇总所有回写记录
node scripts/asset-tools/collect-writeback-items.mjs

# 详细格式
node scripts/asset-tools/collect-writeback-items.mjs --format=detail
```

---

## 使用原则

1. **新产物先进入候选区或草稿区**
2. **通过评审后再晋升到 official / reusable**
3. **是否允许同步到真实项目，以 manifest.sync.allowed 为准**
4. **晋升记录和回写动作会自动追踪**
