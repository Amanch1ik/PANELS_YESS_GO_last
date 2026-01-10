import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // Different port from admin panel
    host: '127.0.0.1',
    proxy: {
      // Proxy partner endpoints to real API to avoid CORS during development
      '/partner': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/partner/, '/api/v1/partner')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})