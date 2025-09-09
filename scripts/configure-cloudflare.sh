#!/bin/bash

# Cloudflare configuration helper script
set -e

echo "☁️  SVG AI Cloudflare Configuration Helper"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${CYAN}[CLOUDFLARE]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_info "Creating .env.production from template..."
    cp .env.production.example .env.production
    print_success ".env.production created!"
fi

echo "Choose your Cloudflare deployment option:"
echo "1. Cloudflare Pages + Workers (Serverless)"
echo "2. Cloudflare Tunnel + VPS (Traditional server)"
echo "3. Cloudflare Pages + External API"
echo ""

read -p "Enter your choice (1-3): " DEPLOYMENT_TYPE

case $DEPLOYMENT_TYPE in
    1)
        print_header "Configuring for Cloudflare Pages + Workers"
        
        read -p "Enter your domain (e.g., example.com): " DOMAIN
        read -p "Enter your worker subdomain (e.g., api): " WORKER_SUBDOMAIN
        
        API_URL="https://${WORKER_SUBDOMAIN}.${DOMAIN}"
        ALLOWED_ORIGINS="https://${DOMAIN},https://www.${DOMAIN},https://svg-ai.pages.dev"
        
        print_info "API will be at: $API_URL"
        print_info "Frontend will be at: https://$DOMAIN"
        ;;
        
    2)
        print_header "Configuring for Cloudflare Tunnel"
        
        read -p "Enter your domain (e.g., example.com): " DOMAIN
        
        API_URL=""  # Use relative URLs with tunnel
        ALLOWED_ORIGINS="https://${DOMAIN},https://www.${DOMAIN}"
        
        print_info "Both frontend and API will be at: https://$DOMAIN"
        print_warning "Make sure to configure your tunnel to route /api/* to port 3001"
        ;;
        
    3)
        print_header "Configuring for Cloudflare Pages + External API"
        
        read -p "Enter your frontend domain (e.g., example.com): " DOMAIN
        read -p "Enter your API server URL (e.g., https://api.example.com): " API_SERVER
        
        API_URL="$API_SERVER"
        ALLOWED_ORIGINS="https://${DOMAIN},https://www.${DOMAIN},https://svg-ai.pages.dev"
        
        print_info "Frontend will be at: https://$DOMAIN"
        print_info "API will be at: $API_SERVER"
        ;;
        
    *)
        print_warning "Invalid choice. Defaulting to option 2 (Cloudflare Tunnel)"
        read -p "Enter your domain (e.g., example.com): " DOMAIN
        API_URL=""
        ALLOWED_ORIGINS="https://${DOMAIN},https://www.${DOMAIN}"
        ;;
esac

# Ask about OpenAI API key
echo ""
read -p "Do you have an OpenAI API key? (y/n): " HAS_OPENAI

if [ "$HAS_OPENAI" = "y" ] || [ "$HAS_OPENAI" = "Y" ]; then
    read -p "Enter your OpenAI API key: " OPENAI_KEY
    OPENAI_LINE="OPENAI_API_KEY=$OPENAI_KEY"
else
    OPENAI_LINE="# OPENAI_API_KEY=your-openai-api-key-here"
fi

# Create the new .env.production file
cat > .env.production << EOF
# Production Environment Configuration - Cloudflare

# Application
NODE_ENV=production
PORT=3001

# API Configuration - Cloudflare specific
VITE_API_BASE_URL=$API_URL

# Cache Configuration
CACHE_MAX_SIZE=2000
CACHE_TTL_MINUTES=120

# Security - Cloudflare domains
ALLOWED_ORIGINS=$ALLOWED_ORIGINS

# OpenAI Configuration (optional)
$OPENAI_LINE

# Logging
LOG_LEVEL=info

# Performance
MAX_REQUEST_SIZE=2097152
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Health Check
HEALTH_CHECK_TIMEOUT=5000

# Cloudflare specific
CF_DEPLOYMENT_TYPE=$DEPLOYMENT_TYPE
CF_DOMAIN=$DOMAIN
EOF

echo ""
print_success "✅ Cloudflare configuration complete!"
echo ""
echo "Your new .env.production file:"
echo "=============================="
cat .env.production
echo ""

# Provide next steps based on deployment type
case $DEPLOYMENT_TYPE in
    1)
        print_header "Next Steps for Cloudflare Pages + Workers:"
        echo "1. Install Wrangler CLI: npm install -g wrangler"
        echo "2. Login to Cloudflare: wrangler login"
        echo "3. Build your app: npm run build"
        echo "4. Deploy to Pages: wrangler pages deploy dist --project-name=svg-ai"
        echo "5. Deploy Worker: wrangler deploy"
        echo ""
        print_info "📖 See CLOUDFLARE.md for detailed instructions"
        ;;
        
    2)
        print_header "Next Steps for Cloudflare Tunnel:"
        echo "1. Install cloudflared: brew install cloudflare/cloudflare/cloudflared"
        echo "2. Login: cloudflared tunnel login"
        echo "3. Create tunnel: cloudflared tunnel create svg-ai"
        echo "4. Configure DNS: cloudflared tunnel route dns svg-ai $DOMAIN"
        echo "5. Deploy app: npm run docker:compose"
        echo "6. Start tunnel: cloudflared tunnel run svg-ai"
        echo ""
        print_info "📖 See CLOUDFLARE.md for detailed tunnel configuration"
        ;;
        
    3)
        print_header "Next Steps for Cloudflare Pages + External API:"
        echo "1. Build frontend: npm run build"
        echo "2. Deploy to Cloudflare Pages (upload dist folder or connect Git)"
        echo "3. Deploy your API to your chosen platform"
        echo "4. Update CORS settings on your API server"
        echo ""
        print_info "📖 See CLOUDFLARE.md for external API deployment options"
        ;;
esac

print_success "🌟 Ready for Cloudflare deployment!"