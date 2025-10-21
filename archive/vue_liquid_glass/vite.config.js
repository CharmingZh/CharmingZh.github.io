import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  // Use '/' for deploying to the root of a domain.
  base: '/',
  plugins: [
    vue({
      // 启用响应式系统优化
      reactivityTransform: true,
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsInlineLimit: 0,
    // 启用代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Vue相关库分离
          vue: ['vue'],
          // 将WebGL库分离
          ogl: ['ogl'],
          // 将Liquid Glass库分离
          'liquid-glass': ['@wxperia/liquid-glass-vue'],
        },
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true, // 生产环境移除debugger
      },
    },
    // 启用source map（仅开发环境）
    sourcemap: false,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', '@wxperia/liquid-glass-vue'],
  },
})
