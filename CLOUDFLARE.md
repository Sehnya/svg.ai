# SVG AI Code Generator - Cloudflare Deployment Guide

This guide covers deploying the SVG AI Code Generator using Cloudflare services.

## 🌟 Cloudflare Deployment Options

### Option 1: Cloudflare Pages (Frontend) + Cloudflare Workers (Backend)

**Best for:** Serverless, global distribution, automatic scaling

### Option 2: Cloudflare Tunnel + VPS/Server

**Best for:** Traditional server deployment with Cloudflare protection

### Option 3: Cloudflare Pages (Static) + External API

**Best for:** Static frontend with separate backend hosting

---

## 🌐 Quick CNAME Domain Setup

**Want to use your own domain like `svg-ai.yourdomain.com`?**

```bash
# One command setup for CNAME domain
npm run setup:cname
```

This will:

- Configure your environment for a custom domain
- Deploy to Cloudflare Pages
- Give you step-by-step DNS instructions
- Set up SSL automatically

**Example:** If you own `example.com`, you can have your app at `svg-ai.example.com`

---

## 🚀 Option 1: Full Cloudflare (Pages + Workers)

### Step 1: Deploy Frontend to Cloudflare Pages

1. **Build the frontend:**

   ```bash
   npm run build
   ```

2. **Connect to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Connect your Git repository
   - Set build settings:
     ```
     Build command: npm run build
     Build output directory: dist
     ```

3. **Configure environment variables in Cloudflare Pages:**
   ```
   VITE_API_BASE_URL = https://your-api.your-domain.com
   ```

### Step 2: Deploy Backend to Cloudflare Workers

1. **Install Wrangler CLI:**

   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create `wrangler.toml` configuration:**

   ```toml
   name = "svg-ai-api"
   main = "server/worker.ts"
   compatibility_date = "2024-01-01"

   [env.production]
   vars = { NODE_ENV = "production" }

   [[env.production.kv_namespaces]]
   binding = "CACHE"
   id = "your-kv-namespace-id"
   ```

3. **Create Worker adapter:**
   ```bash
   # We'll create this file next
   ```

---

## 🛡️ Option 2: Cloudflare Tunnel (Recommended for VPS)

### Step 1: Install Cloudflared

**On Ubuntu/Debian:**

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

**On macOS:**

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Step 2: Authenticate Cloudflared

```bash
cloudflared tunnel login
```

### Step 3: Create a Tunnel

```bash
# Create tunnel
cloudflared tunnel create svg-ai

# Note the tunnel ID from the output
```

### Step 4: Configure DNS

```bash
# Add DNS record pointing to your tunnel
cloudflared tunnel route dns svg-ai your-domain.com
```

### Step 5: Create Tunnel Configuration

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: svg-ai
credentials-file: ~/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:8080
  - hostname: api.your-domain.com
    service: http://localhost:3001
  - service: http_status:404
```

### Step 6: Deploy Your Application

```bash
# Configure for your domain
npm run configure
# Enter your-domain.com when prompted

# Deploy with Docker Compose
npm run docker:compose

# Start the tunnel
cloudflared tunnel run svg-ai
```

### Step 7: Configure Cloudflare Security

In your Cloudflare dashboard:

1. **SSL/TLS Settings:**
   - Set to "Full (strict)" or "Full"
   - Enable "Always Use HTTPS"

2. **Security Settings:**
   - Enable "Bot Fight Mode"
   - Configure rate limiting rules
   - Set up firewall rules if needed

3. **Performance:**
   - Enable "Auto Minify" for CSS, JS, HTML
   - Enable "Brotli" compression
   - Configure caching rules

---

## 📱 Option 3: Cloudflare Pages (Static) + External API

### Step 1: Configure for Static Deployment

Update your environment for external API:

```bash
# In .env.production
VITE_API_BASE_URL=https://your-api-server.com
```

### Step 2: Build and Deploy to Pages

```bash
npm run build
```

Upload the `dist` folder to Cloudflare Pages or connect your Git repository.

### Step 3: Deploy API Separately

Deploy your backend to:

- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure
- Your own VPS

---

## 🔧 Cloudflare-Specific Configuration

### Update Environment Variables

For Cloudflare deployment, update your `.env.production`:

```bash
# For Cloudflare Pages + Workers
VITE_API_BASE_URL=https://svg-ai-api.your-domain.workers.dev

# For Cloudflare Tunnel
VITE_API_BASE_URL=https://api.your-domain.com

# For Cloudflare Pages + External API
VITE_API_BASE_URL=https://your-api-server.com

