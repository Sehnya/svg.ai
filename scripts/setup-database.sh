#!/bin/bash

# SVG AI Database Setup Script
# This script sets up a local PostgreSQL database for development

set -e

DB_NAME="svg_ai_dev"
DB_USER="svg_ai_user"
DB_PASSWORD="svg_ai_password"

echo "🚀 Setting up SVG AI Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is installed and running"

# Create database user if it doesn't exist
echo "📝 Creating database user..."
psql -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   User already exists"

# Create database if it doesn't exist
echo "📝 Creating database..."
psql -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "   Database already exists"

# Grant privileges
echo "📝 Granting privileges..."
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Try to install pgvector extension (optional)
echo "📝 Attempting to install pgvector extension..."
if psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null; then
    echo "✅ pgvector extension installed successfully"
else
    echo "⚠️  pgvector extension not available. Vector similarity search will be disabled."
    echo "   To install pgvector:"
    echo "   - On macOS: brew install pgvector"
    echo "   - On Ubuntu: sudo apt-get install postgresql-14-pgvector"
    echo "   - Then restart PostgreSQL and run this script again"
fi

# Update .env file with database URL
ENV_FILE=".env"
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

if [ -f "$ENV_FILE" ]; then
    # Update existing DATABASE_URL or add it
    if grep -q "DATABASE_URL=" "$ENV_FILE"; then
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" "$ENV_FILE"
        echo "✅ Updated DATABASE_URL in $ENV_FILE"
    else
        echo "" >> "$ENV_FILE"
        echo "DATABASE_URL=$DB_URL" >> "$ENV_FILE"
        echo "✅ Added DATABASE_URL to $ENV_FILE"
    fi
else
    echo "⚠️  .env file not found. Please create it with:"
    echo "   DATABASE_URL=$DB_URL"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run migrations: bun run db:migrate"
echo "2. Seed database: bun run db:seed"
echo ""
echo "Database connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  URL: $DB_URL"