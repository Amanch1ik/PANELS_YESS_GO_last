#!/bin/bash

echo "🚀 Настройка продакшена для Admin_A / Chillgu1"
echo "=============================================="

# Определяем API URL (можно изменить)
API_URL="${API_URL:-https://api.yessgo.org/api/v1}"

echo "📍 Текущая директория: $(pwd)"
echo "🔗 API URL: $API_URL"

# Настройка admin-panel
echo "📋 Настройка admin-panel..."
if [ -d "admin-panel" ]; then
    cd admin-panel

    # Создаем .env файл
    echo "VITE_API_BASE=$API_URL" > .env
    echo "✅ Создан admin-panel/.env"

    # Проверяем содержимое
    echo "📄 Содержимое .env:"
    cat .env

    # Пересборка
    echo "🔨 Пересборка admin-panel..."
    npm install && npm run build

    cd ..
else
    echo "❌ Директория admin-panel не найдена"
fi

# Настройка web-version-YES-GO
echo "📋 Настройка web-version-YES-GO..."
if [ -d "web-version-YES-GO" ]; then
    cd web-version-YES-GO

    # Проверяем .env
    if [ -f ".env" ]; then
        echo "✅ web-version-YES-GO/.env уже существует"
        echo "📄 Содержимое:"
        head -10 .env
    else
        echo "❌ web-version-YES-GO/.env не найден"
    fi

    # Пересборка
    echo "🔨 Пересборка web-version-YES-GO..."
    npm install && npm run build

    cd ..
else
    echo "❌ Директория web-version-YES-GO не найдена"
fi

echo ""
echo "🎯 Готово! Теперь можно тестировать вход:"
echo "   Логин: Admin_A"
echo "   Пароль: Chillgu1"
echo ""
echo "🔍 Если вход не работает:"
echo "   1. Проверьте API URL в .env файлах"
echo "   2. Убедитесь, что API сервер работает"
echo "   3. Проверьте логи браузера (F12 → Console)"
echo ""
echo "📞 Для изменения API URL:"
echo "   export API_URL=https://your-api-domain.com/api/v1"
echo "   ./setup-production.sh"
