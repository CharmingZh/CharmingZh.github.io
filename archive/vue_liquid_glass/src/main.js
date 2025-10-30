import { createApp } from 'vue'
import App from './App.vue'
import LiquidGlass from '@wxperia/liquid-glass-vue' // 导入库
import router from './router'

import './assets/main.css'

if (typeof window !== 'undefined') {
	const currentUrl = new URL(window.location.href)
	const redirect = currentUrl.searchParams.get('redirect')
	if (redirect) {
		let decoded = decodeURIComponent(redirect).trim()
		if (!decoded.startsWith('/')) {
			decoded = `/${decoded}`
		}
		if (decoded.length > 1 && decoded.endsWith('/')) {
			decoded = decoded.slice(0, -1)
		}

		currentUrl.searchParams.delete('redirect')
		const cleanedSearch = currentUrl.searchParams.toString()

		if (decoded === '/404.html') {
			const fallbackUrl = `${currentUrl.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}${currentUrl.hash}`
			window.history.replaceState(null, '', fallbackUrl)
		} else {
			const nextUrl = `${decoded}${cleanedSearch ? `?${cleanedSearch}` : ''}${currentUrl.hash}`
			window.history.replaceState(null, '', nextUrl)
			router.replace(decoded).catch(() => {})
		}
	}
}

const app = createApp(App)

app.use(LiquidGlass) // 全局使用
app.use(router)

router.isReady().then(() => {
	app.mount('#app')
})
