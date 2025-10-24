import type { Request, Response } from "express";
import { prisma } from "../services/database.js";
import { blockchainService } from "../services/blockchain.js";
import type {
  CreateFamilyRequest,
  AddMemberRequest,
  ApiResponse,
} from "../types/index.js";

export class FamilyController {
  async createFamily(req: Request, res: Response) {
    try {
      const { name, owner, contract }: CreateFamilyRequest = req.body;

      if (!name || !owner || !contract) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: name, owner, contract",
        } as ApiResponse);
      }

      const family = await prisma.family.create({
        data: {
          name,
          owner,
          contract,
        },
      });

      res.status(201).json({
        success: true,
        data: family,
        message: "Family created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create family",
      } as ApiResponse);
    }
  }

  async getFamilies(req: Request, res: Response) {
    try {
      const { owner } = req.query;

      const where = owner ? { owner: owner as string } : {};

      const families = await prisma.family.findMany({
        where,
        include: {
          members: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          spendRequests: {
            where: { status: "pending" },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      res.json({
        success: true,
        data: families,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch families",
      } as ApiResponse);
    }
  }

  async getFamilyById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Family ID is required",
        } as ApiResponse);
      }

      const family = await prisma.family.findUnique({
        where: { id },
        include: {
          members: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          spendRequests: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (!family) {
        return res.status(404).json({
          success: false,
          error: "Family not found",
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: family,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch family",
      } as ApiResponse);
    }
  }

  async addMember(req: Request, res: Response) {
    try {
      const {
        familyId,
        walletAddress,
        name,
        role,
        dailyLimit,
        requiresApproval,
      }: AddMemberRequest = req.body;

      if (!familyId || !walletAddress || !name || !role || !dailyLimit) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        } as ApiResponse);
      }

      // Check if family exists
      const family = await prisma.family.findUnique({
        where: { id: familyId },
      });

      if (!family) {
        return res.status(404).json({
          success: false,
          error: "Family not found",
        } as ApiResponse);
      }

      // Create member in database
      const member = await prisma.member.create({
        data: {
          familyId,
          walletAddress,
          name,
          role,
          dailyLimit,
          requiresApproval: requiresApproval ?? true,
        },
      });

      // Set delegate on blockchain
      const blockchainResult = await blockchainService.setDelegate(
        walletAddress,
        requiresApproval ?? true,
        dailyLimit,
        name
      );

      if (!blockchainResult.success) {
        // Rollback database creation
        await prisma.member.delete({ where: { id: member.id } });
        return res.status(500).json({
          success: false,
          error: `Failed to set delegate on blockchain: ${blockchainResult.error}`,
        } as ApiResponse);
      }

      res.status(201).json({
        success: true,
        data: {
          member,
          txHash: blockchainResult.txHash,
        },
        message: "Member added successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error adding member:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add member",
      } as ApiResponse);
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { memberId } = req.params;

      if (!memberId) {
        return res.status(400).json({
          success: false,
          error: "Member ID is required",
        } as ApiResponse);
      }

      const member = await prisma.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: "Member not found",
        } as ApiResponse);
      }

      // Revoke delegate on blockchain
      const blockchainResult = await blockchainService.revokeDelegate(
        member.walletAddress
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to revoke delegate on blockchain: ${blockchainResult.error}`,
        } as ApiResponse);
      }

      // Delete member from database
      await prisma.member.delete({
        where: { id: memberId },
      });

      res.json({
        success: true,
        data: { txHash: blockchainResult.txHash },
        message: "Member removed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove member",
      } as ApiResponse);
    }
  }

  async getMemberInfo(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required",
        } as ApiResponse);
      }

      const member = await prisma.member.findUnique({
        where: { walletAddress },
        include: {
          family: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          spendRequests: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: "Member not found",
        } as ApiResponse);
      }

      // Get blockchain info
      const blockchainInfo = await blockchainService.getDelegateInfo(
        walletAddress
      );

      res.json({
        success: true,
        data: {
          member,
          blockchainInfo,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching member info:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch member info",
      } as ApiResponse);
    }
  }
}
