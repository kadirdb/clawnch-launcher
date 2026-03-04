"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { deployToken, type DeployFormData, type FeePreference, type PairedToken } from "@/lib/deploy";
import { registerAgent } from "@/lib/clawnch-api";
import type { Address, Hash } from "viem";
import DeployResult from "./DeployResult";

const API_KEY_PREFIX = "clawnch_api_key_";

function getStoredApiKey(address: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${API_KEY_PREFIX}${address.toLowerCase()}`);
}

function storeApiKey(address: string, key: string) {
  localStorage.setItem(`${API_KEY_PREFIX}${address.toLowerCase()}`, key);
}

export default function DeployForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string>();

  const [form, setForm] = useState<DeployFormData>({
    name: "",
    symbol: "",
    image: "",
    description: "",
    feePreference: "Clawnch",
    pairedToken: "WETH",
    vaultEnabled: false,
    vaultPercentage: 10,
    vaultLockupDays: 7,
    vaultVestingDays: 0,
    devBuyEnabled: false,
    devBuyEth: "",
  });

  const [deploying, setDeploying] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  const [tokenAddress, setTokenAddress] = useState<Address>();
  const [error, setError] = useState<string>();

  // Load stored API key when wallet connects
  useEffect(() => {
    if (address) {
      setApiKey(getStoredApiKey(address));
    } else {
      setApiKey(null);
    }
  }, [address]);

  const update = (field: keyof DeployFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    if (!walletClient || !address) return;

    setRegistering(true);
    setRegError(undefined);

    try {
      const result = await registerAgent(
        walletClient as any,
        "Clawnch Launcher User",
        "Token deployer via Clawnch Launcher web UI"
      );
      storeApiKey(address, result.apiKey);
      setApiKey(result.apiKey);
    } catch (err: any) {
      setRegError(err.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeploy = async () => {
    if (!walletClient || !publicClient || !apiKey) return;

    setDeploying(true);
    setError(undefined);
    setTxHash(undefined);
    setTokenAddress(undefined);

    try {
      const result = await deployToken(apiKey, walletClient as any, publicClient, form);

      if (result.txHash) setTxHash(result.txHash);
      if (result.tokenAddress) setTokenAddress(result.tokenAddress);
    } catch (err: any) {
      setError(err.message || "Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center text-zinc-500 py-20">
        Connect your wallet to deploy a token.
      </div>
    );
  }

  // Registration step
  if (!apiKey) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 text-center">
          <h2 className="text-lg font-semibold text-zinc-100">Register with Clawnch</h2>
          <p className="text-sm text-zinc-400">
            One-time registration required to deploy tokens through Clawnch.
            You&apos;ll sign a message with your wallet to verify ownership.
          </p>
          {regError && (
            <p className="text-sm text-red-400">{regError}</p>
          )}
          <button
            onClick={handleRegister}
            disabled={registering}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registering ? "Signing..." : "Register"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-zinc-100">Deploy Token</h2>

        {/* Name */}
        <Field label="Token Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="My Token"
            className="input"
          />
        </Field>

        {/* Symbol */}
        <Field label="Token Symbol" required>
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => update("symbol", e.target.value.toUpperCase())}
            placeholder="MYTKN"
            className="input"
            maxLength={10}
          />
        </Field>

        {/* Image URL */}
        <Field label="Image URL">
          <input
            type="url"
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://..."
            className="input"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A short description of your token..."
            className="input resize-none"
            rows={3}
          />
        </Field>

        {/* Fee Preference & Paired Token */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fee Preference">
            <select
              value={form.feePreference}
              onChange={(e) =>
                update("feePreference", e.target.value as FeePreference)
              }
              className="input"
            >
              <option value="Clawnch">Clawnch Token</option>
              <option value="Paired">Paired Token</option>
              <option value="Both">Both</option>
            </select>
          </Field>

          <Field label="Paired Token">
            <select
              value={form.pairedToken}
              onChange={(e) =>
                update("pairedToken", e.target.value as PairedToken)
              }
              className="input"
            >
              <option value="WETH">WETH</option>
              <option value="USDC">USDC</option>
            </select>
          </Field>
        </div>

        {/* Vault Section */}
        <Collapsible
          label="Vault Allocation"
          enabled={form.vaultEnabled}
          onToggle={(v) => update("vaultEnabled", v)}
        >
          <div className="grid grid-cols-3 gap-3">
            <Field label="Supply %">
              <input
                type="number"
                value={form.vaultPercentage}
                onChange={(e) =>
                  update("vaultPercentage", Number(e.target.value))
                }
                className="input"
                min={1}
                max={90}
              />
            </Field>
            <Field label="Lockup Days">
              <input
                type="number"
                value={form.vaultLockupDays}
                onChange={(e) =>
                  update("vaultLockupDays", Number(e.target.value))
                }
                className="input"
                min={7}
              />
            </Field>
            <Field label="Vesting Days">
              <input
                type="number"
                value={form.vaultVestingDays}
                onChange={(e) =>
                  update("vaultVestingDays", Number(e.target.value))
                }
                className="input"
                min={0}
              />
            </Field>
          </div>
        </Collapsible>

        {/* Dev Buy Section */}
        <Collapsible
          label="Dev Buy"
          enabled={form.devBuyEnabled}
          onToggle={(v) => update("devBuyEnabled", v)}
        >
          <Field label="ETH Amount">
            <input
              type="number"
              value={form.devBuyEth}
              onChange={(e) => update("devBuyEth", e.target.value)}
              placeholder="0.01"
              className="input"
              step="0.001"
              min={0}
            />
          </Field>
        </Collapsible>

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={deploying || !form.name || !form.symbol}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deploying ? "Deploying..." : "Deploy"}
        </button>
      </div>

      <DeployResult
        txHash={txHash}
        tokenAddress={tokenAddress}
        error={error}
        loading={deploying}
      />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
        {required && <span className="text-violet-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Collapsible({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-600 focus:ring-violet-500"
        />
      </label>
      {enabled && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}
