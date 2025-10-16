/**
 * Example: Multichain sponsored transaction across Base Sepolia and Arbitrum Sepolia
 */
import { randomBytes } from "node:crypto";
import { eth_getTransactionCount, getAddress, getRpcClient, type ThirdwebClient } from "thirdweb";
import { arbitrumSepolia } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import type { WrappedCalls } from "../types";
import {
  buildExecuteWithSigCalldata,
  createAuthorizationTuple,
  pollRelayerStatus,
  relayerRequest,
} from "../utils";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export async function runMultichainExample(
  client: ThirdwebClient,
  account: ReturnType<typeof privateKeyToAccount>,
  relayerUrl: string,
  thirdwebSecret: string,
  baseNonce: bigint
) {
  console.log("\n" + "=".repeat(70));
  console.log("Example 3: Multichain Sponsored Transaction");
  console.log("=".repeat(70));
  console.log("Chains: Base Sepolia + Arbitrum Sepolia");

  const eoaAddress = getAddress(account.address);

  // Fetch nonce for Arbitrum Sepolia
  const arbSepoliaChain = arbitrumSepolia;
  const arbRpcClient = getRpcClient({ client, chain: arbSepoliaChain });
  const arbNonceHex = await eth_getTransactionCount(arbRpcClient, {
    address: eoaAddress,
    blockTag: "pending",
  });
  const arbNonce = BigInt(arbNonceHex);

  // Create authorizations for both chains
  const baseAuthList = [
    await createAuthorizationTuple(account, BASE_SEPOLIA_CHAIN_ID, baseNonce),
  ];
  const arbAuthList = [
    await createAuthorizationTuple(account, ARBITRUM_SEPOLIA_CHAIN_ID, arbNonce),
  ];

  // Create and sign Base Sepolia transaction
  const baseWrappedUid = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const baseWrappedCalls: WrappedCalls = {
    uid: baseWrappedUid,
    calls: [
      {
        target: eoaAddress as `0x${string}`,
        data: "0x",
        value: BigInt(0),
      },
    ],
  };

  const baseSignature = (await account.signTypedData({
    domain: {
      chainId: BASE_SEPOLIA_CHAIN_ID,
      name: "MinimalAccount",
      verifyingContract: eoaAddress,
      version: "1",
    },
    primaryType: "WrappedCalls",
    types: {
      Call: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
      ],
      WrappedCalls: [
        { name: "calls", type: "Call[]" },
        { name: "uid", type: "bytes32" },
      ],
    },
    message: baseWrappedCalls,
  })) as `0x${string}`;

  const baseCalldata = await buildExecuteWithSigCalldata({
    client,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    wrappedCalls: baseWrappedCalls,
    signature: baseSignature,
  });

  // Create and sign Arbitrum Sepolia transaction
  const arbWrappedUid = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const arbWrappedCalls: WrappedCalls = {
    uid: arbWrappedUid,
    calls: [
      {
        target: eoaAddress as `0x${string}`,
        data: "0x",
        value: BigInt(0),
      },
    ],
  };

  const arbSignature = (await account.signTypedData({
    domain: {
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      name: "MinimalAccount",
      verifyingContract: eoaAddress,
      version: "1",
    },
    primaryType: "WrappedCalls",
    types: {
      Call: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
      ],
      WrappedCalls: [
        { name: "calls", type: "Call[]" },
        { name: "uid", type: "bytes32" },
      ],
    },
    message: arbWrappedCalls,
  })) as `0x${string}`;

  const arbCalldata = await buildExecuteWithSigCalldata({
    client,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    wrappedCalls: arbWrappedCalls,
    signature: arbSignature,
  });

  // Submit multichain transaction
  const multichainResult = await relayerRequest<string[]>(
    relayerUrl,
    thirdwebSecret,
    "relayer_sendTransactionMultichain",
    [
      {
        to: eoaAddress,
        chainId: BASE_SEPOLIA_CHAIN_ID.toString(),
        data: baseCalldata,
        payment: {
          type: "sponsored",
        },
        authorizationList: baseAuthList,
      },
      {
        to: eoaAddress,
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID.toString(),
        data: arbCalldata,
        payment: {
          type: "sponsored",
        },
        authorizationList: arbAuthList,
      },
    ]
  );

  if (!multichainResult || multichainResult.length === 0) {
    throw new Error("relayer_sendTransactionMultichain failed");
  }

  console.log("Enqueued multichain transactions:");
  multichainResult.forEach((taskId, index) => {
    console.log(`  Chain ${index + 1}: ${taskId}`);
  });

  // Poll for both transaction statuses using the correct relayer URL for each chain
  console.log("\nPolling transaction statuses...");
  console.log("(Note: Cross-chain transactions may take longer to confirm)");
  
  const chains = [
    { id: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia" },
    { id: ARBITRUM_SEPOLIA_CHAIN_ID, name: "Arbitrum Sepolia" },
  ];

  for (let i = 0; i < multichainResult.length; i++) {
    const taskId = multichainResult[i];
    const chainInfo = chains[i];
    const chainRelayerUrl = `https://${chainInfo.id}.bundler.thirdweb.com/v2`;
    
    console.log(`\n${chainInfo.name} (Chain ${i + 1}) status:`);
    const status = await pollRelayerStatus(
      chainRelayerUrl, // Use the correct relayer URL for this chain
      thirdwebSecret,
      taskId,
      30, // Increased to 30 attempts (90 seconds) for cross-chain transactions
      3_000
    );
    console.log(JSON.stringify(status, null, 2));
  }
}
