#!/bin/bash
# Build in temporary directory to avoid permission issues

echo "🏗️ Building in temporary directory..."

PROJECT_DIR="/var/www/PANELS_YESS_GO_last/admin-panel"
TEMP_DIR="/tmp/admin-panel-build-$(date +%s)"

# Create temp directory
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Copy source files (excluding node_modules and dist)
echo "Copying source files..."
cp -r "$PROJECT_DIR"/* "$TEMP_DIR"/ 2>/dev/null
cp -r "$PROJECT_DIR"/.* "$TEMP_DIR"/ 2>/dev/null

# Remove problematic directories
rm -rf "$TEMP_DIR/node_modules" "$TEMP_DIR/dist" 2>/dev/null

# Create symlink to node_modules
ln -s "$PROJECT_DIR/node_modules" "$TEMP_DIR/node_modules" 2>/dev/null

# Build
echo "Building..."
npm run build

# Copy result back
if [ -d "$TEMP_DIR/dist" ]; then
    echo "Copying build result back..."
    sudo rm -rf "$PROJECT_DIR/dist" 2>/dev/null
    sudo mkdir -p "$PROJECT_DIR/dist" 2>/dev/null
    sudo cp -r "$TEMP_DIR/dist"/* "$PROJECT_DIR/dist"/ 2>/dev/null
    sudo chown -R $(whoami):$(whoami) "$PROJECT_DIR/dist" 2>/dev/null

    echo "✅ Build completed successfully!"
    echo "Result copied to: $PROJECT_DIR/dist"
else
    echo "❌ Build failed"
fi

# Cleanup
cd /tmp
rm -rf "$TEMP_DIR"