# CORS Origins (include your Cloudflare domains)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,https://svg-ai.pages.dev
```

### Cloudflare Worker Adapter

Create `server/worker.ts`:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { cache } from "hono/cache";

// Import your existing server logic
import { generateSVGRoute, healthCheckRoute } from "./schemas/openapi";
import { RuleBasedGenerator } from "./services/RuleBasedGenerator";

const app = new Hono();

// Cloudflare-specific CORS
app.use(
  "*",
  cors({
    origin: ["https://your-domain.com", "https://svg-ai.pages.dev"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// Cache responses for 1 hour
app.use(
  "/api/*",
  cache({
    cacheName: "svg-ai-cache",
    cacheControl: "max-age=3600",
  })
);

// Your existing routes
app.openapi(healthCheckRoute, (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    worker: true,
  });
});

app.openapi(generateSVGRoute, async (c) => {
  const request = c.req.valid("json");
  const generator = new RuleBasedGenerator();

  try {
    const result = await generator.generate(request);
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Generation failed" }, 500);
  }
});

export default app;
```

### Cloudflare Pages Functions

For Cloudflare Pages with Functions, create `functions/api/[[path]].ts`:

```typescript
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";

// Import your app
import app from "../../server/worker";

export const onRequest = handle(app);
```

---

## 🚀 Automated Cloudflare Deployment Script

Create `scripts/deploy-cloudflare.sh`:

```bash
#!/bin/bash

echo "🌟 Deploying SVG AI to Cloudflare..."

# Build the application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=svg-ai

# Deploy Worker (if using)
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://svg-ai.pages.dev"
echo "🔧 Worker: https://svg-ai-api.your-domain.workers.dev"
```

Add to `package.json`:

```json
{
  "scripts": {
    "deploy:cloudflare": "./scripts/deploy-cloudflare.sh"
  }
}
```

---

## 🔒 Security Best Practices with Cloudflare

### 1. Configure Security Headers

In Cloudflare Dashboard → Security → Settings:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 2. Rate Limiting Rules

Create rate limiting rules:

- API endpoints: 100 requests per minute
- Static assets: 1000 requests per minute

### 3. Bot Protection

- Enable "Bot Fight Mode"
- Configure "Super Bot Fight Mode" (Pro plan)
- Set up custom firewall rules

### 4. DDoS Protection

Cloudflare provides automatic DDoS protection, but you can:

- Enable "Under Attack Mode" during attacks
- Configure custom security rules
- Set up alerts for traffic spikes

---

## 📊 Monitoring and Analytics

### Cloudflare Analytics

- Real-time traffic analytics
- Security event monitoring
- Performance metrics
- Bot traffic analysis

### Custom Monitoring

Add to your Worker:

```typescript
// Log to Cloudflare Analytics
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  // Log metrics
  console.log({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    timestamp: new Date().toISOString(),
  });
});
```

---

## 💰 Cloudflare Pricing Considerations

### Free Tier Includes:

- Cloudflare Pages: Unlimited static sites
- Workers: 100,000 requests/day
- CDN and basic security
- SSL certificates

### Paid Plans:

- **Pro ($20/month):** Enhanced security, analytics
- **Business ($200/month):** Advanced security, performance
- **Enterprise:** Custom pricing, dedicated support

---

## 🆘 Troubleshooting Cloudflare Issues

### Common Issues:

1. **CORS Errors:**

   ```bash
   # Check your ALLOWED_ORIGINS includes Cloudflare domains
   ALLOWED_ORIGINS=https://your-domain.com,https://svg-ai.pages.dev
   ```

2. **Worker Timeout:**

   ```typescript
   // Increase timeout in wrangler.toml
   [env.production]
   compatibility_date = "2024-01-01"
   usage_model = "bundled"  # or "unbound" for longer timeouts
   ```

3. **Build Failures:**

   ```bash
   # Check Node.js version in Pages settings
   NODE_VERSION = 18
   ```

4. **SSL Issues:**
   - Ensure SSL mode is "Full" or "Full (strict)"
   - Check certificate status in SSL/TLS tab

---

## 🎯 Quick Cloudflare Setup Commands

```bash
# 1. Install tools
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Configure environment
npm run configure
# Enter your Cloudflare domain

# 4. Build application
npm run build

# 5. Deploy to Pages
wrangler pages deploy dist --project-name=svg-ai

# 6. Deploy Worker (optional)
wrangler deploy

# 7. Test deployment
curl https://your-domain.com/health
```

Your SVG AI Code Generator is now running on Cloudflare's global network! 🌍
