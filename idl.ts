

export type SafeVault = {
  "version": "0.1.0",
  "name": "safe_vault",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "borrow",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount_to_borrow", "type": "u64" }]
    },
    {
      "name": "repay",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ],
  "accounts": [
    {
      "name": "UserAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "depositedAmount", "type": "u64" },
          { "name": "borrowedAmount", "type": "u64" }
        ]
      }
    }
  ]
};

export const IDL: SafeVault = {
  "version": "0.1.0",
  "name": "safe_vault",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "borrow",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount_to_borrow", "type": "u64" }]
    },
    {
      "name": "repay",
      "accounts": [
        { "name": "vaultAccount", "isMut": true, "isSigner": false },
        { "name": "userAccount", "isMut": true, "isSigner": false },
        { "name": "vaultTokenAccount", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ],
  "accounts": [
    {
      "name": "UserAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "depositedAmount", "type": "u64" },
          { "name": "borrowedAmount", "type": "u64" }
        ]
      }
    }
  ]
};