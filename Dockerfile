# Multi-stage build for production optimization
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build stage for frontend
FROM base AS frontend-builder

# Build the frontend application
RUN bun run build

# Build stage for backend
FROM base AS backend-builder

# No additional build steps needed for backend as it's TypeScript

# Production stage
FROM oven/bun:1-slim AS production

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./dist

# Copy backend source
COPY --from=backend-builder /app/server ./server

# Copy other necessary files
COPY --from=backend-builder /app/tsconfig.json ./

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["bun", "run", "server/index.ts"]