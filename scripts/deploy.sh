#!/bin/bash

# SVG AI Deployment Script
# This script deploys the application to Kubernetes

set -e

# Configuration
NAMESPACE="svg-ai"
ENVIRONMENT="${1:-production}"
IMAGE_TAG="${2:-latest}"
REGISTRY="ghcr.io/your-org/svg-ai"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Usage
usage() {
    echo "Usage: $0 [environment] [image-tag]"
    echo "Environments: production, staging"
    echo "Example: $0 production v1.2.3"
    exit 1
}

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    log "ERROR: Invalid environment. Use 'production' or 'staging'"
    usage
fi

log "Starting deployment to ${ENVIRONMENT} environment..."

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log "ERROR: kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    log "WARNING: helm is not installed, using kubectl directly"
fi

# Verify cluster connection
if ! kubectl cluster-info &> /dev/null; then
    log "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

# Create namespace if it doesn't exist
log "Creating namespace if needed..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC
log "Applying RBAC configuration..."
kubectl apply -f k8s/rbac.yaml

# Apply ConfigMaps and Secrets
log "Applying configuration..."
kubectl apply -f k8s/configmap.yaml

# Check if secrets exist, create if needed
if ! kubectl get secret svg-ai-secrets -n "${NAMESPACE}" &> /dev/null; then
    log "WARNING: Secrets not found. Please create them manually:"
    echo "kubectl create secret generic svg-ai-secrets \\"
    echo "  --from-env-file=config/${ENVIRONMENT}.env \\"
    echo "  --namespace=${NAMESPACE}"
    exit 1
fi

# Update image tag in deployment
log "Updating deployment with image tag: ${IMAGE_TAG}"
sed "s|image: ghcr.io/your-org/svg-ai:latest|image: ${REGISTRY}:${IMAGE_TAG}|g" k8s/deployment.yaml | kubectl apply -f -

# Apply services
log "Applying services..."
kubectl apply -f k8s/service.yaml

# Apply ingress
log "Applying ingress..."
kubectl apply -f k8s/ingress.yaml

# Apply HPA
log "Applying horizontal pod autoscaler..."
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to be ready
log "Waiting for deployment to be ready..."
kubectl rollout status deployment/svg-ai-app -n "${NAMESPACE}" --timeout=600s
kubectl rollout status deployment/svg-ai-nginx -n "${NAMESPACE}" --timeout=300s

# Verify deployment
log "Verifying deployment..."
kubectl get pods -n "${NAMESPACE}" -l app=svg-ai

# Run health check
log "Running health check..."
sleep 30

# Port forward for health check
kubectl port-forward service/svg-ai-service 8080:3001 -n "${NAMESPACE}" &
PF_PID=$!
sleep 5

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    log "✅ Health check passed"
else
    log "❌ Health check failed"
    kubectl logs -l app=svg-ai,component=backend -n "${NAMESPACE}" --tail=50
    kill $PF_PID 2>/dev/null || true
    exit 1
fi

kill $PF_PID 2>/dev/null || true

# Display deployment info
log "Deployment completed successfully!"
echo ""
echo "Deployment Information:"
echo "======================"
echo "Environment: ${ENVIRONMENT}"
echo "Image: ${REGISTRY}:${IMAGE_TAG}"
echo "Namespace: ${NAMESPACE}"
echo ""
echo "Services:"
kubectl get services -n "${NAMESPACE}"
echo ""
echo "Ingress:"
kubectl get ingress -n "${NAMESPACE}"
echo ""
echo "Pods:"
kubectl get pods -n "${NAMESPACE}" -l app=svg-ai

# Send notification
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 SVG AI deployed successfully to ${ENVIRONMENT}: ${REGISTRY}:${IMAGE_TAG}\"}" \
        "${SLACK_WEBHOOK_URL}"
fi

log "Deployment script completed"