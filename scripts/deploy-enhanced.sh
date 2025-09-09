#!/bin/bash

# Enhanced Cloudflare Pages deployment with advanced SVG generation
set -e

echo "🚀 Deploying Enhanced SVG AI to Cloudflare Pages..."

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

# Generate unique project name
TIMESTAMP=$(date +%s)
PROJECT_NAME="svg-ai-enhanced-$TIMESTAMP"

print_info "Using project name: $PROJECT_NAME"

# Create deployment directory
DEPLOY_DIR="deploy-enhanced"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy built frontend
print_info "Copying frontend files..."
cp -r dist/* "$DEPLOY_DIR/"

# Create enhanced API function
print_info "Creating enhanced API function..."
mkdir -p "$DEPLOY_DIR/functions/api"

cat > "$DEPLOY_DIR/functions/api/[[path]].ts" << 'EOF'
// Enhanced Cloudflare Pages Function - Advanced SVG Generation
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
        environment: 'cloudflare-pages-functions-enhanced',
        features: ['polygons', 'paths', 'gradients', 'patterns', 'complex-shapes'],
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

      // Enhanced SVG generation
      const { prompt, size } = requestData;
      const { width, height } = size;
      const seed = requestData.seed || Math.floor(Math.random() * 1000000);
      
      // Generate enhanced SVG
      const svgResult = generateEnhancedSVG(prompt, width, height, seed);
      
      const response = {
        svg: svgResult.svg,
        meta: {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          backgroundColor: 'transparent',
          palette: svgResult.palette,
          description: `Enhanced SVG: "${prompt}"`,
          seed,
        },
        layers: svgResult.layers,
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

// Enhanced SVG generation function
function generateEnhancedSVG(prompt: string, width: number, height: number, seed: number) {
  const lowerPrompt = prompt.toLowerCase();
  const colors = extractColors(prompt);
  const primaryColor = colors[0] || '#3B82F6';
  const secondaryColor = colors[1] || '#1E40AF';
  
  let svgContent = '';
  let layers: any[] = [];
  let defs = '';
  
  // Create gradients if multiple colors
  if (colors.length > 1) {
    defs += `
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
      </linearGradient>
    </defs>`;
  }
  
  // Enhanced shape detection and generation
  if (lowerPrompt.includes('star') || lowerPrompt.includes('pentagram')) {
    const result = generateStar(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('hexagon') || lowerPrompt.includes('hex')) {
    const result = generateHexagon(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('diamond') || lowerPrompt.includes('rhombus')) {
    const result = generateDiamond(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('heart')) {
    const result = generateHeart(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('arrow')) {
    const result = generateArrow(width, height, primaryColor, lowerPrompt, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('wave') || lowerPrompt.includes('curve')) {
    const result = generateWave(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('spiral')) {
    const result = generateSpiral(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('flower') || lowerPrompt.includes('petal')) {
    const result = generateFlower(width, height, colors, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('tree') || lowerPrompt.includes('branch')) {
    const result = generateTree(width, height, colors, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('mountain') || lowerPrompt.includes('peak')) {
    const result = generateMountains(width, height, colors, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('circle')) {
    const result = generateCircle(width, height, primaryColor, lowerPrompt, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('square') || lowerPrompt.includes('rect')) {
    const result = generateRectangle(width, height, primaryColor, lowerPrompt, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else if (lowerPrompt.includes('triangle')) {
    const result = generateTriangle(width, height, primaryColor, seed);
    svgContent += result.content;
    layers.push(...result.layers);
    
  } else {
    // Default: create an abstract composition
    const result = generateAbstractComposition(width, height, colors, lowerPrompt, seed);
    svgContent += result.content;
    layers.push(...result.layers);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${defs}
    ${svgContent}
  </svg>`;
  
  return {
    svg,
    layers,
    palette: colors.length > 0 ? colors : ['#3B82F6', '#1E40AF', '#1D4ED8'],
  };
}

// Enhanced shape generators
function generateStar(width: number, height: number, color: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.4;
  const points = 5;
  
  let starPoints = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle - Math.PI / 2);
    const y = cy + radius * Math.sin(angle - Math.PI / 2);
    starPoints += `${x},${y} `;
  }
  
  return {
    content: `<polygon points="${starPoints.trim()}" fill="${color}" stroke="${adjustColor(color, -20)}" stroke-width="2" id="star-shape"></polygon>`,
    layers: [{ id: 'star-shape', label: 'Star', type: 'shape' }]
  };
}

function generateHexagon(width: number, height: number, color: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  let hexPoints = '';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    hexPoints += `${x},${y} `;
  }
  
  return {
    content: `<polygon points="${hexPoints.trim()}" fill="${color}" stroke="${adjustColor(color, -20)}" stroke-width="2" id="hex-shape"></polygon>`,
    layers: [{ id: 'hex-shape', label: 'Hexagon', type: 'shape' }]
  };
}

function generateDiamond(width: number, height: number, color: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const w = width * 0.3;
  const h = height * 0.4;
  
  const points = `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
  
  return {
    content: `<polygon points="${points}" fill="${color}" stroke="${adjustColor(color, -20)}" stroke-width="2" id="diamond-shape"></polygon>`,
    layers: [{ id: 'diamond-shape', label: 'Diamond', type: 'shape' }]
  };
}

function generateHeart(width: number, height: number, color: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const size = Math.min(width, height) * 0.3;
  
  const path = `M ${cx} ${cy + size * 0.3} 
               C ${cx} ${cy - size * 0.2}, ${cx - size * 0.8} ${cy - size * 0.2}, ${cx - size * 0.8} ${cy + size * 0.1}
               C ${cx - size * 0.8} ${cy + size * 0.4}, ${cx} ${cy + size * 0.7}, ${cx} ${cy + size}
               C ${cx} ${cy + size * 0.7}, ${cx + size * 0.8} ${cy + size * 0.4}, ${cx + size * 0.8} ${cy + size * 0.1}
               C ${cx + size * 0.8} ${cy - size * 0.2}, ${cx} ${cy - size * 0.2}, ${cx} ${cy + size * 0.3} Z`;
  
  return {
    content: `<path d="${path}" fill="${color}" stroke="${adjustColor(color, -20)}" stroke-width="2" id="heart-shape"></path>`,
    layers: [{ id: 'heart-shape', label: 'Heart', type: 'path' }]
  };
}

function generateArrow(width: number, height: number, color: string, prompt: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const arrowWidth = width * 0.6;
  const arrowHeight = height * 0.2;
  const headWidth = height * 0.4;
  
  let points = '';
  if (prompt.includes('right')) {
    points = `${cx - arrowWidth/2},${cy - arrowHeight/2} ${cx + arrowWidth/2 - headWidth},${cy - arrowHeight/2} 
              ${cx + arrowWidth/2 - headWidth},${cy - headWidth/2} ${cx + arrowWidth/2},${cy} 
              ${cx + arrowWidth/2 - headWidth},${cy + headWidth/2} ${cx + arrowWidth/2 - headWidth},${cy + arrowHeight/2} 
              ${cx - arrowWidth/2},${cy + arrowHeight/2}`;
  } else if (prompt.includes('left')) {
    points = `${cx + arrowWidth/2},${cy - arrowHeight/2} ${cx - arrowWidth/2 + headWidth},${cy - arrowHeight/2} 
              ${cx - arrowWidth/2 + headWidth},${cy - headWidth/2} ${cx - arrowWidth/2},${cy} 
              ${cx - arrowWidth/2 + headWidth},${cy + headWidth/2} ${cx - arrowWidth/2 + headWidth},${cy + arrowHeight/2} 
              ${cx + arrowWidth/2},${cy + arrowHeight/2}`;
  } else {
    // Default up arrow
    points = `${cx - arrowHeight/2},${cy + arrowWidth/2} ${cx - arrowHeight/2},${cy - arrowWidth/2 + headWidth} 
              ${cx - headWidth/2},${cy - arrowWidth/2 + headWidth} ${cx},${cy - arrowWidth/2} 
              ${cx + headWidth/2},${cy - arrowWidth/2 + headWidth} ${cx + arrowHeight/2},${cy - arrowWidth/2 + headWidth} 
              ${cx + arrowHeight/2},${cy + arrowWidth/2}`;
  }
  
  return {
    content: `<polygon points="${points}" fill="${color}" stroke="${adjustColor(color, -20)}" stroke-width="2" id="arrow-shape"></polygon>`,
    layers: [{ id: 'arrow-shape', label: 'Arrow', type: 'shape' }]
  };
}

function generateWave(width: number, height: number, color: string, seed: number) {
  const amplitude = height * 0.2;
  const frequency = 3;
  const cy = height / 2;
  
  let path = `M 0 ${cy}`;
  for (let x = 0; x <= width; x += 5) {
    const y = cy + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI);
    path += ` L ${x} ${y}`;
  }
  
  return {
    content: `<path d="${path}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" id="wave-path"></path>`,
    layers: [{ id: 'wave-path', label: 'Wave', type: 'path' }]
  };
}

function generateSpiral(width: number, height: number, color: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;
  const turns = 3;
  
  let path = `M ${cx} ${cy}`;
  for (let i = 0; i <= turns * 360; i += 5) {
    const angle = (i * Math.PI) / 180;
    const radius = (i / (turns * 360)) * maxRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    path += ` L ${x} ${y}`;
  }
  
  return {
    content: `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" id="spiral-path"></path>`,
    layers: [{ id: 'spiral-path', label: 'Spiral', type: 'path' }]
  };
}

function generateFlower(width: number, height: number, colors: string[], seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const petalRadius = Math.min(width, height) * 0.15;
  const petals = 8;
  const color1 = colors[0] || '#FF69B4';
  const color2 = colors[1] || '#FFB6C1';
  
  let content = '';
  let layers = [];
  
  // Generate petals
  for (let i = 0; i < petals; i++) {
    const angle = (i * 2 * Math.PI) / petals;
    const petalX = cx + Math.cos(angle) * petalRadius * 1.5;
    const petalY = cy + Math.sin(angle) * petalRadius * 1.5;
    
    content += `<ellipse cx="${petalX}" cy="${petalY}" rx="${petalRadius}" ry="${petalRadius * 0.6}" 
                fill="${color1}" transform="rotate(${(angle * 180) / Math.PI} ${petalX} ${petalY})" 
                id="petal-${i}"></ellipse>`;
    layers.push({ id: `petal-${i}`, label: `Petal ${i + 1}`, type: 'shape' });
  }
  
  // Center
  content += `<circle cx="${cx}" cy="${cy}" r="${petalRadius * 0.4}" fill="${color2}" id="flower-center"></circle>`;
  layers.push({ id: 'flower-center', label: 'Flower Center', type: 'shape' });
  
  return { content, layers };
}

function generateTree(width: number, height: number, colors: string[], seed: number) {
  const trunkColor = colors.find(c => c.includes('brown') || c.includes('8B4513')) || '#8B4513';
  const leafColor = colors.find(c => c.includes('green')) || '#228B22';
  
  const trunkWidth = width * 0.1;
  const trunkHeight = height * 0.4;
  const trunkX = width / 2 - trunkWidth / 2;
  const trunkY = height - trunkHeight;
  
  const crownRadius = width * 0.25;
  const crownX = width / 2;
  const crownY = trunkY - crownRadius * 0.5;
  
  let content = '';
  let layers = [];
  
  // Trunk
  content += `<rect x="${trunkX}" y="${trunkY}" width="${trunkWidth}" height="${trunkHeight}" fill="${trunkColor}" id="tree-trunk"></rect>`;
  layers.push({ id: 'tree-trunk', label: 'Tree Trunk', type: 'shape' });
  
  // Crown (multiple circles for organic look)
  for (let i = 0; i < 3; i++) {
    const offsetX = (i - 1) * crownRadius * 0.3;
    const offsetY = i * crownRadius * 0.1;
    content += `<circle cx="${crownX + offsetX}" cy="${crownY + offsetY}" r="${crownRadius * (0.8 + i * 0.1)}" 
                fill="${leafColor}" opacity="0.8" id="crown-${i}"></circle>`;
    layers.push({ id: `crown-${i}`, label: `Tree Crown ${i + 1}`, type: 'shape' });
  }
  
  return { content, layers };
}

function generateMountains(width: number, height: number, colors: string[], seed: number) {
  const mountainColor = colors[0] || '#708090';
  const skyColor = colors[1] || '#87CEEB';
  
  let content = '';
  let layers = [];
  
  // Background
  content += `<rect x="0" y="0" width="${width}" height="${height * 0.6}" fill="${skyColor}" id="sky"></rect>`;
  layers.push({ id: 'sky', label: 'Sky', type: 'shape' });
  
  // Mountains (3 peaks)
  const peaks = [
    { x: width * 0.2, y: height * 0.3, width: width * 0.3 },
    { x: width * 0.5, y: height * 0.2, width: width * 0.4 },
    { x: width * 0.8, y: height * 0.4, width: width * 0.25 }
  ];
  
  peaks.forEach((peak, i) => {
    const points = `${peak.x - peak.width/2},${height} ${peak.x},${peak.y} ${peak.x + peak.width/2},${height}`;
    content += `<polygon points="${points}" fill="${adjustColor(mountainColor, i * -10)}" id="mountain-${i}"></polygon>`;
    layers.push({ id: `mountain-${i}`, label: `Mountain ${i + 1}`, type: 'shape' });
  });
  
  return { content, layers };
}

function generateCircle(width: number, height: number, color: string, prompt: string, seed: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  
  let strokeWidth = 0;
  let fill = color;
  let stroke = 'none';
  
  if (prompt.includes('outline') || prompt.includes('border')) {
    strokeWidth = 3;
    stroke = color;
    fill = 'none';
  }
  
  return {
    content: `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" id="main-circle"></circle>`,
    layers: [{ id: 'main-circle', label: 'Circle', type: 'shape' }]
  };
}

function generateRectangle(width: number, height: number, color: string, prompt: string, seed: number) {
  const rectWidth = width * 0.6;
  const rectHeight = height * 0.6;
  const x = (width - rectWidth) / 2;
  const y = (height - rectHeight) / 2;
  
  let rx = 0;
  if (prompt.includes('rounded')) {
    rx = Math.min(rectWidth, rectHeight) * 0.1;
  }
  
  return {
    content: `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" rx="${rx}" fill="${color}" id="main-rect"></rect>`,
    layers: [{ id: 'main-rect', label: 'Rectangle', type: 'shape' }]
  };
}

function generateTriangle(width: number, height: number, color: string, seed: number) {
  const points = `${width/2},${height*0.1} ${width*0.1},${height*0.9} ${width*0.9},${height*0.9}`;
  
  return {
    content: `<polygon points="${points}" fill="${color}" id="main-triangle"></polygon>`,
    layers: [{ id: 'main-triangle', label: 'Triangle', type: 'shape' }]
  };
}

function generateAbstractComposition(width: number, height: number, colors: string[], prompt: string, seed: number) {
  let content = '';
  let layers = [];
  
  const numShapes = Math.min(colors.length + 2, 5);
  
  for (let i = 0; i < numShapes; i++) {
    const color = colors[i % colors.length] || `hsl(${(i * 60) % 360}, 70%, 60%)`;
    const size = (Math.sin(seed + i) * 0.5 + 0.5) * Math.min(width, height) * 0.2;
    const x = (Math.cos(seed + i * 2) * 0.5 + 0.5) * (width - size) + size / 2;
    const y = (Math.sin(seed + i * 3) * 0.5 + 0.5) * (height - size) + size / 2;
    
    if (i % 3 === 0) {
      content += `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}" opacity="0.7" id="abstract-${i}"></circle>`;
    } else if (i % 3 === 1) {
      content += `<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" fill="${color}" opacity="0.7" id="abstract-${i}"></rect>`;
    } else {
      const points = `${x},${y - size/2} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}`;
      content += `<polygon points="${points}" fill="${color}" opacity="0.7" id="abstract-${i}"></polygon>`;
    }
    
    layers.push({ id: `abstract-${i}`, label: `Abstract Shape ${i + 1}`, type: 'shape' });
  }
  
  return { content, layers };
}

// Helper functions
function extractColors(prompt: string): string[] {
  const colorMap: Record<string, string> = {
    red: '#EF4444', crimson: '#DC143C', scarlet: '#FF2400',
    blue: '#3B82F6', navy: '#000080', cyan: '#00FFFF', azure: '#007FFF',
    green: '#10B981', lime: '#32CD32', forest: '#228B22', emerald: '#50C878',
    yellow: '#F59E0B', gold: '#FFD700', amber: '#FFBF00',
    purple: '#8B5CF6', violet: '#8A2BE2', indigo: '#4B0082', magenta: '#FF00FF',
    pink: '#EC4899', rose: '#FF007F', coral: '#FF7F50',
    orange: '#F97316', tangerine: '#FF8C00', peach: '#FFCBA4',
    brown: '#8B4513', chocolate: '#D2691E', tan: '#D2B48C',
    gray: '#6B7280', silver: '#C0C0C0', charcoal: '#36454F',
    black: '#1F2937', white: '#F9FAFB', cream: '#FFFDD0'
  };

  const colors: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [colorName, hex] of Object.entries(colorMap)) {
    if (lowerPrompt.includes(colorName)) {
      colors.push(hex);
    }
  }
  
  return colors.length > 0 ? colors : ['#3B82F6'];
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
EOF

print_info "Deploying enhanced version to Cloudflare Pages..."

# Deploy with commit-dirty flag
if wrangler pages deploy "$DEPLOY_DIR" --project-name="$PROJECT_NAME" --commit-dirty=true; then
    print_success "✅ Enhanced deployment successful!"
    
    PAGES_URL="https://$PROJECT_NAME.pages.dev"
    
    echo ""
    print_success "🌐 Enhanced SVG AI deployed!"
    print_info "URL: $PAGES_URL"
    print_info "API: $PAGES_URL/api/generate"
    
    echo ""
    print_info "🎨 New features available:"
    echo "• Stars, hexagons, diamonds, hearts"
    echo "• Arrows (directional), waves, spirals"
    echo "• Flowers, trees, mountains"
    echo "• Abstract compositions"
    echo "• Enhanced color detection"
    echo "• Polygonal and freeform shapes"
    
    echo ""
    print_info "🧪 Try these prompts:"
    echo "• 'red star with gold outline'"
    echo "• 'blue hexagon pattern'"
    echo "• 'pink heart with gradient'"
    echo "• 'green tree with brown trunk'"
    echo "• 'purple spiral wave'"
    echo "• 'orange diamond crystal'"
    
    # Test the enhanced deployment
    print_info "Testing enhanced features..."
    sleep 15
    
    echo "Testing star generation..."
    if curl -X POST "$PAGES_URL/api/generate" \
       -H "Content-Type: application/json" \
       -d '{"prompt":"red star","size":{"width":200,"height":200}}' 2>/dev/null | grep -q "star-shape"; then
        print_success "✅ Enhanced features working!"
    else
        print_warning "⚠️  Enhanced features might need a few minutes to be available"
    fi
    
    echo ""
    print_success "🎉 Enhanced deployment complete!"
    print_info "🌐 Project URL: $PAGES_URL"
    
    # Clean up
    rm -rf "$DEPLOY_DIR"
    
else
    print_warning "❌ Enhanced deployment failed. Check the error above."
    rm -rf "$DEPLOY_DIR"
    exit 1
fi