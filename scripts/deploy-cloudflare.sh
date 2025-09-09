#!/bin/bash

# Cloudflare deployment script
set -e

echo "🌟 Deploying SVG AI to Cloudflare..."
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

# Check if .env.production exists and has Cloudflare config
if [ ! -f ".env.production" ] || ! grep -q "CF_DEPLOYMENT_TYPE" .env.production; then
    print_warning "Cloudflare configuration not found. Running configuration..."
    ./scripts/configure-cloudflare.sh
fi

# Read deployment type from .env.production
DEPLOYMENT_TYPE=$(grep "CF_DEPLOYMENT_TYPE" .env.production | cut -d'=' -f2)
DOMAIN=$(grep "CF_DOMAIN" .env.production | cut -d'=' -f2)

print_header "Deployment Type: $DEPLOYMENT_TYPE"
print_header "Domain: $DOMAIN"

# Build the application
print_info "Building application..."
npm run build

case $DEPLOYMENT_TYPE in
    1)
        print_header "Deploying to Cloudflare Pages + Workers"
        
        # Deploy to Cloudflare Pages
        print_info "Deploying frontend to Cloudflare Pages..."
        wrangler pages deploy dist --project-name=svg-ai --compatibility-date=2024-01-01
        
        # Create Worker if it doesn't exist
        if [ ! -f "server/worker.ts" ]; then
            print_info "Creating Cloudflare Worker adapter..."
            mkdir -p server
            cat > server/worker.ts << 'EOF'
import { Hono } from "hono";
import { cors } from "hono/cors";

// Import your existing services
import { RuleBasedGenerator } from "./services/RuleBasedGenerator";
import type { GenerationRequest } from "./types";

const app = new Hono();

// CORS for Cloudflare
app.use("*", cors({
  origin: ["https://svg-ai.pages.dev", "https://*.pages.dev"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    worker: true,
  });
});

// SVG generation endpoint
app.post("/api/generate", async (c) => {
  try {
    const request: GenerationRequest = await c.req.json();
    const generator = new RuleBasedGenerator();
    const result = await generator.generate(request);
    return c.json(result);
  } catch (error) {
    return c.json({ 
      error: "Generation failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export default app;
EOF
        fi
        
        # Deploy Worker
        print_info "Deploying backend to Cloudflare Workers..."
        wrangler deploy
        
        print_success "✅ Deployed to Cloudflare Pages + Workers!"
        print_info "🌐 Frontend: https://svg-ai.pages.dev"
        print_info "🔧 Worker: https://svg-ai-api.$DOMAIN.workers.dev"
        ;;
        
    2)
        print_header "Deploying with Cloudflare Tunnel"
        
        # Check if tunnel exists
        if ! cloudflared tunnel list | grep -q "svg-ai"; then
            print_info "Creating Cloudflare tunnel..."
            cloudflared tunnel create svg-ai
        fi
        
        # Deploy with Docker Compose
        print_info "Starting Docker containers..."
        docker-compose -f docker-compose.prod.yml up -d
        
        # Create tunnel config if it doesn't exist
        TUNNEL_CONFIG="$HOME/.cloudflared/config.yml"
        if [ ! -f "$TUNNEL_CONFIG" ]; then
            print_info "Creating tunnel configuration..."
            mkdir -p "$HOME/.cloudflared"
            cat > "$TUNNEL_CONFIG" << EOF
tunnel: svg-ai
credentials-file: ~/.cloudflared/$(cloudflared tunnel list | grep svg-ai | awk '{print $1}').json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:8080
  - hostname: api.$DOMAIN
    service: http://localhost:3001
  - service: http_status:404
EOF
        fi
        
        # Configure DNS
        print_info "Configuring DNS..."
        cloudflared tunnel route dns svg-ai $DOMAIN || print_warning "DNS might already be configured"
        
        print_success "✅ Application deployed!"
        print_info "🌐 Your app: https://$DOMAIN"
        print_warning "⚠️  Don't forget to start the tunnel: cloudflared tunnel run svg-ai"
        ;;
        
    3)
        print_header "Deploying to Cloudflare Pages (Static)"
        
        # Deploy to Cloudflare Pages
        print_info "Deploying to Cloudflare Pages..."
        wrangler pages deploy dist --project-name=svg-ai --compatibility-date=2024-01-01
        
        print_success "✅ Frontend deployed to Cloudflare Pages!"
        print_info "🌐 Frontend: https://svg-ai.pages.dev"
        print_warning "⚠️  Don't forget to deploy your API separately!"
        ;;
        
    *)
        print_warning "Unknown deployment type. Please run: npm run configure:cloudflare"
        exit 1
        ;;
esac

echo ""
print_success "🎉 Cloudflare deployment completed!"
print_info "📖 Check CLOUDFLARE.md for more configuration options"