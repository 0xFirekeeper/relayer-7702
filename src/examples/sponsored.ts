/**
 * Example: Sponsored (gasless) transaction
 */
import { randomBytes } from "node:crypto";
import { getAddress, type ThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import type { AuthorizationTuple, CapabilitiesResponse, WrappedCalls } from "../types";
import { buildExecuteWithSigCalldata, pollRelayerStatus, relayerRequest } from "../utils";

export async function runSponsoredExample(
  client: ThirdwebClient,
  account: ReturnType<typeof privateKeyToAccount>,
  relayerUrl: string,
  thirdwebSecret: string,
  chainId: number,
  authorizationList: AuthorizationTuple[]
) {
  console.log("\n" + "=".repeat(70));
  console.log("Example 1: Sponsored (Gasless) Transaction");
  console.log("=".repeat(70));

  const eoaAddress = getAddress(account.address);
  const wrappedUid = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const wrappedCalls: WrappedCalls = {
    uid: wrappedUid,
    calls: [
      {
        target: eoaAddress as `0x${string}`,
        data: "0x",
        value: BigInt(0),
      },
    ],
  };

  // Sign the wrapped calls using EIP-712
  const signature = (await account.signTypedData({
    domain: {
      chainId,
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
    message: wrappedCalls,
  })) as `0x${string}`;

  const calldata = await buildExecuteWithSigCalldata({
    client,
    chainId,
    wrappedCalls,
    signature,
  });

  // Submit the transaction to the relayer
  const taskId = await relayerRequest<string>(
    relayerUrl,
    thirdwebSecret,
    "relayer_sendTransaction",
    {
      to: eoaAddress,
      chainId: chainId.toString(),
      data: calldata,
      payment: {
        type: "sponsored",
      },
      authorizationList,
    }
  );

  if (!taskId) {
    throw new Error("relayer_sendTransaction failed: no task ID returned");
  }

  console.log("Enqueued transaction with task ID:", taskId);

  const finalStatus = await pollRelayerStatus(
    relayerUrl,
    thirdwebSecret,
    taskId,
    10
  );

  console.log("Final status:", JSON.stringify(finalStatus, null, 2));
}
