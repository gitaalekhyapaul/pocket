#!/bin/bash

# Pocket Family Payments - Deployment Script
# This script deploys the entire stack for ETHOnline 2025

set -e

echo "🚀 Starting Pocket Family Payments deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env files exist
check_env_files() {
    print_status "Checking environment files..."
    
    if [ ! -f "contracts/.env" ]; then
        print_warning "contracts/.env not found. Please copy from contracts/env.example and configure."
        exit 1
    fi
    
    if [ ! -f "pocket-server/.env" ]; then
        print_warning "pocket-server/.env not found. Please copy from pocket-server/env.example and configure."
        exit 1
    fi
    
    if [ ! -f "pocket-client/.env.local" ]; then
        print_warning "pocket-client/.env.local not found. Please copy from pocket-client/env.local.example and configure."
        exit 1
    fi
    
    print_success "Environment files found"
}

# Deploy smart contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    cd contracts
    
    # Install dependencies
    print_status "Installing contract dependencies..."
    npm install
    
    # Compile contracts
    print_status "Compiling contracts..."
    npm run build
    
    # Deploy to Sepolia
    print_status "Deploying to Sepolia..."
    npm run deploy:sepolia
    
    # Get contract address from deployment
    CONTRACT_ADDRESS=$(cat deployments/sepolia.json | grep -o '"familyAccount":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        print_error "Failed to get contract address from deployment"
        exit 1
    fi
    
    print_success "Contract deployed to: $CONTRACT_ADDRESS"
    
    # Update backend .env with contract address
    cd ../pocket-server
    sed -i.bak "s/FAMILY_ACCOUNT_ADDRESS=.*/FAMILY_ACCOUNT_ADDRESS=$CONTRACT_ADDRESS/" .env
    print_success "Updated backend .env with contract address"
    
    # Update frontend .env with contract address
    cd ../pocket-client
    sed -i.bak "s/NEXT_PUBLIC_FAMILY_ACCOUNT_ADDRESS=.*/NEXT_PUBLIC_FAMILY_ACCOUNT_ADDRESS=$CONTRACT_ADDRESS/" .env.local
    print_success "Updated frontend .env with contract address"
    
    cd ..
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd pocket-server
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Setup database
    print_status "Setting up database..."
    npx prisma generate
    npx prisma migrate dev --name init
    
    print_success "Backend setup complete"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd pocket-client
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Frontend setup complete"
    cd ..
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd pocket-server
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend
    print_status "Starting frontend..."
    cd pocket-client
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Services started!"
    print_status "Backend running on: http://localhost:4000"
    print_status "Frontend running on: http://localhost:3000"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Frontend PID: $FRONTEND_PID"
    
    # Save PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
    fi
    
    print_success "Cleanup complete"
}

# Trap cleanup on exit
trap cleanup EXIT

# Main deployment flow
main() {
    print_status "Starting Pocket Family Payments deployment for ETHOnline 2025"
    
    check_env_files
    deploy_contracts
    setup_backend
    setup_frontend
    start_services
    
    print_success "🎉 Deployment complete!"
    print_status ""
    print_status "Your Pocket Family Payments app is now running:"
    print_status "  Frontend: http://localhost:3000"
    print_status "  Backend API: http://localhost:4000"
    print_status "  Contract: $CONTRACT_ADDRESS"
    print_status ""
    print_status "Press Ctrl+C to stop all services"
    
    # Wait for user to stop
    wait
}

# Run main function
main "$@"
