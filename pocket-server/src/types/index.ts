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

export interface CreateSpendRequestRequest {
  familyId: string;
  memberId: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
  description?: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
