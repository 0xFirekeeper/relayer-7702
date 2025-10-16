/**
 * Thirdweb 7702 Relayer Demo
 * 
 * Demonstrates three integration patterns:
 *  1. Sponsored (gasless) transactions
 *  2. ERC20 token payment for gas
 *  3. Multichain sponsored transactions
 */
import { config } from "dotenv";
import {
  createThirdwebClient,
  eth_getTransactionCount,
  getAddress,
  getRpcClient,
} from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import { runErc20PaymentExample } from "./examples/erc20-payment";
import { runMultichainExample } from "./examples/multichain";
import { runSponsoredExample } from "./examples/sponsored";
import type { CapabilitiesResponse } from "./types";
import { createAuthorizationTuple, relayerRequest, requestExchangeRate } from "./utils";

config();

async function main() {
  // ============================================================================
  // Setup and Configuration
  // ============================================================================
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  const thirdwebSecret = process.env.THIRDWEB_SECRET_KEY;
  
  if (!walletPrivateKey || !thirdwebSecret) {
    throw new Error("Set WALLET_PRIVATE_KEY and THIRDWEB_SECRET_KEY in your .env file");
  }

  const chain = baseSepolia;
  const chainId = chain.id;
  const relayerUrl = `https://${chainId}.bundler.thirdweb.com/v2`;

  console.log("=".repeat(70));
  console.log("Thirdweb 7702 Relayer Demo");
  console.log("=".repeat(70));
  console.log("Relayer:", relayerUrl);
  console.log("Chain:", `${chain.name} (${chainId})`);

  const client = createThirdwebClient({ secretKey: thirdwebSecret });
  const account = privateKeyToAccount({ client, privateKey: walletPrivateKey });
  const eoaAddress = getAddress(account.address);
  console.log("EOA address:", eoaAddress);

  // Get nonce for EIP-7702 authorization
  const rpcClient = getRpcClient({ client, chain });
  const nonceHex = await eth_getTransactionCount(rpcClient, {
    address: eoaAddress,
    blockTag: "pending",
  });
  const nonce = BigInt(nonceHex);

  // Create EIP-7702 authorization
  const authorizationList = [await createAuthorizationTuple(account, chainId, nonce)];

  // ============================================================================
  // Relayer Capability Discovery
  // ============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("Fetching Relayer Capabilities");
  console.log("=".repeat(70));

  const capabilities = await relayerRequest<CapabilitiesResponse>(
    relayerUrl,
    thirdwebSecret,
    "relayer_getCapabilities",
    [chainId.toString()]
  );

  const chainCapabilities = capabilities?.[chainId.toString()];
  if (!chainCapabilities) {
    throw new Error(`No capabilities found for chain ${chainId}`);
  }

  console.log("Available tokens:");
  console.table(chainCapabilities.tokens);

  // Sample exchange rate
  const tokenForQuote = chainCapabilities.tokens[0];
  if (tokenForQuote) {
    const exchangeRate = await requestExchangeRate(
      relayerUrl,
      thirdwebSecret,
      chainId.toString(),
      tokenForQuote.address
    );
    console.log("\nExchange rate sample:", JSON.stringify(exchangeRate, null, 2));
  }

  // ============================================================================
  // Run Examples
  // ============================================================================
  
  // Example 1: Sponsored transaction
  await runSponsoredExample(
    client,
    account,
    relayerUrl,
    thirdwebSecret,
    chainId,
    authorizationList
  );

  // Example 2: ERC20 payment (if tokens available)
  if (tokenForQuote) {
    await runErc20PaymentExample(
      client,
      account,
      relayerUrl,
      thirdwebSecret,
      chainId,
      chain,
      tokenForQuote,
      chainCapabilities.feeCollector
    );
  } else {
    console.log("\nSkipping ERC20 example - no tokens available");
  }

  // Example 3: Multichain transaction
  await runMultichainExample(
    client,
    account,
    relayerUrl,
    thirdwebSecret,
    nonce
  );

  console.log("\n" + "=".repeat(70));
  console.log("Demo Complete!");
  console.log("=".repeat(70));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
