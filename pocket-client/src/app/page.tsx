"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { FamilyDashboard } from "@/components/FamilyDashboard";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CreateFamily } from "@/components/CreateFamily";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [showCreateFamily, setShowCreateFamily] = useState(false);

  // Fetch families for the connected wallet
  const { data: families, isLoading } = useQuery({
    queryKey: ["families", address],
    queryFn: () => api.getFamilies(address),
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Pocket Family Payments
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Secure, delegated payments for families. Set spending limits,
              approve transactions, and manage family finances with blockchain
              technology.
            </p>
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your families...</p>
        </div>
      </div>
    );
  }

  if (families && families.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome to Pocket!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create your first family account to get started with delegated
              payments.
            </p>
            {!showCreateFamily ? (
              <button
                onClick={() => setShowCreateFamily(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Create Family Account
              </button>
            ) : (
              <CreateFamily onSuccess={() => setShowCreateFamily(false)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FamilyDashboard families={families} />
    </div>
  );
}
