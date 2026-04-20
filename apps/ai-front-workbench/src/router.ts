import { createRouter, createWebHistory } from 'vue-router'

const workbenchChildren = [
 {
  path: '',
  name: 'workbench-home',
  component: () => import('./pages/WorkbenchHomePage.vue'),
  meta: {
   title: '沉淀首页',
   description: '先看当前能复用的结果，再决定下一步抽什么、落什么。',
   badge: 'Workbench',
  },
 },
 {
  path: 'catalog',
  name: 'workbench-catalog',
  component: () => import('./pages/AssetCatalogPage.vue'),
  meta: {
   title: '资产目录',
   description: '按可预览、真实基线、继续沉淀三个视角浏览资产。',
   badge: 'Catalog',
  },
 },
 {
  path: 'assets/:type/:name',
  name: 'workbench-asset-detail',
  component: () => import('./pages/AssetPreviewPage.vue'),
  meta: {
   title: '资产详情',
   description: '查看预览、运行时画像、来源信息和下一步落地建议。',
   parentPath: '/workbench/catalog',
   badge: 'Detail',
  },
 },
 {
  path: 'review-queue',
  name: 'workbench-review-queue',
  component: () => import('./pages/ReviewQueuePage.vue'),
  meta: {
   title: '处理队列',
   description: '集中查看还需要继续抽离、对齐或补边界的资产。',
   badge: 'Queue',
  },
 },
 {
  path: 'sources',
  name: 'workbench-sources',
  component: () => import('./pages/SourceTracePage.vue'),
  meta: {
   title: '来源 Backlog',
   description: '直接看下一批值得从 project-mamba 抽离的组件家族和基线文件。',
   badge: 'Backlog',
  },
 },
 {
  path: 'schema-to-page',
  name: 'workbench-schema-to-page',
  component: () => import('./pages/SchemaToPageWorkbenchPage.vue'),
  meta: {
   title: '结构适配',
   description: '把接口结构翻成组件装配建议、页面骨架和实现边界。',
   badge: 'Schema',
  },
 },
 {
  path: 'components/example-card',
  name: 'workbench-example-card',
  component: () => import('./pages/WorkbenchExampleCardPage.vue'),
  meta: {
   title: 'Example Card 预览',
   description: '单独查看 Example Card 的状态矩阵和组件表现。',
   parentPath: '/workbench/assets/component/example-card',
   badge: 'Preview',
  },
 },
 {
  path: 'components/wanmore-list-tab-box',
  name: 'workbench-wanmore-list-tab-box',
  component: () => import('./pages/WorkbenchWanmoreListTabBoxPage.vue'),
  meta: {
   title: 'Wanmore ListTabBox 预览',
   description: '查看真实抽取组件在 workbench 里的运行状态。',
   parentPath: '/workbench/assets/component/wanmore-list-tab-box',
   badge: 'Preview',
  },
 },
 {
  path: 'pages/example-overview',
  name: 'workbench-example-overview',
  component: () => import('./pages/WorkbenchExampleOverviewPage.vue'),
  meta: {
   title: 'Overview Draft 预览',
   description: '验证页面草稿是否已经站在组件装配层，而不是继续平铺原生结构。',
   parentPath: '/workbench/assets/page/example-overview-page',
   badge: 'Preview',
  },
 },
]

export default createRouter({
 history: createWebHistory(),
 routes: [
  {
   path: '/',
   redirect: '/workbench',
  },
  {
   path: '/catalog',
   redirect: '/workbench/catalog',
  },
  {
   path: '/assets/:type/:name',
   redirect: (to) => `/workbench/assets/${to.params.type}/${to.params.name}`,
  },
  {
   path: '/review-queue',
   redirect: '/workbench/review-queue',
  },
  {
   path: '/sources',
   redirect: '/workbench/sources',
  },
  {
   path: '/schema-to-page',
   redirect: '/workbench/schema-to-page',
  },
  {
   path: '/components/example-card',
   redirect: '/workbench/components/example-card',
  },
  {
   path: '/components/wanmore-list-tab-box',
   redirect: '/workbench/components/wanmore-list-tab-box',
  },
  {
   path: '/pages/example-overview',
   redirect: '/workbench/pages/example-overview',
  },
  {
   path: '/workbench',
   component: () => import('./layouts/WorkbenchShell.vue'),
   children: workbenchChildren,
  },
 ],
})
