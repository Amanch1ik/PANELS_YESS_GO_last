#!/bin/bash
# Fix permissions for YESS!GO admin panel deployment

echo "🔧 Fixing permissions for YESS!GO admin panel..."

# Project directory
PROJECT_DIR="/var/www/PANELS_YESS_GO_last/admin-panel"

# Fix ownership
echo "Setting correct ownership..."
sudo chown -R yesgoadm:yesgoadm "$PROJECT_DIR"

# Fix permissions for directories
echo "Setting directory permissions..."
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;

# Fix permissions for files
echo "Setting file permissions..."
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;

# Make sure dist directory is writable
echo "Ensuring dist directory is writable..."
if [ -d "$PROJECT_DIR/dist" ]; then
    chmod -R 755 "$PROJECT_DIR/dist"
    sudo chown -R yesgoadm:yesgoadm "$PROJECT_DIR/dist"
fi

# Make node_modules writable if it exists
if [ -d "$PROJECT_DIR/node_modules" ]; then
    chmod -R 755 "$PROJECT_DIR/node_modules"
fi

echo "✅ Permissions fixed!"
echo ""
echo "Now try building again:"
echo "cd /var/www/PANELS_YESS_GO_last/admin-panel"
echo "npm run build"
