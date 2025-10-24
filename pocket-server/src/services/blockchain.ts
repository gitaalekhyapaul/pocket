import { ethers } from "ethers";
import { prisma } from "./database.js";

// Contract ABI for FamilyAccount
const FAMILY_ACCOUNT_ABI = [
  "function setDelegate(address delegate, bool requiresApproval, uint256 dailyLimit, string memory name) external",
  "function revokeDelegate(address delegate) external",
  "function approveAndExecute(bytes32 requestId, address delegate, address token, address to, uint256 amount) external",
  "function rejectSpend(bytes32 requestId, address delegate, string memory reason) external",
  "function getDelegateInfo(address delegate) external view returns (bool exists, bool requiresApproval, uint256 dailyLimit, string memory name)",
  "function getAvailableAllowance(address delegate, address token) external view returns (uint256)",
  "function isMerchantWhitelisted(address delegate, address merchant) external view returns (bool)",
  "event DelegateSet(address indexed delegate, bool requiresApproval, uint256 dailyLimit, string name)",
  "event DelegateRevoked(address indexed delegate)",
  "event SpendRequested(bytes32 indexed requestId, address indexed delegate, address indexed token, address to, uint256 amount, string description)",
  "event SpendExecuted(bytes32 indexed requestId, address indexed actor, address indexed token, address to, uint256 amount)",
  "event SpendRejected(bytes32 indexed requestId, address indexed delegate, string reason)",
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private familyAccount: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.OWNER_PRIVATE_KEY;
    const contractAddress = process.env.FAMILY_ACCOUNT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        "Missing required environment variables for blockchain service"
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.familyAccount = new ethers.Contract(
      contractAddress,
      FAMILY_ACCOUNT_ABI,
      this.wallet
    ) as any;
  }

  async setDelegate(
    delegateAddress: string,
    requiresApproval: boolean,
    dailyLimit: string,
    name: string
  ) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      //@ts-ignore
      const tx = await this.familyAccount!.setDelegate(
        delegateAddress,
        requiresApproval,
        dailyLimit,
        name
      );

      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error setting delegate:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async revokeDelegate(delegateAddress: string) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      //@ts-ignore

      const tx = await this.familyAccount!.revokeDelegate(delegateAddress);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error revoking delegate:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async approveAndExecute(
    requestId: string,
    delegateAddress: string,
    tokenAddress: string,
    toAddress: string,
    amount: string
  ) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      //@ts-ignore

      const tx = await this.familyAccount!.approveAndExecute(
        requestId,
        delegateAddress,
        tokenAddress,
        toAddress,
        amount
      );

      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error approving spend:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async rejectSpend(
    requestId: string,
    delegateAddress: string,
    reason: string
  ) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      //@ts-ignore

      const tx = await this.familyAccount!.rejectSpend(
        requestId,
        delegateAddress,
        reason
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error rejecting spend:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getDelegateInfo(delegateAddress: string) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      const [exists, requiresApproval, dailyLimit, name] =
        //@ts-ignore

        await this.familyAccount!.getDelegateInfo(delegateAddress);
      return {
        exists,
        requiresApproval,
        dailyLimit: dailyLimit.toString(),
        name,
      };
    } catch (error) {
      console.error("Error getting delegate info:", error);
      return null;
    }
  }

  async getAvailableAllowance(delegateAddress: string, tokenAddress: string) {
    try {
      if (!this.familyAccount) {
        throw new Error("Family account contract not initialized");
      }
      //@ts-ignore

      const allowance = await this.familyAccount!.getAvailableAllowance(
        delegateAddress,
        tokenAddress
      );
      return allowance.toString();
    } catch (error) {
      console.error("Error getting available allowance:", error);
      return "0";
    }
  }

  async listenToEvents() {
    console.log("Starting event listener...");

    // Listen for SpendRequested events
    this.familyAccount.on(
      "SpendRequested",
      async (requestId, delegate, token, to, amount, description) => {
        console.log("SpendRequested event received:", {
          requestId,
          delegate,
          token,
          to,
          amount: amount.toString(),
          description,
        });

        try {
          // Find the family and member
          const member = await prisma.member.findFirst({
            where: { walletAddress: delegate },
            include: { family: true },
          });

          if (member) {
            // Create spend request in database
            await prisma.spendRequest.create({
              data: {
                familyId: member.familyId,
                memberId: member.id,
                requestId: requestId,
                tokenAddress: token,
                toAddress: to,
                amount: amount.toString(),
                description: description,
                status: "pending",
              },
            });

            console.log("Spend request saved to database");
          }
        } catch (error) {
          console.error("Error processing SpendRequested event:", error);
        }
      }
    );

    // Listen for SpendExecuted events
    this.familyAccount.on(
      "SpendExecuted",
      async (requestId, actor, token, to, amount) => {
        console.log("SpendExecuted event received:", {
          requestId,
          actor,
          token,
          to,
          amount: amount.toString(),
        });

        try {
          // Update spend request status
          await prisma.spendRequest.updateMany({
            where: { requestId: requestId },
            data: {
              status: "approved",
              txHash: "pending", // Will be updated with actual tx hash
            },
          });

          // Create transaction record
          const spendRequest = await prisma.spendRequest.findFirst({
            where: { requestId: requestId },
            include: { member: true },
          });

          if (spendRequest) {
            await prisma.transaction.create({
              data: {
                familyId: spendRequest.familyId,
                memberId: spendRequest.memberId,
                txHash: "pending", // Will be updated with actual tx hash
                tokenAddress: token,
                toAddress: to,
                amount: amount.toString(),
                description: spendRequest.description,
                status: "completed",
              },
            });
          }

          console.log("Spend execution recorded in database");
        } catch (error) {
          console.error("Error processing SpendExecuted event:", error);
        }
      }
    );

    // Listen for SpendRejected events
    this.familyAccount.on(
      "SpendRejected",
      async (requestId, delegate, reason) => {
        console.log("SpendRejected event received:", {
          requestId,
          delegate,
          reason,
        });

        try {
          await prisma.spendRequest.updateMany({
            where: { requestId: requestId },
            data: { status: "rejected" },
          });

          console.log("Spend rejection recorded in database");
        } catch (error) {
          console.error("Error processing SpendRejected event:", error);
        }
      }
    );
  }

  stopListening() {
    this.familyAccount.removeAllListeners();
  }
}

export const blockchainService = new BlockchainService();
