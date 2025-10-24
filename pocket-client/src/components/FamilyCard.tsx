"use client";
import { Family } from "@/lib/api";
import { Users, DollarSign, Clock } from "lucide-react";

interface FamilyCardProps {
  family: Family;
  onSelect: () => void;
  isSelected: boolean;
}

export function FamilyCard({ family, onSelect, isSelected }: FamilyCardProps) {
  const pendingRequests = family.spendRequests.filter(
    (req) => req.status === "pending"
  ).length;
  const totalTransactions = family.transactions.length;
  const activeMembers = family.members.filter(
    (member) => member.isActive
  ).length;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{family.name}</h3>
        {pendingRequests > 0 && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {pendingRequests} pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <Users size={16} className="mr-2" />
          <span className="text-sm">{activeMembers} active members</span>
        </div>

        <div className="flex items-center text-gray-600">
          <DollarSign size={16} className="mr-2" />
          <span className="text-sm">{totalTransactions} transactions</span>
        </div>

        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-2" />
          <span className="text-sm">
            Created {new Date(family.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-mono">
          {family.contract.slice(0, 6)}...{family.contract.slice(-4)}
        </p>
      </div>
    </div>
  );
}
