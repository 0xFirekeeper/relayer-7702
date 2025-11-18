/**
 * Example: ERC20 token payment for gas fees
 */
import { randomBytes } from "node:crypto";
import { eth_estimateGas, getAddress, getRpcClient, type ThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import type { ExchangeRateQuote, WrappedCalls } from "../types";
import {
  buildExecuteWithSigCalldata,
  encodeErc20Transfer,
  pollRelayerStatus,
  relayerRequest,
  requestExchangeRate,
} from "../utils";

export async function runErc20PaymentExample(
  client: ThirdwebClient,
  account: ReturnType<typeof privateKeyToAccount>,
  relayerUrl: string,
  thirdwebSecret: string,
  chainId: number,
  chain: any,
  token: { address: string; symbol?: string; decimals: number },
  feeCollector: string
) {
  console.log("\n" + "=".repeat(70));
  console.log("Example 2: ERC20 Token Payment");
  console.log("=".repeat(70));
  console.log(`Using token: ${token.symbol || "ERC20"} (${token.address})`);

  const eoaAddress = getAddress(account.address);
  const exchangeData = await requestExchangeRate(
    relayerUrl,
    thirdwebSecret,
    chainId.toString(),
    token.address
  );

  if (!exchangeData || "error" in exchangeData) {
    console.warn("Could not get exchange rate, skipping ERC20 example");
    return;
  }

  console.log(`Exchange rate: ${exchangeData.rate}`);
  console.log(`Fee collector: ${feeCollector}`);
  console.log(`Min fee: ${exchangeData.minFee || "N/A"}`);

  // Estimate gas for a no-op call
  const rpcClient = getRpcClient({ client, chain });
  const estimatedGas = await eth_estimateGas(rpcClient, {
    from: eoaAddress,
    to: eoaAddress,
    data: "0x",
    value: "0x0",
  });
  console.log(`Estimated gas: ${estimatedGas}`);

  // Calculate the fee using the correct formula from the relayer implementation
  const gasPrice = BigInt(exchangeData.gasPrice);
  const tokenDecimals = exchangeData.token.decimals;
  
  // Use the same scaling approach as the bundler
  const RATE_SCALE = 1_000_000_000n;
  const NATIVE_DECIMALS = 18n;
  
  // Formula: tokenFee = max(minFee, (estimatedGas × gasPrice / 10^18) × rate)
  const gasCostInNative = (estimatedGas * gasPrice) / (10n ** NATIVE_DECIMALS);
  
  // Convert rate to scaled bigint (rate is already tokens-per-native, e.g., 3407 USDC/ETH)
  const rate = parseFloat(exchangeData.rate);
  const rateScaled = BigInt(Math.ceil(rate * Number(RATE_SCALE)));
  
  // Calculate required tokens in scaled units
  const estimatedTokensScaled = rateScaled * gasCostInNative;
  
  // Convert minFee to scaled units
  const minFee = exchangeData.minFee ? parseFloat(exchangeData.minFee) : 0;
  const minFeeScaled = minFee > 0 ? BigInt(Math.ceil(minFee * Number(RATE_SCALE))) : 0n;
  
  // Take the max of estimated and minimum fee
  const requiredScaled = estimatedTokensScaled > minFeeScaled ? estimatedTokensScaled : minFeeScaled;
  
  // Convert scaled amount to base units (adjust for token decimals)
  const decimalsFactor = 10n ** BigInt(tokenDecimals);
  const feeAmount = (requiredScaled * decimalsFactor + RATE_SCALE - 1n) / RATE_SCALE;
  
  const feeAmountDisplay = Number(feeAmount) / Math.pow(10, tokenDecimals);

  console.log(`Fee amount to pay: ${feeAmountDisplay} ${exchangeData.token.symbol || token.symbol || "tokens"}`);

  // Encode ERC20 transfer
  const transferCalldata = encodeErc20Transfer(feeCollector, feeAmount);

  const wrappedUid = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const wrappedCalls: WrappedCalls = {
    uid: wrappedUid,
    calls: [
      {
        target: token.address as `0x${string}`,
        data: transferCalldata,
        value: BigInt(0),
      },
    ],
  };

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

  const taskId = await relayerRequest<string>(
    relayerUrl,
    thirdwebSecret,
    "relayer_sendTransaction",
    {
      to: eoaAddress,
      chainId: chainId.toString(),
      data: calldata,
      payment: {
        type: "token",
        address: token.address,
      },
      authorizationList: undefined,
    }
  );

  if (!taskId) {
    console.error("ERC20 relayer_sendTransaction failed");
    return;
  }

  console.log("Enqueued ERC20 transaction with task ID:", taskId);

  const finalStatus = await pollRelayerStatus(relayerUrl, thirdwebSecret, taskId, 20);
  console.log("Final status:", JSON.stringify(finalStatus, null, 2));
}
