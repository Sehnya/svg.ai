# SVG AI Code Generator - Production Deployment Guide

This guide covers deploying the SVG AI Code Generator to production environments.

## 🚀 Super Quick Start (3 commands)

```bash
# 1. Configure environment (interactive)
npm run configure

# 2. Deploy with Docker Compose
npm run docker:compose

# 3. Test it works
curl http://localhost:8080/health
```

Your app will be running at `http://localhost:8080` with nginx reverse proxy!

## Prerequisites

- Docker and Docker Compose installed
- Bun runtime (for local builds)
- SSL certificates (for HTTPS deployment)
- Domain name configured

## Quick Start

### 1. Environment Configuration

**Easy Way (Recommended):**

```bash
# Run the configuration helper script
npm run configure
```

**Manual Way:**

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your production values:

```bash
# Application
NODE_ENV=production
PORT=3001

# API Configuration - Leave empty for nginx proxy, or set to your domain
VITE_API_BASE_URL=

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Security - Add your domain and nginx proxy origins
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,http://localhost:8080

# Performance
CACHE_MAX_SIZE=2000
CACHE_TTL_MINUTES=120
```

**Step-by-Step Configuration:**

1. **Set API Base URL to empty** (this is already done):

   ```bash
   VITE_API_BASE_URL=
   ```

   ☝️ Notice there's nothing after the `=` sign - this tells the app to use relative URLs

2. **Update ALLOWED_ORIGINS with your actual domain**:
   Replace `https://your-domain.com` with your real domain:

   ```bash
   # Example: If your domain is example.com
   ALLOWED_ORIGINS=https://example.com,https://www.example.com,http://localhost:8080

   # Example: If your domain is myapp.io
   ALLOWED_ORIGINS=https://myapp.io,https://www.myapp.io,http://localhost:8080
   ```

3. **For local testing only** (keep localhost:8080):
   ```bash
   ALLOWED_ORIGINS=http://localhost:8080
   ```

**Visual Guide:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Browser  │    │  Nginx Proxy    │    │  SVG AI Server  │
│                 │    │  (Port 8080)    │    │  (Port 3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ GET /api/generate     │                       │
         │──────────────────────▶│                       │
         │                       │ GET /api/generate     │
         │                       │──────────────────────▶│
         │                       │                       │
         │                       │ ◀─────────────────────│
         │ ◀─────────────────────│                       │
```

**What this does:**

- Empty `VITE_API_BASE_URL` = App uses `/api/generate` instead of `https://domain.com/api/generate`
- Nginx proxy forwards `/api/generate` to the backend automatically
- `ALLOWED_ORIGINS` tells the server which domains can make API requests

**Quick Test:**
After configuration, test with:

```bash
npm run deploy
curl http://localhost:8080/api/generate -X POST -H "Content-Type: application/json" -d '{"prompt":"test","size":{"width":100,"height":100}}'
```

### 2. Build and Deploy

#### Option A: Docker Compose (Recommended)

```bash
# Build and start all services
npm run docker:compose

# Monitor deployment
npm run monitor
```

#### Option B: Manual Docker Deployment

```bash
# Build production assets
npm run build:prod

# Build and run Docker container
npm run docker:build
npm run docker:run

# Monitor the deployment
npm run monitor
```

#### Option C: Direct Deployment Script

```bash
# Run the deployment script
npm run deploy
```

## Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   SVG AI App    │    │   File System   │
│   (Port 80/443) │────│   (Port 3001)   │────│     Cache       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

- **Nginx**: Reverse proxy, static file serving, SSL termination
- **SVG AI App**: Node.js application running on Bun
- **File System Cache**: Response caching for generated SVGs

## Configuration Files

### Docker Configuration

- `Dockerfile`: Multi-stage production build
- `docker-compose.prod.yml`: Production services orchestration
- `.dockerignore`: Files excluded from Docker build

### Nginx Configuration

- `nginx.conf`: Reverse proxy and static file serving
- SSL configuration (commented out by default)
- Security headers and rate limiting

### Environment Files

- `.env.production`: Production environment variables
- `.env.production.example`: Template for production config

## Deployment Scripts

### Build Script (`scripts/build-prod.sh`)

Builds the application for production:

```bash
./scripts/build-prod.sh
```

Features:

- Dependency installation
- TypeScript type checking
- Frontend build with Vite
- Build verification
- Size analysis

### Deployment Script (`scripts/deploy.sh`)

Deploys the application using Docker:

```bash
./scripts/deploy.sh
```

Features:

- Docker container management
- Health check verification
- Automatic rollback on failure
- Deployment status reporting

### Monitoring Script (`scripts/monitor.sh`)

Monitors the production deployment:

```bash
# One-time status check
./scripts/monitor.sh status

# Continuous monitoring
./scripts/monitor.sh monitor

# View recent logs
./scripts/monitor.sh logs

# View error logs
./scripts/monitor.sh errors

# Restart container
./scripts/monitor.sh restart
```

## SSL/HTTPS Setup

### 1. Obtain SSL Certificates

Using Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificates
sudo certbot certonly --standalone -d your-domain.com
```

### 2. Configure Nginx for HTTPS

Uncomment the HTTPS server block in `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}
```

### 3. Update Docker Compose

Add SSL certificate volumes to `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## Environment Variables

