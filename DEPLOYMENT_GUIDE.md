# 🚀 Руководство по развертыванию Admin Panel

## 📋 Текущая архитектура

- **Frontend (Admin Panel)**: `https://admin.yessgo.org/`
- **Backend API**: `https://api.yessgo.org/api/v1/`

## 🔧 Настройка для корректной работы API

### Вариант 1: Nginx Proxy (Рекомендуемый)

Используйте предоставленную конфигурацию `nginx-admin-config.conf`:

```bash
# Скопируйте конфигурацию на сервер
scp nginx-admin-config.conf yesgoadm@srv:/tmp/

# На сервере
sudo cp /tmp/nginx-admin-config.conf /etc/nginx/sites-available/admin.yessgo.org
sudo ln -s /etc/nginx/sites-available/admin.yessgo.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант 2: Код всегда использует api.yessgo.org

Код уже настроен так, чтобы в продакшн режиме использовать `https://api.yessgo.org/api/v1` напрямую.

### Вариант 3: Environment переменные

Создайте `.env` файл на сервере:

```bash
# В /var/www/PANELS_YESS_GO_last/admin-panel/.env
VITE_API_BASE=https://api.yessgo.org/api/v1
```

## 🔍 Проверка работы

### 1. Проверьте API доступность:
```bash
curl -I https://api.yessgo.org/api/v1/health
# Expected: 200 OK
```

### 2. Проверьте работу админ панели:
```bash
curl -I https://admin.yessgo.org/
# Expected: 200 OK
```

### 3. Проверьте API прокси:
```bash
curl https://admin.yessgo.org/api/v1/health
# Should proxy to api.yessgo.org
```

## 🐛 Отладка проблем

### Если запросы всё ещё идут на admin.yessgo.org:

1. **Проверьте nginx конфигурацию:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

2. **Проверьте логи nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Проверьте DNS:**
   ```bash
   nslookup api.yessgo.org
   nslookup admin.yessgo.org
   ```

4. **Проверьте браузер:**
   - Откройте DevTools → Network
   - Посмотрите на какие URL уходят запросы
   - Проверьте CORS headers

## 📊 Мониторинг

### Полезные команды для проверки:

```bash
# Проверить работу сервисов
sudo systemctl status nginx

# Проверить логи приложений
sudo journalctl -u nginx -f

# Проверить сетевые соединения
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

## 🎯 Ожидаемый результат

После настройки:
- ✅ Frontend доступен на `https://admin.yessgo.org/`
- ✅ API запросы проксируются на `https://api.yessgo.org/api/v1/`
- ✅ CORS настроен правильно
- ✅ SSL сертификаты работают
- ✅ Кэширование статических файлов настроено
