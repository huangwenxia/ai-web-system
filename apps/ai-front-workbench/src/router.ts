import { createRouter, createWebHistory } from 'vue-router'

import WorkbenchHomePage from './pages/WorkbenchHomePage.vue'
import WorkbenchExampleCardPage from './pages/WorkbenchExampleCardPage.vue'

export default createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'WorkbenchHome',
            component: WorkbenchHomePage,
        },
        {
            path: '/components/example-card',
            name: 'WorkbenchExampleCard',
            component: WorkbenchExampleCardPage,
        },
    ],
})
