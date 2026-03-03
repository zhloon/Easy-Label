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