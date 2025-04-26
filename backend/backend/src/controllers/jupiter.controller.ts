/**
 * Jupiter Controller
 *
 * This controller handles Jupiter-related API requests.
 */

import type { Request, Response } from "express"
import { JupiterService } from "../services/jupiter.service"
import { validateSolanaAddress } from "../utils/validators"

export class JupiterController {
  private jupiterService: JupiterService

  constructor() {
    this.jupiterService = new JupiterService()
  }

  /**
   * Get a quote from Jupiter
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inputMint, outputMint, amount, slippageBps } = req.query

      // Validate parameters
      if (!inputMint || !outputMint || !amount) {
        res.status(400).json({ error: "Input mint, output mint, and amount are required" })
        return
      }

      // Validate addresses
      if (!validateSolanaAddress(inputMint as string) || !validateSolanaAddress(outputMint as string)) {
        res.status(400).json({ error: "Invalid token mint address" })
        return
      }

      const quote = await this.jupiterService.getQuote({
        inputMint: inputMint as string,
        outputMint: outputMint as string,
        amount: amount as string,
        slippageBps: slippageBps ? Number.parseInt(slippageBps as string) : 50,
      })

      res.status(200).json(quote)
    } catch (error) {
      console.error("Error in getQuote:", error)
      res.status(500).json({ error: "Failed to get Jupiter quote" })
    }
  }

  /**
   * Create a swap transaction
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  createSwapTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, inputMint, outputMint, amount, slippageBps } = req.body

      // Validate parameters
      if (!walletAddress || !inputMint || !outputMint || !amount) {
        res.status(400).json({ error: "Wallet address, input mint, output mint, and amount are required" })
        return
      }

      // Validate addresses
      if (
        !validateSolanaAddress(walletAddress) ||
        !validateSolanaAddress(inputMint) ||
        !validateSolanaAddress(outputMint)
      ) {
        res.status(400).json({ error: "Invalid Solana address" })
        return
      }

      const transaction = await this.jupiterService.createSwapTransaction({
        walletAddress,
        inputMint,
        outputMint,
        amount,
        slippageBps: slippageBps || 50,
      })

      res.status(200).json({ transaction })
    } catch (error) {
      console.error("Error in createSwapTransaction:", error)
      res.status(500).json({ error: "Failed to create swap transaction" })
    }
  }

  /**
   * Create a batch swap transaction
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  createBatchSwapTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, tokenMints, targetMint, slippageBps } = req.body

      // Validate parameters
      if (!walletAddress || !tokenMints || !targetMint) {
        res.status(400).json({ error: "Wallet address, token mints, and target mint are required" })
        return
      }

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      // Validate token mints
      if (!Array.isArray(tokenMints) || tokenMints.length === 0) {
        res.status(400).json({ error: "Token mints must be a non-empty array" })
        return
      }

      // Validate target mint
      if (!validateSolanaAddress(targetMint)) {
        res.status(400).json({ error: "Invalid target mint address" })
        return
      }

      const transaction = await this.jupiterService.createBatchSwapTransaction({
        walletAddress,
        tokenMints,
        targetMint,
        slippageBps: slippageBps || 50,
      })

      res.status(200).json({ transaction })
    } catch (error) {
      console.error("Error in createBatchSwapTransaction:", error)
      res.status(500).json({ error: "Failed to create batch swap transaction" })
    }
  }
}
