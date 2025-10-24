"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Family } from "@/lib/api";
import { X, Plus } from "lucide-react";

interface AddMemberModalProps {
  families: Family[];
  onClose: () => void;
}

export function AddMemberModal({ families, onClose }: AddMemberModalProps) {
  const queryClient = useQueryClient();
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [formData, setFormData] = useState({
    walletAddress: "",
    name: "",
    role: "child" as "parent" | "child" | "guardian",
    dailyLimit: "",
    requiresApproval: true,
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: any) => api.addMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamilyId) return;

    const dailyLimitWei = (parseFloat(formData.dailyLimit) * 1e18).toString();

    addMemberMutation.mutate({
      familyId: selectedFamilyId,
      walletAddress: formData.walletAddress,
      name: formData.name,
      role: formData.role,
      dailyLimit: dailyLimitWei,
      requiresApproval: formData.requiresApproval,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add Family Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="family"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Family
            </label>
            <select
              id="family"
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a family</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="walletAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Wallet Address
            </label>
            <input
              type="text"
              id="walletAddress"
              value={formData.walletAddress}
              onChange={(e) =>
                setFormData({ ...formData, walletAddress: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Member Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter member name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dailyLimit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Daily Spending Limit (tokens)
            </label>
            <input
              type="number"
              id="dailyLimit"
              value={formData.dailyLimit}
              onChange={(e) =>
                setFormData({ ...formData, dailyLimit: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={formData.requiresApproval}
              onChange={(e) =>
                setFormData({ ...formData, requiresApproval: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="requiresApproval"
              className="ml-2 block text-sm text-gray-700"
            >
              Requires approval for transactions
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {addMemberMutation.isPending ? (
                "Adding..."
              ) : (
                <>
                  <Plus size={20} className="mr-2" />
                  Add Member
                </>
              )}
            </button>
          </div>
        </form>

        {addMemberMutation.error && (
          <div className="px-6 pb-6">
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {addMemberMutation.error.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
