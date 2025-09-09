#!/bin/bash

# SVG AI Restore Script
# This script restores the database from a backup

set -e

# Configuration
BACKUP_DIR="/tmp/svg-ai-restore"
RESTORE_FILE="$1"

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-svg_ai}"
DB_USER="${DB_USER:-postgres}"

# Storage configuration
S3_BUCKET="${S3_BUCKET:-svg-ai-backups}"
S3_PREFIX="${S3_PREFIX:-database}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Usage
usage() {
    echo "Usage: $0 <backup-file>"
    echo "Example: $0 svg-ai-backup-20231201_120000.dump.gz"
    echo ""
    echo "Available backups:"
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | awk '{print $4}' | grep -E '\.dump\.gz$' | tail -10
    fi
    exit 1
}

# Validate input
if [ -z "$RESTORE_FILE" ]; then
    log "ERROR: No backup file specified"
    usage
fi

# Create restore directory
mkdir -p "${BACKUP_DIR}"

log "Starting restore process..."

# Download backup from S3 if not local
if [ ! -f "${RESTORE_FILE}" ]; then
    if command -v aws &> /dev/null; then
        log "Downloading backup from S3..."
        aws s3 cp \
            "s3://${S3_BUCKET}/${S3_PREFIX}/${RESTORE_FILE}" \
            "${BACKUP_DIR}/${RESTORE_FILE}"
        RESTORE_FILE="${BACKUP_DIR}/${RESTORE_FILE}"
    else
        log "ERROR: Backup file not found and AWS CLI not available"
        exit 1
    fi
fi

# Verify backup file exists
if [ ! -f "${RESTORE_FILE}" ]; then
    log "ERROR: Backup file not found: ${RESTORE_FILE}"
    exit 1
fi

# Decompress if needed
if [[ "${RESTORE_FILE}" == *.gz ]]; then
    log "Decompressing backup..."
    gunzip -c "${RESTORE_FILE}" > "${BACKUP_DIR}/restore.dump"
    RESTORE_FILE="${BACKUP_DIR}/restore.dump"
fi

# Confirm restore operation
echo "⚠️  WARNING: This will completely replace the current database!"
echo "Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "Backup file: $(basename ${RESTORE_FILE})"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore operation cancelled"
    exit 0
fi

# Create backup of current database before restore
log "Creating backup of current database..."
CURRENT_BACKUP="${BACKUP_DIR}/pre-restore-backup-$(date +%Y%m%d_%H%M%S).dump"
pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --no-password \
    --file="${CURRENT_BACKUP}"

log "Current database backed up to: ${CURRENT_BACKUP}"

# Stop application services (if running in Kubernetes)
if command -v kubectl &> /dev/null; then
    log "Scaling down application..."
    kubectl scale deployment svg-ai-app --replicas=0 -n svg-ai || true
    
    # Wait for pods to terminate
    sleep 30
fi

# Terminate existing connections
log "Terminating existing database connections..."
psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="postgres" \
    --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" || true

# Drop and recreate database
log "Recreating database..."
psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="postgres" \
    --command="DROP DATABASE IF EXISTS ${DB_NAME};"

psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="postgres" \
    --command="CREATE DATABASE ${DB_NAME};"

# Restore database
log "Restoring database from backup..."
pg_restore \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    "${RESTORE_FILE}"

if [ $? -eq 0 ]; then
    log "Database restore completed successfully"
else
    log "ERROR: Database restore failed"
    
    # Attempt to restore from pre-restore backup
    log "Attempting to restore from pre-restore backup..."
    pg_restore \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --no-password \
        --clean \
        --if-exists \
        "${CURRENT_BACKUP}"
    
    exit 1
fi

# Run database migrations if needed
if [ -f "package.json" ] && grep -q "db:migrate" package.json; then
    log "Running database migrations..."
    bun run db:migrate || npm run db:migrate
fi

# Restart application services
if command -v kubectl &> /dev/null; then
    log "Scaling up application..."
    kubectl scale deployment svg-ai-app --replicas=3 -n svg-ai
    
    # Wait for pods to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/svg-ai-app -n svg-ai
fi

# Health check
log "Performing health check..."
sleep 10

if command -v curl &> /dev/null; then
    HEALTH_URL="http://localhost:3001/api/health"
    if command -v kubectl &> /dev/null; then
        # Port forward for health check
        kubectl port-forward service/svg-ai-service 3001:3001 -n svg-ai &
        PF_PID=$!
        sleep 5
    fi
    
    if curl -f "${HEALTH_URL}" > /dev/null 2>&1; then
        log "Application health check passed"
    else
        log "WARNING: Application health check failed"
    fi
    
    if [ -n "$PF_PID" ]; then
        kill $PF_PID 2>/dev/null || true
    fi
fi

# Cleanup
rm -rf "${BACKUP_DIR}"

log "Restore process completed successfully"

# Send notification
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ SVG AI database restore completed successfully from: $(basename ${RESTORE_FILE})\"}" \
        "${SLACK_WEBHOOK_URL}"
fi