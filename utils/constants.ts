import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("F6v2QEtfjZLEb2fQMdGRSwM26P1U7jmZiB8RxJ4pZfv9");

// REPLACE WITH YOUR ACTUAL SPL MINT ADDRESS FOR TESTING
// This is the token mint that the vault will accept/lend
export const MINT_ADDRESS = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); 

// Seed constants - these must match your Rust program's seeds
export const VAULT_SEED = "vault";
export const USER_SEED = "user";