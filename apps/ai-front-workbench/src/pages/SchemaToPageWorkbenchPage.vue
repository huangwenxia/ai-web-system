<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed, ref } from 'vue'

import WorkbenchExampleCard from '../components/WorkbenchExampleCard.vue'
import { assetRegistry } from '../registry'
import {
 type FieldSemantic,
 type InputMode,
 type SchemaEndpoint,
 type SchemaField,
 type SchemaPageInput,
 openApiPresets,
 parseOpenApiInput,
 parseSampleInput,
 parseSchemaInput,
 sampleResponsePresets,
 schemaPresets,
} from '../schema-to-page'

type Confidence = 'high' | 'medium' | 'low'
type InferredPageType = 'overview' | 'list' | 'detail'
type BlockType = 'metrics' | 'table' | 'detail' | 'activity' | 'list'

interface InferredBlock {
 id: string
 title: string
 blockType: BlockType
 confidence: Confidence
 layout: string
 reason: string
 actions: string[]
 fields: SchemaField[]
 endpoint: SchemaEndpoint
 matchedAssets: typeof assetRegistry
}

const inputMode = ref<InputMode>('sample')

const usageSteps = [
 {
  title: '贴结构',
  description: '支持样例 JSON、OpenAPI 或手工 schema，不需要先整理成固定格式。',
 },
 {
  title: '看区块建议',
  description: '右侧先把数据拆成区块，再判断复用哪些组件、还缺哪些能力。',
 },
 {
  title: '再进真实项目',
  description: '只有结构和边界清晰后，再进入真实项目实现，避免直接平铺静态 DOM。',
 },
]

const schemaPresetOptions = [
 { id: 'resourceOverview', label: '手工 schema：运营总览页' },
 { id: 'deploymentDetail', label: '手工 schema：部署详情页' },
]

const samplePresetOptions = [
 { id: 'resourceOverview', label: '样例 JSON：运营总览页' },
 { id: 'deploymentDetail', label: '样例 JSON：部署详情页' },
]

const openApiPresetOptions = [
 { id: 'resourceOverview', label: 'OpenAPI：运营总览接口' },
 { id: 'deploymentFieldDefinitions', label: '字段定义：部署详情页' },
]

const selectedSchemaPresetId = ref(schemaPresetOptions[0].id)
const selectedSamplePresetId = ref(samplePresetOptions[0].id)
const selectedOpenApiPresetId = ref(openApiPresetOptions[0].id)

const schemaText = ref(JSON.stringify(schemaPresets[selectedSchemaPresetId.value], null, 2))
const sampleText = ref(JSON.stringify(sampleResponsePresets[selectedSamplePresetId.value], null, 2))
const openApiText = ref(JSON.stringify(openApiPresets[selectedOpenApiPresetId.value], null, 2))

function loadSchemaPreset(presetId: string) {
 selectedSchemaPresetId.value = presetId
 schemaText.value = JSON.stringify(schemaPresets[presetId], null, 2)
}

function loadSamplePreset(presetId: string) {
 selectedSamplePresetId.value = presetId
 sampleText.value = JSON.stringify(sampleResponsePresets[presetId], null, 2)
}

function loadOpenApiPreset(presetId: string) {
 selectedOpenApiPresetId.value = presetId
 openApiText.value = JSON.stringify(openApiPresets[presetId], null, 2)
}

function handleSchemaPresetChange(event: Event) {
 const target = event.target as HTMLSelectElement | null
 if (target?.value) {
  loadSchemaPreset(target.value)
 }
}

function handleSamplePresetChange(event: Event) {
 const target = event.target as HTMLSelectElement | null
 if (target?.value) {
  loadSamplePreset(target.value)
 }
}

function handleOpenApiPresetChange(event: Event) {
 const target = event.target as HTMLSelectElement | null
 if (target?.value) {
  loadOpenApiPreset(target.value)
 }
}

function switchInputMode(mode: InputMode) {
 inputMode.value = mode
}

const parsedResult = computed(() => {
 switch (inputMode.value) {
  case 'sample':
   return parseSampleInput(sampleText.value)
  case 'openapi':
   return parseOpenApiInput(openApiText.value)
  case 'schema':
  default:
   return parseSchemaInput(schemaText.value)
 }
})

