/**
 * Transaction Model
 *
 * This file defines the transaction-related data models.
 */

/**
 * Transaction type enum
 */
export enum TransactionType {
  /** Liquidation transaction */
  LIQUIDATE = "liquidate",

  /** Bridge transaction */
  BRIDGE = "bridge",

  /** Liquidation and bridge transaction */
  LIQUIDATE_AND_BRIDGE = "liquidate_and_bridge",

  /** Unknown transaction type */
  UNKNOWN = "unknown",
}

/**
 * Transaction details interface
 */
export interface TransactionDetails {
  /** The transaction ID (signature) */
  id: string

  /** The transaction type */
  type: TransactionType

  /** The transaction timestamp */
  timestamp: string

  /** The transaction status */
  status: string

  /** The transaction fee */
  fee: number

  /** The input tokens */
  inputTokens?: {
    /** The token mint */
    mint: string

    /** The token symbol */
    symbol: string

    /** The token amount */
    amount: number

    /** The token value in USD */
    valueUsd: number
  }[]

  /** The output token */
  outputToken?: {
    /** The token mint */
    mint: string

    /** The token symbol */
    symbol: string

    /** The token amount */
    amount: number

    /** The token value in USD */
    valueUsd: number
  }

  /** The bridge details */
  bridgeDetails?: {
    /** The source chain */
    sourceChain: string

    /** The target chain */
    targetChain: string

    /** The recipient address on the target chain */
    recipientAddress: string
  }
}

/**
 * Transaction history interface
 */
export interface TransactionHistory {
  /** The transactions */
  transactions: TransactionDetails[]

  /** Whether there are more transactions */
  hasMore: boolean
}
