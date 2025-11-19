/**
 * Utility functions for interacting with the Thirdweb 7702 Relayer
 */
import {
  encode,
  getContract,
  prepareContractCall,
  signAuthorization,
  type ThirdwebClient,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import { padHex, toHex } from "thirdweb/utils";
import { THIRDWEB_MINIMAL_ACCOUNT_ABI, THIRDWEB_MINIMAL_ACCOUNT_ADDRESS } from "./minimal-account";
import type {
  AuthorizationTuple,
  ExchangeRateEntry,
  JsonRpcRequest,
  RelayerResult,
  RelayerStatusEntry,
  WrappedCalls,
} from "./types";


const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build the calldata for executeWithSig function on the minimal account contract.
 */
export async function buildExecuteWithSigCalldata({
  client,
  chainId,
  wrappedCalls,
  signature,
}: {
  client: ThirdwebClient;
  chainId: number;
  wrappedCalls: WrappedCalls;
  signature: `0x${string}`;
}): Promise<`0x${string}`> {
  const minimalAccountContract = getContract({
    client,
    chain: defineChain(chainId),
    address: THIRDWEB_MINIMAL_ACCOUNT_ADDRESS,
    abi: THIRDWEB_MINIMAL_ACCOUNT_ABI,
  });
  const transaction = prepareContractCall({
    contract: minimalAccountContract,
    method: "executeWithSig",
    params: [wrappedCalls, signature],
  });
  return (await encode(transaction)) as `0x${string}`;
}

/**
 * Create and sign an EIP-7702 authorization for a given chain and nonce.
 */
export async function createAuthorizationTuple(
  account: ReturnType<typeof privateKeyToAccount>,
  chainId: number,
  nonce: bigint,
  contractAddress?: `0x${string}`
): Promise<AuthorizationTuple> {
  const authorization = await signAuthorization({
    account,
    request: {
      address: contractAddress || THIRDWEB_MINIMAL_ACCOUNT_ADDRESS,
      chainId,
      nonce,
    },
  });

  return [
    authorization.chainId,
    authorization.address,
    authorization.nonce.toString(),
    authorization.yParity,
    toHex(authorization.r),
    toHex(authorization.s),
  ];
}

/**
 * Request fee data (exchange rate) for a specific token on a chain.
 */
export async function requestExchangeRate(
  relayerUrl: string,
  thirdwebSecret: string,
  chainId: string,
  tokenAddress: string
): Promise<ExchangeRateEntry | undefined> {
  return await relayerRequest<ExchangeRateEntry>(
    relayerUrl,
    thirdwebSecret,
    "relayer_getFeeData",
    {
      chainId,
      token: tokenAddress,
    }
  );
}

/**
 * Poll the relayer for transaction status until it reaches a final state.
 */
export async function pollRelayerStatus(
  relayerUrl: string,
  thirdwebSecret: string,
  taskId: string,
  attempts: number,
  delayMs = 3_000
) {
  let finalStatus: RelayerStatusEntry | undefined;
  
  const getStatusMessage = (code: number): string => {
    if (code === 100) return "pending (not submitted)";
    if (code === 110) return "submitted (awaiting confirmation)";
    if (code === 200) return "confirmed";
    if (code >= 400 && code < 500) return "rejected";
    if (code >= 500) return "reverted";
    return "unknown";
  };

  for (let attempt = 0; attempt < attempts; attempt++) {
    await sleep(delayMs);
    const statusResponse = await relayerRequest<RelayerStatusEntry>(
      relayerUrl,
      thirdwebSecret,
      "relayer_getStatus",
      {
        id: taskId,
        logs: true,
      }
    );

    if (!statusResponse) {
      console.warn("relayer_getStatus returned empty result");
      continue;
    }
    if ("error" in statusResponse) {
      console.warn("relayer_getStatus error:", statusResponse.error);
      finalStatus = statusResponse;
      continue;
    }

    const statusMsg = getStatusMessage(statusResponse.status);
    console.log(`Status poll #${attempt + 1}: status=${statusResponse.status} (${statusMsg})`);
    finalStatus = statusResponse;
    if (statusResponse.status >= 200) {
      break;
    }
  }

  return finalStatus;
}

/**
 * Encode an ERC20 transfer calldata.
 * Format: transfer(address to, uint256 amount)
 */
export function encodeErc20Transfer(to: string, amount: bigint): `0x${string}` {
  const methodSelector = "0xa9059cbb";
  const feeCollectorPadded = to
    .toLowerCase()
    .replace("0x", "")
    .padStart(64, "0");
  const amountPadded = amount.toString(16).padStart(64, "0");
  return `${methodSelector}${feeCollectorPadded}${amountPadded}` as `0x${string}`;
}

/**
 * Generic relayer JSON-RPC request helper.
 */
export async function relayerRequest<T>(
  url: string,
  secretKey: string,
  method: string,
  params?: unknown
): Promise<T | undefined> {
  const payload: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    ...(params === undefined ? {} : { params }),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-secret-key": secretKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Relayer request failed with ${response.status} and message ${await response.text()}`
    );
  }

  const body = (await response.json()) as RelayerResult<T>;
  if (body.error) {
    throw new Error(
      `${method} returned error ${body.error.code}: ${body.error.message}`
    );
  }
  return body.result;
}
