<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed } from 'vue'

import sourceInventoryRaw from '../registry/generated/source-inventory.generated.json'
import type { SourceInventorySummary } from '../registry/types'

const sourceInventory = sourceInventoryRaw as SourceInventorySummary

const topBacklog = computed(() => sourceInventory.priorityBacklog.slice(0, 8))
const duplicateFamilies = computed(() => sourceInventory.duplicateComponentFamilies.slice(0, 18))
const leadingProjects = computed(() =>
 [...sourceInventory.projects].sort((left, right) => right.likelyCandidates - left.likelyCandidates).slice(0, 6)
)

function getBacklogMeta(score: number, sharedViewCount: number, pageBlockCount: number, inCommon: boolean) {
 return [
  `score ${score}`,
  `shared ${sharedViewCount}`,
  `block ${pageBlockCount}`,
  inCommon ? 'common 基线' : null,
 ]
  .filter(Boolean)
  .join(' / ')
}
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <section class="wb-top-grid">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">Backlog 怎么看</div>
       <p class="wb-card-heading-note">这里回答的是“下一批先抽谁、从哪一个真实实现下手、为什么先抽它”。</p>
      </div>
     </template>

     <CardBoxBody>
      <ul class="wb-inline-list">
       <li>优先看排名靠前的家族，它们通常跨项目重复、结构稳定、抽取收益最高。</li>
       <li>“Representative” 就是建议先抽的真实基线文件，不是最终唯一实现。</li>
       <li>如果还要继续扩 backlog，优先去候选密度高的项目再扫一轮。</li>
      </ul>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">扫描结果</div>
       <p class="wb-card-heading-note">来源不是拍脑袋，是从整个 project-mamba 扫描出来的。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article class="wb-metric-item">
        <div class="wb-metric-label">扫描项目</div>
        <div class="wb-metric-value">{{ sourceInventory.totalProjects }}</div>
        <p class="wb-card-note">纳入扫描的 app 数量</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">Vue 文件</div>
        <div class="wb-metric-value">{{ sourceInventory.totalVueFiles }}</div>
        <p class="wb-card-note">参与分析的文件规模</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">重复家族</div>
        <div class="wb-metric-value">{{ sourceInventory.duplicateComponentFamilyCount }}</div>
        <p class="wb-card-note">跨项目出现的可沉淀家族数</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">来源根目录</div>
        <div class="wb-metric-value wb-metric-value--small">{{ sourceInventory.sourceRoot }}</div>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <CardBox class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">优先提取 Backlog</div>
       <p class="wb-card-heading-note">按跨项目重复、shared-view 占比、清洗成本和 common 基线综合排序。</p>
      </div>
    </template>

    <CardBoxBody>
     <div class="wb-backlog-list">
      <article v-for="item in topBacklog" :key="item.normalizedName" class="wb-backlog-item">
       <div class="wb-rank">#{{ item.rank }}</div>
       <div class="wb-backlog-content">
        <div class="wb-card-row">
         <h3 class="wb-card-title">{{ item.familyName }}</h3>
         <span class="wb-chip wb-chip--soft">{{ getBacklogMeta(item.score, item.sharedViewCount, item.pageBlockCount, item.inCommon) }}</span>
        </div>

        <p class="wb-card-note">{{ item.recommendation }}</p>

        <dl class="wb-metadata">
         <div>
          <dt>建议起点</dt>
          <dd>{{ item.representativePath }}</dd>
         </div>
         <div>
          <dt>覆盖项目</dt>
          <dd>{{ item.projects.join(' / ') }}</dd>
         </div>
         <div>
          <dt>平均复杂度</dt>
          <dd>imports {{ item.averageImportCount }} / local deps {{ item.averageLocalDependencyCount }}</dd>
         </div>
         <div>
          <dt>样本数量</dt>
          <dd>{{ item.entryCount }}</dd>
         </div>
        </dl>

        <ul class="wb-inline-list">
         <li v-for="reason in item.reasons.slice(0, 3)" :key="reason">{{ reason }}</li>
        </ul>

        <div class="wb-chip-row">
         <span v-for="sample in item.sampleEntries.slice(0, 3)" :key="sample.id" class="wb-chip wb-chip--soft">
          {{ sample.project }} / {{ sample.relativePath }}
         </span>
        </div>
       </div>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>

   <CardBox class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">还有哪些家族值得继续沉淀</div>
       <p class="wb-card-heading-note">这个表用于扩展下一轮范围，不再直接展示原始文件海。</p>
      </div>
    </template>

    <CardBoxBody>
     <div class="wb-mini-table-wrap">
      <table class="wb-mini-table">
       <thead>
        <tr>
         <th>Family</th>
         <th>Projects</th>
         <th>Implementations</th>
         <th>Representative</th>
         <th>Score</th>
        </tr>
       </thead>
       <tbody>
        <tr v-for="family in duplicateFamilies" :key="family.normalizedName">
         <td>
          <strong>{{ family.familyName }}</strong>
          <div class="wb-card-note">{{ family.recommendation }}</div>
         </td>
         <td>{{ family.projects.join(' / ') }}</td>
         <td>shared {{ family.sharedViewCount }} / block {{ family.pageBlockCount }}</td>
         <td>{{ family.representativePath }}</td>
         <td>{{ family.score }}</td>
        </tr>
       </tbody>
      </table>
     </div>
    </CardBoxBody>
   </CardBox>

   <CardBox class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">如果继续扫，先去哪几个项目</div>
       <p class="wb-card-heading-note">优先从候选密度高的项目继续扩展 backlog。</p>
      </div>
    </template>

    <CardBoxBody>
     <div class="wb-card-grid wb-card-grid--three">
      <article v-for="project in leadingProjects" :key="project.name" class="wb-metric-item">
       <div class="wb-metric-label">{{ project.name }}</div>
       <div class="wb-metric-value">{{ project.likelyCandidates }}</div>
       <p class="wb-card-note">likely candidates</p>
       <dl class="wb-metadata">
        <div>
         <dt>shared-view</dt>
         <dd>{{ project.sourceTypes['shared-view-component'] ?? 0 }}</dd>
        </div>
        <div>
         <dt>page-block</dt>
         <dd>{{ project.sourceTypes['page-block-component'] ?? 0 }}</dd>
        </div>
        <div>
         <dt>page-shell</dt>
         <dd>{{ project.sourceTypes['page-shell'] ?? 0 }}</dd>
        </div>
        <div>
         <dt>not-eligible</dt>
         <dd>{{ project.sourceTypes['not-eligible'] ?? 0 }}</dd>
        </div>
       </dl>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
