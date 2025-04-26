/**
 * Program Instructions Utility
 *
 * This file provides utilities for creating program instructions.
 */

import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import type { JupiterQuoteResponse } from "../models/jupiter.model"

// Porg program ID
const PORG_PROGRAM_ID = new PublicKey("Porg111111111111111111111111111111111111111")

/**
 * Create Porg batch liquidate instruction
 *
 * @param user - The user public key
 * @param targetTokenAccount - The target token account public key
 * @param feeAccount - The fee account public key
 * @param targetTokenMint - The target token mint public key
 * @param includeDust - Whether to include dust tokens
 * @param minTokenValueUsd - The minimum token value in USD
 * @param jupiterRoutes - The Jupiter routes
 * @returns The batch liquidate instruction
 */
export async function createPorgBatchLiquidateInstruction(
  user: PublicKey,
  targetTokenAccount: PublicKey,
  feeAccount: PublicKey,
  targetTokenMint: PublicKey,
  includeDust: boolean,
  minTokenValueUsd: number,
  jupiterRoutes: JupiterQuoteResponse[],
): Promise<TransactionInstruction> {
  // Get Porg state account
  const porgStateAccount = await getPorgStateAccount()

  // Calculate minimum output amount
  const minOutputAmount = jupiterRoutes.reduce((sum, route) => sum + BigInt(route.outAmount), BigInt(0))

  // Create the instruction
  return new TransactionInstruction({
    programId: PORG_PROGRAM_ID,
    keys: [
      { pubkey: porgStateAccount, isSigner: false, isWritable: false },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: targetTokenAccount, isSigner: false, isWritable: true },
      { pubkey: feeAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([
      // Instruction index for batch_liquidate
      0,
      // Serialized parameters would go here
    ]),
  })
}

/**
 * Get Porg state account
 *
 * @returns The Porg state account public key
 */
async function getPorgStateAccount(): Promise<PublicKey> {
  // In a real implementation, you would derive this from the program ID
  return new PublicKey("PorgState11111111111111111111111111111111111")
}
