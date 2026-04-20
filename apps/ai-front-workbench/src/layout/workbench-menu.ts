import type { RouteItem } from '@repo/utils'

const APP_ID = 'ai-front-workbench'
const APP_NAME = 'AI Front Workbench'

function createTranslations(name: string, description = '') {
 return {
  'zh-CN': {
   name,
   description,
  },
  'en-US': {
   name,
   description,
  },
 }
}

function createMeta(
 name: string,
 options: {
  title?: string
  icon?: string
  visible?: '0' | '1'
  description?: string
 } = {}
) {
 return {
  appId: APP_ID,
  appName: APP_NAME,
  icon: options.icon ?? '',
  isAffix: false,
  isHide: options.visible === '0',
  isKeepAlive: false,
  isLink: false,
  permissionMenuId: '',
  title: options.title ?? name,
  visible: options.visible ?? '1',
  translations: createTranslations(name, options.description ?? ''),
 }
}

function createItem(
 path: string,
 name: string,
 options: {
  title?: string
  icon?: string
  visible?: '0' | '1'
  description?: string
 } = {}
): RouteItem {
 return {
  path,
  name,
  icon: options.icon,
  meta: createMeta(name, options),
 }
}

export const workbenchMenuRoutes: RouteItem[] = [
 createItem('/workbench', '沉淀首页', {
  title: '沉淀首页',
  icon: 'metisicon-home4',
  description: '先看当前能复用的结果，再决定下一步抽什么组件。',
 }),
 createItem('/workbench/catalog', '资产目录', {
  title: '资产目录',
  icon: 'metisicon-yingyong',
  description: '按可预览、真实基线、继续沉淀三个视角浏览资产。',
 }),
 createItem('/workbench/sources', '来源 Backlog', {
  title: '来源 Backlog',
  icon: 'metisicon-book1',
  description: '直接看下一批值得从 project-mamba 抽离的组件家族。',
 }),
 createItem('/workbench/review-queue', '处理队列', {
  title: '处理队列',
  icon: 'metisicon-jiedian',
  description: '集中处理 fallback、对齐、补边界和接入预览。',
 }),
 createItem('/workbench/schema-to-page', '结构适配', {
  title: '结构适配',
  icon: 'metisicon-biaodan',
  description: '把接口结构翻成组件装配建议和实现边界。',
 }),
 createItem('/workbench/assets/:type/:name', '资产详情', {
  title: '资产详情',
  visible: '0',
 }),
 createItem('/workbench/components/example-card', 'Example Card Preview', {
  title: 'Example Card Preview',
  visible: '0',
 }),
 createItem('/workbench/components/wanmore-list-tab-box', 'Wanmore ListTabBox Preview', {
  title: 'Wanmore ListTabBox Preview',
  visible: '0',
 }),
 createItem('/workbench/pages/example-overview', 'Overview Draft Preview', {
  title: 'Overview Draft Preview',
  visible: '0',
 }),
]

export const workbenchQuickLinks = [
 {
  label: '首页',
  to: '/workbench',
 },
 {
  label: '目录',
  to: '/workbench/catalog',
 },
 {
  label: 'Backlog',
  to: '/workbench/sources',
 },
 {
  label: '队列',
  to: '/workbench/review-queue',
 },
]
