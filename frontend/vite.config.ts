import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 18601,
    proxy: {
      '/api': {
        target: 'http://localhost:18602',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:18602',
        ws: true
      }
    }
  }
})