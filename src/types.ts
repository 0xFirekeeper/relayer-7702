/**
 * Type definitions for the Thirdweb 7702 Relayer API
 */

// JSON-RPC base types
export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
};

export type RelayerResult<T> = {
  result?: T;
  error?: { code: number; message: string };
};

// Relayer API response types
export type CapabilitiesResponse = Record<
  string,
  {
    feeCollector: string;
    tokens: Array<{ address: string; symbol?: string; decimals: number }>;
  }
>;

export type ExchangeRateError = { error: { id: string; message: string } };

export type ExchangeRateQuote = {
  chainId: string;
  rate: string;
  minFee?: string;
  token: {
    address: string;
    decimals: number;
    symbol?: string;
    name?: string;
  };
  gasPrice: string;
  expiry: number;
  context?: unknown;
};

export type ExchangeRateEntry = ExchangeRateQuote | ExchangeRateError;

export type RelayerStatusEntry =
  | {
      chainId: string;
      createdAt: number;
      status: number;
      hash?: string;
      receipt?: {
        blockHash: string;
        blockNumber: string;
        transactionHash: string;
        logs?: Array<{
          address: string;
          topics: string[];
          data: string;
        }>;
      };
      reason?: string;
      data?: unknown;
    }
  | {
      error: {
        id: string;
        message: string;
      };
    };

// EIP-7702 authorization tuple type
export type AuthorizationTuple = [
  number,
  string,
  string,
  number,
  `0x${string}`,
  `0x${string}`
];

// WrappedCalls structure for executeWithSig
export type Call = {
  target: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
};

export type WrappedCalls = {
  uid: `0x${string}`;
  calls: Call[];
};
