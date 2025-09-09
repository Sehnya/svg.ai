#!/bin/bash

# Production monitoring script
set -e

# Configuration
CONTAINER_NAME="svg-ai-prod"
LOG_LINES=50
CHECK_INTERVAL=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[MONITOR]${NC} $1"
}

# Function to check container status
check_container_status() {
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$CONTAINER_NAME"; then
        status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$CONTAINER_NAME" | awk '{print $2, $3, $4}')
        print_status "Container Status: $status"
        return 0
    else
        print_error "Container '$CONTAINER_NAME' is not running"
        return 1
    fi
}

# Function to check health status
check_health_status() {
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
    case $health_status in
        "healthy")
            print_status "Health Status: ✅ Healthy"
            ;;
        "unhealthy")
            print_error "Health Status: ❌ Unhealthy"
            ;;
        "starting")
            print_warning "Health Status: 🔄 Starting"
            ;;
        *)
            print_warning "Health Status: ❓ Unknown"
            ;;
    esac
}

# Function to check application endpoint
check_application() {
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Application: ✅ Responding"
        
        # Get response time
        response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3001/health)
        print_status "Response Time: ${response_time}s"
    else
        print_error "Application: ❌ Not responding"
    fi
}

# Function to show resource usage
show_resource_usage() {
    if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -q "$CONTAINER_NAME"; then
        stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep "$CONTAINER_NAME")
        print_status "Resource Usage:"
        echo "  $stats"
    else
        print_warning "Could not retrieve resource usage"
    fi
}

# Function to show recent logs
show_recent_logs() {
    print_header "Recent Logs (last $LOG_LINES lines):"
    docker logs --tail $LOG_LINES "$CONTAINER_NAME" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
}

# Function to show error logs
show_error_logs() {
    print_header "Recent Error Logs:"
    docker logs --tail 100 "$CONTAINER_NAME" 2>&1 | grep -i "error\|fail\|exception" | tail -10 | while IFS= read -r line; do
        echo -e "  ${RED}$line${NC}"
    done
}

# Function to run full status check
run_status_check() {
    print_header "=== SVG AI Production Status Check ==="
    echo "Timestamp: $(date)"
    echo ""
    
    check_container_status
    check_health_status
    check_application
    show_resource_usage
    echo ""
}

# Function to monitor continuously
monitor_continuous() {
    print_header "Starting continuous monitoring (Ctrl+C to stop)..."
    print_status "Check interval: ${CHECK_INTERVAL}s"
    echo ""
    
    while true; do
        run_status_check
        sleep $CHECK_INTERVAL
        echo "----------------------------------------"
    done
}

# Function to show help
show_help() {
    echo "SVG AI Production Monitor"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status    Show current status (default)"
    echo "  monitor   Start continuous monitoring"
    echo "  logs      Show recent logs"
    echo "  errors    Show recent error logs"
    echo "  health    Check health status only"
    echo "  restart   Restart the container"
    echo "  help      Show this help message"
    echo ""
}

# Function to restart container
restart_container() {
    print_header "Restarting container..."
    
    if docker restart "$CONTAINER_NAME"; then
        print_status "Container restarted successfully"
        
        # Wait for health check
        print_status "Waiting for health check..."
        sleep 10
        check_health_status
    else
        print_error "Failed to restart container"
        exit 1
    fi
}

# Main script logic
case "${1:-status}" in
    "status")
        run_status_check
        ;;
    "monitor")
        monitor_continuous
        ;;
    "logs")
        show_recent_logs
        ;;
    "errors")
        show_error_logs
        ;;
    "health")
        check_health_status
        check_application
        ;;
    "restart")
        restart_container
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac