"use client";
import { useState } from "react";
import { Family } from "@/lib/api";
import { FamilyCard } from "./FamilyCard";
import { AddMemberModal } from "./AddMemberModal";
import { PendingRequestsModal } from "./PendingRequestsModal";
import { Plus, Bell } from "lucide-react";

interface FamilyDashboardProps {
  families: Family[];
}

export function FamilyDashboard({ families }: FamilyDashboardProps) {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  // Calculate total pending requests across all families
  const totalPendingRequests = families.reduce(
    (total, family) =>
      total +
      family.spendRequests.filter((req) => req.status === "pending").length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pocket Family Payments
              </h1>
              <p className="text-gray-600">
                Manage your family's delegated payments
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {totalPendingRequests > 0 && (
                <button
                  onClick={() => setShowPendingRequests(true)}
                  className="relative bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Bell size={20} className="mr-2" />
                  Pending Requests
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {totalPendingRequests}
                  </span>
                </button>
              )}

              <button
                onClick={() => setShowAddMember(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Add Member
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Families
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                onSelect={() => setSelectedFamily(family)}
                isSelected={selectedFamily?.id === family.id}
              />
            ))}
          </div>
        </div>

        {/* Selected Family Details */}
        {selectedFamily && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedFamily.name} - Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Members */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Family Members
                </h4>
                <div className="space-y-2">
                  {selectedFamily.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.walletAddress}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {parseFloat(member.dailyLimit) / 1e18} tokens/day
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.requiresApproval
                            ? "Requires approval"
                            : "Auto-approve"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Recent Transactions
                </h4>
                <div className="space-y-2">
                  {selectedFamily.transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.description || "Payment"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {parseFloat(tx.amount) / 1e18} tokens
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedFamily.transactions.length === 0 && (
                    <p className="text-gray-500 text-sm">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          families={families}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {showPendingRequests && (
        <PendingRequestsModal
          families={families}
          onClose={() => setShowPendingRequests(false)}
        />
      )}
    </div>
  );
}
