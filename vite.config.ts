// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  // ★ 核心修复：这里必须是相对路径 './'，绝对不能漏掉或写成 '/'
  base: './', 
  build: {
    target: 'es2022'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022'
    }
  },
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
})