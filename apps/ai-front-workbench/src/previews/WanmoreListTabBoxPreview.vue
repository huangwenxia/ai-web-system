<script setup lang="ts">
import WanmoreListTabBox from '../../../../assets/components/candidates/wanmore-list-tab-box.vue'

import { cn } from '@common/utils/tailwind'

const cardShellClass = cn('grid gap-4', 'lg:grid-cols-2')
const tableRows = [
 {
  name: '向量知识库检索',
  type: '表格视图',
  status: '已清洗',
  owner: 'wanmore',
 },
 {
  name: '模型部署总览',
  type: '卡片视图',
  status: '待补边界态',
  owner: 'hashrate',
 },
 {
  name: '对象存储资源池',
  type: '候选组件',
  status: 'raw-candidate',
  owner: 'wanmore',
 },
]
</script>

<template>
 <div class="space-y-5">
  <div class="flex flex-wrap gap-2">
   <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">Tailwind 基线: hashrate</span>
   <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">组件依赖: Element Plus</span>
   <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">工具函数: @common/utils/tailwind</span>
  </div>

  <div class="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
   <WanmoreListTabBox>
    <template #card>
     <div :class="cardShellClass">
      <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
       <div class="mb-3 flex items-center justify-between">
        <div>
         <h3 class="text-base font-semibold text-slate-900">卡片候选视图</h3>
         <p class="mt-1 text-sm text-slate-500">模拟 workbench 内部的组件资产卡片浏览。</p>
        </div>
        <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">card slot</span>
       </div>
       <div class="space-y-3">
        <div class="rounded-xl bg-white p-3 ring-1 ring-slate-200">
         <div class="text-sm font-medium text-slate-900">AI Front Workbench</div>
         <div class="mt-1 text-xs text-slate-500">依赖 project-mamba 的 Tailwind 与 Element Plus 运行基线。</div>
        </div>
        <div class="rounded-xl bg-white p-3 ring-1 ring-slate-200">
         <div class="text-sm font-medium text-slate-900">候选组件清洗</div>
         <div class="mt-1 text-xs text-slate-500">从源项目视图抽取后，先进入 raw-candidate，再逐步完成清洗。</div>
        </div>
       </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
       <div class="mb-3 flex items-center justify-between">
        <div>
         <h3 class="text-base font-semibold text-slate-900">审评摘要</h3>
         <p class="mt-1 text-sm text-slate-500">用于观察切换逻辑与插槽布局是否保持原项目体验。</p>
        </div>
        <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">review</span>
       </div>
       <ul class="space-y-2 text-sm text-slate-600">
        <li>来源项目: wanmore</li>
        <li>来源类型: shared-view-component</li>
        <li>建议下一步: 补充独立 preview wrapper</li>
       </ul>
      </article>
     </div>
    </template>

    <template #table>
     <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
       <div>
        <h3 class="text-sm font-semibold text-slate-900">表格槽位预览</h3>
        <p class="mt-1 text-xs text-slate-500">切换到 table 后，验证原组件在 workbench 中的局部结构承载。</p>
       </div>
       <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">table slot</span>
      </div>

      <div class="overflow-x-auto">
       <table class="min-w-full text-sm">
        <thead class="bg-white text-slate-500">
         <tr>
          <th class="px-4 py-3 text-left font-medium">资产</th>
          <th class="px-4 py-3 text-left font-medium">类型</th>
          <th class="px-4 py-3 text-left font-medium">状态</th>
          <th class="px-4 py-3 text-left font-medium">来源</th>
         </tr>
        </thead>
        <tbody>
         <tr v-for="row in tableRows" :key="row.name" class="border-t border-slate-200">
          <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
          <td class="px-4 py-3 text-slate-600">{{ row.type }}</td>
          <td class="px-4 py-3">
           <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{{ row.status }}</span>
          </td>
          <td class="px-4 py-3 text-slate-600">{{ row.owner }}</td>
         </tr>
        </tbody>
       </table>
      </div>
     </div>
    </template>
   </WanmoreListTabBox>
  </div>
 </div>
</template>
