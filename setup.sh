#!/bin/bash

# Script to setup and run the project locally

set -e

echo "🚀 Starting Dogs CRUD API setup..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate || echo "⚠️  Migrations failed. Make sure PostgreSQL is running and .env is configured"

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To run tests, run:"
echo "  npm test"
