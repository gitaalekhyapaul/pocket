"use client";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useState } from "react";

export function ConnectWallet() {
  const { connect } = useWeb3AuthConnect();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      await connect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
      <p className="text-sm text-gray-400 mt-4">
        Connect your wallet to access family payment features
      </p>
    </div>
  );
}
