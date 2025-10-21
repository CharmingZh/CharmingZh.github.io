<!-- eslint-disable vue/multi-word-component-names -->
<script setup>

import { onMounted, watch, inject } from 'vue';

// 注入从父组件 App.vue 提供的 'currentTheme' 响应式变量
const currentTheme = inject('currentTheme');

// 定义设置访客地图主题的函数
const setVisitorMapTheme = () => {
  const container = document.getElementById('mapmyvisitors-container');
  if (!container) return; // 如果容器不存在，则退出

  // 移除旧的地图脚本，确保每次只加载一个地图实例
  const existingScript = document.getElementById('mapmyvisitors');
  if (existingScript) {
    existingScript.remove();
  }

  // **** 新增：清空容器的内部 HTML，确保旧的地图内容被彻底移除 ****
  container.innerHTML = '';

  // 获取当前主题下的 CSS 变量值
  // 注意：这里需要确保 CSS 变量在 main.css 或全局样式中已定义，
  // 并且在暗色/亮色主题下有不同的值。
  const style = getComputedStyle(document.body);
  const oceanColor = style.getPropertyValue('--map-ocean-color').trim().replace('#', '');
  const landColor = style.getPropertyValue('--map-land-color').trim().replace('#', '');
  const pastVisitorsColor = style.getPropertyValue('--map-past-visitors-color').trim().replace('#', '');
  const recentVisitorsColor = style.getPropertyValue('--map-recent-visitors-color').trim().replace('#', '');
  const textColor = style.getPropertyValue('--map-text-color').trim().replace('#', '');

  // 构建新的 src URL，现在使用你提供的参数名: cl, co, cmo, cmn
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.id = 'mapmyvisitors'; // 设置 ID 便于后续移除
  script.async = true; // 异步加载脚本
  // 更新了 URL 参数名以匹配你提供的示例
  script.src = `//mapmyvisitors.com/map.js?d=YJ5tJC9Cdj8baVhSikHNQIW1U0rlJuKC09z8yCFRKEI&cl=${oceanColor}&co=${landColor}&cmn=${pastVisitorsColor}&cmo=${recentVisitorsColor}&t=${textColor}&w=a`;

  // 将新脚本添加到容器中
  container.appendChild(script);
};

// 在组件挂载时初始化访客地图
onMounted(() => {
  setVisitorMapTheme();
});

// 监听 currentTheme 响应式变量的变化
// 当 currentTheme 改变时（即主题切换时），重新调用 setVisitorMapTheme
watch(currentTheme, () => {
  // 使用 requestAnimationFrame 确保 CSS 变量已经更新
  requestAnimationFrame(() => {
    setVisitorMapTheme();
  });
});

</script>

<template>
  <div>
    <footer class="footer">
      <div class="social-links">
        <!-- ① Email（原生灰色） -->
        <a href="mailto:zhan2374@msu.edu" title="Email">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4" d="M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2 0v.01L12 9.51 17 4.01V4H5Zm0 2.62V18h14V6.62l-5.99 4.68a1 1 0 0 1-1.24 0L5 6.62Z"/>
          </svg>
        </a>

        <!-- ② GitHub（原生黑色） -->
        <a href="https://github.com/CharmingZh" target="_blank" title="GitHub">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34c-.45-1.15-1.1-1.46-1.1-1.46c-.91-.62.07-.61.07-.61c1 .07 1.53 1.03 1.53 1.03c.9 1.52 2.36 1.08 2.94.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.1.39-1.99 1.03-2.69a2.3 2.3 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.37.2 2.4.1 2.64c.64.7 1.03 1.6 1.03 2.69c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85v2.72c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>
          </svg>
        </a>

        <!-- ③ Google Scholar（官方蓝底白标） -->
        <a href="https://scholar.google.com.hk/citations?user=kEJINEIAAAAJ"
           target="_blank"
           title="Google Scholar">
          <svg viewBox="0 0 512 512" width="24" height="24" aria-label="Google Scholar" role="img">
            <rect width="512" height="512" rx="15%" fill="#4285F4"/>
            <path fill="#FFFFFF"
                  d="M213 111l-107 94h69c5 45 41 64 78 67-7 18-4 27 7 39-43 1-103 26-103 67
                   4 45 63 54 92 54 38 1 81-19 90-54 4-35-10-54-31-71-23-18-28-28-21-40
                   15-17 35-27 39-51 2-17-2-28-6-43l45-38-1 16c-3 2-5 6-5 9v103c2 13 22 11
                   23 0V160c0-3-2-7-5-8v-25l16-16zm58 141c-61 10-87-87-38-99 56-11 83 86
                   38 99zm-5 73c60 13 61 63 10 78-44 9-82-4-81-30 0-25 35-48 71-48z"/>
          </svg>
        </a>

        <!-- ④ LinkedIn（官方蓝标） -->
        <a href="https://www.linkedin.com/in/jiamingzh/"
           target="_blank"
           title="LinkedIn">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4"
                  d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5
                   1.12 1 2.5 1 4.98 2.12 4.98 3.5zm.02 4.5H0v14h5V8zm7.5
                   0h-5v14h5V15.6c0-2.7.5-5.4 3.4-5.4 2.9 0 2.9 2.7
                   2.9 5.5V22h5v-8.9c0-6.8-3.6-9.9-8.4-9.9-4.3
                   0-6.2 2.6-7.3 4.4.1 0 .1 0 .1 0V8z"/>
          </svg>
        </a>
      </div>
      <div id="mapmyvisitors-container" class="visitor-map"></div>

      <p>&copy; 2025 Jiaming Zhang. All Rights Reserved.</p>
    </footer>

    <!-- 主题切换按钮现在由 App.vue 管理点击事件 -->
    <!-- 这个按钮的点击事件监听器已从 Footer.vue 中移除 -->
    <!-- 它的 SVG 图标切换逻辑仍然由 CSS 的 [data-theme] 属性控制 -->
    <button class="theme-switcher" id="theme-toggle" title="Switch Theme">
      <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.061 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.836 17.894a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.59a.75.75 0 010-1.06zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75-.75zM5.106 17.836a.75.75 0 010-1.06l1.591-1.591a.75.75 0 111.06 1.06l-1.59 1.591a.75.75 0 01-1.061 0zM3 12a.75.75 0 01.75-.75h2.25a.75.75 0 010-1.5H3.75A.75.75 0 013 12zM6.106 5.106a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06L6.106 6.167a.75.75 0 010-1.06z"></path></svg>
      <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 004.472-.528.75.75 0 01.818.162.75.75 0 01.162.819A10.5 10.5 0 119.528 1.718zM16.5 9a.75.75 0 01.75.75 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-1.5 0 1.5 1.5 0 00-1.5-1.5.75.75 0 010-1.5 1.5 1.5 0 001.5-1.5.75.75 0 01.75-.75z" clip-rule="evenodd"></path></svg>
    </button>
  </div>
</template>

<style scoped>
.footer {
  position: relative;
  padding: 2rem 1rem;
  background: var(--footer-bg); /* 确保这个变量在你的 main.css 中有定义 */
  color: var(--footer-text); /* 确保这个变量在你的 main.css 中有定义 */
  text-align: center;
}

.visitor-map {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 如果想给地图限定宽高，可以加： */
  /* width: 100%; max-width: 300px; height: 50px; */
}
</style>
