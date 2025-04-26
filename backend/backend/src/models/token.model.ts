/**
 * Token Model
 *
 * This file defines the token-related data models.
 */

/**
 * Token information interface
 */
export interface TokenInfo {
  /** The token symbol (e.g., SOL, USDC) */
  symbol: string

  /** The token name (e.g., Solana, USD Coin) */
  name: string

  /** The token mint address */
  mint: string

  /** The token decimals */
  decimals: number

  /** The token balance */
  balance: number

  /** The token value in USD */
  value: number

  /** The token percentage of the portfolio */
  percentage: number

  /** The token icon URL */
  icon?: string
}

/**
 * Token metadata interface
 */
export interface TokenMetadata {
  /** The token symbol (e.g., SOL, USDC) */
  symbol: string

  /** The token name (e.g., Solana, USD Coin) */
  name: string

  /** The token icon URL */
  icon?: string

  /** The token decimals */
  decimals: number
}
