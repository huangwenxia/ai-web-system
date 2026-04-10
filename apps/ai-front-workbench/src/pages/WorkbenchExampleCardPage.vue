<script setup lang="ts">
import WorkbenchExampleCard from '../components/WorkbenchExampleCard.vue'

const examples = [
 {
 title: '默认态',
 props: {
 title: '算力总览',
 value: '128.5 TH/s',
 description: '最近24 小时稳定运行',
 },
 },
 {
 title: '空态',
 props: {
 title: '昨日收益',
 value: '',
 emptyText: '暂无收益数据',
 },
 },
 {
 title: '加载态',
 props: {
 title: '在线矿机数',
 loading: true,
 },
 },
]
</script>

<template>
 <main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
 <header class="flex flex-col gap-2">
 <router-link class="text-sm text-slate-500" to="/">← 返回工作台首页</router-link>
 <h1 class="m-0 text-3xl font-bold">Example Card 独立预览</h1>
 <p class="m-0 text-sm text-slate-500">用于候选组件在进入真实项目集成预览前的第一轮验证。</p>
 </header>

 <section class="grid gap-4 md:grid-cols-3">
 <article v-for="item in examples" :key="item.title" class="flex flex-col gap-3">
 <h2 class="m-0 text-sm font-semibold">{{ item.title }}</h2>
 <WorkbenchExampleCard v-bind="item.props" />
 </article>
 </section>
 </main>
</template>
