/**
 * Wormhole Controller
 *
 * This controller handles Wormhole-related API requests.
 */

import type { Request, Response } from "express"
import { WormholeService } from "../services/wormhole.service"
import { validateSolanaAddress } from "../utils/validators"

export class WormholeController {
  private wormholeService: WormholeService

  constructor() {
    this.wormholeService = new WormholeService()
  }

  /**
   * Create a bridge transaction
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  createBridgeTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, tokenMint, amount, targetChain, recipientAddress } = req.body

      // Validate parameters
      if (!walletAddress || !tokenMint || !amount || !targetChain || !recipientAddress) {
        res.status(400).json({
          error: "Wallet address, token mint, amount, target chain, and recipient address are required",
        })
        return
      }

      // Validate addresses
      if (!validateSolanaAddress(walletAddress) || !validateSolanaAddress(tokenMint)) {
        res.status(400).json({ error: "Invalid Solana address" })
        return
      }

      const transaction = await this.wormholeService.createBridgeTransaction({
        walletAddress,
        tokenMint,
        amount,
        targetChain,
        recipientAddress,
      })

      res.status(200).json({ transaction })
    } catch (error) {
      console.error("Error in createBridgeTransaction:", error)
      res.status(500).json({ error: "Failed to create bridge transaction" })
    }
  }

  /**
   * Get supported chains
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getSupportedChains = async (_req: Request, res: Response): Promise<void> => {
    try {
      const chains = await this.wormholeService.getSupportedChains()
      res.status(200).json(chains)
    } catch (error) {
      console.error("Error in getSupportedChains:", error)
      res.status(500).json({ error: "Failed to get supported chains" })
    }
  }

  /**
   * Get bridge fees
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getBridgeFees = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sourceChain, targetChain, tokenMint } = req.query

      // Validate parameters
      if (!sourceChain || !targetChain) {
        res.status(400).json({ error: "Source chain and target chain are required" })
        return
      }

      // If token mint is provided, validate it
      if (tokenMint && !validateSolanaAddress(tokenMint as string)) {
        res.status(400).json({ error: "Invalid token mint address" })
        return
      }

      const fees = await this.wormholeService.getBridgeFees({
        sourceChain: sourceChain as string,
        targetChain: targetChain as string,
        tokenMint: tokenMint as string,
      })

      res.status(200).json(fees)
    } catch (error) {
      console.error("Error in getBridgeFees:", error)
      res.status(500).json({ error: "Failed to get bridge fees" })
    }
  }
}
