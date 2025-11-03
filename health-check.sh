#!/bin/bash

echo "🔍 System Health Check"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node --version)"
else
    echo "✗ Node.js: not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✓ npm: $(npm --version)"
else
    echo "✗ npm: not found"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL: installed"
else
    echo "⚠ PostgreSQL: not found (can use Docker)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
else
    echo "⚠ Docker: not found"
fi

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo "✓ Dependencies: installed"
else
    echo "✗ Dependencies: not installed"
    echo "  Run: npm install"
    exit 1
fi

# Check if .env exists
if [ -f ".env" ]; then
    echo "✓ .env: configured"
else
    echo "✗ .env: missing"
    echo "  Run: cp .env.example .env"
    exit 1
fi

# Check if Prisma client is generated
if [ -d "node_modules/@prisma/client" ]; then
    echo "✓ Prisma Client: generated"
else
    echo "✗ Prisma Client: not generated"
    echo "  Run: npm run prisma:generate"
    exit 1
fi

# Try to compile TypeScript
echo ""
echo "🔨 Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo "✓ TypeScript: compiles successfully"
else
    echo "✗ TypeScript: compilation errors"
    echo "  Run: npm run build"
    exit 1
fi

echo ""
echo "✅ All health checks passed!"
echo ""
echo "You can now:"
echo "  - Start development: npm run dev"
echo "  - Run tests: npm test"
echo "  - Start PostgreSQL: docker-compose up -d"
