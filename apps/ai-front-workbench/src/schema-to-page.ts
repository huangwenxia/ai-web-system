export type InputMode = 'sample' | 'schema' | 'openapi'
export type WorkMode = 'prototype' | 'confirmed-design'
export type FieldSemantic =
 | 'primary'
 | 'metric'
 | 'status'
 | 'enum'
 | 'text'
 | 'datetime'
 | 'owner'
 | 'progress'
 | 'money'
 | 'unknown'
export type EndpointShape = 'object' | 'array'

export interface SchemaField {
 name: string
 label: string
 type: string
 semantic: FieldSemantic
 required?: boolean
 description?: string
}

export interface SchemaEndpoint {
 name: string
 label: string
 shape: EndpointShape
 description: string
 actions?: string[]
 fields: SchemaField[]
}

export interface SchemaPageInput {
 pageName: string
 pageGoal: string
 audience: string
 workMode: WorkMode
 endpoints: SchemaEndpoint[]
}

interface SampleEnvelopeMeta {
 pageName?: string
 pageGoal?: string
 audience?: string
 workMode?: WorkMode
 response?: unknown
 data?: unknown
}

interface OpenApiParseCandidate {
 schema: unknown
 pageName?: string
 pageGoal?: string
 audience?: string
 workMode?: WorkMode
 rootKey?: string
}

interface EndpointBuildOptions {
 actions?: string[]
 description?: string
 label?: string
}

const DEFAULT_SAMPLE_PAGE_NAME = '接口驱动页面'
const DEFAULT_SAMPLE_PAGE_GOAL = '根据接口样例推导页面骨架与组件承接方式'
const DEFAULT_OPENAPI_PAGE_GOAL = '根据 OpenAPI / 字段定义推导页面骨架与组件承接方式'
const DEFAULT_AUDIENCE = '产品 / 设计 / 前端'
const FIELD_SEMANTICS = new Set<FieldSemantic>([
 'primary',
 'metric',
 'status',
 'enum',
 'text',
 'datetime',
 'owner',
 'progress',
 'money',
 'unknown',
])
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const

export const schemaPresets: Record<string, SchemaPageInput> = {
 resourceOverview: {
  pageName: '算力资源运营台',
  pageGoal: '帮助运营快速查看资源供给、异常状态和待处理事项',
  audience: '运营 / 交付',
  workMode: 'prototype',
  endpoints: [
   {
    name: 'resourceSummary',
    label: '资源总览',
    shape: 'object',
    description: '首屏需要快速判断资源规模和当前健康度',
    actions: ['refresh'],
    fields: [
     { name: 'onlineCount', label: '在线资源', type: 'number', semantic: 'metric' },
     { name: 'gpuCount', label: 'GPU 总量', type: 'number', semantic: 'metric' },
     { name: 'warningCount', label: '告警资源', type: 'number', semantic: 'metric' },
     { name: 'usageRate', label: '平均利用率', type: 'number', semantic: 'progress' },
    ],
   },
   {
    name: 'resourceList',
    label: '资源列表',
    shape: 'array',
    description: '主工作区承接筛选、检索和批量处理',
    actions: ['search', 'filter', 'batchRestart', 'create'],
    fields: [
     { name: 'resourceName', label: '资源名称', type: 'string', semantic: 'primary' },
     { name: 'resourceType', label: '资源类型', type: 'string', semantic: 'enum' },
     { name: 'status', label: '状态', type: 'string', semantic: 'status' },
     { name: 'owner', label: '负责人', type: 'string', semantic: 'owner' },
     { name: 'updatedAt', label: '更新时间', type: 'string', semantic: 'datetime' },
    ],
   },
   {
    name: 'warningFeed',
    label: '异常动态',
    shape: 'array',
    description: '需要辅助说明最近的异常变化与处理节奏',
    actions: ['viewAll'],
    fields: [
     { name: 'level', label: '等级', type: 'string', semantic: 'status' },
     { name: 'message', label: '内容', type: 'string', semantic: 'text' },
     { name: 'createdAt', label: '时间', type: 'string', semantic: 'datetime' },
    ],
   },
  ],
 },
 deploymentDetail: {
  pageName: '模型部署详情',
  pageGoal: '帮助交付和研发确认部署状态、资源配置和发布记录',
  audience: '研发 / 交付 / 运维',
  workMode: 'confirmed-design',
  endpoints: [
   {
    name: 'deploymentDetail',
    label: '部署基础信息',
    shape: 'object',
    description: '页面头部需要承接关键信息、状态和主要操作',
    actions: ['edit', 'restart', 'rollback'],
    fields: [
     { name: 'deploymentName', label: '部署名称', type: 'string', semantic: 'primary' },
     { name: 'status', label: '部署状态', type: 'string', semantic: 'status' },
     { name: 'owner', label: '负责人', type: 'string', semantic: 'owner' },
     { name: 'createdAt', label: '创建时间', type: 'string', semantic: 'datetime' },
     { name: 'cost', label: '资源成本', type: 'number', semantic: 'money' },
    ],
   },
   {
    name: 'versionList',
    label: '版本记录',
    shape: 'array',
    description: '版本切换与历史回溯是主要任务区域',
    actions: ['compare', 'publish'],
    fields: [
     { name: 'version', label: '版本号', type: 'string', semantic: 'primary' },
     { name: 'status', label: '状态', type: 'string', semantic: 'status' },
     { name: 'creator', label: '发布人', type: 'string', semantic: 'owner' },
     { name: 'publishedAt', label: '发布时间', type: 'string', semantic: 'datetime' },
    ],
   },
   {
    name: 'runtimeMetrics',
    label: '运行指标',
    shape: 'object',
    description: '中间区域需要补充核心运行指标和当前资源表现',
    actions: ['refresh'],
    fields: [
     { name: 'qps', label: 'QPS', type: 'number', semantic: 'metric' },
     { name: 'latency', label: '平均延迟', type: 'number', semantic: 'metric' },
     { name: 'successRate', label: '成功率', type: 'number', semantic: 'progress' },
     { name: 'warningCount', label: '异常数', type: 'number', semantic: 'metric' },
    ],
   },
  ],
 },
}

