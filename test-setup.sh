#!/bin/bash

# Test script to verify Pocket Family Payments setup
echo "🧪 Testing Pocket Family Payments Setup..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

# Test 1: Smart Contracts
print_status "Testing smart contracts..."
cd contracts
if npm run build > /dev/null 2>&1; then
    print_success "Smart contracts compile successfully"
else
    print_error "Smart contracts failed to compile"
    exit 1
fi

if npm test > /dev/null 2>&1; then
    print_success "Smart contract tests pass"
else
    print_error "Smart contract tests failed"
    exit 1
fi
cd ..

# Test 2: Backend
print_status "Testing backend setup..."
cd pocket-server
if [ -f ".env" ]; then
    print_success "Backend .env file exists"
else
    print_error "Backend .env file missing"
    exit 1
fi

if [ -f "prisma/dev.db" ]; then
    print_success "Database file exists"
else
    print_error "Database file missing - run 'npx prisma migrate dev --name init'"
    exit 1
fi
cd ..

# Test 3: Frontend
print_status "Testing frontend setup..."
cd pocket-client
if [ -f ".env.local" ]; then
    print_success "Frontend .env.local file exists"
else
    print_error "Frontend .env.local file missing"
    exit 1
fi
cd ..

# Test 4: Environment files
print_status "Checking environment files..."
if [ -f "contracts/.env" ]; then
    print_success "Contracts .env file exists"
else
    print_error "Contracts .env file missing - copy from contracts/env.example"
    exit 1
fi

echo ""
print_success "🎉 All tests passed! The project is ready to run."
echo ""
echo "Next steps:"
echo "1. Configure your .env files with RPC URLs and private keys"
echo "2. Run: ./scripts/deploy.sh"
echo "3. Access the app at: http://localhost:3000"
