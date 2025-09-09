# SVG AI Deployment Guide

## Overview

This guide covers the deployment of the SVG AI Code Generator to production and staging environments using Docker and Kubernetes.

## Prerequisites

### Required Tools

- Docker 20.10+
- Kubernetes 1.24+
- kubectl
- Helm 3.0+ (optional)
- AWS CLI (for S3 backups)

### Required Services

- PostgreSQL 15+ with pgvector extension
- Redis 7+ (optional, for enhanced caching)
- OpenAI API access
- SSL certificates (for HTTPS)

## Environment Setup

### 1. Create Environment Configuration

Copy the appropriate environment template:

```bash
# For production
cp config/production.env .env.production

# For staging
cp config/staging.env .env.staging
```

Edit the environment file with your actual values:

```bash
# Database
DATABASE_URL=postgresql://username:password@hostname:5432/svg_ai_prod

# OpenAI API
OPENAI_API_KEY=sk-your-actual-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGINS=https://yourdomain.com

# Other required variables...
```

### 2. Create Kubernetes Secrets

```bash
# Create secrets from environment file
kubectl create secret generic svg-ai-secrets \
  --from-env-file=.env.production \
  --namespace=svg-ai

# Or create individual secrets
kubectl create secret generic svg-ai-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=OPENAI_API_KEY="sk-your-key" \
  --from-literal=JWT_SECRET="your-secret" \
  --namespace=svg-ai
```

## Deployment Methods

### Method 1: Using Deployment Script (Recommended)

```bash
# Deploy to production
./scripts/deploy.sh production v1.0.0

# Deploy to staging
./scripts/deploy.sh staging latest
```

### Method 2: Manual Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply RBAC
kubectl apply -f k8s/rbac.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Wait for deployment
kubectl rollout status deployment/svg-ai-app -n svg-ai
```

### Method 3: Docker Compose (Development/Testing)

```bash
# Production-like environment
docker-compose -f docker-compose.prod.yml up -d

# With custom environment
docker-compose --env-file .env.production up -d
```

## Database Setup

### 1. Create Database and User

```sql
-- Connect as superuser
CREATE DATABASE svg_ai_prod;
CREATE USER svg_ai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE svg_ai_prod TO svg_ai_user;

-- Enable pgvector extension
\c svg_ai_prod
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Migrations

```bash
# Set database URL
export DATABASE_URL="postgresql://svg_ai_user:password@host:5432/svg_ai_prod"

# Run migrations
bun run db:migrate

# Seed initial data (optional)
bun run db:seed
```

## SSL/TLS Configuration

### 1. Using cert-manager (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 2. Manual Certificate

```bash
# Create TLS secret
kubectl create secret tls svg-ai-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace=svg-ai
```

## Monitoring and Logging

### 1. Enable Metrics Collection

The application exposes metrics at `/api/monitoring/metrics` in Prometheus format.

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    scrape_configs:
    - job_name: 'svg-ai'
      static_configs:
      - targets: ['svg-ai-service:3001']
      metrics_path: '/api/monitoring/metrics'
```

### 2. Log Aggregation

```bash
# Using Fluentd or similar
kubectl apply -f https://raw.githubusercontent.com/fluent/fluentd-kubernetes-daemonset/master/fluentd-daemonset-elasticsearch-rbac.yaml
```

## Backup and Disaster Recovery

### 1. Automated Backups

Set up a CronJob for regular backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: svg-ai-backup
  namespace: svg-ai
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15
              command:
                - /bin/bash
                - -c
                - |
                  pg_dump $DATABASE_URL | gzip > /backup/svg-ai-$(date +%Y%m%d).sql.gz
                  aws s3 cp /backup/svg-ai-$(date +%Y%m%d).sql.gz s3://your-backup-bucket/
              env:
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: svg-ai-secrets
                      key: DATABASE_URL
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              emptyDir: {}
          restartPolicy: OnFailure
```

### 2. Manual Backup

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh svg-ai-backup-20231201_120000.dump.gz
```

## Scaling Configuration

### 1. Horizontal Pod Autoscaler

The HPA is configured to scale based on CPU and memory usage:

```yaml
# Current configuration in k8s/hpa.yaml
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70
targetMemoryUtilizationPercentage: 80
```

### 2. Vertical Pod Autoscaler (Optional)

```bash
# Install VPA
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/download/vertical-pod-autoscaler-0.13.0/vpa-release-0.13.0-yaml.tar.gz

