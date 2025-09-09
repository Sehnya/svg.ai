#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Configuration
IMAGE_NAME="svg-ai"
CONTAINER_NAME="svg-ai-prod"
NETWORK_NAME="svg-ai-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required files exist
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found. Please run this script from the project root."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Using default environment variables."
fi

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Stop and remove existing container
print_status "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Remove old image
print_status "Removing old image..."
docker rmi $IMAGE_NAME:latest 2>/dev/null || true

# Build new image
print_status "Building new Docker image..."
docker build -t $IMAGE_NAME:latest .

# Create network if it doesn't exist
docker network create $NETWORK_NAME 2>/dev/null || true

# Run new container
print_status "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    -p 3001:3001 \
    --env-file .env.production \
    --restart unless-stopped \
    --health-cmd="curl -f http://localhost:3001/health || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    $IMAGE_NAME:latest

# Wait for container to be healthy
print_status "Waiting for container to be healthy..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null | grep -q "healthy"; then
        print_status "Container is healthy!"
        break
    fi
    
    if [ $counter -eq $((timeout - 1)) ]; then
        print_error "Container failed to become healthy within $timeout seconds"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    sleep 1
    counter=$((counter + 1))
done

# Test the deployment
print_status "Testing deployment..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "✅ Deployment successful! Application is running at http://localhost:3001"
else
    print_error "❌ Deployment failed! Health check failed."
    docker logs $CONTAINER_NAME
    exit 1
fi

# Show container status
print_status "Container status:"
docker ps | grep $CONTAINER_NAME

# Show logs
print_status "Recent logs:"
docker logs --tail 20 $CONTAINER_NAME

print_status "🎉 Deployment completed successfully!"
print_status "You can view logs with: docker logs -f $CONTAINER_NAME"
print_status "You can stop the container with: docker stop $CONTAINER_NAME"