const parsedInput = computed<SchemaPageInput | null>(() => parsedResult.value.value)
const parseError = computed(() => parsedResult.value.error)
const normalizedSchemaText = computed(() => (parsedInput.value ? JSON.stringify(parsedInput.value, null, 2) : ''))
const shouldShowNormalizedSchema = computed(() => Boolean(parsedInput.value) && inputMode.value !== 'schema')
const normalizedSchemaTitle = computed(() =>
 inputMode.value === 'openapi' ? 'OpenAPI / 字段定义归一后的 Schema' : '自动识别后的 Schema'
)

const currentInputLabel = computed(() => {
 switch (inputMode.value) {
  case 'sample':
   return '样例 JSON 自动识别'
  case 'openapi':
   return 'OpenAPI / 字段定义自动归一'
  case 'schema':
  default:
   return '手工 schema 精修'
 }
})

function inferPageType(input: SchemaPageInput): InferredPageType {
 const objectCount = input.endpoints.filter((item) => item.shape === 'object').length
 const arrayCount = input.endpoints.filter((item) => item.shape === 'array').length

 if (objectCount >= 2 && arrayCount <= 1) {
  return 'detail'
 }

 if (arrayCount >= 2) {
  return 'list'
 }

 return 'overview'
}

function getFieldSemanticCount(fields: SchemaField[], semantic: FieldSemantic) {
 return fields.filter((field) => field.semantic === semantic).length
}

function getBlockType(endpoint: SchemaEndpoint): BlockType {
 const metricCount = getFieldSemanticCount(endpoint.fields, 'metric') + getFieldSemanticCount(endpoint.fields, 'progress')
 const statusCount = getFieldSemanticCount(endpoint.fields, 'status')
 const datetimeCount = getFieldSemanticCount(endpoint.fields, 'datetime')
 const primaryCount = getFieldSemanticCount(endpoint.fields, 'primary')

 if (endpoint.shape === 'object' && metricCount >= 2) {
  return 'metrics'
 }

 if (endpoint.shape === 'array' && datetimeCount >= 1 && endpoint.fields.length <= 4 && primaryCount === 0) {
  return 'activity'
 }

 if (endpoint.shape === 'array' && endpoint.fields.length >= 4) {
  return 'table'
 }

 if (endpoint.shape === 'object') {
  return 'detail'
 }

 if (endpoint.shape === 'array' && statusCount >= 1) {
  return 'list'
 }

 return 'list'
}

function getBlockConfidence(endpoint: SchemaEndpoint): Confidence {
 const unknownCount = getFieldSemanticCount(endpoint.fields, 'unknown')
 if (unknownCount >= 2) {
  return 'low'
 }
 if (unknownCount === 1) {
  return 'medium'
 }
 return 'high'
}

function getBlockLayout(blockType: BlockType) {
 switch (blockType) {
  case 'metrics':
   return '首屏指标卡 + 状态判断'
  case 'table':
   return '筛选栏 + 主表格 + 批量动作'
  case 'detail':
   return '头部摘要 + 关键信息卡'
  case 'activity':
   return '动态流 / 时间线 / 最近变化'
  case 'list':
   return '卡片列表 / 分组列表'
 }
}

function getBlockReason(endpoint: SchemaEndpoint, blockType: BlockType) {
 switch (blockType) {
  case 'metrics':
   return `${endpoint.label} 以数量、比率、规模判断为主，适合放在首屏概览。`
  case 'table':
   return `${endpoint.label} 同时包含主字段、状态、负责人和时间，更像真正的主操作区。`
  case 'detail':
   return `${endpoint.label} 是单对象结构，适合作为详情头部或摘要区。`
  case 'activity':
   return `${endpoint.label} 更像记录流，不适合直接重表格化。`
  case 'list':
   return `${endpoint.label} 信息密度适中，适合轻量列表或卡片分组。`
 }
}

