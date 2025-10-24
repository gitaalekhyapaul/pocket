import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Family {
  id: string;
  name: string;
  owner: string;
  contract: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  transactions: Transaction[];
  spendRequests: SpendRequest[];
}

export interface Member {
  id: string;
  familyId: string;
  walletAddress: string;
  name: string;
  role: "parent" | "child" | "guardian";
  dailyLimit: string;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  familyId: string;
  memberId: string;
  txHash: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
  description?: string;
  status: "pending" | "completed" | "failed";
  blockNumber?: number;
  createdAt: string;
}

export interface SpendRequest {
  id: string;
  familyId: string;
  memberId: string;
  requestId: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  member: Member;
}

export interface CreateFamilyRequest {
  name: string;
  owner: string;
  contract: string;
}

export interface AddMemberRequest {
  familyId: string;
  walletAddress: string;
  name: string;
  role: "parent" | "child" | "guardian";
  dailyLimit: string;
  requiresApproval: boolean;
}

export interface ApproveSpendRequest {
  requestId: string;
  delegateAddress: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
}

export interface RejectSpendRequest {
  requestId: string;
  delegateAddress: string;
  reason: string;
}

export const api = {
  // Family endpoints
  createFamily: async (data: CreateFamilyRequest) => {
    const response = await apiClient.post("/families", data);
    return response.data;
  },

  getFamilies: async (owner?: string) => {
    const params = owner ? { owner } : {};
    const response = await apiClient.get("/families", { params });
    return response.data.data;
  },

  getFamilyById: async (id: string) => {
    const response = await apiClient.get(`/families/${id}`);
    return response.data.data;
  },

  // Member endpoints
  addMember: async (data: AddMemberRequest) => {
    const response = await apiClient.post(
      `/families/${data.familyId}/members`,
      data
    );
    return response.data;
  },

  removeMember: async (memberId: string) => {
    const response = await apiClient.delete(`/families/members/${memberId}`);
    return response.data;
  },

  getMemberInfo: async (walletAddress: string) => {
    const response = await apiClient.get(`/families/members/${walletAddress}`);
    return response.data.data;
  },

  // Spend endpoints
  getPendingRequests: async (familyId?: string) => {
    const params = familyId ? { familyId } : {};
    const response = await apiClient.get("/spend/requests/pending", { params });
    return response.data.data;
  },

  approveSpend: async (data: ApproveSpendRequest) => {
    const response = await apiClient.post("/spend/requests/approve", data);
    return response.data;
  },

  rejectSpend: async (data: RejectSpendRequest) => {
    const response = await apiClient.post("/spend/requests/reject", data);
    return response.data;
  },

  getSpendHistory: async (familyId?: string, memberId?: string) => {
    const params: any = {};
    if (familyId) params.familyId = familyId;
    if (memberId) params.memberId = memberId;

    const response = await apiClient.get("/spend/requests/history", { params });
    return response.data.data;
  },

  getTransactionHistory: async (familyId?: string, memberId?: string) => {
    const params: any = {};
    if (familyId) params.familyId = familyId;
    if (memberId) params.memberId = memberId;

    const response = await apiClient.get("/spend/transactions/history", {
      params,
    });
    return response.data.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },
};
