import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  base: './', 
  
  plugins: [
    vue(), 
    tailwindcss(), 
    
    electron([
      {
        entry: 'src-electron/main.ts',
      },
    ]),
    
    renderer(),
    
  ],
  server: {
    // 🌟 添加 proxy 代理配置
    proxy: {
      '/api': {
        // 👇 将这里替换为您刚部署好的 Cloudflare Worker 的真实域名！
        target: 'https://easylabel.cloud', 
        changeOrigin: true, // 允许跨域
        secure: false       // 如果是 https 建议设为 false
      }
    }
  },
  
  // ★ 修复点 1：允许本地开发依赖预构建时，支持顶级 await
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },

  build: {
    // ★ 修复点 2：将生产打包的目标环境升级为 esnext，完美放行 pdf.js
    target: 'esnext', 
    chunkSizeWarningLimit: 1500, 
  }
})