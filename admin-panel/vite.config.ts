import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: '127.0.0.1',
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
          // For other partner operations, try different API paths
          // First try admin endpoint, if it fails we can try others
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
      },
      '/transactions': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/transactions/, '/api/v1/admin/transactions')
      },
      '/payments': {
        target: 'https://api.yessgo.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/payments/, '/api/v1/admin/payments')
      }
    },
    historyApiFallback: true
  },
  build: {
    // Увеличиваем лимит размера чанка
    chunkSizeWarningLimit: 1000,
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем React и связанные библиотеки
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Разделяем UI библиотеки
          'ui-vendor': ['recharts'],
          // Разделяем утилиты
          'utils-vendor': ['axios', 'date-fns']
        }
      }
    },
    // Оптимизации для production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Source maps для production (опционально)
    sourcemap: false,
    // CSS код-сплиттинг
    cssCodeSplit: true,
    // Оптимизация изображений
    assetsInlineLimit: 4096,
    // Настройки для chunks
    reportCompressedSize: false
  },
  // Оптимизации зависимостей
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'recharts', 'date-fns']
  }
})


