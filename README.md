# Pocket - Family Delegated Payments

> **ETHOnline 2025 Submission** - A secure, blockchain-based family payment system with delegated spending limits and approval workflows.

## 🏆 Prize Tracks Targeted

- **PayPal USD (PYUSD)** - Consumer payments with parental controls & approvals
- **Hardhat** - Clean Hardhat project with comprehensive tests and deployment scripts
- **Envio** - Real-time event indexing and live dashboard updates
- **Base Network** - Cross-chain deployment support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- MetaMask or compatible wallet
- Sepolia ETH for gas fees

### 1. Clone and Setup

```bash
git clone <repository-url>
cd pocket
```

### 2. Environment Configuration

Copy and configure environment files:

```bash
# Smart Contracts
cp contracts/env.example contracts/.env
# Edit contracts/.env with your RPC URLs and private keys

# Backend
cp pocket-server/env.example pocket-server/.env
# Edit pocket-server/.env with your configuration

# Frontend
cp pocket-client/env.local.example pocket-client/.env.local
# Edit pocket-client/.env.local with your settings
```

### 3. Deploy Everything

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment (this will deploy contracts, setup backend, and start services)
./scripts/deploy.sh
```

The script will:

- Deploy the FamilyAccount smart contract to Sepolia
- Setup the backend database and API
- Start both backend and frontend services
- Update environment files with deployed contract addresses

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/api/v1/health

## 🏗️ Architecture

### Smart Contracts (Hardhat + Solidity)

**FamilyAccount.sol** - Core contract managing:

- Delegate management (add/remove family members)
- Daily spending limits per member
- Approval workflows for transactions
- Event emission for real-time updates

```solidity
// Key functions
function setDelegate(address delegate, bool requiresApproval, uint256 dailyLimit, string memory name)
function spendAsDelegate(address token, address to, uint256 amount, string memory description)
function approveAndExecute(bytes32 requestId, address delegate, address token, address to, uint256 amount)
```

### Backend (Node.js + Express + Prisma)

**Features:**

- RESTful API for family and member management
- Real-time blockchain event listening
- SQLite database with Prisma ORM
- WebSocket support for live updates

**Key Endpoints:**

- `POST /api/v1/families` - Create family
- `POST /api/v1/families/:id/members` - Add member
- `GET /api/v1/spend/requests/pending` - Get pending requests
- `POST /api/v1/spend/requests/approve` - Approve spend

### Frontend (Next.js + Wagmi + Tailwind)

**Features:**

- Wallet connection with MetaMask
- Family dashboard with member management
- Real-time pending request notifications
- Transaction history and approval workflows

## 💡 How It Works

### 1. Family Setup

1. Parent connects wallet and creates a family
2. Deploys FamilyAccount contract with parent as owner
3. Adds family members (children/guardians) with spending limits

### 2. Member Spending

1. Child attempts to spend tokens via `spendAsDelegate()`
2. If approval required: Creates pending request
3. Parent receives notification and can approve/reject
4. If approved: Transaction executes on-chain

### 3. Real-time Updates

- Backend listens to blockchain events
- Updates database with new transactions/requests
- Frontend receives real-time updates via WebSocket

## 🎯 Demo Flow

### For ETHOnline 2025 Judges

1. **Connect Wallet** - Use MetaMask to connect to Sepolia
2. **Create Family** - Set up a family account
3. **Add Members** - Add children with spending limits
4. **Test Spending** - Simulate child spending requests
5. **Approve/Reject** - Show parent approval workflow
6. **View History** - Display transaction history

### Sample Configuration

```javascript
// Example family setup
const family = {
  name: "Smith Family",
  owner: "0x...", // Parent wallet
  contract: "0x...", // Deployed FamilyAccount
  members: [
    {
      name: "Alice",
      role: "child",
      dailyLimit: "10", // 10 tokens per day
      requiresApproval: true,
    },
  ],
};
```

## 🔧 Development

### Manual Setup (if not using deploy script)

```bash
# 1. Smart Contracts
cd contracts
npm install
npm run build
npm run deploy:sepolia

# 2. Backend
cd ../pocket-server
npm install
npx prisma migrate dev --name init
npm run dev

# 3. Frontend
cd ../pocket-client
npm install
npm run dev
```

### Testing

```bash
# Test smart contracts
cd contracts
npm test

# Test backend API
curl http://localhost:4000/api/v1/health
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run individual services
docker build -t pocket-backend ./pocket-server
docker build -t pocket-frontend ./pocket-client
```

## 📊 ETHOnline 2025 Integration

### PayPal USD (PYUSD) Track

- **Consumer Champion**: Family-focused payments with parental controls
- **Grand Prize**: Comprehensive payment system with approval workflows
- Uses PYUSD as the primary stablecoin for all transactions

### Hardhat Track

- **Best Projects Built Using Hardhat 3**: Complete Hardhat setup with:
  - Comprehensive test suite
  - Deployment scripts for multiple networks
  - TypeScript integration
  - Gas optimization

### Envio Track

- **Best Live Web3 Dashboard**: Real-time event indexing
- **Best Use of HyperIndex**: Live transaction monitoring
- Backend listens to blockchain events and updates dashboard in real-time

### Base Network

- Cross-chain deployment support
- Optimized for Base mainnet and Base Sepolia
- Gas-efficient smart contract design

## 🔒 Security Features

- **Daily Spending Limits**: Enforced on-chain per member
- **Approval Workflows**: Parental control over large transactions
- **Merchant Whitelisting**: Optional merchant restrictions
- **Event Logging**: Complete audit trail of all transactions
- **Access Control**: Role-based permissions (parent/child/guardian)

## 📈 Scalability

- **Modular Design**: Easy to extend with new features
- **Cross-chain Ready**: Supports multiple EVM networks
- **Real-time Updates**: WebSocket integration for live data
- **Database Optimization**: Efficient querying with Prisma

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For ETHOnline 2025 judges or participants:

- Check the demo flow above
- Review the architecture section
- Test with the provided sample configuration
- Contact the team for any questions

---

**Built for ETHOnline 2025** 🚀
