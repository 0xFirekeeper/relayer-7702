# Thirdweb 7702 Relayer Demo

Demo code for integrating with Thirdweb's EIP-7702 relayer. Shows four transaction patterns: sponsored (gasless), ERC20 payment, OKX wallet integration, and multichain execution.

## Quick Start

```bash
# Install
yarn install

# Configure
cp .env.example .env
# Add your WALLET_PRIVATE_KEY and THIRDWEB_SECRET_KEY

# Run
yarn dev
```

## What You'll See

The demo runs four examples in sequence:

1. **Sponsored Transaction** - Relayer pays gas, transaction executes for free
2. **ERC20 Payment** - User pays gas fees in USDC instead of ETH
3. **OKX Wallet with ERC20** - OKX wallet using executeWithRelayer with token payment
4. **Multichain** - Execute transactions on Base Sepolia and Arbitrum Sepolia simultaneously

## Project Structure

```
src/
├── index.ts              # Runs all four examples
├── types.ts              # API type definitions
├── utils.ts              # Signing, encoding, polling helpers
├── minimal-account.ts    # Thirdweb MinimalAccount ABI
├── okx-account.ts        # OKX Account ABI
└── examples/
    ├── sponsored.ts      # Example 1: Gasless tx
    ├── erc20-payment.ts  # Example 2: ERC20 fee payment
    ├── okx.ts            # Example 3: OKX wallet integration
    └── multichain.ts     # Example 4: Cross-chain tx
```

## How It Works

### 1. Sponsored Transactions

```typescript
// User signs transaction off-chain
const signature = await account.signTypedData({ ... });

// Relayer pays gas and submits on-chain
await relayerRequest("relayer_sendTransaction", {
  payment: { type: "sponsored" }
});
```

The relayer covers all gas costs. Great for onboarding or promotional campaigns.

### 2. ERC20 Payment

```typescript
// Get exchange rate from relayer
const rate = await requestExchangeRate(chainId, tokenAddress);

// Calculate fee in token units
const feeAmount = gasEstimate * gasPrice * rate;

// Include token transfer in transaction batch
const calls = [
  { target: tokenAddress, data: encodeTransfer(feeCollector, feeAmount) },
];
```

User pays gas fees in any supported ERC20 token. The relayer provides exchange rates and handles the conversion.

### 3. OKX Wallet Integration

```typescript
// OKX uses executeWithRelayer instead of executeWithSig
const batchedCall = {
  calls: [...],
  nonce: 0n  // OKX uses nonce instead of uid
};

await relayerRequest("relayer_sendTransaction", {
  data: encodeOkxExecuteWithRelayer(batchedCall, validatorData),
  payment: { type: "token", address: tokenAddress }
});
```

OKX wallets use a different execution function but work with the same relayer infrastructure.

### 4. Multichain Execution

```typescript
await relayerRequest("relayer_sendTransactionMultichain", [
  { chainId: "84532", ... },   // Base Sepolia
  { chainId: "421614", ... }   // Arbitrum Sepolia
]);
```

Execute transactions on multiple chains with a single API call. Each chain polls its own relayer endpoint for status.

## Key Concepts

**EIP-7702** - EOAs can temporarily delegate to a smart contract, enabling batched transactions and custom validation logic without deploying a separate wallet contract.

**Authorization Tuples** - Signed permissions that activate the EIP-7702 delegation. One per chain, includes nonce for replay protection.

**WrappedCalls** - Transaction batch format with unique ID to prevent replays. Multiple calls execute atomically.

## Configuration

Required environment variables:

```bash
WALLET_PRIVATE_KEY=0x...           # Your private key for MinimalAccount examples
OKX_WALLET_PRIVATE_KEY=0x...       # Separate private key for OKX wallet example
THIRDWEB_SECRET_KEY=...            # API key from thirdweb.com/dashboard
```

**Note**: OKX example uses a separate wallet to demonstrate the different account type.

Your wallet needs:

- ETH on Base Sepolia for account upgrades
- USDC on Base Sepolia for the ERC20 payment example (optional)

## Relayer API

The demo uses these JSON-RPC methods:

- `relayer_getCapabilities` - List supported tokens and fee collectors
- `relayer_getExchangeRate` - Get token-to-gas exchange rate with expiry
- `relayer_sendTransaction` - Submit signed transaction
- `relayer_sendTransactionMultichain` - Submit transactions across chains
- `relayer_getStatus` - Poll transaction status until confirmed

See `src/types.ts` for full API specifications.

## Troubleshooting

**Transaction stuck at status 110** - Normal, wait for block confirmation. Multichain transactions can take 30-60 seconds.

**"Insufficient Payment" error** - Exchange rate expired or gas price changed. Request a fresh quote.

## Resources

- [Thirdweb Dashboard](https://thirdweb.com/dashboard) - Get your API key
- [EIP-7702 Spec](https://eips.ethereum.org/EIPS/eip-7702) - Technical details

