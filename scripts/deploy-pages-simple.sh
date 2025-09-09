#!/bin/bash

# Simple Cloudflare Pages deployment
set -e

echo "🚀 Deploying to Cloudflare Pages..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare first:"
    wrangler login
fi

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    print_info "Building application..."
    npm run build
fi

# Try to deploy directly first
print_info "Deploying to Cloudflare Pages..."

if wrangler pages deploy dist --project-name=svg-ai; then
    print_success "✅ Deployment successful!"
else
    print_info "Project might not exist. Creating it first..."
    
    # Create project if it doesn't exist
    wrangler pages project create svg-ai --production-branch=main
    
    # Try deploying again
    print_info "Deploying again..."
    wrangler pages deploy dist --project-name=svg-ai
    
    print_success "✅ Deployment successful!"
fi

echo ""
print_success "🌐 Your app is deployed!"
print_info "Default URL: https://svg-ai.pages.dev"
print_info "To add a custom domain, go to Cloudflare Dashboard → Pages → svg-ai → Custom domains"