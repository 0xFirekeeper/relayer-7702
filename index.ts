/**
 * Demo script showcasing Thirdweb's 7702 relayer integrations.
 *
 * Flow outline:
 *  1. Load environment configuration and derive the controlling account.
 *  2. Request relayer capabilities and preview available fee tokens.
 *  3. Execute a "sponsored" (gasless) transaction using the relayer.
 *  4. Execute an ERC20-fee transaction, illustrating token-based fee payment.
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import {
  createThirdwebClient,
  eth_estimateGas,
  eth_getTransactionCount,
  getAddress,
  getRpcClient,
  signAuthorization,
} from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import { padHex, toHex } from "thirdweb/utils";

// Load environment variables from the local .env file if present.
config();

const DEFAULT_CHAIN = baseSepolia;
const DEFAULT_MINIMAL_ACCOUNT =
  "0x3E515544F8d8293B0A353E10Ff3b7ca03b52f35b" as const;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
};

type RelayerResult<T> = {
  result?: T;
  error?: { code: number; message: string };
};

type CapabilitiesResponse = Record<
  string,
  {
    feeCollector: string;
    tokens: Array<{ address: string; symbol: string; decimals: string }>;
  }
>;

type ExchangeRateError = { error: { id: string; message: string } };
type ExchangeRateQuote = {
  quote: {
    rate: number;
    token: {
      address: string;
      decimals: number;
      symbol?: string;
      name?: string;
    };
    minFee?: number;
  };
  chainId: string;
  gasPrice: string;
  feeCollector: string;
  expiry: number;
};
type ExchangeRateEntry = ExchangeRateQuote | ExchangeRateError;

type RelayerStatusEntry =
  | {
      version: string;
      id: string;
      relayedStatus: number;
      receipt: unknown;
      rejected?: { message: string };
      reverted?: { message?: string };
    }
  | {
      error: {
        id: string;
        message: string;
      };
    };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // --- Secrets & configuration ------------------------------------------------
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  const thirdwebSecret = process.env.THIRDWEB_SECRET_KEY;
  if (!walletPrivateKey) {
    throw new Error("Set WALLET_PRIVATE_KEY in your environment");
  }
  if (!thirdwebSecret) {
    throw new Error("Set THIRDWEB_SECRET_KEY in your environment");
  }

  const chain = DEFAULT_CHAIN;
  const chainIdString = chain.id.toString();
  const relayerUrl = `https://${chain.id}.bundler.thirdweb.com/v2`;

  console.log("Using relayer:", relayerUrl);
  console.log("Target chain:", `${chain.name} (${chain.id})`);

  // Build a Thirdweb client and account instance to sign all downstream requests.
  const client = createThirdwebClient({ secretKey: thirdwebSecret });
  const account = privateKeyToAccount({ client, privateKey: walletPrivateKey });
  const eoaAddress = getAddress(account.address);
  console.log("EOA address:", eoaAddress);

  // Fetch the relayer RPC client and the next nonce for the minimal account.
  const rpcClient = getRpcClient({ client, chain });
  const nonceHex = await eth_getTransactionCount(rpcClient, {
    address: eoaAddress,
    blockTag: "pending",
  });
  const nonce = BigInt(nonceHex);

  // Authorize the relayer for the minimal account contract (EIP-7702 boilerplate).
  const authorization = await signAuthorization({
    account,
    request: {
      address: DEFAULT_MINIMAL_ACCOUNT,
      chainId: chain.id,
      nonce,
    },
  });

  const authorizationTuple: [
    number,
    string,
    string,
    number,
    `0x${string}`,
    `0x${string}`
  ] = [
    authorization.chainId,
    authorization.address,
    authorization.nonce.toString(),
    authorization.yParity,
    padHex(toHex(authorization.r), { size: 32 }),
    padHex(toHex(authorization.s), { size: 32 }),
  ];
  const authorizationList = [authorizationTuple];

  // --- Relayer capability discovery ------------------------------------------
  const capabilities = await relayerRequest<CapabilitiesResponse>(
    relayerUrl,
    thirdwebSecret,
    "relayer_getCapabilities",
    []
  );

  const chainCapabilities = capabilities?.[chainIdString];
  if (!chainCapabilities) {
    throw new Error(
      `relayer_getCapabilities did not return config for chain ${chain.id}`
    );
  }

  console.log("Capabilities:");
  console.table(
    chainCapabilities.tokens.map((token) => ({
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
    }))
  );

  const tokenForQuote = chainCapabilities.tokens[0];
  if (tokenForQuote) {
    const exchangeRate = await requestExchangeRate(
      relayerUrl,
      thirdwebSecret,
      chainIdString,
      tokenForQuote.address
    );
    console.log("Exchange rate sample:", JSON.stringify(exchangeRate, null, 2));
  } else {
    console.warn("No ERC20 tokens configured for this chain; skipping quote");
  }

  // --- Example 1: Sponsored (gasless) execution ------------------------------
  const wrappedUid = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const wrappedCalls = {
    uid: wrappedUid,
    calls: [
      {
        target: eoaAddress,
        data: "0x",
        value: "0",
      },
    ],
  };

  const signature = (await account.signTypedData({
    domain: {
      chainId: chain.id,
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
    message: {
      uid: wrappedUid,
      calls: [
        {
          target: eoaAddress,
          data: "0x",
          value: BigInt(0),
        },
      ],
    },
  })) as `0x${string}`;

  const sendResult = await relayerRequest<
    Array<
      |
        {
          chainId: string;
          id: string;
        }
      | {
          error: {
            id: string;
            message: string;
          };
        }
    >
  >(relayerUrl, thirdwebSecret, "relayer_sendTransaction", [
    {
      to: eoaAddress,
      chainId: chainIdString,
      capabilities: {
        payment: {
          type: "sponsored",
        },
      },
      authorizationList,
      data: {
        wrappedCalls,
        signature,
      },
    },
  ]);

  const sendEntry = sendResult?.[0];
  if (!sendEntry || "error" in sendEntry) {
    throw new Error(
      `relayer_sendTransaction failed: ${JSON.stringify(sendEntry, null, 2)}`
    );
  }

  console.log("Enqueued transaction", sendEntry);

  const queueId = sendEntry.id;
  const finalStatus = await pollRelayerStatus(
    relayerUrl,
    thirdwebSecret,
    queueId,
    10
  );

  console.log(
    "Final relayer_getStatus result:",
    JSON.stringify(finalStatus, null, 2)
  );

  // --- Example 2: ERC20 fee payment -----------------------------------------
  if (!tokenForQuote) {
    return;
  }

  console.log("\n--- ERC20 Payment Example ---");
  console.log(`Using token: ${tokenForQuote.symbol} (${tokenForQuote.address})`);

  const exchangeData = await requestExchangeRate(
    relayerUrl,
    thirdwebSecret,
    chainIdString,
    tokenForQuote.address
  );

  if (!exchangeData || "error" in exchangeData) {
    console.warn("Could not get exchange rate, skipping ERC20 example");
    return;
  }

  console.log(`Exchange rate: ${exchangeData.quote.rate}`);
  console.log(`Fee collector: ${exchangeData.feeCollector}`);
  console.log(`Min fee: ${exchangeData.quote.minFee || "N/A"}`);

  // Estimate gas for a no-op call; the relayer uses it to price the fee.
  const estimatedGas = await eth_estimateGas(rpcClient, {
    from: eoaAddress,
    to: eoaAddress,
    data: "0x",
    value: "0x0",
  });
  console.log(`Estimated gas: ${estimatedGas}`);

  // Calculate the ERC20-denominated fee based on the relayer quote.
  const gasPrice = BigInt(exchangeData.gasPrice);
  const gasCostInWei = estimatedGas * gasPrice;
  const rateScaled = BigInt(Math.floor(exchangeData.quote.rate * 1e18));
  const feeInTokenUnits = (gasCostInWei * rateScaled) / BigInt(1e18);

  const tokenDecimals = exchangeData.quote.token.decimals;
  const decimalScalar = Math.pow(10, tokenDecimals);
  const minFeeInTokenUnits = exchangeData.quote.minFee
    ? BigInt(Math.floor(exchangeData.quote.minFee * decimalScalar))
    : BigInt(0);
  const feeAmount = feeInTokenUnits > minFeeInTokenUnits ? feeInTokenUnits : minFeeInTokenUnits;
  const feeAmountDisplay = Number(feeAmount) / decimalScalar;

  console.log(`Fee amount to pay: ${feeAmountDisplay} (${exchangeData.quote.token.symbol})`);

  // Encode ERC20 transfer: transfer(address to, uint256 amount).
  const transferCalldata = encodeErc20Transfer(
    exchangeData.feeCollector,
    feeAmount
  );

  const wrappedUid2 = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const wrappedCalls2 = {
    uid: wrappedUid2,
    calls: [
      {
        target: tokenForQuote.address as `0x${string}`,
        data: transferCalldata,
        value: "0",
      },
    ],
  };

  const signature2 = (await account.signTypedData({
    domain: {
      chainId: chain.id,
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
    message: {
      uid: wrappedUid2,
      calls: [
        {
          target: tokenForQuote.address as `0x${string}`,
          data: transferCalldata,
          value: BigInt(0),
        },
      ],
    },
  })) as `0x${string}`;

  const sendResult2 = await relayerRequest<
    Array<
      |
        {
          chainId: string;
          id: string;
        }
      | {
          error: {
            id: string;
            message: string;
          };
        }
    >
  >(relayerUrl, thirdwebSecret, "relayer_sendTransaction", [
    {
      to: eoaAddress,
      chainId: chainIdString,
      capabilities: {
        payment: {
          type: "erc20",
          token: tokenForQuote.address,
          data: toHex(estimatedGas, { size: 32 }),
        },
      },
      authorizationList: undefined,
      data: {
        wrappedCalls: wrappedCalls2,
        signature: signature2,
      },
    },
  ]);

  const sendEntry2 = sendResult2?.[0];
  if (!sendEntry2 || "error" in sendEntry2) {
    console.error(
      `ERC20 relayer_sendTransaction failed: ${JSON.stringify(sendEntry2, null, 2)}`
    );
    return;
  }

  console.log("Enqueued ERC20 transaction", sendEntry2);

  const finalStatus2 = await pollRelayerStatus(
    relayerUrl,
    thirdwebSecret,
    sendEntry2.id,
    20
  );

  console.log(
    "Final ERC20 relayer_getStatus result:",
    JSON.stringify(finalStatus2, null, 2)
  );
}

async function requestExchangeRate(
  relayerUrl: string,
  thirdwebSecret: string,
  chainId: string,
  tokenAddress: string
): Promise<ExchangeRateEntry | undefined> {
  const response = await relayerRequest<ExchangeRateEntry[]>(
    relayerUrl,
    thirdwebSecret,
    "relayer_getExchangeRate",
    [
      {
        chainId,
        token: tokenAddress,
      },
    ]
  );

  return response?.[0];
}

async function pollRelayerStatus(
  relayerUrl: string,
  thirdwebSecret: string,
  queueId: string,
  attempts: number,
  delayMs = 3_000
) {
  let finalStatus: RelayerStatusEntry | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    await sleep(delayMs);
    const statusResponse = await relayerRequest<RelayerStatusEntry[]>(
      relayerUrl,
      thirdwebSecret,
      "relayer_getStatus",
      {
        ids: [queueId],
      }
    );

    const statusEntry = statusResponse?.[0];
    if (!statusEntry) {
      console.warn("relayer_getStatus returned empty result");
      continue;
    }
    if ("error" in statusEntry) {
      console.warn("relayer_getStatus error:", statusEntry.error);
      finalStatus = statusEntry;
      continue;
    }

    console.log(
      `Status poll #${attempt + 1}: relayedStatus=${statusEntry.relayedStatus}`
    );
    finalStatus = statusEntry;
    if (statusEntry.relayedStatus >= 200) {
      break;
    }
  }

  return finalStatus;
}

function encodeErc20Transfer(to: string, amount: bigint): `0x${string}` {
  const methodSelector = "0xa9059cbb";
  const feeCollectorPadded = to.toLowerCase().replace("0x", "").padStart(64, "0");
  const amountPadded = amount.toString(16).padStart(64, "0");
  return `${methodSelector}${feeCollectorPadded}${amountPadded}` as `0x${string}`;
}

async function relayerRequest<T>(
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

