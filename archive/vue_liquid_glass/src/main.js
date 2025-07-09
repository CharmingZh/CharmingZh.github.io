import { createApp } from 'vue'
import App from './App.vue'
import LiquidGlass from '@wxperia/liquid-glass-vue' // 导入库

import './assets/main.css'

const app = createApp(App)

app.use(LiquidGlass) // 全局使用

app.mount('#app')