function getAssetKeywords(blockType: BlockType) {
 switch (blockType) {
  case 'metrics':
   return ['card', 'example']
  case 'table':
   return ['list-tab-box', 'component']
  case 'detail':
   return ['overview', 'page']
  case 'activity':
   return ['overview', 'draft']
  case 'list':
   return ['component', 'shared']
 }
}

function getMatchedAssets(blockType: BlockType) {
 const keywords = getAssetKeywords(blockType)

 return assetRegistry
  .filter((asset) => {
   const haystack = [asset.name, ...asset.tags, ...asset.compatibility.dependencies].join(' ').toLowerCase()
   return keywords.some((keyword) => haystack.includes(keyword))
  })
  .slice(0, 3)
}

const inferredBlocks = computed<InferredBlock[]>(() => {
 if (!parsedInput.value) {
  return []
 }

 return parsedInput.value.endpoints.map((endpoint, index) => {
  const blockType = getBlockType(endpoint)

  return {
   id: `${endpoint.name}-${index}`,
   title: endpoint.label,
   blockType,
   confidence: getBlockConfidence(endpoint),
   layout: getBlockLayout(blockType),
   reason: getBlockReason(endpoint, blockType),
   actions: endpoint.actions ?? [],
   fields: endpoint.fields,
   endpoint,
   matchedAssets: getMatchedAssets(blockType),
  }
 })
})

const inferredPageType = computed<InferredPageType>(() => (parsedInput.value ? inferPageType(parsedInput.value) : 'overview'))
const totalFieldCount = computed(() => inferredBlocks.value.reduce((sum, block) => sum + block.fields.length, 0))
const unknownFieldCount = computed(() =>
 inferredBlocks.value.reduce((sum, block) => sum + block.fields.filter((field) => field.semantic === 'unknown').length, 0)
)

const nextFlow = computed(() => {
 if (!parsedInput.value) {
  return '先把输入整理成可解析结构，再进入组件装配建议。'
 }

 if (parsedInput.value.workMode === 'prototype' || unknownFieldCount.value > 0) {
  return '建议先停留在组件装配和字段语义确认阶段，先收敛区块职责和缺口。'
 }

 return '结构已经比较清晰，可以继续进入真实项目实现，用现有组件装配页面并补齐少量缺口。'
})

const pendingQuestions = computed(() => {
 if (!parsedInput.value) {
  return []
 }

 const questions: string[] = []

 if (inputMode.value !== 'schema' && unknownFieldCount.value > 0) {
  questions.push('自动归一结果里仍有 unknown 字段，建议先确认这些字段到底承接状态、主信息还是说明文本。')
 }

 for (const endpoint of parsedInput.value.endpoints) {
  if (endpoint.shape === 'array' && !endpoint.fields.some((field) => field.semantic === 'primary')) {
   questions.push(`${endpoint.label} 缺少主字段，当前更难确定表格或列表的第一视觉焦点。`)
  }

  if ((endpoint.actions ?? []).length === 0) {
   questions.push(`${endpoint.label} 还没有明确动作区，建议确认它是浏览区还是操作区。`)
  }
 }

 return questions
})

const boundaryStates = computed(() => {
 if (!parsedInput.value) {
  return []
 }

 return [
  'loading：接口返回前的骨架与占位',
  'empty：列表为空、指标为空时的替代文案',
  'error：请求失败或字段缺失时的反馈方式',
  'permission：是否存在只读态、禁用态和权限差异',
  parsedInput.value.workMode === 'prototype'
   ? 'pending-confirmation：字段语义尚未完全确认时的临时占位'
   : 'design-aligned：结构确认后需要严格贴合页面视觉',
 ]
})

function getSampleValue(field: SchemaField, index = 0) {
 const order = index + 1

 switch (field.semantic) {
  case 'metric':
   return ['128', '32', '14', '96'][index % 4]
  case 'progress':
   return ['82%', '68%', '94%', '57%'][index % 4]
  case 'status':
   return ['运行中', '待处理', '异常'][index % 3]
  case 'datetime':
   return `2026-04-17 1${index}:30`
  case 'owner':
   return ['张蕊', '王悦', '李骁'][index % 3]
  case 'money':
   return ['￥12,800', '￥36,000', '￥8,600'][index % 3]
  case 'enum':
   return ['标准型', '高性能', '共享型'][index % 3]
  case 'primary':
   return `${field.label}${order}`
  case 'text':
   return `${field.label}需要进一步确认说明`
  case 'unknown':
   return '待确认'
 }
}

