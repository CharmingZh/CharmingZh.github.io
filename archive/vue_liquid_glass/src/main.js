import { createApp } from 'vue'
import App from './App.vue'
import LiquidGlass from '@wxperia/liquid-glass-vue' // 导入库
import router from './router'

import './assets/main.css'

if (typeof window !== 'undefined') {
	const currentUrl = new URL(window.location.href)
	const redirect = currentUrl.searchParams.get('redirect')
	if (redirect) {
		const decoded = decodeURIComponent(redirect)
		const normalized = decoded.startsWith('/') ? decoded : `/${decoded}`
		currentUrl.searchParams.delete('redirect')
		const cleanedSearch = currentUrl.searchParams.toString()
		const newUrl = `${currentUrl.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}${currentUrl.hash}`
		window.history.replaceState(null, '', newUrl)
		router.replace(normalized).catch(() => {})
	}
}

const app = createApp(App)

app.use(LiquidGlass) // 全局使用
app.use(router)

router.isReady().then(() => {
	app.mount('#app')
})
