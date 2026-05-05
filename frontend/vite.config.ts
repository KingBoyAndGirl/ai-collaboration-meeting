import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 18501,
    proxy: {
      '/api': {
        target: 'http://localhost:18502',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:18502',
        ws: true
      }
    }
  }
})