#!/bin/bash

# CNAME domain setup for Cloudflare Pages
set -e

echo "🌐 Setting up CNAME domain for SVG AI on Cloudflare Pages"
echo "========================================================"
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
    echo -e "${CYAN}[SETUP]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    print_info "Please login to Cloudflare first:"
    wrangler login
fi

echo "Let's set up your custom domain for Cloudflare Pages!"
echo ""

# Get domain information
read -p "Enter your main domain (e.g., yourdomain.com): " MAIN_DOMAIN
read -p "Enter your subdomain for the app (e.g., svg-ai): " SUBDOMAIN

FULL_DOMAIN="${SUBDOMAIN}.${MAIN_DOMAIN}"

print_header "Your app will be available at: https://$FULL_DOMAIN"
echo ""

# Ask about API setup
echo "How do you want to set up the API?"
echo "1. Use Cloudflare Workers (api.$FULL_DOMAIN)"
echo "2. Use the same domain with /api path ($FULL_DOMAIN/api)"
echo "3. Use a different API domain"
echo ""

read -p "Choose option (1-3): " API_OPTION

case $API_OPTION in
    1)
        API_DOMAIN="api.${FULL_DOMAIN}"
        API_URL="https://${API_DOMAIN}"
        print_info "API will be at: $API_URL"
        ;;
    2)
        API_DOMAIN="$FULL_DOMAIN"
        API_URL=""  # Use relative URLs
        print_info "API will be at: https://$FULL_DOMAIN/api"
        ;;
    3)
        read -p "Enter your API domain (e.g., api.example.com): " API_DOMAIN
        API_URL="https://${API_DOMAIN}"
        print_info "API will be at: $API_URL"
        ;;
    *)
        print_warning "Invalid option. Using option 2 (same domain with /api path)"
        API_DOMAIN="$FULL_DOMAIN"
        API_URL=""
        ;;
esac

# Ask about OpenAI
echo ""
read -p "Do you have an OpenAI API key? (y/n): " HAS_OPENAI

if [ "$HAS_OPENAI" = "y" ] || [ "$HAS_OPENAI" = "Y" ]; then
    read -p "Enter your OpenAI API key: " OPENAI_KEY
    OPENAI_LINE="OPENAI_API_KEY=$OPENAI_KEY"
else
    OPENAI_LINE="# OPENAI_API_KEY=your-openai-api-key-here"
fi

# Create environment configuration
ALLOWED_ORIGINS="https://${FULL_DOMAIN},https://www.${FULL_DOMAIN}"

cat > .env.production << EOF
# Production Environment Configuration - Cloudflare Pages with CNAME

# Application
NODE_ENV=production
PORT=3001

# API Configuration - Custom domain
VITE_API_BASE_URL=$API_URL

# Cache Configuration
CACHE_MAX_SIZE=2000
CACHE_TTL_MINUTES=120

# Security - Custom domain
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

# Cloudflare CNAME Configuration
CF_DEPLOYMENT_TYPE=cname
CF_DOMAIN=$FULL_DOMAIN
CF_MAIN_DOMAIN=$MAIN_DOMAIN
CF_SUBDOMAIN=$SUBDOMAIN
CF_API_DOMAIN=$API_DOMAIN
EOF

print_success "✅ Environment configured!"
echo ""

# Build the application
print_info "Building application..."
npm run build

# Deploy to Cloudflare Pages
print_info "Deploying to Cloudflare Pages..."

# Check if project exists, create if not
if ! wrangler pages project list | grep -q "svg-ai"; then
    print_info "Creating Cloudflare Pages project..."
    wrangler pages project create svg-ai --production-branch=main
fi

wrangler pages deploy dist --project-name=svg-ai

# Get the Pages project info
PROJECT_NAME="svg-ai"

echo ""
print_success "🎉 Application deployed to Cloudflare Pages!"
echo ""

print_header "Next Steps - DNS Configuration:"
echo ""
echo "1. Go to your domain registrar (where you bought $MAIN_DOMAIN)"
echo "2. Add a CNAME record:"
echo "   Name: $SUBDOMAIN"
echo "   Value: svg-ai.pages.dev"
echo "   TTL: Auto or 300 seconds"
echo ""

if [ "$API_OPTION" = "1" ]; then
    echo "3. Add another CNAME record for the API:"
    echo "   Name: api.$SUBDOMAIN"
    echo "   Value: svg-ai-api.your-account.workers.dev"
    echo "   TTL: Auto or 300 seconds"
    echo ""
fi

print_header "Cloudflare Pages Configuration:"
echo ""
echo "1. Go to Cloudflare Dashboard → Pages → svg-ai"
echo "2. Go to Custom domains tab"
echo "3. Click 'Set up a custom domain'"
echo "4. Enter: $FULL_DOMAIN"
echo "5. Click 'Continue' and follow the verification steps"
echo ""

if [ "$API_OPTION" = "1" ]; then
    print_header "Worker API Configuration:"
    echo ""
    echo "1. Deploy the Worker API:"
    echo "   wrangler deploy"
    echo ""
    echo "2. Add custom domain to Worker:"
    echo "   wrangler route add '$API_DOMAIN/*' svg-ai-api"
    echo ""
fi

print_header "Environment Variables (if needed):"
echo ""
echo "In Cloudflare Pages → Settings → Environment variables, add:"
echo "VITE_API_BASE_URL = $API_URL"
echo ""

print_success "🌟 Setup complete!"
echo ""
echo "Your app will be available at:"
echo "🌐 Frontend: https://$FULL_DOMAIN"
if [ "$API_OPTION" = "1" ]; then
    echo "🔧 API: https://$API_DOMAIN"
else
    echo "🔧 API: https://$FULL_DOMAIN/api"
fi
echo ""

print_info "📖 See CLOUDFLARE.md for more detailed configuration options"
print_warning "⚠️  DNS changes may take up to 24 hours to propagate worldwide"

# Create a verification script
cat > scripts/verify-domain.sh << 'EOF'
#!/bin/bash

echo "🔍 Verifying domain setup..."

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

echo "Checking DNS resolution for $DOMAIN..."
nslookup "$DOMAIN" || echo "DNS not yet propagated"

echo "Checking HTTPS certificate..."
curl -I "https://$DOMAIN" 2>/dev/null | head -1 || echo "HTTPS not yet available"

echo "Checking health endpoint..."
curl -s "https://$DOMAIN/health" | jq . 2>/dev/null || echo "Health endpoint not yet available"

echo "Done!"
EOF

chmod +x scripts/verify-domain.sh

echo "💡 Tip: Use 'scripts/verify-domain.sh $FULL_DOMAIN' to check if your domain is working"