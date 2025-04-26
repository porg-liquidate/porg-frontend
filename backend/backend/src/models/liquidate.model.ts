/**
 * Liquidate Model
 *
 * This file defines the liquidation-related data models.
 */

import type { TokenInfo } from "./token.model"
import type { JupiterQuoteResponse } from "./jupiter.model"

/**
 * Liquidation options interface
 */
export interface LiquidateOptions {
  /** The target token mint to liquidate into */
  targetToken: string

  /** Whether to include dust tokens */
  includeDust: boolean

  /** The minimum token value in USD to include */
  minTokenValueUsd?: number

  /** The slippage in basis points (1/100th of a percent) */
  slippageBps?: number
}

/**
 * Bridge options interface
 */
export interface BridgeOptions {
  /** The target chain to bridge to */
  targetChain: string

  /** The recipient address on the target chain */
  recipientAddress: string
}

/**
 * Simulation result interface
 */
export interface SimulationResult {
  /** The input tokens to liquidate */
  inputTokens: TokenInfo[]

  /** The total input value in USD */
  totalInputValue: number

  /** The target token mint */
  targetToken: string

  /** The total output amount */
  totalOutputAmount: number

  /** The Jupiter fees */
  jupiterFees: number

  /** The Porg fee */
  porgFee: number

  /** The final output amount after fees */
  finalOutputAmount: number

  /** The Jupiter quotes for each token */
  quotes: JupiterQuoteResponse[]
}
