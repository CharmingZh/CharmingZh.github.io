import { createApp } from 'vue'
import App from './App.vue'
import LiquidGlass from '@wxperia/liquid-glass-vue' // 导入库
import router from './router'

import './assets/main.css'

const app = createApp(App)

app.use(LiquidGlass) // 全局使用
app.use(router)

app.mount('#app')
