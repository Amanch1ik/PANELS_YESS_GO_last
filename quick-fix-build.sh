#!/bin/bash
# One-liner fix for build permissions
cd /var/www/PANELS_YESS_GO_last/admin-panel && rm -rf dist && mkdir -p dist && chmod 755 dist && echo "✅ Fixed! Now run: npm run build"
