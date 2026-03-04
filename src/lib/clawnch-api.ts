import {
  keccak256,
  encodePacked,
  getAddress,
  type WalletClient,
  type PublicClient,
  type Account,
  type Chain,
  type Transport,
  type Hash,
  type Hex,
  type Address,
} from "viem";

// Use local API routes as proxy to avoid CORS issues
const API_BASE = "";

type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

// ============================================================================
// Types
// ============================================================================

export interface RegisterResult {
  apiKey: string;
  agentId: string;
  wallet: Address;
}

interface CaptchaChallenge {
  challengeId: string;
  message: string;
  nonce: string;
  contractAddress: Address;
  storageSlot: Hex;
  deadline: string;
}

export interface ApiDeployResponse {
  success: boolean;
  txHash: Hash;
  tokenAddress: Address;
  clawnchBurned: string;
  burnTxHash: Hash | null;
  rateLimitBypassed: boolean;
  deployedFrom: Address;
  agentId: string;
}

// ============================================================================
// Agent Registration (one-time)
// ============================================================================

export async function registerAgent(
  walletClient: ConnectedWalletClient,
  name: string,
  description: string
): Promise<RegisterResult> {
  const address = walletClient.account!.address;

  // Step 1: Register — get challenge
  const registerRes = await fetch(`${API_BASE}/api/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, wallet: address, description }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(err.error);
  }

  const { registrationId, message } = await registerRes.json();

  // Step 2: Sign the challenge
  const signature = await walletClient.signMessage({ message });

  // Step 3: Verify — get API key
  const verifyRes = await fetch(`${API_BASE}/api/agents/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registrationId, signature }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error);
  }

  return verifyRes.json();
}

// ============================================================================
// Token Deployment
// ============================================================================

export interface DeployParams {
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  rewards?: {
    recipients: Array<{
      recipient: Address;
      admin: Address;
      bps: number;
      feePreference?: "Clawnch" | "Paired" | "Both";
    }>;
  };
  vault?: {
    percentage: number;
    lockupDuration: number;
    vestingDuration?: number;
    recipient: Address;
  };
  devBuy?: {
    ethAmount: string;
    recipient: Address;
  };
}

async function apiRequest(
  method: string,
  path: string,
  apiKey: string,
  body?: any
) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const options: RequestInit = { method, headers };

  if (body && method === "POST") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

async function solveCaptcha(
  challenge: CaptchaChallenge,
  walletClient: ConnectedWalletClient,
  publicClient: PublicClient
) {
  // Read on-chain storage slot
  const storageValue = await publicClient.getStorageAt({
    address: getAddress(challenge.contractAddress),
    slot: challenge.storageSlot,
  });

  if (!storageValue) {
    throw new Error("Failed to read on-chain storage for captcha");
  }

  // Sign the challenge message
  const signature = await walletClient.signMessage({
    message: challenge.message,
  });

  // Compute proof = keccak256(signature + nonce + storageValue)
  const proof = keccak256(
    encodePacked(
      ["bytes", "string", "bytes32"],
      [signature, challenge.nonce, storageValue]
    )
  );

  return {
    challengeId: challenge.challengeId,
    signature,
    storageValue,
    proof,
  };
}

export async function deployToken(
  apiKey: string,
  walletClient: ConnectedWalletClient,
  publicClient: PublicClient,
  params: DeployParams
): Promise<ApiDeployResponse> {
  // Step 1: Request captcha challenge
  const challenge: CaptchaChallenge = await apiRequest(
    "POST",
    "/api/deploy",
    apiKey,
    { tokenParams: params, bypassRateLimit: false }
  );

  // Step 2: Solve captcha
  const solution = await solveCaptcha(challenge, walletClient, publicClient);

  // Step 3: Submit solution → server deploys token
  const result: ApiDeployResponse = await apiRequest(
    "POST",
    "/api/deploy/confirm",
    apiKey,
    {
      challengeId: challenge.challengeId,
      solution,
      tokenParams: params,
    }
  );

  return result;
}
