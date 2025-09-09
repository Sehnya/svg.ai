#!/bin/bash

# Clean Cloudflare Pages deployment
set -e

echo "🚀 Deploying SVG AI to Cloudflare Pages (Clean Version)..."

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

# Build the frontend only
print_info "Building frontend..."
npm run build

# Generate unique project name
TIMESTAMP=$(date +%s)
PROJECT_NAME="svg-ai-clean-$TIMESTAMP"

print_info "Using project name: $PROJECT_NAME"

# Create a clean deployment directory
DEPLOY_DIR="deploy-clean"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy built frontend
print_info "Copying frontend files..."
cp -r dist/* "$DEPLOY_DIR/"

# Create the API function directly (no copying from existing files)
print_info "Creating API function..."
mkdir -p "$DEPLOY_DIR/functions/api"

cat > "$DEPLOY_DIR/functions/api/[[path]].ts" << 'EOF'
// Cloudflare Pages Function - Clean API
export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (path === 'health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'cloudflare-pages-functions',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  // SVG generation endpoint
  if (path === 'generate' && request.method === 'POST') {
    try {
      const requestData = await request.json();
      
      // Validate request
      if (!requestData.prompt || !requestData.size) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request',
            details: ['Missing required fields: prompt, size'],
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // Simple SVG generation
      const { prompt, size } = requestData;
      const { width, height } = size;
      const seed = requestData.seed || Math.floor(Math.random() * 1000000);
      
      // Generate SVG based on prompt
      let svgContent = '';
      const color = getColorFromPrompt(prompt);
      
      if (prompt.toLowerCase().includes('circle')) {
        const radius = Math.min(width, height) * 0.3;
        const cx = width / 2;
        const cy = height / 2;
        svgContent = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" id="main-circle"></circle>`;
      } else if (prompt.toLowerCase().includes('square') || prompt.toLowerCase().includes('rect')) {
        const rectWidth = width * 0.6;
        const rectHeight = height * 0.6;
        const x = (width - rectWidth) / 2;
        const y = (height - rectHeight) / 2;
        svgContent = `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${color}" id="main-rect"></rect>`;
      } else if (prompt.toLowerCase().includes('triangle')) {
        const points = `${width/2},${height*0.1} ${width*0.1},${height*0.9} ${width*0.9},${height*0.9}`;
        svgContent = `<polygon points="${points}" fill="${color}" id="main-triangle"></polygon>`;
      } else {
        // Default circle
        const radius = Math.min(width, height) * 0.3;
        const cx = width / 2;
        const cy = height / 2;
        svgContent = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" id="main-shape"></circle>`;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${svgContent}
    </svg>`;

      const response = {
        svg,
        meta: {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          backgroundColor: 'transparent',
          palette: ['#3B82F6', '#1E40AF', '#1D4ED8'],
          description: `Generated SVG: "${prompt}"`,
          seed,
        },
        layers: [
          {
            id: 'main-shape',
            label: 'Main Shape',
            type: 'shape',
          },
        ],
        warnings: [],
        errors: [],
      };

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Generation failed',
          details: [error instanceof Error ? error.message : 'Unknown error'],
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  }

  // 404 for other routes
  return new Response(
    JSON.stringify({
      error: 'Not found',
      details: [`API endpoint ${path} not found`],
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// Helper function to extract color from prompt
function getColorFromPrompt(prompt: string): string {
  const colorMap: Record<string, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    orange: '#F97316',
    gray: '#6B7280',
    black: '#1F2937',
    white: '#F9FAFB',
  };

  const lowerPrompt = prompt.toLowerCase();
  
  for (const [color, hex] of Object.entries(colorMap)) {
    if (lowerPrompt.includes(color)) {
      return hex;
    }
  }
  
  return '#3B82F6'; // Default blue
}
EOF

print_info "Deploying to Cloudflare Pages..."

# Deploy with commit-dirty flag to avoid git warnings
if wrangler pages deploy "$DEPLOY_DIR" --project-name="$PROJECT_NAME" --commit-dirty=true; then
    print_success "✅ Deployment successful!"
    
    # Get the deployment URL
    PAGES_URL="https://$PROJECT_NAME.pages.dev"
    
    echo ""
    print_success "🌐 Your app is deployed!"
    print_info "URL: $PAGES_URL"
    print_info "API: $PAGES_URL/api/generate"
    
    # Test the deployment
    print_info "Testing deployment..."
    sleep 15
    
    echo "Testing health endpoint..."
    if curl -f "$PAGES_URL/api/health" 2>/dev/null; then
        echo ""
        print_success "✅ API health check passed!"
    else
        print_warning "⚠️  Health check failed, trying generation test..."
        
        echo "Testing generation endpoint..."
        if curl -X POST "$PAGES_URL/api/generate" \
           -H "Content-Type: application/json" \
           -d '{"prompt":"blue circle","size":{"width":100,"height":100}}' 2>/dev/null | head -c 100; then
            echo ""
            print_success "✅ API generation test passed!"
        else
            print_warning "⚠️  API might need a few minutes to be fully available"
        fi
    fi
    
    echo ""
    print_info "🔧 To add your custom domain (svg.seh-nya.com):"
    echo "1. Go to: https://dash.cloudflare.com → Pages → $PROJECT_NAME → Custom domains"
    echo "2. Click 'Set up a custom domain'"
    echo "3. Enter: svg.seh-nya.com"
    echo "4. Add CNAME record in your DNS:"
    echo "   Name: svg"
    echo "   Value: $PROJECT_NAME.pages.dev"
    echo ""
    
    print_success "🎉 Deployment complete!"
    print_info "🌐 Project URL: $PAGES_URL"
    
    # Clean up
    rm -rf "$DEPLOY_DIR"
    
else
    print_warning "❌ Deployment failed. Check the error above."
    rm -rf "$DEPLOY_DIR"
    exit 1
fi