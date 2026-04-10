<template>
 <main class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
 <header class="flex flex-col gap-2">
 <h1 class="m-0 text-3xl font-bold">AI Front Workbench</h1>
 <p class="m-0 text-sm text-slate-500">候选组件与候选页面的独立预览工作台。</p>
 </header>

 <section class="grid gap-4 md:grid-cols-2">
 <router-link class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300" to="/components/example-card">
 <h2 class="m-0 text-base font-semibold">Example Card</h2>
 <p class="mt-2 text-sm text-slate-500">查看候选组件的默认态、空态、加载态。</p>
 </router-link>
 </section>
 </main>
</template>
