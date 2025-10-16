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

  // Calculate the ERC20-denominated fee
  const gasPrice = BigInt(exchangeData.gasPrice);
  const gasCostInWei = estimatedGas * gasPrice;
  const rateScaled = BigInt(Math.floor(parseFloat(exchangeData.rate) * 1e18));
  const feeInTokenUnits = (gasCostInWei * rateScaled) / BigInt(1e18);

  const tokenDecimals = exchangeData.token.decimals;
  const decimalScalar = Math.pow(10, tokenDecimals);
  const minFeeInTokenUnits = exchangeData.minFee
    ? BigInt(Math.floor(parseFloat(exchangeData.minFee) * decimalScalar))
    : BigInt(0);
  const feeAmount =
    feeInTokenUnits > minFeeInTokenUnits ? feeInTokenUnits : minFeeInTokenUnits;
  const feeAmountDisplay = Number(feeAmount) / decimalScalar;

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
        data: exchangeData.context,
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
