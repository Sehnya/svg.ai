#!/bin/bash

# SVG AI Rollback Script
# This script rolls back the deployment to a previous version

set -e

# Configuration
NAMESPACE="svg-ai"
DEPLOYMENT_NAME="svg-ai-app"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Usage
usage() {
    echo "Usage: $0 [revision-number]"
    echo "If no revision number is provided, rolls back to previous version"
    echo ""
    echo "Available revisions:"
    kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}" 2>/dev/null || echo "No deployment found"
    exit 1
}

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log "ERROR: kubectl is not installed"
    exit 1
fi

# Verify cluster connection
if ! kubectl cluster-info &> /dev/null; then
    log "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

# Check if deployment exists
if ! kubectl get deployment "${DEPLOYMENT_NAME}" -n "${NAMESPACE}" &> /dev/null; then
    log "ERROR: Deployment ${DEPLOYMENT_NAME} not found in namespace ${NAMESPACE}"
    exit 1
fi

# Show current status
log "Current deployment status:"
kubectl get deployment "${DEPLOYMENT_NAME}" -n "${NAMESPACE}"
echo ""

# Show rollout history
log "Rollout history:"
kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}"
echo ""

# Get revision number
REVISION="$1"
if [ -n "$REVISION" ]; then
    # Validate revision number
    if ! kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}" --revision="${REVISION}" &> /dev/null; then
        log "ERROR: Invalid revision number: ${REVISION}"
        usage
    fi
    
    log "Rolling back to revision ${REVISION}..."
    kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}" --to-revision="${REVISION}"
else
    log "Rolling back to previous version..."
    kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}"
fi

# Wait for rollback to complete
log "Waiting for rollback to complete..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}" --timeout=600s

# Verify rollback
log "Verifying rollback..."
kubectl get pods -n "${NAMESPACE}" -l app=svg-ai,component=backend

# Run health check
log "Running health check..."
sleep 30

# Port forward for health check
kubectl port-forward service/svg-ai-service 8080:3001 -n "${NAMESPACE}" &
PF_PID=$!
sleep 5

HEALTH_CHECK_PASSED=false
for i in {1..5}; do
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        log "✅ Health check passed (attempt $i)"
        HEALTH_CHECK_PASSED=true
        break
    else
        log "❌ Health check failed (attempt $i), retrying..."
        sleep 10
    fi
done

kill $PF_PID 2>/dev/null || true

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    log "❌ Health check failed after rollback"
    log "Recent logs:"
    kubectl logs -l app=svg-ai,component=backend -n "${NAMESPACE}" --tail=50
    exit 1
fi

# Display rollback info
log "Rollback completed successfully!"
echo ""
echo "Current deployment status:"
kubectl get deployment "${DEPLOYMENT_NAME}" -n "${NAMESPACE}"
echo ""
echo "Current pods:"
kubectl get pods -n "${NAMESPACE}" -l app=svg-ai,component=backend
echo ""
echo "Rollout history:"
kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "${NAMESPACE}"

# Send notification
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    CURRENT_REVISION=$(kubectl get deployment "${DEPLOYMENT_NAME}" -n "${NAMESPACE}" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⏪ SVG AI rolled back successfully to revision ${CURRENT_REVISION}\"}" \
        "${SLACK_WEBHOOK_URL}"
fi

log "Rollback script completed"