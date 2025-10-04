# Thirdweb 7702 Relayer Demo

This project contains a single TypeScript script (`index.ts`) that walks through two end-to-end examples of using Thirdweb's 7702 relayer:

- **Sponsored (gasless) execution** – the relayer covers gas and enqueues a transaction for a Minimal Account.
- **ERC20-fee execution** – demonstrates paying the relayer in an ERC20 token (e.g., USDC) using the quoted exchange rate.

It is designed for live demos, with rich logging and inline comments explaining each step so stakeholders can follow along easily.

## Prerequisites

- Node.js 18 or later (matches the Thirdweb SDK requirements)
- An API key created in the [Thirdweb dashboard](https://thirdweb.com/create-api-key)
- A funded wallet on Base Sepolia capable of signing transactions

## Setup

Install dependencies once:

```bash
yarn
```

Create a `.env` file by copying `.env.example` (if provided) or creating a new file with the following values:

```bash
WALLET_PRIVATE_KEY=0x...
THIRDWEB_SECRET_KEY=************************
```

- `THIRDWEB_SECRET_KEY`: API key from the Thirdweb dashboard.
- `WALLET_PRIVATE_KEY`: Private key for the wallet that controls the Minimal Account (keep this secret).

## Running the demo

```bash
yarn start
```

You should see logging that describes:

1. The relayer and chain being targeted (`baseSepolia`).
2. The relayer capabilities and the ERC20 tokens available for payments.
3. A sponsored transaction being submitted and polled until relayed.
4. An ERC20-fee transaction (if a token is available), including pricing, authorization, and status polling.

If an ERC20 token isn't configured, the script will skip the second example gracefully.

## How it works

The script performs the following high-level actions:

1. Loads environment variables and constructs a Thirdweb client & account.
2. Fetches relayer capabilities, including fee tokens and collectors.
3. Signs an authorization for the Minimal Account (EIP-7702 requirement).
4. Sends a wrapped call in sponsored mode and polls `relayer_getStatus` until it finalizes.
5. Obtains an exchange rate quote, computes the ERC20-denominated fee, encodes `transfer(address,uint256)`, and submits a token-based fee transaction.

Each step logs enough context to narrate the flow during a presentation.

## Troubleshooting

- **Missing environment variables:** The script will throw descriptive errors if `WALLET_PRIVATE_KEY` or `THIRDWEB_SECRET_KEY` are not set.
- **Insufficient funds:** Ensure the wallet has enough balance for ERC20 transfers when demonstrating token payments.
- **Rate/Cap changes:** Relayer capabilities can evolve; re-run the capabilities query before presenting to confirm tokens and fee collectors.

## Additional resources

- [Thirdweb portal](https://portal.thirdweb.com)
- [7702 relayer docs](https://hackmd.io/T4TkZYFQQnCupiuW231DYw?view#relayer_getExchangeRate)
- [Support](https://thirdweb.com/support)

