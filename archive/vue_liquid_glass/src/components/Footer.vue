<template>
  <div>
    <footer class="footer">
      <div class="social-links">
        <a href="mailto:zhan2374@msu.edu" title="Email"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2 0v.01L12 9.51 17 4.01V4H5Zm0 2.62V18h14V6.62l-5.99 4.68a1 1 0 0 1-1.24 0L5 6.62Z"></path></svg></a>
        <a href="https://github.com/CharmingZh" target="_blank" title="GitHub"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34c-.45-1.15-1.1-1.46-1.1-1.46c-.91-.62.07-.61.07-.61c1 .07 1.53 1.03 1.53 1.03c.9 1.52 2.36 1.08 2.94.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.1.39-1.99 1.03-2.69a2.3 2.3 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.37.2 2.4.1 2.64c.64.7 1.03 1.6 1.03 2.69c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85v2.72c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"></path></svg></a>
        <a href="https://scholar.google.com.hk/citations?user=kEJINEIAAAAJ" target="_blank" title="Google Scholar"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2Zm0 14.5l-5.5-3.18v-5.04l5.5 3.18l5.5-3.18v5.04L12 16.5Z"></path></svg></a>
        <a href="https://www.linkedin.com/in/jiamingzh/" target="_blank" title="LinkedIn"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14Zm-7 6.67h-2.11v5.44H12v-5.44ZM9.44 8.56a1.11 1.11 0 1 0 0 2.22a1.11 1.11 0 0 0 0-2.22Zm8.67 3.25c0-2.3-1.28-3.42-3.07-3.42c-1.45 0-2.3.79-2.68 1.51h-.03v-1.29H10.2v5.44h2.11v-2.67c0-.7.13-1.39.99-1.39c.85 0 .86.8.86 1.43v2.63h2.12v-3.35Z"></path></svg></a>
      </div>
      <p>&copy; 2025 Jiaming Zhang. All Rights Reserved.</p>
    </footer>

    <button class="theme-switcher" id="theme-toggle" title="Switch Theme">
      <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.061 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.836 17.894a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.59a.75.75 0 010-1.06zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75-.75zM5.106 17.836a.75.75 0 010-1.06l1.591-1.591a.75.75 0 111.06 1.06l-1.59 1.591a.75.75 0 01-1.061 0zM3 12a.75.75 0 01.75-.75h2.25a.75.75 0 010-1.5H3.75A.75.75 0 013 12zM6.106 5.106a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06L6.106 6.167a.75.75 0 010-1.06z"></path></svg>
      <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 004.472-.528.75.75 0 01.818.162.75.75 0 01.162.819A10.5 10.5 0 119.528 1.718zM16.5 9a.75.75 0 01.75.75 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-1.5 0 1.5 1.5 0 00-1.5-1.5.75.75 0 010-1.5 1.5 1.5 0 001.5-1.5.75.75 0 01.75-.75z" clip-rule="evenodd"></path></svg>
    </button>
  </div>
</template>
