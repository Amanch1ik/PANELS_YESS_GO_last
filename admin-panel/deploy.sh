#!/bin/bash

# YESS!GO Admin Panel Deployment Script
# This script builds and deploys the admin panel

set -e

echo "🚀 Starting YESS!GO Admin Panel Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_DIR/dist"
DOCKER_IMAGE="yessgo-admin-panel:latest"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Check if Docker is available (optional)
if command -v docker &> /dev/null; then
    print_status "Docker is available: $(docker --version)"
    USE_DOCKER=true
else
    print_warning "Docker is not available. Will build without Docker."
    USE_DOCKER=false
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Clean previous build
print_status "Cleaning previous build..."
npm run clean

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Build for production
print_status "Building for production..."
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Check if main files exist
if [ ! -f "$BUILD_DIR/index.html" ]; then
    print_error "Build failed - index.html not found"
    exit 1
fi

print_status "Build completed successfully"

# Build Docker image if Docker is available
if [ "$USE_DOCKER" = true ]; then
    print_status "Building Docker image..."
    docker build -t "$DOCKER_IMAGE" .

    print_status "Docker image built: $DOCKER_IMAGE"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 8080:80 $DOCKER_IMAGE"
    echo ""
    echo "Or using docker-compose:"
    echo "  docker-compose up -d"
fi

# Print deployment summary
echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "Files ready for deployment:"
echo "  - Build directory: $BUILD_DIR"
echo "  - Main file: $BUILD_DIR/index.html"
echo "  - Assets: $BUILD_DIR/assets/"
echo ""
echo "Next steps:"
echo "1. Upload the 'dist' folder to your web server"
echo "2. Configure your web server to serve the dist folder"
echo "3. Ensure the server supports SPA routing (try_files)"
echo ""
if [ "$USE_DOCKER" = true ]; then
    echo "Docker deployment:"
    echo "1. Copy Dockerfile and docker-compose.yml to your server"
    echo "2. Run: docker-compose up -d"
    echo "3. Access at: http://your-server:8080"
    echo ""
fi

print_status "Deployment preparation completed successfully!"
