/**
 * Connection Utility
 *
 * This file provides utilities for connecting to the Solana network.
 */

import { Connection, type Commitment } from "@solana/web3.js"
import dotenv from "dotenv"

dotenv.config()

// Default RPC URL
const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com"

// Connection singleton
let connection: Connection | null = null

/**
 * Get Solana connection
 *
 * @param commitment - The commitment level
 * @returns The Solana connection
 */
export function getSolanaConnection(commitment: Commitment = "confirmed"): Connection {
  if (!connection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL
    connection = new Connection(rpcUrl, commitment)
  }

  return connection
}
