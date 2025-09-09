#!/bin/bash

# Start Database Monitor Script
echo "🔍 Starting SVG-AI Database Monitor..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, using default: postgresql://localhost:5432/svg_ai_dev"
    export DATABASE_URL="postgresql://localhost:5432/svg_ai_dev"
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo "🌐 Dashboard will be available at: http://localhost:3002"
echo "🔌 WebSocket server will run on: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the monitor"
echo ""

# Start the monitor
npm run db:monitor