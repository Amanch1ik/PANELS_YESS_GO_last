#!/bin/bash

echo "🔧 Исправление проблемы сборки esbuild на сервере"
echo "=================================================="

echo "📁 Текущая директория: $(pwd)"

# Проверяем версию Node.js
echo "📊 Версия Node.js: $(node -v)"
echo "📊 Версия npm: $(npm -v)"

echo "🗑️  Шаг 1: Удаление node_modules и package-lock.json..."
rm -rf node_modules package-lock.json

echo "🧹 Шаг 2: Очистка кэша npm..."
npm cache clean --force 2>/dev/null || true

echo "📦 Шаг 3: Переустановка зависимостей..."
npm install

echo "🔍 Шаг 4: Проверка установленных версий..."
echo "esbuild version: $(npm list esbuild 2>/dev/null | grep esbuild || echo 'not found')"
echo "vite version: $(npm list vite 2>/dev/null | grep vite || echo 'not found')"

echo "🔨 Шаг 5: Попытка сборки..."
if npm run build; then
    echo "✅ Сборка прошла успешно!"
else
    echo "❌ Сборка не удалась. Попробуем альтернативные решения..."
    echo "🔄 Попытка с --force..."
    npm install --force
    npm run build
fi

echo "🎯 Готово!"