### Required Variables

| Variable            | Description      | Example                   |
| ------------------- | ---------------- | ------------------------- |
| `NODE_ENV`          | Environment mode | `production`              |
| `PORT`              | Application port | `3001`                    |
| `VITE_API_BASE_URL` | Frontend API URL | `https://your-domain.com` |

### Optional Variables

| Variable            | Description                       | Default     |
| ------------------- | --------------------------------- | ----------- |
| `OPENAI_API_KEY`    | OpenAI API key for LLM generation | None        |
| `ALLOWED_ORIGINS`   | CORS allowed origins              | `localhost` |
| `CACHE_MAX_SIZE`    | Maximum cache entries             | `1000`      |
| `CACHE_TTL_MINUTES` | Cache TTL in minutes              | `60`        |
| `LOG_LEVEL`         | Logging level                     | `info`      |

## Health Checks

The application includes comprehensive health checks:

### Application Health Check

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Docker Health Check

Docker automatically monitors application health:

```bash
docker inspect --format='{{.State.Health.Status}}' svg-ai-prod
```

## Monitoring and Logging

### Application Logs

```bash
# View real-time logs
docker logs -f svg-ai-prod

# View recent logs
npm run monitor logs
```

### Error Monitoring

```bash
# View error logs
npm run monitor errors

# Check application status
npm run monitor status
```

### Resource Monitoring

```bash
# View resource usage
docker stats svg-ai-prod

# Continuous monitoring
npm run monitor monitor
```

## Performance Optimization

### Caching Strategy

- **Response Caching**: Generated SVGs cached by request hash
- **Static Asset Caching**: Long-term caching for JS/CSS files
- **Nginx Caching**: Reverse proxy caching for API responses

### Resource Limits

Configure resource limits in `docker-compose.prod.yml`:

```yaml
svg-ai:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M
```

## Security Considerations

### Network Security

- All external traffic goes through Nginx
- Application runs on internal Docker network
- Rate limiting configured at Nginx level

### Application Security

- Input sanitization for all user inputs
- SVG sanitization using DOMPurify
- CORS configuration for allowed origins
- Security headers configured

### Container Security

- Non-root user in Docker container
- Minimal base image (Bun slim)
- No unnecessary packages installed

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check container logs
docker logs svg-ai-prod

# Check Docker daemon
sudo systemctl status docker
```

#### Health Check Failing

```bash
# Test health endpoint directly
curl -v http://localhost:3001/health

# Check application logs
npm run monitor logs
```

#### CORS Errors in Browser

If you see CORS errors like "No 'Access-Control-Allow-Origin' header":

```bash
# 1. Check your ALLOWED_ORIGINS in .env.production
# Make sure it includes your nginx domain
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:8080

# 2. Verify VITE_API_BASE_URL is empty for nginx proxy
VITE_API_BASE_URL=

# 3. Rebuild and redeploy
npm run build:prod
npm run deploy

# 4. Test API directly through nginx
curl -X POST http://localhost:8080/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","size":{"width":100,"height":100}}'
```

#### High Memory Usage

```bash
# Check resource usage
docker stats svg-ai-prod

# Restart container
npm run monitor restart
```

### Log Analysis

```bash
# Search for errors
docker logs svg-ai-prod 2>&1 | grep -i error

# Monitor real-time logs
docker logs -f svg-ai-prod | grep -E "(error|warn|fail)"
```

## Backup and Recovery

### Application Data

The application is stateless, but you may want to backup:

- Configuration files (`.env.production`, `nginx.conf`)
- SSL certificates
- Docker images

### Backup Script Example

```bash
#!/bin/bash
# backup.sh

# Backup configuration
tar -czf backup-$(date +%Y%m%d).tar.gz \
  .env.production \
  nginx.conf \
  docker-compose.prod.yml

# Backup Docker image
docker save svg-ai:latest | gzip > svg-ai-image-$(date +%Y%m%d).tar.gz
```

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments:

1. Use a load balancer (nginx, HAProxy, or cloud LB)
2. Run multiple application containers
3. Implement shared caching (Redis)
4. Use container orchestration (Kubernetes, Docker Swarm)

### Vertical Scaling

Increase container resources:

```yaml
svg-ai:
  deploy:
    resources:
      limits:
        cpus: "2.0"
        memory: 1G
```

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review application logs
3. Verify configuration files
4. Test health endpoints
5. Check Docker and system resources

## Security Updates

Regularly update:

- Base Docker images
- Node.js dependencies
- System packages
- SSL certificates

```bash
# Update dependencies
bun update

# Rebuild with latest base image
docker build --no-cache -t svg-ai:latest .
```
