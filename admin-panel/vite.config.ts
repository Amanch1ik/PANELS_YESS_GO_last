import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth/, '/api/v1/auth')
      },
      '/admin': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/admin/, '/api/v1/admin')
      },
      '/partners': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // For partner products, use the regular API endpoint, not admin
          if (path.match(/^\/partners\/\d+\/products/)) {
            return path.replace(/^\/partners/, '/api/v1/partners');
          }
          // For other partner operations, use admin endpoint
          return path.replace(/^\/partners/, '/api/v1/admin/partners');
        }
      },
      '/messages': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/messages/, '/api/v1/admin/notifications')
      },
      '/users': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/users/, '/api/v1/admin/users')
      },
      '/products': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/products/, '/api/v1/admin/promotions')
      },
      '/oauth': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/oauth/, '/api/v1/oauth')
      },
      '/partner': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/partner/, '/api/v1/partner')
      }
    }
  }
})


