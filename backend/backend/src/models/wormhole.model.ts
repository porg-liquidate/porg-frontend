/**
 * Wormhole Model
 *
 * This file defines the Wormhole-related data models.
 */

import type { TransactionInstruction } from "@solana/web3.js"

/**
 * Wormhole bridge parameters interface
 */
export interface WormholeBridgeParams {
  /** The wallet address */
  walletAddress: string

  /** The token mint to bridge */
  tokenMint: string

  /** The amount to bridge (in raw units) */
  amount: string

  /** The target chain to bridge to */
  targetChain: string

  /** The recipient address on the target chain */
  recipientAddress: string
}

/**
 * Wormhole bridge response interface
 */
export interface WormholeBridgeResponse {
  /** The transaction instructions */
  instructions: TransactionInstruction[]

  /** The source chain */
  sourceChain: string

  /** The target chain */
  targetChain: string

  /** The token mint */
  tokenMint: string

  /** The amount to bridge (in raw units) */
  amount: string

  /** The recipient address on the target chain */
  recipientAddress: string
}

/**
 * Wormhole supported chain interface
 */
export interface WormholeSupportedChain {
  /** The chain ID */
  id: string

  /** The chain name */
  name: string

  /** The chain ID in Wormhole format */
  chainId: number

  /** The chain logo URL */
  logo: string
}

/**
 * Wormhole bridge fee parameters interface
 */
export interface WormholeBridgeFeeParams {
  /** The source chain */
  sourceChain: string

  /** The target chain */
  targetChain: string

  /** The token mint to bridge */
  tokenMint?: string
}

/**
 * Wormhole bridge fees interface
 */
export interface WormholeBridgeFees {
  /** The source chain */
  sourceChain: string

  /** The target chain */
  targetChain: string

  /** The base fee */
  baseFee: string

  /** The gas estimate */
  gasEstimate: string

  /** The total fee */
  totalFee: string

  /** The USD equivalent of the fee */
  usdEquivalent: string
}
