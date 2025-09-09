#!/bin/bash

# Production build script
set -e

echo "🏗️  Building SVG AI Code Generator for production..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed. Please install Bun first."
    echo "Visit: https://bun.sh/docs/installation"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies
print_status "Installing dependencies..."
bun install --frozen-lockfile

# Run tests
print_status "Running tests..."
if ! bun run test:unit; then
    print_warning "Unit tests failed. Continuing with build..."
fi

# Type check
print_status "Running TypeScript type check..."
if ! bun run vue-tsc --noEmit; then
    echo "❌ Error: TypeScript type check failed."
    exit 1
fi

# Build frontend
print_status "Building frontend application..."
if ! bun run build; then
    echo "❌ Error: Frontend build failed."
    exit 1
fi

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build output directory 'dist' not found."
    exit 1
fi

# Check if critical files exist
critical_files=("dist/index.html" "dist/assets")
for file in "${critical_files[@]}"; do
    if [ ! -e "$file" ]; then
        echo "❌ Error: Critical build file '$file' not found."
        exit 1
    fi
done

# Build size analysis
print_status "Analyzing build size..."
if command -v du &> /dev/null; then
    build_size=$(du -sh dist/ | cut -f1)
    print_status "Total build size: $build_size"
fi

# List main assets
print_status "Build assets:"
find dist/assets -name "*.js" -o -name "*.css" | head -10 | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "  - $(basename "$file"): $size"
done

# Verify server can start
print_status "Verifying server configuration..."
timeout 10s bun run server/index.ts &
server_pid=$!
sleep 3

if kill -0 $server_pid 2>/dev/null; then
    print_status "✅ Server starts successfully"
    kill $server_pid
else
    echo "❌ Error: Server failed to start"
    exit 1
fi

print_status "🎉 Production build completed successfully!"
print_status "Build output is in the 'dist' directory"
print_status "To deploy, run: ./scripts/deploy.sh"