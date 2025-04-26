/**
 * Validators Utility
 *
 * This file provides validation utilities.
 */

import { PublicKey } from "@solana/web3.js"

/**
 * Validate Solana address
 *
 * @param address - The address to validate
 * @returns Whether the address is valid
 */
export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Validate transaction signature
 *
 * @param signature - The signature to validate
 * @returns Whether the signature is valid
 */
export function validateTransactionSignature(signature: string): boolean {
  // Transaction signatures are 88 characters long and base58 encoded
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/
  return base58Regex.test(signature)
}
