export const OKX_ACCOUNT_ADDRESS = "0xb7a972aee9fb89aaa39f9b42c11235a45e34c95f";

export const OKX_ACCOUNT_ABI = [
  {
    type: "function",
    name: "executeWithRelayer",
    inputs: [
      {
        name: "batchedCall",
        type: "tuple",
        components: [
          {
            name: "calls",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "value", type: "uint256" },
              { name: "data", type: "bytes" },
            ],
          },
          { name: "nonce", type: "uint256" },
        ],
      },
      { name: "validatorData", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
