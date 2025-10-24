#!/bin/bash

# Pocket Family Payments - Demo Script for ETHOnline 2025
# This script demonstrates the key features of the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if services are running
check_services() {
    print_header "Checking Services"
    
    # Check backend
    if curl -s http://localhost:4000/api/v1/health > /dev/null; then
        print_success "Backend API is running"
    else
        print_error "Backend API is not running. Please start it first."
        exit 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is running"
    else
        print_error "Frontend is not running. Please start it first."
        exit 1
    fi
}

# Demo API endpoints
demo_api() {
    print_header "API Demo"
    
    print_step "Testing health endpoint"
    curl -s http://localhost:4000/api/v1/health | jq .
    
    print_step "Getting families (should be empty initially)"
    curl -s http://localhost:4000/api/v1/families | jq .
    
    print_step "Getting pending requests (should be empty initially)"
    curl -s http://localhost:4000/api/v1/spend/requests/pending | jq .
}

# Demo smart contract interaction
demo_contract() {
    print_header "Smart Contract Demo"
    
    if [ ! -f "contracts/deployments/sepolia.json" ]; then
        print_error "Contract deployment file not found. Please deploy contracts first."
        return
    fi
    
    CONTRACT_ADDRESS=$(cat contracts/deployments/sepolia.json | grep -o '"familyAccount":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        print_error "Contract address not found in deployment file"
        return
    fi
    
    print_success "FamilyAccount contract deployed at: $CONTRACT_ADDRESS"
    
    print_step "Contract verification on Etherscan"
    echo "Check: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
}

# Demo workflow
demo_workflow() {
    print_header "Demo Workflow"
    
    print_info "1. Open http://localhost:3000 in your browser"
    print_info "2. Connect your MetaMask wallet to Sepolia network"
    print_info "3. Create a new family account"
    print_info "4. Add family members with spending limits"
    print_info "5. Test the approval workflow"
    
    echo ""
    print_info "Sample family member configuration:"
    echo "  Name: Alice"
    echo "  Role: Child"
    echo "  Daily Limit: 10 tokens"
    echo "  Requires Approval: Yes"
    
    echo ""
    print_info "Sample spend request:"
    echo "  Amount: 5 tokens"
    echo "  To: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    echo "  Description: Lunch money"
}

# Show prize track alignment
show_prize_tracks() {
    print_header "ETHOnline 2025 Prize Tracks"
    
    echo -e "${GREEN}✅ PayPal USD (PYUSD) Track${NC}"
    echo "  - Consumer Champion: Family-focused payments"
    echo "  - Grand Prize: Comprehensive payment system"
    echo "  - Uses PYUSD as primary stablecoin"
    echo ""
    
    echo -e "${GREEN}✅ Hardhat Track${NC}"
    echo "  - Best Projects Built Using Hardhat 3"
    echo "  - Complete test suite and deployment scripts"
    echo "  - TypeScript integration and gas optimization"
    echo ""
    
    echo -e "${GREEN}✅ Envio Track${NC}"
    echo "  - Best Live Web3 Dashboard"
    echo "  - Real-time event indexing"
    echo "  - Live transaction monitoring"
    echo ""
    
    echo -e "${GREEN}✅ Base Network${NC}"
    echo "  - Cross-chain deployment support"
    echo "  - Optimized for Base mainnet and Sepolia"
    echo "  - Gas-efficient smart contract design"
    echo ""
}

# Show architecture
show_architecture() {
    print_header "Architecture Overview"
    
    echo "🏗️  Smart Contracts (Hardhat + Solidity)"
    echo "   - FamilyAccount.sol: Core delegation logic"
    echo "   - Daily spending limits and approval workflows"
    echo "   - Event emission for real-time updates"
    echo ""
    
    echo "⚙️  Backend (Node.js + Express + Prisma)"
    echo "   - RESTful API for family management"
    echo "   - Real-time blockchain event listening"
    echo "   - SQLite database with Prisma ORM"
    echo "   - WebSocket support for live updates"
    echo ""
    
    echo "💻 Frontend (Next.js + Wagmi + Tailwind)"
    echo "   - Wallet connection with MetaMask"
    echo "   - Family dashboard and member management"
    echo "   - Real-time notifications and approvals"
    echo "   - Transaction history and analytics"
    echo ""
}

# Main demo function
main() {
    print_header "Pocket Family Payments - ETHOnline 2025 Demo"
    
    echo "This demo showcases a complete family delegated payment system"
    echo "built for ETHOnline 2025 with multiple prize track integrations."
    echo ""
    
    check_services
    demo_api
    demo_contract
    show_prize_tracks
    show_architecture
    demo_workflow
    
    print_header "Demo Complete"
    print_success "🎉 Pocket Family Payments is ready for ETHOnline 2025!"
    print_info "Access the application at: http://localhost:3000"
    print_info "API documentation at: http://localhost:4000/api/v1/health"
}

# Run main function
main "$@"
