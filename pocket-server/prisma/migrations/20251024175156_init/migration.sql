-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "dailyLimit" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spend_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spend_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spend_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "members_walletAddress_key" ON "members"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txHash_key" ON "transactions"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "spend_requests_requestId_key" ON "spend_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_address_key" ON "tokens"("address");
