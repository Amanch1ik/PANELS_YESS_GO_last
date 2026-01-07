# 🚀 Настройка для хостинга - Admin_A / Chillgu1

## 📋 Важно для входа после хостинга

### **Проблема:**
После хостинга приложение может не находить API, и вход с `Admin_A` / `Chillgu1` не работает.

### **Решение:**

## **1️⃣ Настройка .env файла на сервере**

### **Для admin-panel:**
```bash
# Подключитесь к серверу
ssh yesgoadm@srv
cd /var/www/PANELS_YESS_GO_last/admin-panel

# Создайте .env файл для продакшена
cat > .env << 'EOF'
# Production environment variables for YESS!GO Admin Panel
# Used when running in production

# API Configuration - Direct API calls for production
VITE_API_BASE=https://api.yessgo.org/api/v1

# Alternative API URLs (uncomment if needed):
# VITE_API_BASE=https://admin.yessgo.org/api/v1
# VITE_API_BASE=http://localhost:8000/api/v1
# VITE_API_BASE=https://your-custom-api-domain.com/api/v1

# Optional: Analytics & Monitoring
# VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
EOF
```

### **Проверка настройки:**
```bash
# Проверьте созданный файл
cat .env
```

### **Для web-version-YES-GO:**
```bash
cd /var/www/PANELS_YESS_GO_last/web-version-YES-GO

# .env уже должен быть настроен правильно
# Проверьте содержимое:
cat .env
```

## **2️⃣ Пересборка приложений**

```bash
# Admin Panel
cd /var/www/PANELS_YESS_GO_last/admin-panel
npm install
npm run build

# Web App
cd /var/www/PANELS_YESS_GO_last/web-version-YES-GO
npm install
npm run build
```

## **3️⃣ Проверка API доступности**

```bash
# Проверьте, что API работает
curl -I https://api.yessgo.org/api/v1/health

# Или если API на том же сервере:
curl -I http://localhost:8000/api/v1/health
```

## **4️⃣ Тест входа**

После настройки попробуйте войти:
- **Логин:** `Admin_A`
- **Пароль:** `Chillgu1`

## **🔍 Возможные проблемы:**

### **Если API недоступен:**

1. **Проверьте домен API:**
   ```bash
   # Вместо api.yessgo.org может быть другой домен
   ping api.yessgo.org
   ```

2. **Проверьте порт API:**
   ```bash
   # API может работать на порту 8000, 3000 и т.д.
   curl http://localhost:8000/api/v1/health
   ```

3. **Обновите .env:**
   ```bash
   # В admin-panel/.env
   VITE_API_BASE=http://localhost:8000/api/v1
   # или
   VITE_API_BASE=https://your-actual-api-domain.com/api/v1
   ```

### **Если CORS ошибки:**

Добавьте в nginx конфигурацию:
```nginx
location /api/ {
    proxy_pass https://api.yessgo.org/api/;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Authorization, Content-Type";
}
```

## **✅ Быстрая проверка:**

```bash
# На сервере
cd /var/www/PANELS_YESS_GO_last/admin-panel
grep "VITE_API_BASE" .env
npm run build
systemctl reload nginx  # если используете nginx
```

**После настройки вход `Admin_A` / `Chillgu1` должен работать!** 🔑