function getConfidenceTone(confidence: Confidence) {
 switch (confidence) {
  case 'high':
   return 'success'
  case 'medium':
   return 'info'
  case 'low':
   return 'warning'
 }
}

function getConfidenceLabel(confidence: Confidence) {
 switch (confidence) {
  case 'high':
   return '高置信'
  case 'medium':
   return '中置信'
  case 'low':
   return '待确认'
 }
}

function getBlockTypeLabel(blockType: BlockType) {
 switch (blockType) {
  case 'metrics':
   return '指标总览'
  case 'table':
   return '主操作表格'
  case 'detail':
   return '详情摘要'
  case 'activity':
   return '动态记录'
  case 'list':
   return '分组列表'
 }
}

function getPageTypeLabel(pageType: InferredPageType) {
 switch (pageType) {
  case 'overview':
   return '总览型页面'
  case 'list':
   return '列表 / 工作台页面'
  case 'detail':
   return '详情 / 配置页面'
 }
}
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <section class="wb-top-grid">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">使用方式</div>
       <p class="wb-card-heading-note">先把结构喂进来，再看组件装配建议和页面骨架。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-card-grid wb-card-grid--three">
       <article v-for="step in usageSteps" :key="step.title" class="wb-step-card">
        <div class="wb-step-index">FLOW</div>
        <h3 class="wb-card-title">{{ step.title }}</h3>
        <p class="wb-card-note">{{ step.description }}</p>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">当前判断</div>
       <p class="wb-card-heading-note">先判结构和边界，再决定是不是能直接进真实项目实现。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article class="wb-metric-item">
        <div class="wb-metric-label">输入模式</div>
        <div class="wb-metric-value wb-metric-value--small">{{ currentInputLabel }}</div>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">已沉淀资产</div>
        <div class="wb-metric-value">{{ assetRegistry.length }}</div>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">识别区块</div>
        <div class="wb-metric-value">{{ inferredBlocks.length }}</div>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">待确认字段</div>
        <div class="wb-metric-value">{{ unknownFieldCount }}</div>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <section class="wb-tool-layout">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">输入</div>
       <p class="wb-card-heading-note">支持样例响应、OpenAPI / 字段定义，以及手工 schema 精修。</p>
      </div>
     </template>

     <CardBoxBody class="wb-stack">
      <div class="wb-toggle-row">
       <button
        class="wb-toggle-button"
        :data-active="inputMode === 'sample'"
        type="button"
        @click="switchInputMode('sample')"
       >
        样例响应 JSON
       </button>
       <button
        class="wb-toggle-button"
        :data-active="inputMode === 'openapi'"
        type="button"
        @click="switchInputMode('openapi')"
       >
        OpenAPI / 字段定义
       </button>
       <button
        class="wb-toggle-button"
        :data-active="inputMode === 'schema'"
        type="button"
        @click="switchInputMode('schema')"
       >
        手工 Schema
       </button>
      </div>

      <template v-if="inputMode === 'sample'">
       <label class="wb-field">
        <span class="wb-field-label">样例预设</span>
        <select class="wb-field-control" :value="selectedSamplePresetId" @change="handleSamplePresetChange">
         <option v-for="item in samplePresetOptions" :key="item.id" :value="item.id">
          {{ item.label }}
         </option>
        </select>
       </label>

       <div class="wb-card-row">
        <button class="wb-button" type="button" @click="loadSamplePreset(selectedSamplePresetId)">重置为当前样例</button>
       </div>

       <label class="wb-field">
        <span class="wb-field-label">样例 JSON</span>
        <textarea v-model="sampleText" class="wb-editor-textarea" spellcheck="false" />
       </label>

       <div class="wb-empty-box">
        <ul class="wb-inline-list">
         <li>可以直接粘贴接口返回主体，例如 `data` 或 `response` 里的对象或数组。</li>
         <li>也可以粘贴带元信息的包装结构，例如 `pageName / pageGoal / audience / workMode / response`。</li>
        </ul>
       </div>
      </template>

      <template v-else-if="inputMode === 'openapi'">
       <label class="wb-field">
        <span class="wb-field-label">OpenAPI / 字段定义预设</span>
        <select class="wb-field-control" :value="selectedOpenApiPresetId" @change="handleOpenApiPresetChange">
         <option v-for="item in openApiPresetOptions" :key="item.id" :value="item.id">
          {{ item.label }}
         </option>
        </select>
       </label>

       <div class="wb-card-row">
        <button class="wb-button" type="button" @click="loadOpenApiPreset(selectedOpenApiPresetId)">重置为当前预设</button>
       </div>

       <label class="wb-field">
        <span class="wb-field-label">OpenAPI / 字段定义 JSON</span>
        <textarea v-model="openApiText" class="wb-editor-textarea" spellcheck="false" />
       </label>

       <div class="wb-empty-box">
        <ul class="wb-inline-list">
         <li>支持完整 OpenAPI 文档，也支持单独粘贴 `schema`、`content`、`responses` 等片段。</li>
         <li>如果后端只给了字段定义，也可以直接粘贴 `fields`、`properties` 或组合结构。</li>
        </ul>
       </div>
      </template>

      <template v-else>
       <label class="wb-field">
        <span class="wb-field-label">Schema 预设</span>
        <select class="wb-field-control" :value="selectedSchemaPresetId" @change="handleSchemaPresetChange">
         <option v-for="item in schemaPresetOptions" :key="item.id" :value="item.id">
          {{ item.label }}
         </option>
        </select>
       </label>

       <div class="wb-card-row">
        <button class="wb-button" type="button" @click="loadSchemaPreset(selectedSchemaPresetId)">重置为当前 schema</button>
       </div>

       <label class="wb-field">
        <span class="wb-field-label">Schema JSON</span>
        <textarea v-model="schemaText" class="wb-editor-textarea" spellcheck="false" />
       </label>

       <div class="wb-empty-box">
        <p class="wb-card-note">字段语义建议值</p>
        <div class="wb-chip-row">
         <span class="wb-chip wb-chip--soft">primary</span>
         <span class="wb-chip wb-chip--soft">metric</span>
         <span class="wb-chip wb-chip--soft">status</span>
         <span class="wb-chip wb-chip--soft">datetime</span>
         <span class="wb-chip wb-chip--soft">owner</span>
         <span class="wb-chip wb-chip--soft">money</span>
         <span class="wb-chip wb-chip--soft">progress</span>
         <span class="wb-chip wb-chip--soft">unknown</span>
        </div>
       </div>
      </template>

      <div v-if="parseError" class="wb-empty-box">
       <h3 class="wb-card-title">JSON 解析失败</h3>
       <p class="wb-card-note">{{ parseError }}</p>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">结构推导</div>
       <p class="wb-card-heading-note">右侧始终复用同一套组件装配推导，只是输入源不同。</p>
      </div>
     </template>

     <CardBoxBody class="wb-stack">
      <template v-if="parsedInput">
       <div class="wb-card-grid wb-card-grid--two">
        <article class="wb-step-card">
         <div class="wb-step-index">PAGE TYPE</div>
         <h3 class="wb-card-title">{{ getPageTypeLabel(inferredPageType) }}</h3>
         <p class="wb-card-note">{{ parsedInput.pageName }}</p>
        </article>
        <article class="wb-step-card">
         <div class="wb-step-index">NEXT FLOW</div>
         <h3 class="wb-card-title">{{ parsedInput.workMode === 'prototype' ? '先装配收敛' : '可继续实现' }}</h3>
         <p class="wb-card-note">{{ nextFlow }}</p>
        </article>
       </div>

       <div class="wb-card-grid wb-card-grid--three">
        <article class="wb-step-card">
         <div class="wb-step-index">ENDPOINTS</div>
         <h3 class="wb-card-title">{{ parsedInput.endpoints.length }}</h3>
         <p class="wb-card-note">已识别页面区块</p>
        </article>
        <article class="wb-step-card">
         <div class="wb-step-index">FIELDS</div>
         <h3 class="wb-card-title">{{ totalFieldCount }}</h3>
         <p class="wb-card-note">进入装配映射的字段数</p>
        </article>
        <article class="wb-step-card">
         <div class="wb-step-index">UNKNOWN</div>
         <h3 class="wb-card-title">{{ unknownFieldCount }}</h3>
         <p class="wb-card-note">仍需人工确认的字段</p>
        </article>
       </div>

       <div class="wb-card">
        <h3 class="wb-card-title">输入摘要</h3>
        <ul class="wb-inline-list">
         <li>页面目标：{{ parsedInput.pageGoal }}</li>
         <li>目标用户：{{ parsedInput.audience }}</li>
         <li>
          工作模式：{{ parsedInput.workMode === 'prototype' ? '只有接口，先推组件装配' : '结构已确认，继续收敛实现' }}
         </li>
         <li>当前输入：{{ currentInputLabel }}</li>
        </ul>
       </div>

       <div v-if="shouldShowNormalizedSchema" class="wb-card">
        <h3 class="wb-card-title">{{ normalizedSchemaTitle }}</h3>
        <p class="wb-card-note">如果自动归一后的结构已经足够清晰，就可以直接继续做组件装配建议。</p>
        <textarea :value="normalizedSchemaText" class="wb-editor-textarea wb-editor-textarea--compact" readonly />
       </div>

       <div class="wb-card">
        <h3 class="wb-card-title">建议补齐的边界状态</h3>
        <ul class="wb-inline-list">
         <li v-for="state in boundaryStates" :key="state">{{ state }}</li>
        </ul>
       </div>

       <div v-if="pendingQuestions.length" class="wb-card">
        <h3 class="wb-card-title">待确认项</h3>
        <ul class="wb-inline-list">
         <li v-for="item in pendingQuestions" :key="item">{{ item }}</li>
        </ul>
       </div>
      </template>

      <div v-else class="wb-empty-box">
       <p class="wb-card-note">先提供一份可解析的 JSON、OpenAPI 或 schema，右侧才会开始推导结构。</p>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <CardBox v-if="parsedInput" class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">区块建议、组件承接与缺口判断</div>
       <p class="wb-card-heading-note">每个接口先映射成区块，再判断优先复用什么、还缺什么。</p>
      </div>
    </template>

    <CardBoxBody>
     <div class="wb-stack">
      <article v-for="block in inferredBlocks" :key="block.id" class="wb-card">
       <div class="wb-card-row">
        <span class="wb-chip">{{ getBlockTypeLabel(block.blockType) }}</span>
        <span class="wb-status-badge" :data-tone="getConfidenceTone(block.confidence)">
         {{ getConfidenceLabel(block.confidence) }}
        </span>
       </div>

       <h3 class="wb-card-title">{{ block.title }}</h3>
       <p class="wb-card-note">{{ block.endpoint.description }}</p>

       <dl class="wb-metadata">
        <div>
         <dt>建议布局</dt>
         <dd>{{ block.layout }}</dd>
        </div>
        <div>
         <dt>判断依据</dt>
         <dd>{{ block.reason }}</dd>
        </div>
        <div>
         <dt>接口形态</dt>
         <dd>{{ block.endpoint.shape }}</dd>
        </div>
        <div>
         <dt>动作区</dt>
         <dd>{{ block.actions.join(', ') || '待确认' }}</dd>
        </div>
       </dl>

       <div class="wb-subsection-title">字段承接</div>
       <div class="wb-chip-row">
        <span v-for="field in block.fields" :key="field.name" class="wb-chip wb-chip--soft">
         {{ field.label }} / {{ field.semantic }}
        </span>
       </div>

       <div class="wb-subsection-title">优先复用资产</div>
       <div v-if="block.matchedAssets.length" class="wb-card-actions">
        <router-link v-for="asset in block.matchedAssets" :key="asset.id" class="wb-action-link" :to="asset.preview.catalogRoute">
         {{ asset.name }}
        </router-link>
       </div>
       <p v-else class="wb-card-note">当前没有直接命中的沉淀资产，适合补一块新的视觉组件。</p>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>

   <CardBox v-if="parsedInput" class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">页面装配雏形</div>
       <p class="wb-card-heading-note">这里只验证结构和节奏是否成立，不等同于最终设计稿。</p>
      </div>
    </template>

    <CardBoxBody class="wb-preview-shell">
     <section class="wb-preview-hero">
      <div>
       <div class="wb-eyebrow">Generated Skeleton</div>
       <h3 class="wb-title wb-title--preview">{{ parsedInput.pageName }}</h3>
       <p class="wb-card-note">{{ parsedInput.pageGoal }}</p>
      </div>
      <div class="wb-chip-row">
       <span class="wb-chip">{{ getPageTypeLabel(inferredPageType) }}</span>
       <span class="wb-chip wb-chip--soft">{{ parsedInput.audience }}</span>
      </div>
     </section>

     <section v-for="block in inferredBlocks" :key="`${block.id}-preview`" class="wb-generated-section">
      <div class="wb-section-header">
       <div>
        <h3 class="wb-card-title">{{ block.title }}</h3>
        <p class="wb-card-note">{{ getBlockTypeLabel(block.blockType) }}</p>
       </div>
       <div class="wb-chip-row">
        <span v-for="action in block.actions" :key="action" class="wb-chip wb-chip--soft">{{ action }}</span>
       </div>
      </div>

      <div v-if="block.blockType === 'metrics'" class="wb-card-grid wb-card-grid--three">
       <WorkbenchExampleCard
        v-for="(field, index) in block.fields"
        :key="field.name"
        :title="field.label"
        :value="getSampleValue(field, index)"
        :description="field.description || `${field.name} / ${field.semantic}`"
       />
      </div>

      <div v-else-if="block.blockType === 'table'" class="wb-generated-table">
       <div class="wb-chip-row">
        <span
         v-for="field in block.fields.filter((field) => ['status', 'enum', 'owner'].includes(field.semantic))"
         :key="field.name"
         class="wb-chip wb-chip--soft"
        >
         {{ field.label }}筛选
        </span>
       </div>
       <div class="wb-mini-table-wrap">
        <table class="wb-mini-table">
         <thead>
          <tr>
           <th v-for="field in block.fields" :key="field.name">{{ field.label }}</th>
          </tr>
         </thead>
         <tbody>
          <tr v-for="rowIndex in 3" :key="rowIndex">
           <td v-for="field in block.fields" :key="`${rowIndex}-${field.name}`">{{ getSampleValue(field, rowIndex - 1) }}</td>
          </tr>
         </tbody>
        </table>
       </div>
      </div>

      <div v-else-if="block.blockType === 'detail'" class="wb-metadata">
       <div v-for="(field, index) in block.fields" :key="field.name">
        <dt>{{ field.label }}</dt>
        <dd>{{ getSampleValue(field, index) }}</dd>
       </div>
      </div>

      <div v-else-if="block.blockType === 'activity'" class="wb-stack">
       <article v-for="rowIndex in 3" :key="rowIndex" class="wb-step-card">
        <div class="wb-step-index">
         {{ getSampleValue(block.fields.find((field) => field.semantic === 'datetime') || block.fields[0], rowIndex - 1) }}
        </div>
        <h4 class="wb-card-title">
         {{ getSampleValue(block.fields.find((field) => field.semantic === 'text') || block.fields[0], rowIndex - 1) }}
        </h4>
        <p class="wb-card-note">
         {{ getSampleValue(block.fields.find((field) => field.semantic === 'status') || block.fields[0], rowIndex - 1) }}
        </p>
       </article>
      </div>

      <div v-else class="wb-card-grid wb-card-grid--two">
       <article v-for="rowIndex in 4" :key="rowIndex" class="wb-step-card">
        <h4 class="wb-card-title">
         {{ getSampleValue(block.fields.find((field) => field.semantic === 'primary') || block.fields[0], rowIndex - 1) }}
        </h4>
        <p class="wb-card-note">
         {{ block.fields.map((field) => `${field.label}: ${getSampleValue(field, rowIndex - 1)}`).join(' / ') }}
        </p>
       </article>
      </div>
     </section>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
