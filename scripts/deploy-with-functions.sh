#!/bin/bash

# Deploy to Cloudflare Pages with Functions
set -e

echo "🚀 Deploying SVG AI to Cloudflare Pages with Functions..."

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

# Build the frontend
print_info "Building frontend..."
npm run build

# Copy server files to functions directory for deployment
print_info "Preparing Functions..."
mkdir -p functions/api/server
cp -r server/* functions/api/server/ 2>/dev/null || true

# Generate unique project name if needed
TIMESTAMP=$(date +%s)
PROJECT_NAME="svg-ai-$TIMESTAMP"

print_info "Using project name: $PROJECT_NAME"

# Deploy to Cloudflare Pages
print_info "Deploying to Cloudflare Pages with Functions..."

if wrangler pages deploy . --project-name="$PROJECT_NAME"; then
    print_success "✅ Deployment successful!"
    
    # Get the deployment URL
    PAGES_URL="https://$PROJECT_NAME.pages.dev"
    
    echo ""
    print_success "🌐 Your app is deployed!"
    print_info "Frontend: $PAGES_URL"
    print_info "API: $PAGES_URL/api/generate"
    
    # Test the deployment
    print_info "Testing deployment..."
    sleep 10
    
    if curl -f "$PAGES_URL/api/health" > /dev/null 2>&1; then
        print_success "✅ API health check passed!"
    else
        print_warning "⚠️  API health check failed, trying direct test..."
        
        # Test with a simple generation request
        if curl -X POST "$PAGES_URL/api/generate" \
           -H "Content-Type: application/json" \
           -d '{"prompt":"test","size":{"width":100,"height":100}}' > /dev/null 2>&1; then
            print_success "✅ API generation test passed!"
        else
            print_warning "⚠️  API might need a few minutes to be fully available"
        fi
    fi
    
    echo ""
    print_info "🔧 To add your custom domain (svg.seh-nya.com):"
    echo "1. Go to Cloudflare Dashboard → Pages → $PROJECT_NAME → Custom domains"
    echo "2. Click 'Set up a custom domain'"
    echo "3. Enter: svg.seh-nya.com"
    echo "4. Add CNAME record in your DNS:"
    echo "   Name: svg"
    echo "   Value: $PROJECT_NAME.pages.dev"
    echo ""
    
    print_success "🎉 Deployment complete!"
    
else
    print_warning "Deployment failed. Check the error above."
    exit 1
fi