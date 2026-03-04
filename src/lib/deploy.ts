import type { WalletClient, PublicClient, Hash, Address } from "viem";

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
  walletClient: WalletClient,
  publicClient: PublicClient,
  form: DeployFormData
): Promise<DeployTokenResult> {
  // Use webpack alias to bypass package.json exports restriction
  const { ClawnchDeployer } = await import(
    /* webpackIgnore: false */
    "@clawnch/clawncher-sdk/deployer"
  );

  const address = walletClient.account!.address;

  const deployer = new ClawnchDeployer({
    wallet: walletClient as any,
    publicClient,
    network: "mainnet",
  });

  const options: any = {
    name: form.name,
    symbol: form.symbol,
    tokenAdmin: address,
    image: form.image || undefined,
    metadata: form.description ? { description: form.description } : undefined,
    pairedToken: form.pairedToken,
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
    options.vault = {
      percentage: form.vaultPercentage,
      lockupDuration: form.vaultLockupDays * 86400,
      vestingDuration: form.vaultVestingDays * 86400,
      recipient: address,
    };
  }

  if (form.devBuyEnabled && form.devBuyEth) {
    const ethFloat = parseFloat(form.devBuyEth);
    if (ethFloat > 0) {
      options.devBuy = {
        ethAmount: BigInt(Math.floor(ethFloat * 1e18)),
        recipient: address,
      };
    }
  }

  const result = await deployer.deploy(options);

  if (result.error) {
    return { error: result.error.message };
  }

  const out: DeployTokenResult = { txHash: result.txHash };

  if (result.txHash) {
    const { address: tokenAddr } = await result.waitForTransaction();
    if (tokenAddr) out.tokenAddress = tokenAddr;
  }

  return out;
}
