import type { WalletClient, PublicClient, Hash, Address, Account, Chain, Transport } from "viem";
import { deployToken as apiDeploy, type DeployParams } from "./clawnch-api";

type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

export type FeePreference = "Clawnch" | "Paired" | "Both";
export type PairedToken = "WETH" | "USDC";

export interface DeployFormData {
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  feePreference: FeePreference;
  pairedToken: PairedToken;
  vaultEnabled: boolean;
  vaultPercentage: number;
  vaultLockupDays: number;
  vaultVestingDays: number;
  devBuyEnabled: boolean;
  devBuyEth: string;
}

export interface DeployTokenResult {
  txHash?: Hash;
  tokenAddress?: Address;
  error?: string;
}

export async function deployToken(
  apiKey: string,
  walletClient: ConnectedWalletClient,
  publicClient: PublicClient,
  form: DeployFormData
): Promise<DeployTokenResult> {
  const address = walletClient.account!.address;

  const params: DeployParams = {
    name: form.name,
    symbol: form.symbol,
    image: form.image || undefined,
    description: form.description || undefined,
    rewards: {
      recipients: [
        {
          recipient: address,
          admin: address,
          bps: 10000,
          feePreference: form.feePreference,
        },
      ],
    },
  };

  if (form.vaultEnabled && form.vaultPercentage > 0) {
    params.vault = {
      percentage: form.vaultPercentage,
      lockupDuration: form.vaultLockupDays * 86400,
      vestingDuration: form.vaultVestingDays * 86400,
      recipient: address,
    };
  }

  if (form.devBuyEnabled && form.devBuyEth) {
    const ethFloat = parseFloat(form.devBuyEth);
    if (ethFloat > 0) {
      params.devBuy = {
        ethAmount: String(BigInt(Math.floor(ethFloat * 1e18))),
        recipient: address,
      };
    }
  }

  const result = await apiDeploy(apiKey, walletClient, publicClient, params);

  return {
    txHash: result.txHash,
    tokenAddress: result.tokenAddress,
  };
}
