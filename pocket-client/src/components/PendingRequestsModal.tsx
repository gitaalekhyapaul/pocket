"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Family, SpendRequest } from "@/lib/api";
import { X, Check, XCircle, Clock } from "lucide-react";

interface PendingRequestsModalProps {
  families: Family[];
  onClose: () => void;
}

export function PendingRequestsModal({
  families,
  onClose,
}: PendingRequestsModalProps) {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null
  );

  // Get all pending requests from all families
  const pendingRequests = families.flatMap((family) =>
    family.spendRequests
      .filter((req) => req.status === "pending")
      .map((req) => ({ ...req, familyName: family.name }))
  );

  const approveMutation = useMutation({
    mutationFn: (data: any) => api.approveSpend(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: any) => api.rejectSpend(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      setRejectingRequestId(null);
      setRejectReason("");
    },
  });

  const handleApprove = (request: SpendRequest) => {
    approveMutation.mutate({
      requestId: request.requestId,
      delegateAddress: request.member.walletAddress,
      tokenAddress: request.tokenAddress,
      toAddress: request.toAddress,
      amount: request.amount,
    });
  };

  const handleReject = (request: SpendRequest) => {
    if (!rejectReason.trim()) return;

    rejectMutation.mutate({
      requestId: request.requestId,
      delegateAddress: request.member.walletAddress,
      reason: rejectReason,
    });
  };

  const startReject = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingRequestId(null);
    setRejectReason("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Pending Spend Requests
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {request.familyName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested by: {request.member.name} (
                        {request.member.role})
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium text-gray-900">
                        {parseFloat(request.amount) / 1e18} tokens
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">To Address</p>
                      <p className="font-mono text-sm text-gray-900">
                        {request.toAddress.slice(0, 6)}...
                        {request.toAddress.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">
                        {request.description || "No description"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requested</p>
                      <p className="text-gray-900">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {rejectingRequestId === request.id ? (
                    <div className="border-t pt-4">
                      <div className="mb-3">
                        <label
                          htmlFor="rejectReason"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Reason for rejection
                        </label>
                        <textarea
                          id="rejectReason"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={2}
                          placeholder="Enter reason for rejection..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReject(request)}
                          disabled={
                            !rejectReason.trim() || rejectMutation.isPending
                          }
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm flex items-center"
                        >
                          <XCircle size={16} className="mr-1" />
                          {rejectMutation.isPending
                            ? "Rejecting..."
                            : "Confirm Reject"}
                        </button>
                        <button
                          onClick={cancelReject}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2 border-t pt-4">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm flex items-center"
                      >
                        <Check size={16} className="mr-1" />
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => startReject(request.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
                      >
                        <XCircle size={16} className="mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
