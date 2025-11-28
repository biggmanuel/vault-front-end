# SafeVault Web3 Frontend

A Next.js/React frontend for the SafeVault Solana Anchor program.

## Features
- Connect Solana Wallets (Phantom, Solflare)
- Initialize Vault (Admin)
- Deposit Tokens (User)
- Borrow Tokens (User)
- Real-time Vault & User Balance Updates

## Configuration
The DApp is currently configured for **Devnet**.

### Constants
Key configuration values are located in `utils/constants.ts`:
- **Program ID:** `F6v2QEtfjZLEb2fQMdGRSwM26P1U7jmZiB8RxJ4pZfv9`
- **Mint Address:** `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` (Default test mint)

## Dependencies
This project uses a CDN-based import map for zero-build configuration, compatible with the current environment. Key libraries:
- React 18
- @solana/web3.js
- @coral-xyz/anchor
- Tailwind CSS

## Usage
1. Ensure your wallet is connected to **Devnet**.
2. If the vault is not initialized, use the "Admin Zone" to Initialize it.
3. Airdrop yourself some of the configured Mint tokens (or change `MINT_ADDRESS` in constants to a token you own).
4. Deposit and Borrow assets using the dashboard.
