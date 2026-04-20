<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed } from 'vue'

import WorkbenchAssetShowcase from '../components/WorkbenchAssetShowcase.vue'
import WorkbenchStatusBadge from '../components/WorkbenchStatusBadge.vue'
import sourceInventoryRaw from '../registry/generated/source-inventory.generated.json'
import { assetRegistry, getAssetImplementationLabel, getAssetSummary, getAssetTypeLabel } from '../registry'
import type { SourceInventoryBacklogItem, SourceInventorySummary, WorkbenchAssetEntry } from '../registry/types'

const sourceInventory = sourceInventoryRaw as SourceInventorySummary

const previewAssets = computed(() =>
 [...assetRegistry]
  .filter((asset) => asset.preview.demoRoute)
  .sort((left, right) => {
   if (left.type !== right.type) {
    return left.type === 'component' ? -1 : 1
   }

   if (left.implementation.realComponentRefs !== right.implementation.realComponentRefs) {
    return left.implementation.realComponentRefs ? -1 : 1
   }

   return left.name.localeCompare(right.name)
  })
)

const alignedCount = computed(() => assetRegistry.filter((asset) => asset.implementation.realComponentRefs).length)
const pendingCount = computed(() =>
 assetRegistry.filter(
  (asset) =>
   asset.implementation.fallbackHtmlBlocks.length > 0 ||
   asset.composition.missingCapabilities.length > 0 ||
   !asset.implementation.realComponentRefs
 ).length
)

const spotlightAssets = computed(() => previewAssets.value.slice(0, 3))
const topBacklog = computed(() => sourceInventory.priorityBacklog.slice(0, 5))

const actionCards = [
 {
  title: '先看资产效果',
  note: '直接进入目录，先判断现有组件和页面够不够用。',
  to: '/workbench/catalog',
 },
 {
  title: '看下一批该抽什么',
  note: '从 project-mamba 扫描结果里挑下一批优先沉淀的家族。',
  to: '/workbench/sources',
 },
 {
  title: '处理待办缺口',
  note: '聚合还没对齐、还在 fallback、还没接预览的资产。',
  to: '/workbench/review-queue',
 },
]

const overviewFacts = computed(() => [
 {
  label: '可直接预览',
  value: String(previewAssets.value.length),
  note: '已经能在工作台里看到效果',
 },
 {
  label: '真实组件基线',
  value: String(alignedCount.value),
  note: '已经接到真实 project-mamba 依赖链',
 },
 {
  label: '待继续沉淀',
  value: String(pendingCount.value),
  note: '还需要补边界、补接入或继续抽离',
 },
 {
  label: '来源 Backlog',
  value: String(sourceInventory.priorityBacklog.length),
  note: '扫描后可直接排队处理的组件家族',
 },
])

function getBacklogMeta(item: SourceInventoryBacklogItem) {
 return [
  `${item.projects.length} 个项目`,
  `shared ${item.sharedViewCount}`,
  `block ${item.pageBlockCount}`,
  item.inCommon ? 'common 基线' : null,
 ]
  .filter(Boolean)
  .join(' / ')
}

function getShowcaseNote(asset: WorkbenchAssetEntry) {
 return getAssetSummary(asset)
}
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <section class="wb-top-grid">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">这一页该拿来做什么</div>
       <p class="wb-card-heading-note">工作台不负责设计探索，负责把真实可复用结果沉淀清楚。</p>
      </div>
     </template>

     <CardBoxBody>
      <p class="wb-card-note">
       这里优先回答三个问题：现在有什么能直接用、下一批该抽什么、哪些资产还卡在对齐或边界阶段。
      </p>

      <div class="wb-action-grid">
       <router-link v-for="item in actionCards" :key="item.to" class="wb-quick-link" :to="item.to">
        <strong class="wb-quick-link-label">{{ item.title }}</strong>
        <span class="wb-quick-link-note">{{ item.note }}</span>
       </router-link>
      </div>

      <div class="wb-chip-row">
       <span class="wb-chip">来源项目 {{ sourceInventory.totalProjects }}</span>
       <span class="wb-chip wb-chip--soft">Vue 文件 {{ sourceInventory.totalVueFiles }}</span>
       <span class="wb-chip wb-chip--soft">候选资产 {{ assetRegistry.length }}</span>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">当前概览</div>
       <p class="wb-card-heading-note">先用结果判断方向，不再让首页像一页说明文档。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article v-for="item in overviewFacts" :key="item.label" class="wb-metric-item">
        <div class="wb-metric-label">{{ item.label }}</div>
        <div class="wb-metric-value">{{ item.value }}</div>
        <p class="wb-card-note">{{ item.note }}</p>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <CardBox class="wb-surface-card">
    <template #title>
     <div class="wb-card-heading">
      <div class="wb-card-heading-title">现在就能看的资产</div>
      <p class="wb-card-heading-note">先看效果，再判断值不值得继续沉淀。</p>
     </div>
    </template>

    <template #headerRight>
     <router-link class="wb-section-link" to="/workbench/catalog">打开完整目录</router-link>
    </template>

    <CardBoxBody>
      <div class="wb-asset-grid">
       <article v-for="asset in spotlightAssets" :key="asset.id" class="wb-asset-tile">
        <div class="wb-card-row">
         <WorkbenchStatusBadge :status="asset.status" />
         <span class="wb-chip">{{ getAssetTypeLabel(asset.type) }}</span>
         <span class="wb-chip wb-chip--soft">{{ getAssetImplementationLabel(asset) }}</span>
        </div>

        <div class="wb-asset-copy">
         <h3 class="wb-card-title">{{ asset.name }}</h3>
         <p class="wb-card-note">{{ getShowcaseNote(asset) }}</p>
        </div>

        <div class="wb-asset-preview">
         <WorkbenchAssetShowcase :asset-id="asset.id" mode="card" />
        </div>

        <div class="wb-asset-actions">
         <router-link class="wb-action-link" :to="asset.preview.catalogRoute">看详情</router-link>
         <router-link v-if="asset.preview.demoRoute" class="wb-action-link" :to="asset.preview.demoRoute">
          打开预览
         </router-link>
        </div>
       </article>
      </div>
    </CardBoxBody>
   </CardBox>

   <CardBox class="wb-surface-card">
    <template #title>
     <div class="wb-card-heading">
      <div class="wb-card-heading-title">下一批优先沉淀</div>
      <p class="wb-card-heading-note">这里直接给出顺序，不再让你自己回到源码海里挑。</p>
     </div>
    </template>

    <template #headerRight>
     <router-link class="wb-section-link" to="/workbench/sources">查看完整 Backlog</router-link>
    </template>

    <CardBoxBody>
     <div class="wb-backlog-list">
      <article v-for="item in topBacklog" :key="item.normalizedName" class="wb-backlog-item">
       <div class="wb-rank">#{{ item.rank }}</div>
       <div class="wb-backlog-content">
        <div class="wb-card-row">
         <h3 class="wb-card-title">{{ item.familyName }}</h3>
         <span class="wb-chip wb-chip--soft">score {{ item.score }}</span>
        </div>
        <p class="wb-card-note">{{ item.recommendation }}</p>
        <p class="wb-inline-note">{{ getBacklogMeta(item) }}</p>
        <ul class="wb-inline-list">
         <li v-for="reason in item.reasons.slice(0, 2)" :key="reason">{{ reason }}</li>
        </ul>
       </div>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