export const sampleResponsePresets: Record<string, SampleEnvelopeMeta> = {
 resourceOverview: {
  pageName: '算力资源运营台',
  pageGoal: '帮助运营快速查看资源供给、异常状态和待处理事项',
  audience: '运营 / 交付',
  workMode: 'prototype',
  response: {
   summary: {
    onlineCount: 128,
    gpuCount: 640,
    warningCount: 14,
    usageRate: 82,
   },
   resources: [
    {
     resourceName: '训练集群 A',
     resourceType: 'GPU',
     status: 'running',
     owner: '张磊',
     updatedAt: '2026-04-17 10:30:00',
    },
   ],
   warningFeed: [
    {
     level: 'high',
     message: 'GPU 利用率持续低于阈值',
     createdAt: '2026-04-17 09:50:00',
    },
   ],
  },
 },
 deploymentDetail: {
  pageName: '模型部署详情',
  pageGoal: '帮助交付和研发确认部署状态、资源配置和发布记录',
  audience: '研发 / 交付 / 运维',
  workMode: 'confirmed-design',
  response: {
   deploymentDetail: {
    deploymentName: '文生图生产服务',
    status: 'running',
    owner: '王倩',
    createdAt: '2026-04-15 18:00:00',
    cost: 12800,
   },
   versionList: [
    {
     version: 'v2.3.1',
     status: 'published',
     creator: '李骁',
     publishedAt: '2026-04-16 22:30:00',
    },
   ],
   runtimeMetrics: {
    qps: 182,
    latency: 86,
    successRate: 99.2,
    warningCount: 2,
   },
  },
 },
}

export const openApiPresets: Record<string, Record<string, unknown>> = {
 resourceOverview: {
  openapi: '3.0.3',
  info: {
   title: '算力资源运营台',
   description: '帮助运营快速查看资源供给、异常状态和待处理事项',
  },
  paths: {
   '/api/resources/overview': {
    get: {
     summary: '资源运营总览',
     description: '首屏需要同时承接总览指标、资源列表和异常动态。',
     responses: {
      '200': {
       description: '返回运营总览数据',
       content: {
        'application/json': {
         schema: {
          $ref: '#/components/schemas/ResourceOverviewResponse',
         },
        },
       },
      },
     },
    },
   },
  },
  components: {
   schemas: {
    ResourceOverviewResponse: {
     type: 'object',
     properties: {
      resourceSummary: {
       title: '资源总览',
       description: '首屏需要快速判断资源规模和当前健康度',
       $ref: '#/components/schemas/ResourceSummary',
      },
      resourceList: {
       type: 'array',
       title: '资源列表',
       description: '主工作区承接筛选、检索和批量处理',
       items: {
        $ref: '#/components/schemas/ResourceItem',
       },
      },
      warningFeed: {
       type: 'array',
       title: '异常动态',
       description: '需要辅助说明最近的异常变化与处理节奏',
       items: {
        $ref: '#/components/schemas/WarningFeedItem',
       },
      },
     },
    },
    ResourceSummary: {
     type: 'object',
     required: ['onlineCount', 'gpuCount', 'usageRate'],
     properties: {
      onlineCount: {
       type: 'integer',
       title: '在线资源',
      },
      gpuCount: {
       type: 'integer',
       title: 'GPU 总量',
      },
      warningCount: {
       type: 'integer',
       title: '告警资源',
      },
      usageRate: {
       type: 'number',
       title: '平均利用率',
      },
     },
    },
    ResourceItem: {
     type: 'object',
     required: ['resourceName', 'status'],
     properties: {
      resourceName: {
       type: 'string',
       title: '资源名称',
      },
      resourceType: {
       type: 'string',
       title: '资源类型',
       enum: ['GPU', 'CPU', '混合'],
      },
      status: {
       type: 'string',
       title: '状态',
       enum: ['running', 'stopped', 'warning'],
      },
      owner: {
       type: 'string',
       title: '负责人',
      },
      updatedAt: {
       type: 'string',
       format: 'date-time',
       title: '更新时间',
      },
     },
    },
    WarningFeedItem: {
     type: 'object',
     properties: {
      level: {
       type: 'string',
       title: '等级',
       enum: ['high', 'medium', 'low'],
      },
      message: {
       type: 'string',
       title: '内容',
       description: '异常说明',
      },
      createdAt: {
       type: 'string',
       format: 'date-time',
       title: '时间',
      },
     },
    },
   },
  },
 },
 deploymentFieldDefinitions: {
  pageName: '模型部署详情',
  pageGoal: '帮助交付和研发确认部署状态、资源配置和发布记录',
  audience: '研发 / 交付 / 运维',
  workMode: 'confirmed-design',
  schema: {
   type: 'object',
   properties: {
    deploymentDetail: {
     type: 'object',
     title: '部署基础信息',
     description: '页面头部需要承接关键信息、状态和主要操作',
     actions: ['edit', 'restart', 'rollback'],
     fields: [
      { name: 'deploymentName', label: '部署名称', type: 'string', semantic: 'primary', required: true },
      { name: 'status', label: '部署状态', type: 'string', semantic: 'status', required: true },
      { name: 'owner', label: '负责人', type: 'string', semantic: 'owner' },
      { name: 'createdAt', label: '创建时间', type: 'datetime', semantic: 'datetime' },
      { name: 'cost', label: '资源成本', type: 'number', semantic: 'money' },
     ],
    },
    versionList: {
     type: 'array',
     title: '版本记录',
     description: '版本切换与历史回溯是主要任务区域',
     actions: ['compare', 'publish'],
     items: {
      type: 'object',
      fields: [
       { name: 'version', label: '版本号', type: 'string', semantic: 'primary', required: true },
       { name: 'status', label: '状态', type: 'string', semantic: 'status' },
       { name: 'creator', label: '发布人', type: 'string', semantic: 'owner' },
       { name: 'publishedAt', label: '发布时间', type: 'datetime', semantic: 'datetime' },
      ],
     },
    },
    runtimeMetrics: {
     type: 'object',
     title: '运行指标',
     description: '中间区域需要补充核心运行指标和当前资源表现',
     actions: ['refresh'],
     properties: {
      qps: {
       type: 'number',
       title: 'QPS',
      },
      latency: {
       type: 'number',
       title: '平均延迟',
      },
      successRate: {
       type: 'number',
       title: '成功率',
      },
      warningCount: {
       type: 'integer',
       title: '异常数',
      },
     },
    },
   },
  },
 },
}

