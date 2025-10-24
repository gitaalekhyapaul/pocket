import type { Request, Response } from "express";
import { prisma } from "../services/database.js";
import { blockchainService } from "../services/blockchain.js";
import type {
  ApproveSpendRequest,
  RejectSpendRequest,
  ApiResponse,
} from "../types/index.js";

export class SpendController {
  async getPendingRequests(req: Request, res: Response) {
    try {
      const { familyId } = req.query;

      const where = familyId
        ? { familyId: familyId as string, status: "pending" }
        : { status: "pending" };

      const requests = await prisma.spendRequest.findMany({
        where,
        include: {
          member: {
            include: {
              family: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: requests,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch pending requests",
      } as ApiResponse);
    }
  }

  async approveSpend(req: Request, res: Response) {
    try {
      const {
        requestId,
        delegateAddress,
        tokenAddress,
        toAddress,
        amount,
      }: ApproveSpendRequest = req.body;

      if (
        !requestId ||
        !delegateAddress ||
        !tokenAddress ||
        !toAddress ||
        !amount
      ) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        } as ApiResponse);
      }

      // Check if request exists and is pending
      const spendRequest = await prisma.spendRequest.findFirst({
        where: { requestId, status: "pending" },
      });

      if (!spendRequest) {
        return res.status(404).json({
          success: false,
          error: "Spend request not found or not pending",
        } as ApiResponse);
      }

      // Approve on blockchain
      const blockchainResult = await blockchainService.approveAndExecute(
        requestId,
        delegateAddress,
        tokenAddress,
        toAddress,
        amount
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to approve spend on blockchain: ${blockchainResult.error}`,
        } as ApiResponse);
      }

      // Update request status
      await prisma.spendRequest.update({
        where: { id: spendRequest.id },
        data: {
          status: "approved",
          txHash: blockchainResult.txHash,
        },
      });

      res.json({
        success: true,
        data: { txHash: blockchainResult.txHash },
        message: "Spend request approved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error approving spend:", error);
      res.status(500).json({
        success: false,
        error: "Failed to approve spend",
      } as ApiResponse);
    }
  }

  async rejectSpend(req: Request, res: Response) {
    try {
      const { requestId, delegateAddress, reason }: RejectSpendRequest =
        req.body;

      if (!requestId || !delegateAddress || !reason) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        } as ApiResponse);
      }

      // Check if request exists and is pending
      const spendRequest = await prisma.spendRequest.findFirst({
        where: { requestId, status: "pending" },
      });

      if (!spendRequest) {
        return res.status(404).json({
          success: false,
          error: "Spend request not found or not pending",
        } as ApiResponse);
      }

      // Reject on blockchain
      const blockchainResult = await blockchainService.rejectSpend(
        requestId,
        delegateAddress,
        reason
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to reject spend on blockchain: ${blockchainResult.error}`,
        } as ApiResponse);
      }

      // Update request status
      await prisma.spendRequest.update({
        where: { id: spendRequest.id },
        data: { status: "rejected" },
      });

      res.json({
        success: true,
        data: { txHash: blockchainResult.txHash },
        message: "Spend request rejected successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error rejecting spend:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reject spend",
      } as ApiResponse);
    }
  }

  async getSpendHistory(req: Request, res: Response) {
    try {
      const { familyId, memberId } = req.query;

      const where: any = {};
      if (familyId) where.familyId = familyId as string;
      if (memberId) where.memberId = memberId as string;

      const requests = await prisma.spendRequest.findMany({
        where,
        include: {
          member: {
            include: {
              family: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({
        success: true,
        data: requests,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching spend history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch spend history",
      } as ApiResponse);
    }
  }

  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { familyId, memberId } = req.query;

      const where: any = {};
      if (familyId) where.familyId = familyId as string;
      if (memberId) where.memberId = memberId as string;

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          member: {
            include: {
              family: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({
        success: true,
        data: transactions,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch transaction history",
      } as ApiResponse);
    }
  }
}