# Apply VPA configuration
cat <<EOF | kubectl apply -f -
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: svg-ai-vpa
  namespace: svg-ai
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: svg-ai-app
  updatePolicy:
    updateMode: "Auto"
EOF
```

## Health Checks and Monitoring

### 1. Application Health Endpoints

- `/api/health` - Basic health check
- `/api/monitoring/metrics` - Prometheus metrics
- `/api/monitoring/database` - Database health

### 2. Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Troubleshooting

### Common Issues

#### 1. Pod Startup Failures

```bash
# Check pod status
kubectl get pods -n svg-ai

# Check pod logs
kubectl logs -l app=svg-ai -n svg-ai --tail=100

# Describe pod for events
kubectl describe pod <pod-name> -n svg-ai
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql $DATABASE_URL

# Check database logs
kubectl logs -l app=postgres -n svg-ai
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
kubectl describe certificate svg-ai-tls -n svg-ai

# Check cert-manager logs
kubectl logs -l app=cert-manager -n cert-manager
```

#### 4. Performance Issues

```bash
# Check resource usage
kubectl top pods -n svg-ai

# Check HPA status
kubectl get hpa -n svg-ai

# Check metrics
curl -s http://localhost:8080/api/monitoring/metrics
```

### Rollback Procedures

#### 1. Automatic Rollback

```bash
# Rollback to previous version
./scripts/rollback.sh

# Rollback to specific revision
./scripts/rollback.sh 3
```

#### 2. Manual Rollback

```bash
# Check rollout history
kubectl rollout history deployment/svg-ai-app -n svg-ai

# Rollback to previous version
kubectl rollout undo deployment/svg-ai-app -n svg-ai

# Rollback to specific revision
kubectl rollout undo deployment/svg-ai-app -n svg-ai --to-revision=2
```

## Security Considerations

### 1. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: svg-ai-network-policy
  namespace: svg-ai
spec:
  podSelector:
    matchLabels:
      app: svg-ai
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3001
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 5432 # PostgreSQL
        - protocol: TCP
          port: 6379 # Redis
        - protocol: TCP
          port: 443 # HTTPS
```

### 2. Pod Security Standards

```yaml
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
    - name: svg-ai
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

## Performance Optimization

### 1. Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 2. Database Optimization

```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### 3. Caching Strategy

- Enable Redis for session storage and caching
- Configure CDN for static assets
- Implement application-level caching

## Maintenance Procedures

### 1. Regular Updates

```bash
# Update dependencies
bun update

# Rebuild and deploy
docker build -t svg-ai:v1.1.0 .
./scripts/deploy.sh production v1.1.0
```

### 2. Database Maintenance

```bash
# Vacuum and analyze
kubectl exec -it <postgres-pod> -- psql -c "VACUUM ANALYZE;"

# Update statistics
kubectl exec -it <postgres-pod> -- psql -c "ANALYZE;"
```

### 3. Log Rotation

```bash
# Configure log rotation in Kubernetes
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: logrotate-config
data:
  logrotate.conf: |
    /var/log/*.log {
        daily
        rotate 7
        compress
        delaycompress
        missingok
        notifempty
    }
EOF
```

## Support and Monitoring

### 1. Alerting Rules

Configure alerts for:

- High error rates (> 5%)
- Slow response times (> 5s)
- High memory usage (> 80%)
- Database connection failures
- Certificate expiration

### 2. Dashboards

Create monitoring dashboards for:

- Application performance metrics
- Database performance
- Infrastructure metrics
- User activity and usage patterns

### 3. On-call Procedures

1. Check application health endpoints
2. Review recent deployments
3. Check resource utilization
4. Review application logs
5. Escalate to development team if needed

## Disaster Recovery Plan

### 1. Recovery Time Objectives (RTO)

- Critical: 1 hour
- High: 4 hours
- Medium: 24 hours

### 2. Recovery Point Objectives (RPO)

- Database: 1 hour (automated backups)
- Configuration: Immediate (version controlled)

### 3. Recovery Procedures

1. **Database Recovery**

   ```bash
   ./scripts/restore.sh latest-backup.dump.gz
   ```

2. **Application Recovery**

   ```bash
   kubectl apply -f k8s/
   ./scripts/deploy.sh production stable
   ```

3. **DNS Failover**
   - Update DNS records to point to backup region
   - Verify SSL certificates are valid

4. **Verification**
   - Run health checks
   - Verify core functionality
   - Monitor error rates and performance
