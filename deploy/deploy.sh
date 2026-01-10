#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for the panels.
# Usage:
#   ./deploy/deploy.sh /path/to/project-root /var/www/PANELS_YESS_GO_last
#
# This script:
#  - builds admin-panel and partner-panel (expects .env with VITE_API_BASE=/api in each)
#  - copies built files to target webroot
#  - tests nginx config and reloads nginx
PROJECT_ROOT="${1:-$(pwd)}"
TARGET_ROOT="${2:-/var/www/PANELS_YESS_GO_last}"

echo "Project root: $PROJECT_ROOT"
echo "Target root: $TARGET_ROOT"

cd "$PROJECT_ROOT/admin-panel"
echo "Installing admin dependencies..."
npm ci
echo "Building admin-panel..."
npm run build

cd "$PROJECT_ROOT/partner-panel"
echo "Installing partner dependencies..."
npm ci
echo "Building partner-panel..."
npm run build

echo "Copying built files to $TARGET_ROOT..."
rm -rf "$TARGET_ROOT/admin-panel"
mkdir -p "$TARGET_ROOT"
cp -r "$PROJECT_ROOT/admin-panel/dist" "$TARGET_ROOT/admin-panel"
mv "$TARGET_ROOT/admin-panel/dist" "$TARGET_ROOT/admin-panel"

rm -rf "$TARGET_ROOT/partner-panel"
cp -r "$PROJECT_ROOT/partner-panel/dist" "$TARGET_ROOT/partner-panel"
mv "$TARGET_ROOT/partner-panel/dist" "$TARGET_ROOT/partner-panel"

echo "Testing nginx config..."
nginx -t
echo "Reloading nginx..."
systemctl reload nginx

echo "Deploy completed."


