import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import './runtime-imports.generated'
import './styles.css'

createApp(App).use(router).use(ElementPlus).mount('#app')
