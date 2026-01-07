#!/bin/bash
# Quick fix for build permissions issue

echo "🔧 Quick fix for build permissions..."

PROJECT_DIR="/var/www/PANELS_YESS_GO_last/admin-panel"

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf "$PROJECT_DIR/dist"

# Create fresh dist directory with correct permissions
mkdir -p "$PROJECT_DIR/dist"
chmod 755 "$PROJECT_DIR/dist"

echo "✅ Ready for build!"
echo ""
echo "Now run:"
echo "npm run build"
