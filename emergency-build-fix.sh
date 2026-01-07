#!/bin/bash
# Emergency fix for stubborn permission issues

echo "🚨 EMERGENCY FIX - Trying all possible solutions..."

PROJECT_DIR="/var/www/PANELS_YESS_GO_last/admin-panel"
BACKUP_DIR="/tmp/admin-panel-backup-$(date +%s)"

# Check current permissions
echo "Current permissions:"
ls -la "$PROJECT_DIR/dist" 2>/dev/null || echo "dist folder doesn't exist or not accessible"

echo "Current user: $(whoami)"
echo "Current groups: $(groups)"

# Try to fix with sudo
echo "Attempting sudo fix..."
sudo rm -rf "$PROJECT_DIR/dist" 2>/dev/null || echo "sudo rm failed"
sudo mkdir -p "$PROJECT_DIR/dist" 2>/dev/null || echo "sudo mkdir failed"
sudo chown -R $(whoami):$(whoami) "$PROJECT_DIR/dist" 2>/dev/null || echo "sudo chown failed"
sudo chmod -R 755 "$PROJECT_DIR/dist" 2>/dev/null || echo "sudo chmod failed"

# If sudo doesn't work, try to backup and recreate
if [ ! -d "$PROJECT_DIR/dist" ] || [ ! -w "$PROJECT_DIR/dist" ]; then
    echo "Sudo approach failed, trying backup approach..."

    # Backup existing dist if it exists
    if [ -d "$PROJECT_DIR/dist" ]; then
        cp -r "$PROJECT_DIR/dist" "$BACKUP_DIR" 2>/dev/null && echo "Backed up dist to $BACKUP_DIR"
    fi

    # Try to remove as different user
    sudo rm -rf "$PROJECT_DIR/dist" 2>/dev/null || true

    # Create new directory
    sudo mkdir -p "$PROJECT_DIR/dist" 2>/dev/null || true
    sudo chown $(whoami) "$PROJECT_DIR/dist" 2>/dev/null || true
    sudo chgrp $(id -gn) "$PROJECT_DIR/dist" 2>/dev/null || true
    chmod 755 "$PROJECT_DIR/dist" 2>/dev/null || true
fi

# Final check
if [ -w "$PROJECT_DIR/dist" ]; then
    echo "✅ dist directory is now writable!"
    echo "Now run: npm run build"
else
    echo "❌ Still can't write to dist directory"
    echo "Please contact server administrator with this info:"
    echo "User: $(whoami)"
    echo "Groups: $(groups)"
    echo "Permissions: $(ls -ld $PROJECT_DIR 2>/dev/null)"
    echo "Dist permissions: $(ls -ld $PROJECT_DIR/dist 2>/dev/null)"
fi
