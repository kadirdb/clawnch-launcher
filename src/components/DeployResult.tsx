"use client";

import type { Address, Hash } from "viem";

interface DeployResultProps {
  txHash?: Hash;
  tokenAddress?: Address;
  error?: string;
  loading?: boolean;
}

export default function DeployResult({
  txHash,
  tokenAddress,
  error,
  loading,
}: DeployResultProps) {
  if (!txHash && !error && !loading) return null;

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Deployment Result
      </h3>

      {loading && (
        <div className="flex items-center gap-2 text-violet-400">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Waiting for transaction confirmation...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 break-all">{error}</p>
      )}

      {txHash && (
        <div className="mb-2">
          <span className="text-sm text-zinc-500">Tx Hash: </span>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-400 hover:underline break-all"
          >
            {txHash}
          </a>
        </div>
      )}

      {tokenAddress && (
        <div>
          <span className="text-sm text-zinc-500">Token Address: </span>
          <a
            href={`https://basescan.org/address/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-400 hover:underline break-all"
          >
            {tokenAddress}
          </a>
        </div>
      )}
    </div>
  );
}
