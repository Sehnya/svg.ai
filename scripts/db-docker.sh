#!/bin/bash

# Database management script for Docker

case "$1" in
  start)
    echo "Starting PostgreSQL container..."
    docker-compose -f docker-compose.db.yml up -d
    echo "Waiting for database to be ready..."
    sleep 5
    docker-compose -f docker-compose.db.yml exec postgres pg_isready -U svg_user -d svg_ai_dev
    echo "Database is ready!"
    ;;
  stop)
    echo "Stopping PostgreSQL container..."
    docker-compose -f docker-compose.db.yml down
    ;;
  restart)
    echo "Restarting PostgreSQL container..."
    docker-compose -f docker-compose.db.yml restart
    ;;
  logs)
    docker-compose -f docker-compose.db.yml logs -f postgres
    ;;
  shell)
    echo "Connecting to PostgreSQL shell..."
    docker-compose -f docker-compose.db.yml exec postgres psql -U svg_user -d svg_ai_dev
    ;;
  reset)
    echo "Resetting database (this will delete all data)..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose -f docker-compose.db.yml down -v
      docker-compose -f docker-compose.db.yml up -d
      echo "Database reset complete!"
    fi
    ;;
  status)
    docker-compose -f docker-compose.db.yml ps
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|shell|reset|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the PostgreSQL container"
    echo "  stop    - Stop the PostgreSQL container"
    echo "  restart - Restart the PostgreSQL container"
    echo "  logs    - Show container logs"
    echo "  shell   - Connect to PostgreSQL shell"
    echo "  reset   - Reset database (deletes all data)"
    echo "  status  - Show container status"
    exit 1
    ;;
esac