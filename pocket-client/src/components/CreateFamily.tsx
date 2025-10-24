"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Plus } from "lucide-react";

interface CreateFamilyProps {
  onSuccess: () => void;
}

export function CreateFamily({ onSuccess }: CreateFamilyProps) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    contract: "",
  });

  const createFamilyMutation = useMutation({
    mutationFn: (data: { name: string; owner: string; contract: string }) =>
      api.createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    createFamilyMutation.mutate({
      name: formData.name,
      owner: address,
      contract: formData.contract,
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Create Family</h2>
        <button
          onClick={onSuccess}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Family Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter family name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="contract"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Family Account Contract Address
          </label>
          <input
            type="text"
            id="contract"
            value={formData.contract}
            onChange={(e) =>
              setFormData({ ...formData, contract: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Deploy the FamilyAccount contract first and enter its address here
          </p>
        </div>

        <button
          type="submit"
          disabled={createFamilyMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          {createFamilyMutation.isPending ? (
            "Creating..."
          ) : (
            <>
              <Plus size={20} className="mr-2" />
              Create Family
            </>
          )}
        </button>
      </form>

      {createFamilyMutation.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {createFamilyMutation.error.message}
        </div>
      )}
    </div>
  );
}
