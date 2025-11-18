/**
 * Example: OKX Wallet with ERC20 payment
 * 
 * This demonstrates using an OKX wallet (which uses the executeWithRelayer function)
 * with ERC20 token payment for gas fees.
 */
import { randomBytes } from "node:crypto";
import {
  encode,
  eth_estimateGas,
  getAddress,
  getContract,
  getRpcClient,
  prepareContractCall,
  type ThirdwebClient,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import { OKX_ACCOUNT_ABI, OKX_ACCOUNT_ADDRESS } from "../okx-account";
import type { AuthorizationTuple, ExchangeRateQuote } from "../types";
import { encodeErc20Transfer, pollRelayerStatus, relayerRequest, requestExchangeRate } from "../utils";

export async function runOkxExample(
  client: ThirdwebClient,
  account: ReturnType<typeof privateKeyToAccount>,
  relayerUrl: string,
  thirdwebSecret: string,
  chainId: number,
  chain: any,
  token: { address: string; symbol?: string; decimals: number },
  feeCollector: string,
  authorizationList: AuthorizationTuple[]
) {
  console.log("\n" + "=".repeat(70));
  console.log("Example 4: OKX Wallet with ERC20 Payment");
  console.log("=".repeat(70));
  console.log(`Using token: ${token.symbol || "ERC20"} (${token.address})`);

  const eoaAddress = getAddress(account.address);

  // Get exchange rate
  const exchangeData = await requestExchangeRate(
    relayerUrl,
    thirdwebSecret,
    chainId.toString(),
    token.address
  );

  if (!exchangeData || "error" in exchangeData) {
    console.warn("Could not get exchange rate, skipping OKX example");
    return;
  }

  console.log(`Exchange rate: ${exchangeData.rate}`);
  console.log(`Fee collector: ${feeCollector}`);
  console.log(`Min fee: ${exchangeData.minFee || "N/A"}`);

  // Estimate gas for the transaction
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

  // Build the ERC20 transfer calls for OKX executeWithRelayer
  const transferCalldata = encodeErc20Transfer(feeCollector, feeAmount);

  // Example user transfer (send 0.01 tokens to a test recipient)
  const decimalScalar = Math.pow(10, tokenDecimals);
  const userTransferAmount = BigInt(Math.floor(0.01 * decimalScalar));
  const userRecipient = "0xf292047fac5a94b5189fd665bf4aeaaf47fa5a28";
  const userTransferCalldata = encodeErc20Transfer(userRecipient, userTransferAmount);

  // Build OKX executeWithRelayer calldata
  const okxContract = getContract({
    client,
    chain: defineChain(chainId),
    address: OKX_ACCOUNT_ADDRESS,
    abi: OKX_ACCOUNT_ABI,
  });

  const batchedCall = {
    calls: [
      {
        target: token.address as `0x${string}`,
        value: BigInt(0),
        data: transferCalldata,
      },
      {
        target: token.address as `0x${string}`,
        value: BigInt(0),
        data: userTransferCalldata,
      },
    ],
    nonce: BigInt(0), // OKX uses nonce instead of uid
  };

  const validatorData =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000" as `0x${string}`;

  const executeWithRelayerCall = prepareContractCall({
    contract: okxContract,
    method: "executeWithRelayer",
    params: [batchedCall, validatorData],
  });

  const okxCalldata = (await encode(executeWithRelayerCall)) as `0x${string}`;

  console.log("Submitting OKX transaction to relayer...");

  const formattedAuthList = authorizationList.map((auth) => ({
    chainId: auth[0].toString(),
    address: auth[1],
    nonce: auth[2],
    yParity: auth[3],
    r: auth[4],
    s: auth[5],
  }));
  
  console.log("Authorization list:", JSON.stringify(formattedAuthList, null, 2));

  // Submit the transaction to the relayer
  const taskId = await relayerRequest<string>(
    relayerUrl,
    thirdwebSecret,
    "relayer_sendTransaction",
    {
      to: eoaAddress,
      chainId: chainId.toString(),
      data: okxCalldata,
      payment: {
        type: "token",
        address: token.address,
      },
      authorizationList: formattedAuthList,
    }
  );

  if (!taskId) {
    console.error("OKX relayer_sendTransaction failed");
    return;
  }

  console.log("Enqueued OKX transaction with task ID:", taskId);

  const finalStatus = await pollRelayerStatus(relayerUrl, thirdwebSecret, taskId, 20);
  console.log("Final status:", JSON.stringify(finalStatus, null, 2));
}
