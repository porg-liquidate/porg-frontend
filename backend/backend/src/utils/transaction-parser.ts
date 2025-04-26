/**
 * Transaction Parser Utility
 *
 * This file provides utilities for parsing transactions.
 */

import type { ParsedTransactionWithMeta } from "@solana/web3.js"
import { TransactionType } from "../models/transaction.model"

// Porg program ID
const PORG_PROGRAM_ID = "Porg111111111111111111111111111111111111111"

/**
 * Check if a transaction is a Porg transaction
 *
 * @param transaction - The transaction to check
 * @returns Whether the transaction is a Porg transaction
 */
export function isPorgTransaction(transaction: ParsedTransactionWithMeta): boolean {
  // Check if any instruction in the transaction is from the Porg program
  return transaction.transaction.message.instructions.some(
    (instruction) => instruction.programId.toString() === PORG_PROGRAM_ID,
  )
}

/**
 * Parse a Porg transaction
 *
 * @param transaction - The transaction to parse
 * @returns The parsed transaction
 */
export function parsePorgTransaction(transaction: ParsedTransactionWithMeta): {
  type: TransactionType
  inputTokens?: {
    mint: string
    symbol: string
    amount: number
    valueUsd: number
  }[]
  outputToken?: {
    mint: string
    symbol: string
    amount: number
    valueUsd: number
  }
  bridgeDetails?: {
    sourceChain: string
    targetChain: string
    recipientAddress: string
  }
} {
  // In a real implementation, you would parse the transaction to extract details
  // For simplicity, we're returning dummy data

  // Check if it's a bridge transaction
  const isBridge = transaction.transaction.message.instructions.some(
    (instruction) => instruction.programId.toString() === "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
  )

  if (isBridge) {
    return {
      type: TransactionType.LIQUIDATE_AND_BRIDGE,
      inputTokens: [
        {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          amount: 0.5,
          valueUsd: 5.0,
        },
        {
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          symbol: "USDC",
          amount: 2.0,
          valueUsd: 2.0,
        },
      ],
      outputToken: {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        amount: 6.95,
        valueUsd: 6.95,
      },
      bridgeDetails: {
        sourceChain: "solana",
        targetChain: "ethereum",
        recipientAddress: "0x1234567890123456789012345678901234567890",
      },
    }
  } else {
    return {
      type: TransactionType.LIQUIDATE,
      inputTokens: [
        {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          amount: 0.5,
          valueUsd: 5.0,
        },
        {
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          symbol: "USDC",
          amount: 2.0,
          valueUsd: 2.0,
        },
      ],
      outputToken: {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        amount: 6.95,
        valueUsd: 6.95,
      },
    }
  }
}