const WRAPPER_META_KEYS = new Set([
 'code',
 'message',
 'msg',
 'success',
 'traceId',
 'requestId',
 'request_id',
 'error',
 'errors',
 'statusCode',
 'status_code',
])

const PAGINATION_KEYS = new Set([
 'page',
 'pageNo',
 'pageNum',
 'pageSize',
 'current',
 'size',
 'pages',
 'offset',
 'limit',
 'total',
 'totalCount',
 'totalPage',
])

const TOKEN_LABELS: Record<string, string> = {
 account: '账号',
 action: '动作',
 activity: '动态',
 amount: '金额',
 app: '应用',
 avg: '平均',
 balance: '余额',
 budget: '预算',
 category: '分类',
 code: '编码',
 count: '数量',
 cpu: 'CPU',
 create: '创建',
 created: '创建',
 creator: '创建人',
 cost: '成本',
 data: '数据',
 date: '日期',
 deadline: '截止时间',
 deployment: '部署',
 detail: '详情',
 duration: '时长',
 error: '异常',
 expense: '支出',
 fee: '费用',
 feed: '动态',
 gpu: 'GPU',
 health: '健康度',
 history: '历史',
 id: 'ID',
 income: '收益',
 info: '信息',
 item: '条目',
 latency: '延迟',
 level: '等级',
 list: '列表',
 load: '负载',
 manager: '负责人',
 memory: '内存',
 message: '内容',
 metric: '指标',
 metrics: '指标',
 mode: '模式',
 model: '模型',
 name: '名称',
 no: '编号',
 note: '备注',
 online: '在线',
 operator: '操作人',
 owner: '负责人',
 page: '页面',
 percent: '占比',
 performance: '性能',
 price: '价格',
 progress: '进度',
 publish: '发布',
 published: '发布时间',
 qps: 'QPS',
 quantity: '数量',
 rate: '比率',
 reason: '原因',
 record: '记录',
 records: '记录',
 resource: '资源',
 response: '响应',
 result: '结果',
 runtime: '运行',
 score: '评分',
 search: '检索',
 size: '规模',
 source: '来源',
 state: '状态',
 status: '状态',
 strategy: '策略',
 success: '成功率',
 summary: '总览',
 task: '任务',
 time: '时间',
 title: '标题',
 total: '总量',
 type: '类型',
 update: '更新',
 updated: '更新时间',
 usage: '利用率',
 user: '用户',
 util: '利用率',
 value: '值',
 version: '版本',
 warning: '告警',
 warningfeed: '异常动态',
 workload: '负载',
}

function isRecord(value: unknown): value is Record<string, unknown> {
 return Object.prototype.toString.call(value) === '[object Object]'
}

function isPrimitive(value: unknown) {
 return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function capitalize(value: string) {
 return value.charAt(0).toUpperCase() + value.slice(1)
}

function splitIdentifier(value: string) {
 return value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .split(/\s+/)
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)
}

function humanizeIdentifier(value: string) {
 const tokens = splitIdentifier(value)
 if (!tokens.length) {
  return value
 }

 const translated = tokens.map((token) => TOKEN_LABELS[token] ?? capitalize(token))
 return translated.join('')
}

