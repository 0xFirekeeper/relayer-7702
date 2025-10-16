export const THIRDWEB_MINIMAL_ACCOUNT_ADDRESS = "0x3E515544F8d8293B0A353E10Ff3b7ca03b52f35b";

export const THIRDWEB_MINIMAL_ACCOUNT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "allowanceUsage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "period",
        type: "uint64",
      },
    ],
    name: "AllowanceExceeded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4",
      },
    ],
    name: "CallPolicyViolated",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "param",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "refValue",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "condition",
        type: "uint8",
      },
    ],
    name: "ConditionFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actualLength",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedLength",
        type: "uint256",
      },
    ],
    name: "InvalidDataLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "msgSender",
        type: "address",
      },
      {
        internalType: "address",
        name: "thisAddress",
        type: "address",
      },
    ],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lifetimeUsage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "LifetimeUsageExceeded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxValuePerUse",
        type: "uint256",
      },
    ],
    name: "MaxValueExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "NoCallsToExecute",
    type: "error",
  },
  {
    inputs: [],
    name: "SessionExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "SessionExpiresTooSoon",
    type: "error",
  },
  {
    inputs: [],
    name: "SessionZeroSigner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "TransferPolicyViolated",
    type: "error",
  },
  {
    inputs: [],
    name: "UIDAlreadyProcessed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "signer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "executor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "batchSize",
        type: "uint256",
      },
    ],
    name: "Executed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newSigner",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "signer",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isWildcard",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "expiresAt",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "bytes4",
                name: "selector",
                type: "bytes4",
              },
              {
                internalType: "uint256",
                name: "maxValuePerUse",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.LimitType",
                    name: "limitType",
                    type: "uint8",
                  },
                  {
                    internalType: "uint256",
                    name: "limit",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "period",
                    type: "uint256",
                  },
                ],
                internalType: "struct SessionLib.UsageLimit",
                name: "valueLimit",
                type: "tuple",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.Condition",
                    name: "condition",
                    type: "uint8",
                  },
                  {
                    internalType: "uint64",
                    name: "index",
                    type: "uint64",
                  },
                  {
                    internalType: "bytes32",
                    name: "refValue",
                    type: "bytes32",
                  },
                  {
                    components: [
                      {
                        internalType: "enum SessionLib.LimitType",
                        name: "limitType",
                        type: "uint8",
                      },
                      {
                        internalType: "uint256",
                        name: "limit",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "period",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct SessionLib.UsageLimit",
                    name: "limit",
                    type: "tuple",
                  },
                ],
                internalType: "struct SessionLib.Constraint[]",
                name: "constraints",
                type: "tuple[]",
              },
            ],
            internalType: "struct SessionLib.CallSpec[]",
            name: "callPolicies",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "maxValuePerUse",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.LimitType",
                    name: "limitType",
                    type: "uint8",
                  },
                  {
                    internalType: "uint256",
                    name: "limit",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "period",
                    type: "uint256",
                  },
                ],
                internalType: "struct SessionLib.UsageLimit",
                name: "valueLimit",
                type: "tuple",
              },
            ],
            internalType: "struct SessionLib.TransferSpec[]",
            name: "transferPolicies",
            type: "tuple[]",
          },
          {
            internalType: "bytes32",
            name: "uid",
            type: "bytes32",
          },
        ],
        indexed: false,
        internalType: "struct SessionLib.SessionSpec",
        name: "sessionSpec",
        type: "tuple",
      },
    ],
    name: "SessionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "ValueReceived",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "signer",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isWildcard",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "expiresAt",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "bytes4",
                name: "selector",
                type: "bytes4",
              },
              {
                internalType: "uint256",
                name: "maxValuePerUse",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.LimitType",
                    name: "limitType",
                    type: "uint8",
                  },
                  {
                    internalType: "uint256",
                    name: "limit",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "period",
                    type: "uint256",
                  },
                ],
                internalType: "struct SessionLib.UsageLimit",
                name: "valueLimit",
                type: "tuple",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.Condition",
                    name: "condition",
                    type: "uint8",
                  },
                  {
                    internalType: "uint64",
                    name: "index",
                    type: "uint64",
                  },
                  {
                    internalType: "bytes32",
                    name: "refValue",
                    type: "bytes32",
                  },
                  {
                    components: [
                      {
                        internalType: "enum SessionLib.LimitType",
                        name: "limitType",
                        type: "uint8",
                      },
                      {
                        internalType: "uint256",
                        name: "limit",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "period",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct SessionLib.UsageLimit",
                    name: "limit",
                    type: "tuple",
                  },
                ],
                internalType: "struct SessionLib.Constraint[]",
                name: "constraints",
                type: "tuple[]",
              },
            ],
            internalType: "struct SessionLib.CallSpec[]",
            name: "callPolicies",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "maxValuePerUse",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.LimitType",
                    name: "limitType",
                    type: "uint8",
                  },
                  {
                    internalType: "uint256",
                    name: "limit",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "period",
                    type: "uint256",
                  },
                ],
                internalType: "struct SessionLib.UsageLimit",
                name: "valueLimit",
                type: "tuple",
              },
            ],
            internalType: "struct SessionLib.TransferSpec[]",
            name: "transferPolicies",
            type: "tuple[]",
          },
          {
            internalType: "bytes32",
            name: "uid",
            type: "bytes32",
          },
        ],
        internalType: "struct SessionLib.SessionSpec",
        name: "sessionSpec",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "createSessionWithSig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
              {
                internalType: "bytes",
                name: "data",
                type: "bytes",
              },
            ],
            internalType: "struct Call[]",
            name: "calls",
            type: "tuple[]",
          },
          {
            internalType: "bytes32",
            name: "uid",
            type: "bytes32",
          },
        ],
        internalType: "struct WrappedCalls",
        name: "wrappedCalls",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "executeWithSig",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "getCallPoliciesForSigner",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes4",
            name: "selector",
            type: "bytes4",
          },
          {
            internalType: "uint256",
            name: "maxValuePerUse",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "enum SessionLib.LimitType",
                name: "limitType",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "limit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "period",
                type: "uint256",
              },
            ],
            internalType: "struct SessionLib.UsageLimit",
            name: "valueLimit",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "enum SessionLib.Condition",
                name: "condition",
                type: "uint8",
              },
              {
                internalType: "uint64",
                name: "index",
                type: "uint64",
              },
              {
                internalType: "bytes32",
                name: "refValue",
                type: "bytes32",
              },
              {
                components: [
                  {
                    internalType: "enum SessionLib.LimitType",
                    name: "limitType",
                    type: "uint8",
                  },
                  {
                    internalType: "uint256",
                    name: "limit",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "period",
                    type: "uint256",
                  },
                ],
                internalType: "struct SessionLib.UsageLimit",
                name: "limit",
                type: "tuple",
              },
            ],
            internalType: "struct SessionLib.Constraint[]",
            name: "constraints",
            type: "tuple[]",
          },
        ],
        internalType: "struct SessionLib.CallSpec[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "getSessionExpirationForSigner",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "getSessionStateForSigner",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "remaining",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "bytes4",
                name: "selector",
                type: "bytes4",
              },
              {
                internalType: "uint256",
                name: "index",
                type: "uint256",
              },
            ],
            internalType: "struct SessionLib.LimitState[]",
            name: "transferValue",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "remaining",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "bytes4",
                name: "selector",
                type: "bytes4",
              },
              {
                internalType: "uint256",
                name: "index",
                type: "uint256",
              },
            ],
            internalType: "struct SessionLib.LimitState[]",
            name: "callValue",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "remaining",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "target",
                type: "address",
              },
              {
                internalType: "bytes4",
                name: "selector",
                type: "bytes4",
              },
              {
                internalType: "uint256",
                name: "index",
                type: "uint256",
              },
            ],
            internalType: "struct SessionLib.LimitState[]",
            name: "callParams",
            type: "tuple[]",
          },
        ],
        internalType: "struct SessionLib.SessionState",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "getTransferPoliciesForSigner",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "maxValuePerUse",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "enum SessionLib.LimitType",
                name: "limitType",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "limit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "period",
                type: "uint256",
              },
            ],
            internalType: "struct SessionLib.UsageLimit",
            name: "valueLimit",
            type: "tuple",
          },
        ],
        internalType: "struct SessionLib.TransferSpec[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "isValidSignature",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "isWildcardSigner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC1155BatchReceived",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC1155Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

export const THIRDWEB_VERIFYING_PAYMASTER_V6_PARTIAL_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "bytes", name: "initCode", type: "bytes" },
          { internalType: "bytes", name: "callData", type: "bytes" },
          { internalType: "uint256", name: "callGasLimit", type: "uint256" },
          {
            internalType: "uint256",
            name: "verificationGasLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256",
          },
          { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
          {
            internalType: "uint256",
            name: "maxPriorityFeePerGas",
            type: "uint256",
          },
          { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct UserOperation",
        name: "_userOp",
        type: "tuple",
      },
    ],
    name: "getHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;