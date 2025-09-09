#!/bin/bash

# SVG AI Backup Script
# This script creates backups of the database and uploads them to cloud storage

set -e

# Configuration
BACKUP_DIR="/tmp/svg-ai-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="svg-ai-backup-${TIMESTAMP}"
RETENTION_DAYS=30

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

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting backup process..."

# Database backup
log "Creating database backup..."
pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --no-password \
    --file="${BACKUP_DIR}/${BACKUP_NAME}.dump"

# Verify backup
if [ ! -f "${BACKUP_DIR}/${BACKUP_NAME}.dump" ]; then
    log "ERROR: Database backup failed"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
log "Database backup created: ${BACKUP_NAME}.dump (${BACKUP_SIZE})"

# Compress backup
log "Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_NAME}.dump"

# Upload to S3
if command -v aws &> /dev/null; then
    log "Uploading backup to S3..."
    aws s3 cp \
        "${BACKUP_DIR}/${BACKUP_NAME}.dump.gz" \
        "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}.dump.gz" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded successfully to S3"
        rm -f "${BACKUP_DIR}/${BACKUP_NAME}.dump.gz"
    else
        log "ERROR: Failed to upload backup to S3"
        exit 1
    fi
else
    log "WARNING: AWS CLI not found, backup stored locally only"
fi

# Clean up old backups from S3
if command -v aws &> /dev/null; then
    log "Cleaning up old backups..."
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        BACKUP_DATE=$(echo "$line" | awk '{print $1}')
        BACKUP_FILE=$(echo "$line" | awk '{print $4}')
        
        if [[ "$BACKUP_DATE" < "$CUTOFF_DATE" ]]; then
            log "Deleting old backup: ${BACKUP_FILE}"
            aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"
        fi
    done
fi

# Health check - verify we can connect to database
log "Performing health check..."
pg_isready \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}"

if [ $? -eq 0 ]; then
    log "Database health check passed"
else
    log "WARNING: Database health check failed"
fi

log "Backup process completed successfully"

# Send notification (optional)
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ SVG AI backup completed successfully: ${BACKUP_NAME}\"}" \
        "${SLACK_WEBHOOK_URL}"
fi