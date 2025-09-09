#!/bin/bash

# Fixed Cloudflare Pages deployment with unique project name
set -e

echo "🚀 Deploying to Cloudflare Pages..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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

# Generate unique project name
TIMESTAMP=$(date +%s)
PROJECT_NAME="svg-ai-gen-$TIMESTAMP"

print_info "Using project name: $PROJECT_NAME"

# Deploy to Cloudflare Pages
print_info "Deploying to Cloudflare Pages..."

if wrangler pages deploy dist --project-name="$PROJECT_NAME"; then
    print_success "✅ Deployment successful!"
    
    # Get the deployment URL
    PAGES_URL="https://$PROJECT_NAME.pages.dev"
    
    echo ""
    print_success "🌐 Your app is deployed!"
    print_info "URL: $PAGES_URL"
    
    # Test the deployment
    print_info "Testing deployment..."
    sleep 5
    
    if curl -f "$PAGES_URL/health" > /dev/null 2>&1; then
        print_success "✅ Health check passed!"
    else
        print_warning "⚠️  Health check failed, but deployment succeeded"
        print_info "The app might need a few minutes to be fully available"
    fi
    
    echo ""
    print_info "To add a custom domain:"
    echo "1. Go to Cloudflare Dashboard → Pages → $PROJECT_NAME → Custom domains"
    echo "2. Add your domain: svg.seh-nya.com"
    echo "3. Add CNAME record: svg → $PROJECT_NAME.pages.dev"
    
else
    print_warning "Deployment failed. Trying alternative approach..."
    
    # Try without project name (let Cloudflare generate one)
    print_info "Deploying without specific project name..."
    wrangler pages deploy dist
fi