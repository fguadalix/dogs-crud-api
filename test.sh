#!/bin/bash

# Test script to verify the setup

set -e

echo "🧪 Running project tests..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run 'cp .env.example .env' and configure it."
    exit 1
fi

# Start PostgreSQL with Docker Compose
echo "🐳 Starting PostgreSQL containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running migrations..."
npm run prisma:migrate:deploy || echo "⚠️  Migrations failed"

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ All tests completed!"
echo ""
echo "To stop PostgreSQL containers, run:"
echo "  docker-compose down"
