# 🔧 Настройка Environment Variables (.env)

## 📁 Структура .env файлов

### Для admin-panel:

#### `.env.local` (Development)
```bash
# Оставьте пустым для использования dev proxy
VITE_API_BASE=
```

#### `.env.production` (Production)
```bash
# Production API URL
VITE_API_BASE=https://api.yessgo.org/api/v1

# Optional: Analytics & Monitoring
# VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Для web-version-YES-GO:

#### `.env` (Development & Production)
```bash
# API Configuration
VITE_API_BASE_URL=https://api.yessgo.org
VITE_API_PROXY_TARGET=https://api.yessgo.org

# Development Settings
VITE_DEV_MODE=false
VITE_DIRECT_API=false

# Optional: Analytics & Monitoring
# VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

#### `.env.production` (Production override)
```bash
# Production-specific overrides
VITE_DEV_MODE=false
VITE_DIRECT_API=true  # Use direct API calls instead of proxy
```

## 🔄 Логика работы:

### admin-panel:
- **Development**: `VITE_API_BASE=""` → использует прокси из `vite.config.ts`
- **Production**: `VITE_API_BASE="https://api.yessgo.org/api/v1"` → прямые запросы к API

### web-version-YES-GO:
- **Development**: Использует прокси `/api` → перенаправляется на `VITE_API_PROXY_TARGET`
- **Production**: Использует `VITE_API_BASE_URL` напрямую

## 🚀 Развертывание:

### 1. Admin Panel:
```bash
# На сервере в /var/www/PANELS_YESS_GO_last/admin-panel/
cp .env.production .env
# Или создать .env с правильными настройками
```

### 2. Web App:
```bash
# На сервере в /var/www/PANELS_YESS_GO_last/web-version-YES-GO/
# .env уже настроен правильно
```

### 3. Пересборка:
```bash
npm run build
```

## ✅ Проверка:

После настройки и пересборки:

1. **Admin Panel** должен отправлять запросы на `https://api.yessgo.org/api/v1/...`
2. **Web App** должен отправлять запросы на `https://api.yessgo.org/api/v1/...`
3. **Dev режим** должен работать с прокси
4. **Prod режим** должен работать с прямыми API вызовами

## 🔍 Отладка:

```bash
# Проверить переменные в браузере
console.log(import.meta.env.VITE_API_BASE)
console.log(import.meta.env.VITE_API_BASE_URL)

# Проверить сетевые запросы в DevTools → Network
```