function sanitizeText(value: unknown, fallback: string) {
 return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function sanitizeOptionalText(...values: unknown[]) {
 for (const value of values) {
  if (typeof value === 'string' && value.trim()) {
   return value.trim()
  }
 }
 return undefined
}

function toWorkMode(value: unknown): WorkMode {
 return value === 'confirmed-design' ? 'confirmed-design' : 'prototype'
}

function isDateLike(value: unknown) {
 if (typeof value === 'number') {
  return value > 1_500_000_000 && value < 4_102_444_800_000
 }

 if (typeof value !== 'string') {
  return false
 }

 return /^\d{4}-\d{1,2}-\d{1,2}/.test(value) || /^\d{4}\/\d{1,2}\/\d{1,2}/.test(value) || /\d{2}:\d{2}:\d{2}/.test(value)
}

function inferFieldType(value: unknown) {
 if (value === null) {
  return 'unknown'
 }
 if (Array.isArray(value)) {
  return 'array'
 }
 if (typeof value === 'number') {
  return 'number'
 }
 if (typeof value === 'boolean') {
  return 'boolean'
 }
 if (typeof value === 'string') {
  return 'string'
 }
 if (isRecord(value)) {
  return 'object'
 }
 return typeof value
}

function inferFieldSemantic(name: string, value: unknown): FieldSemantic {
 const normalizedName = name.toLowerCase()

 if (/(status|state|phase|health|warning|alarm|level|result)/.test(normalizedName)) {
  return 'status'
 }
 if (/(owner|creator|operator|manager|assignee|principal|updatedby|createdby)/.test(normalizedName)) {
  return 'owner'
 }
 if (/(time|date|deadline|expire|expired|at)$/.test(normalizedName) || isDateLike(value)) {
  return 'datetime'
 }
 if (/(price|cost|fee|amount|income|expense|balance|budget|payment)/.test(normalizedName)) {
  return 'money'
 }
 if (/(rate|ratio|progress|usage|util|percent|percentage|success)/.test(normalizedName)) {
  return 'progress'
 }
 if (typeof value === 'number' && /(count|num|total|quantity|score|qps|tps|latency|cpu|gpu|memory|disk|size|load)/.test(normalizedName)) {
  return 'metric'
 }
 if (typeof value === 'number') {
  return 'metric'
 }
 if (/(type|category|kind|mode|scene|strategy|spec)/.test(normalizedName)) {
  return 'enum'
 }
 if (/(name|title|version|code|subject|label)/.test(normalizedName)) {
  return 'primary'
 }
 if (/(desc|description|remark|message|content|reason|note|summary)/.test(normalizedName)) {
  return 'text'
 }
 if (typeof value === 'string' && value.length > 24) {
  return 'text'
 }
 return 'unknown'
}

function normalizeFieldType(value: unknown) {
 if (typeof value !== 'string' || !value.trim()) {
  return 'unknown'
 }

 const normalized = value.trim().toLowerCase()
 if (['integer', 'number', 'float', 'double', 'long', 'decimal'].includes(normalized)) {
  return 'number'
 }
 if (['string', 'text', 'textarea', 'varchar'].includes(normalized)) {
  return 'string'
 }
 if (['boolean', 'bool'].includes(normalized)) {
  return 'boolean'
 }
 if (['object', 'map'].includes(normalized)) {
  return 'object'
 }
 if (['array', 'list'].includes(normalized)) {
  return 'array'
 }
 if (['date', 'datetime', 'timestamp'].includes(normalized)) {
  return 'string'
 }

 return normalized
}

function isFieldSemanticValue(value: unknown): value is FieldSemantic {
 return typeof value === 'string' && FIELD_SEMANTICS.has(value as FieldSemantic)
}

function buildField(name: string, value: unknown): SchemaField {
 return {
  name,
  label: humanizeIdentifier(name),
  type: inferFieldType(value),
  semantic: inferFieldSemantic(name, value),
 }
}

function buildPrimitiveFieldsFromRecord(record: Record<string, unknown>) {
 const fields: SchemaField[] = []

 for (const [key, value] of Object.entries(record)) {
  if (!isPrimitive(value)) {
   continue
  }
  if (PAGINATION_KEYS.has(key)) {
   continue
  }

  fields.push(buildField(key, value))
 }

 return fields
}

function buildFieldsFromArray(items: unknown[]) {
 const recordItems = items.filter(isRecord).slice(0, 3)

 if (!recordItems.length) {
  return [buildField('value', items[0] ?? null)]
 }

 const fieldOrder: string[] = []
 const fieldSamples = new Map<string, unknown>()

 for (const item of recordItems) {
  for (const [key, value] of Object.entries(item)) {
   if (!isPrimitive(value)) {
    continue
   }
   if (!fieldSamples.has(key)) {
    fieldOrder.push(key)
    fieldSamples.set(key, value)
   }
  }
 }

 return fieldOrder.map((key) => buildField(key, fieldSamples.get(key)))
}

function inferActions(shape: EndpointShape, fields: SchemaField[]) {
 const semantics = new Set(fields.map((field) => field.semantic))

 if (shape === 'array') {
  if (semantics.has('datetime') && !semantics.has('primary') && fields.length <= 4) {
   return ['viewAll']
  }

  const actions = ['search', 'filter']
  if (semantics.has('status') || semantics.has('owner')) {
   actions.push('batchAction')
  }
  return actions
 }

 if (semantics.has('metric') || semantics.has('progress')) {
  return ['refresh']
 }

 return ['edit']
}

function buildEndpointDescription(shape: EndpointShape, label: string, fields: SchemaField[]) {
 if (shape === 'array') {
  if (fields.some((field) => field.semantic === 'datetime') && !fields.some((field) => field.semantic === 'primary')) {
   return `${label}更像辅助动态区，适合承接最近变化和处理记录。`
  }
  return `${label}承接主工作区的数据浏览、筛选和批量处理。`
 }

 if (fields.some((field) => field.semantic === 'metric') || fields.some((field) => field.semantic === 'progress')) {
  return `${label}适合作为首屏概览区，用来快速判断规模、健康度和效率。`
 }

 return `${label}适合作为页面头部摘要区，用来承接关键信息和主要动作。`
}

function buildEndpoint(name: string, shape: EndpointShape, fields: SchemaField[], options: EndpointBuildOptions = {}): SchemaEndpoint | null {
 if (!fields.length) {
  return null
 }

 const label = options.label ?? humanizeIdentifier(name)

 return {
  name,
  label,
  shape,
  description: options.description ?? buildEndpointDescription(shape, label, fields),
  actions: options.actions ?? inferActions(shape, fields),
  fields,
 }
}

function shouldIgnoreRootKey(key: string) {
 const normalizedKey = key.toLowerCase()
 return WRAPPER_META_KEYS.has(normalizedKey) || PAGINATION_KEYS.has(normalizedKey)
}

function collectEndpoints(value: unknown, key = 'pageData', depth = 0): SchemaEndpoint[] {
 if (Array.isArray(value)) {
  const endpoint = buildEndpoint(key, 'array', buildFieldsFromArray(value))
  return endpoint ? [endpoint] : []
 }

 if (!isRecord(value)) {
  const endpoint = buildEndpoint(key, 'object', [buildField(key, value)])
  return endpoint ? [endpoint] : []
 }

 const endpoints: SchemaEndpoint[] = []
 const primitiveFields = buildPrimitiveFieldsFromRecord(value)

 if (primitiveFields.length) {
  const endpoint = buildEndpoint(key, 'object', primitiveFields)
  if (endpoint) {
   endpoints.push(endpoint)
  }
 }

 if (depth >= 1) {
  return endpoints
 }

 for (const [childKey, childValue] of Object.entries(value)) {
  if (shouldIgnoreRootKey(childKey) || isPrimitive(childValue)) {
   continue
  }
  endpoints.push(...collectEndpoints(childValue, childKey, depth + 1))
 }

 return endpoints
}

function unwrapEnvelope(value: unknown) {
 if (Array.isArray(value)) {
  return value
 }

 if (!isRecord(value)) {
  return value
 }

 const keys = Object.keys(value)

 if ('response' in value) {
  return value.response
 }

 if ('data' in value && keys.every((key) => key === 'data' || WRAPPER_META_KEYS.has(key) || PAGINATION_KEYS.has(key))) {
  return value.data
 }

 return value
}

function extractEnvelopeMeta(value: unknown) {
 if (!isRecord(value)) {
  return {
   pageName: DEFAULT_SAMPLE_PAGE_NAME,
   pageGoal: DEFAULT_SAMPLE_PAGE_GOAL,
   audience: DEFAULT_AUDIENCE,
   workMode: 'prototype' as WorkMode,
  }
 }

 return {
  pageName: sanitizeText(value.pageName, DEFAULT_SAMPLE_PAGE_NAME),
  pageGoal: sanitizeText(value.pageGoal, DEFAULT_SAMPLE_PAGE_GOAL),
  audience: sanitizeText(value.audience, DEFAULT_AUDIENCE),
  workMode: toWorkMode(value.workMode),
 }
}

function inferPageNameFromEndpoints(endpoints: SchemaEndpoint[]) {
 if (!endpoints.length) {
  return DEFAULT_SAMPLE_PAGE_NAME
 }

 const firstLabel = endpoints[0].label
 if (endpoints.some((endpoint) => endpoint.shape === 'array')) {
  return `${firstLabel}工作台`
 }

 return `${firstLabel}详情页`
}

function resolveJsonPointer(root: unknown, ref: string): unknown {
 if (!ref.startsWith('#/')) {
  return null
 }

 const segments = ref
  .slice(2)
  .split('/')
  .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

 let current: unknown = root

 for (const segment of segments) {
  if (!isRecord(current) && !Array.isArray(current)) {
   return null
  }
  current = (current as Record<string, unknown>)[segment]
 }

 return current
}

function mergeSchemaRecords(...records: Array<Record<string, unknown> | null>) {
 const merged: Record<string, unknown> = {}

 for (const record of records) {
  if (!record) {
   continue
  }

  for (const [key, value] of Object.entries(record)) {
   if (value === undefined) {
    continue
   }

   if (key === 'properties' && isRecord(value)) {
    merged.properties = {
     ...(isRecord(merged.properties) ? merged.properties : {}),
     ...value,
    }
    continue
   }

   if (key === 'required' && Array.isArray(value)) {
    const existing = Array.isArray(merged.required) ? merged.required : []
    merged.required = Array.from(
     new Set([
      ...existing.filter((item): item is string => typeof item === 'string'),
      ...value.filter((item): item is string => typeof item === 'string'),
     ])
    )
    continue
   }

   if (key === 'fields' && Array.isArray(value)) {
    const existing = Array.isArray(merged.fields) ? merged.fields : []
    merged.fields = [...existing, ...value]
    continue
   }

   merged[key] = value
  }
 }

 return merged
}

function resolveSchemaNode(value: unknown, root: unknown, seenRefs = new Set<string>()): Record<string, unknown> | null {
 if (!isRecord(value)) {
  return null
 }

 const ref = typeof value.$ref === 'string' ? value.$ref : undefined
 if (ref) {
  if (seenRefs.has(ref)) {
   return null
  }

  const referenced = resolveJsonPointer(root, ref)
  const resolvedReference = resolveSchemaNode(referenced, root, new Set([...seenRefs, ref]))
  const { $ref: _ignoredRef, ...localOverrides } = value
  return mergeSchemaRecords(resolvedReference, localOverrides)
 }

 let resolved = { ...value }

 if (Array.isArray(resolved.allOf)) {
  const mergedAllOf = resolved.allOf
   .map((item) => resolveSchemaNode(item, root, seenRefs))
   .filter((item): item is Record<string, unknown> => Boolean(item))

  const { allOf: _ignoredAllOf, ...localOverrides } = resolved
  resolved = mergeSchemaRecords(...mergedAllOf, localOverrides)
 }

 for (const key of ['oneOf', 'anyOf'] as const) {
  if (!Array.isArray(resolved[key]) || !resolved[key].length) {
   continue
  }

  const variant = resolveSchemaNode(resolved[key][0], root, seenRefs)
  const { [key]: _ignoredVariant, ...localOverrides } = resolved
  resolved = mergeSchemaRecords(variant, localOverrides)
 }

 if (resolved.type === undefined) {
  if (isRecord(resolved.properties) || Array.isArray(resolved.fields)) {
   resolved.type = 'object'
  } else if (resolved.items !== undefined) {
   resolved.type = 'array'
  }
 }

 return resolved
}

function getSchemaType(schema: Record<string, unknown>, root: unknown) {
 const resolved = resolveSchemaNode(schema, root) ?? schema
 const rawType = typeof resolved.type === 'string' ? resolved.type.toLowerCase() : ''

 if (rawType) {
  return rawType
 }

 if (Array.isArray(resolved.enum) && resolved.enum.length) {
  return inferFieldType(resolved.enum[0])
 }

 if (isRecord(resolved.properties) || Array.isArray(resolved.fields)) {
  return 'object'
 }

 if (resolved.items !== undefined) {
  return 'array'
 }

 return 'unknown'
}

function getSchemaLabel(name: string, schema: Record<string, unknown>) {
 return sanitizeText(schema.label ?? schema.title, humanizeIdentifier(name))
}

function getSchemaDescription(schema: Record<string, unknown>) {
 return sanitizeOptionalText(schema.description, schema.summary)
}

function getSchemaActions(schema: Record<string, unknown>) {
 if (!Array.isArray(schema.actions)) {
  return undefined
 }

 const actions = schema.actions.filter((item): item is string => typeof item === 'string' && item.trim()).map((item) => item.trim())
 return actions.length ? actions : undefined
}

function getSchemaRequiredSet(schema: Record<string, unknown>) {
 if (!Array.isArray(schema.required)) {
  return new Set<string>()
 }

 return new Set(schema.required.filter((item): item is string => typeof item === 'string'))
}

function getSchemaSampleValue(schema: Record<string, unknown>, root: unknown): unknown {
 const resolved = resolveSchemaNode(schema, root) ?? schema

 if (Array.isArray(resolved.enum) && resolved.enum.length) {
  return resolved.enum[0]
 }

 const type = getSchemaType(resolved, root)
 const format = typeof resolved.format === 'string' ? resolved.format.toLowerCase() : ''

 if (format === 'date-time') {
  return '2026-04-17 10:30:00'
 }
 if (format === 'date') {
  return '2026-04-17'
 }

 switch (type) {
  case 'integer':
  case 'number':
   return 0
  case 'boolean':
   return false
  case 'array':
   return []
  case 'object':
   return {}
  case 'string':
   return ''
  default:
   return null
 }
}

function buildFieldFromSchema(name: string, schemaLike: unknown, required: boolean, root: unknown): SchemaField | null {
 const resolved = resolveSchemaNode(schemaLike, root)
 if (!resolved) {
  return null
 }

 const type = normalizeFieldType(getSchemaType(resolved, root))
 const sampleValue = getSchemaSampleValue(resolved, root)
 let semantic = inferFieldSemantic(name, sampleValue)

 if (Array.isArray(resolved.enum) && semantic === 'unknown') {
  semantic = 'enum'
 }

 if (typeof resolved.format === 'string' && ['date', 'date-time'].includes(resolved.format)) {
  semantic = 'datetime'
 }

 if (isFieldSemanticValue(resolved.semantic)) {
  semantic = resolved.semantic
 }

 return {
  name,
  label: getSchemaLabel(name, resolved),
  type: type === 'integer' ? 'number' : type,
  semantic,
  required,
  description: getSchemaDescription(resolved),
 }
}

function getFieldDefinitionSample(field: Record<string, unknown>, type: string) {
 if (Array.isArray(field.enum) && field.enum.length) {
  return field.enum[0]
 }

 if (typeof field.format === 'string' && ['date', 'date-time', 'datetime', 'timestamp'].includes(field.format)) {
  return '2026-04-17 10:30:00'
 }

 switch (type) {
  case 'number':
   return 0
  case 'boolean':
   return false
  case 'array':
   return []
  case 'object':
   return {}
  default:
   return ''
 }
}

function buildFieldFromFieldDefinition(field: unknown): SchemaField | null {
 if (!isRecord(field)) {
  return null
 }

 const name = sanitizeText(field.name ?? field.field ?? field.prop ?? field.key, '')
 if (!name) {
  return null
 }

 const type = normalizeFieldType(field.type ?? field.dataType ?? field.valueType ?? field.kind ?? field.format)
 const sampleValue = getFieldDefinitionSample(field, type)
 let semantic = inferFieldSemantic(name, sampleValue)

 if (Array.isArray(field.enum) && semantic === 'unknown') {
  semantic = 'enum'
 }

 if (isFieldSemanticValue(field.semantic)) {
  semantic = field.semantic
 }

 return {
  name,
  label: sanitizeText(field.label ?? field.title, humanizeIdentifier(name)),
  type,
  semantic,
  required: Boolean(field.required),
  description: sanitizeOptionalText(field.description, field.remark),
 }
}

function buildFieldsFromSchemaNode(schema: Record<string, unknown>, root: unknown) {
 const fields = new Map<string, SchemaField>()

 if (Array.isArray(schema.fields)) {
  for (const item of schema.fields) {
   const field = buildFieldFromFieldDefinition(item)
   if (field) {
    fields.set(field.name, field)
   }
  }
 }

 const properties = isRecord(schema.properties) ? schema.properties : null
 if (!properties) {
  return Array.from(fields.values())
 }

 const requiredSet = getSchemaRequiredSet(schema)

 for (const [name, propertySchema] of Object.entries(properties)) {
  if (PAGINATION_KEYS.has(name)) {
   continue
  }

  const resolvedProperty = resolveSchemaNode(propertySchema, root)
  if (!resolvedProperty) {
   continue
  }

  const propertyType = getSchemaType(resolvedProperty, root)
  if (propertyType === 'object' || propertyType === 'array') {
   continue
  }

  const field = buildFieldFromSchema(name, resolvedProperty, requiredSet.has(name) || resolvedProperty.required === true, root)
  if (field) {
   fields.set(field.name, field)
  }
 }

 return Array.from(fields.values())
}

function collectSchemaEndpoints(schemaLike: unknown, root: unknown, key = 'pageData', depth = 0): SchemaEndpoint[] {
 const resolved = resolveSchemaNode(schemaLike, root)
 if (!resolved) {
  return []
 }

 const schemaType = getSchemaType(resolved, root)
 const label = getSchemaLabel(key, resolved)
 const description = getSchemaDescription(resolved)
 const actions = getSchemaActions(resolved)

 if (schemaType === 'array') {
  const itemSchema = resolveSchemaNode(resolved.items, root)
  const fields = itemSchema ? buildFieldsFromSchemaNode(itemSchema, root) : []
  const normalizedFields = fields.length
   ? fields
   : itemSchema
    ? [buildFieldFromSchema('value', itemSchema, false, root)].filter((item): item is SchemaField => Boolean(item))
    : [buildField('value', null)]

  const endpoint = buildEndpoint(key, 'array', normalizedFields, {
   actions,
   description,
   label,
  })

  return endpoint ? [endpoint] : []
 }

 if (schemaType !== 'object') {
  const field = buildFieldFromSchema(key, resolved, false, root)
  const endpoint = field
   ? buildEndpoint(key, 'object', [field], {
      actions,
      description,
      label,
     })
   : null

  return endpoint ? [endpoint] : []
 }

 const endpoints: SchemaEndpoint[] = []
 const fields = buildFieldsFromSchemaNode(resolved, root)

 if (fields.length) {
  const endpoint = buildEndpoint(key, 'object', fields, {
   actions,
   description,
   label,
  })
  if (endpoint) {
   endpoints.push(endpoint)
  }
 }

 if (depth >= 1) {
  return endpoints
 }

 const properties = isRecord(resolved.properties) ? resolved.properties : null
 if (!properties) {
  return endpoints
 }

 for (const [childKey, childSchema] of Object.entries(properties)) {
  if (shouldIgnoreRootKey(childKey)) {
   continue
  }

  const resolvedChild = resolveSchemaNode(childSchema, root)
  if (!resolvedChild) {
   continue
  }

  const childType = getSchemaType(resolvedChild, root)
  if (childType !== 'object' && childType !== 'array') {
   continue
  }

  endpoints.push(...collectSchemaEndpoints(resolvedChild, root, childKey, depth + 1))
 }

 return endpoints
}

function pickJsonContentSchema(content: unknown) {
 if (!isRecord(content)) {
  return null
 }

 if (isRecord(content['application/json']) && 'schema' in content['application/json']) {
  return content['application/json'].schema
 }

 for (const [mediaType, mediaValue] of Object.entries(content)) {
  if (!mediaType.includes('json') || !isRecord(mediaValue)) {
   continue
  }
  if ('schema' in mediaValue) {
   return mediaValue.schema
  }
 }

 const firstMedia = Object.values(content).find((item) => isRecord(item) && 'schema' in item)
 return isRecord(firstMedia) ? firstMedia.schema : null
}

function pickBestResponse(responses: unknown) {
 if (!isRecord(responses)) {
  return null
 }

 const priority = ['200', '201', '202', 'default']
 for (const code of priority) {
  if (responses[code] !== undefined) {
   return responses[code]
  }
 }

 for (const [code, response] of Object.entries(responses)) {
  if (/^2\d\d$/.test(code)) {
   return response
  }
 }

 return Object.values(responses)[0] ?? null
}

function extractSchemaFromResponse(response: unknown) {
 if (!isRecord(response)) {
  return null
 }

 if (response.content) {
  return pickJsonContentSchema(response.content)
 }

 if ('schema' in response) {
  return response.schema
 }

 return null
}

function pickFirstOperation(paths: unknown) {
 if (!isRecord(paths)) {
  return null
 }

 for (const [path, pathItem] of Object.entries(paths)) {
  if (!isRecord(pathItem)) {
   continue
  }

  for (const method of HTTP_METHODS) {
   if (pathItem[method] !== undefined) {
    return {
     method,
     operation: pathItem[method],
     path,
    }
   }
  }
 }

 return null
}

function pickComponentSchemaCandidate(root: Record<string, unknown>) {
 const specifiedSchemaName = sanitizeOptionalText(root.schemaName, root.component, root.componentName)
 const components = isRecord(root.components) && isRecord(root.components.schemas) ? root.components.schemas : null
 const definitions = isRecord(root.definitions) ? root.definitions : null

 if (specifiedSchemaName) {
  if (components?.[specifiedSchemaName] !== undefined) {
   return {
    ref: `#/components/schemas/${specifiedSchemaName}`,
    schemaName: specifiedSchemaName,
   }
  }

  if (definitions?.[specifiedSchemaName] !== undefined) {
   return {
    ref: `#/definitions/${specifiedSchemaName}`,
    schemaName: specifiedSchemaName,
   }
  }
 }

 const candidates = [
  ...(components ? Object.entries(components).map(([name, schema]) => ({ name, ref: `#/components/schemas/${name}`, schema })) : []),
  ...(definitions ? Object.entries(definitions).map(([name, schema]) => ({ name, ref: `#/definitions/${name}`, schema })) : []),
 ]

 if (!candidates.length) {
  return null
 }

 const sorted = candidates.sort((left, right) => {
  const leftScore = getSchemaNameScore(left.name, left.schema)
  const rightScore = getSchemaNameScore(right.name, right.schema)
  return rightScore - leftScore
 })

 return {
  ref: sorted[0].ref,
  schemaName: sorted[0].name,
 }
}

function getSchemaNameScore(name: string, schema: unknown) {
 let score = 0
 const normalized = name.toLowerCase()

 if (/(response|result|page|detail|overview|summary|list|info|vo|dto|view)/.test(normalized)) {
  score += 4
 }
 if (/(item|row|entity)/.test(normalized)) {
  score -= 1
 }
 if (isRecord(schema)) {
  const type = getSchemaType(schema, { components: { schemas: {} }, definitions: {} })
  if (type === 'object') {
   score += 2
  }
  if (type === 'array') {
   score += 1
  }
  if (isRecord(schema.properties)) {
   score += Object.keys(schema.properties).length
  }
 }

 return score
}

function extractOpenApiCandidate(value: unknown): OpenApiParseCandidate | null {
 if (!isRecord(value)) {
  return null
 }

 const info = isRecord(value.info) ? value.info : null
 const baseMeta = {
  audience: sanitizeOptionalText(value.audience),
  workMode: toWorkMode(value.workMode),
 }

 if (value.paths) {
  const operationMatch = pickFirstOperation(value.paths)
  if (operationMatch && isRecord(operationMatch.operation)) {
   const response = pickBestResponse(operationMatch.operation.responses)
   const schema = extractSchemaFromResponse(response)
   if (schema) {
    return {
     ...baseMeta,
     schema,
     pageName: sanitizeOptionalText(value.pageName, info?.title, operationMatch.operation.summary),
     pageGoal: sanitizeOptionalText(value.pageGoal, operationMatch.operation.description, info?.description, isRecord(response) ? response.description : undefined),
     rootKey: sanitizeText(operationMatch.operation.operationId ?? value.rootKey, 'pageData'),
    }
   }
  }
 }

 if (value.responses) {
  const response = pickBestResponse(value.responses)
  const schema = extractSchemaFromResponse(response)
  if (schema) {
   return {
    ...baseMeta,
    schema,
    pageName: sanitizeOptionalText(value.pageName, value.title, isRecord(response) ? response.title : undefined),
    pageGoal: sanitizeOptionalText(value.pageGoal, value.description, isRecord(response) ? response.description : undefined),
    rootKey: sanitizeText(value.rootKey, 'pageData'),
   }
  }
 }

 if (value.content) {
  const schema = pickJsonContentSchema(value.content)
  if (schema) {
   return {
    ...baseMeta,
    schema,
    pageName: sanitizeOptionalText(value.pageName, value.title),
    pageGoal: sanitizeOptionalText(value.pageGoal, value.description),
    rootKey: sanitizeText(value.rootKey, 'pageData'),
   }
  }
 }

 if (value.schema !== undefined) {
  return {
   ...baseMeta,
   schema: value.schema,
   pageName: sanitizeOptionalText(value.pageName, value.title),
   pageGoal: sanitizeOptionalText(value.pageGoal, value.description),
   rootKey: sanitizeText(value.rootKey, 'pageData'),
  }
 }

 if (value.properties || value.fields || value.$ref || value.items || value.type || value.allOf || value.oneOf || value.anyOf) {
  return {
   ...baseMeta,
   schema: value,
   pageName: sanitizeOptionalText(value.pageName, value.title),
   pageGoal: sanitizeOptionalText(value.pageGoal, value.description),
   rootKey: sanitizeText(value.rootKey, 'pageData'),
  }
 }

 const componentSchema = pickComponentSchemaCandidate(value)
 if (componentSchema) {
  return {
   ...baseMeta,
   schema: { $ref: componentSchema.ref },
   pageName: sanitizeOptionalText(value.pageName, info?.title, humanizeIdentifier(componentSchema.schemaName)),
   pageGoal: sanitizeOptionalText(value.pageGoal, info?.description),
   rootKey: componentSchema.schemaName,
  }
 }

 return null
}

function extractOpenApiMeta(value: unknown, candidate: OpenApiParseCandidate, endpoints: SchemaEndpoint[]) {
 const info = isRecord(value) && isRecord(value.info) ? value.info : null

 return {
  pageName: sanitizeText(
   isRecord(value) ? value.pageName : undefined,
   sanitizeText(candidate.pageName, sanitizeText(info?.title, inferPageNameFromEndpoints(endpoints)))
  ),
  pageGoal: sanitizeText(
   isRecord(value) ? value.pageGoal : undefined,
   sanitizeText(candidate.pageGoal, sanitizeText(info?.description, DEFAULT_OPENAPI_PAGE_GOAL))
  ),
  audience: sanitizeText(isRecord(value) ? value.audience : undefined, sanitizeText(candidate.audience, DEFAULT_AUDIENCE)),
  workMode: isRecord(value) ? toWorkMode(value.workMode ?? candidate.workMode) : toWorkMode(candidate.workMode),
 }
}

export function safeParseJson(text: string) {
 try {
  return {
   data: JSON.parse(text) as unknown,
   error: '',
  }
 } catch (error) {
  return {
   data: null,
   error: error instanceof Error ? error.message : 'JSON 解析失败',
  }
 }
}

export function parseSchemaInput(text: string) {
 const result = safeParseJson(text)
 if (result.error || !result.data) {
  return {
   value: null,
   error: result.error,
  }
 }

 return {
  value: result.data as SchemaPageInput,
  error: '',
 }
}

export function parseSampleInput(text: string) {
 const result = safeParseJson(text)
 if (result.error || result.data === null) {
  return {
   value: null,
   error: result.error,
  }
 }

 const meta = extractEnvelopeMeta(result.data)
 const payload = unwrapEnvelope(result.data)
 const endpoints = collectEndpoints(payload)

 return {
  value: {
   pageName: meta.pageName !== DEFAULT_SAMPLE_PAGE_NAME ? meta.pageName : inferPageNameFromEndpoints(endpoints),
   pageGoal: meta.pageGoal,
   audience: meta.audience,
   workMode: meta.workMode,
   endpoints,
  } satisfies SchemaPageInput,
  error: '',
 }
}

export function parseOpenApiInput(text: string) {
 const result = safeParseJson(text)
 if (result.error || result.data === null) {
  return {
   value: null,
   error: result.error,
  }
 }

 const candidate = extractOpenApiCandidate(result.data)
 if (!candidate) {
  return {
   value: null,
   error: '未识别到可用的 OpenAPI / 字段定义结构。支持 paths、responses、content、schema、properties、fields。',
  }
 }

 const endpoints = collectSchemaEndpoints(candidate.schema, result.data, candidate.rootKey ?? 'pageData')
 if (!endpoints.length) {
  return {
   value: null,
   error: '已解析输入，但没有提取到可用字段。请确认 schema.properties、items 或 fields 是否存在。',
  }
 }

 const meta = extractOpenApiMeta(result.data, candidate, endpoints)

 return {
  value: {
   pageName: meta.pageName,
   pageGoal: meta.pageGoal,
   audience: meta.audience,
   workMode: meta.workMode,
   endpoints,
  } satisfies SchemaPageInput,
  error: '',
 }
}
