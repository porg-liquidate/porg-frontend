/**
 * Jupiter Model
 *
 * This file defines the Jupiter-related data models.
 */

import type { TransactionInstruction } from "@solana/web3.js"

/**
 * Jupiter quote parameters interface
 */
export interface JupiterQuoteParams {
  /** The input token mint */
  inputMint: string

  /** The output token mint */
  outputMint: string

  /** The amount to swap (in raw units) */
  amount: string

  /** The slippage in basis points (1/100th of a percent) */
  slippageBps?: number

  /** Whether to only use direct routes */
  onlyDirectRoutes?: boolean

  /** Whether to use legacy transaction format */
  asLegacyTransaction?: boolean

  /** The maximum number of accounts to use */
  maxAccounts?: number
}

/**
 * Jupiter quote response interface
 */
export interface JupiterQuoteResponse {
  /** The input token mint */
  inputMint: string

  /** The output token mint */
  outputMint: string

  /** The input amount (in raw units) */
  inAmount: string

  /** The output amount (in raw units) */
  outAmount: string

  /** The minimum output amount (in raw units) */
  otherAmountThreshold: string

  /** The swap mode */
  swapMode: string

  /** The slippage in basis points (1/100th of a percent) */
  slippageBps: number

  /** The price impact percentage */
  priceImpactPct: string

  /** The route plan */
  routePlan: {
    /** The swap information */
    swapInfo: {
      /** The AMM key */
      ammKey: string

      /** The AMM label */
      label: string

      /** The input token mint */
      inputMint: string

      /** The output token mint */
      outputMint: string

      /** The input amount (in raw units) */
      inAmount: string

      /** The output amount (in raw units) */
      outAmount: string

      /** The fee amount (in raw units) */
      feeAmount: string

      /** The fee token mint */
      feeMint: string
    }[]
  }[]

  /** The context slot */
  contextSlot: number

  /** The time taken to compute the quote */
  timeTaken: number

  /** The input token decimals */
  inputDecimals: number

  /** The output token decimals */
  outputDecimals: number

  /** The fee amount (in raw units) */
  feeAmount: string
}

/**
 * Jupiter swap parameters interface
 */
export interface JupiterSwapParams {
  /** The wallet address */
  walletAddress: string

  /** The input token mint */
  inputMint: string

  /** The output token mint */
  outputMint: string

  /** The amount to swap (in raw units) */
  amount: string

  /** The slippage in basis points (1/100th of a percent) */
  slippageBps?: number
}

/**
 * Jupiter swap response interface
 */
export interface JupiterSwapResponse {
  /** The route information */
  route: JupiterQuoteResponse

  /** The transaction instructions */
  instructions: TransactionInstruction[]

  /** The total output amount (in raw units) */
  totalOutputAmount?: string
}

/**
 * Jupiter batch swap parameters interface
 */
export interface JupiterBatchSwapParams {
  /** The wallet address */
  walletAddress: string

  /** The token mints to swap */
  tokenMints: string[]

  /** The target token mint */
  targetMint: string

  /** The slippage in basis points (1/100th of a percent) */
  slippageBps?: number
}
