#!/bin/bash

# Production configuration helper script
set -e

echo "🔧 SVG AI Production Configuration Helper"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_info "Creating .env.production from template..."
    cp .env.production.example .env.production
    print_success ".env.production created!"
else
    print_info ".env.production already exists"
fi

echo ""
echo "Current configuration:"
echo "====================="
cat .env.production
echo ""

# Ask user for their domain
echo "Let's configure your production environment:"
echo ""

read -p "Enter your domain name (e.g., example.com) or press Enter for localhost only: " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_info "Configuring for localhost testing only..."
    ALLOWED_ORIGINS="http://localhost:8080"
else
    print_info "Configuring for domain: $DOMAIN"
    ALLOWED_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://localhost:8080"
fi

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
# Production Environment Configuration

# Application
NODE_ENV=production
PORT=3001

# API Configuration - Empty for nginx proxy (DO NOT CHANGE)
VITE_API_BASE_URL=

# Cache Configuration
CACHE_MAX_SIZE=2000
CACHE_TTL_MINUTES=120

# Security - Your domain and nginx proxy origins
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
EOF

echo ""
print_success "✅ Configuration complete!"
echo ""
echo "Your new .env.production file:"
echo "=============================="
cat .env.production
echo ""

print_info "Key settings explained:"
echo "• VITE_API_BASE_URL is empty - this makes the app use relative URLs like '/api/generate'"
echo "• ALLOWED_ORIGINS includes your domain - this allows CORS requests from your website"
echo "• All other settings are optimized for production"
echo ""

print_success "🚀 Ready to deploy! Run: npm run deploy"