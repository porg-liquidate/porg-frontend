/**
 * Liquidate Controller
 *
 * This controller handles liquidation-related API requests.
 */

import type { Request, Response } from "express"
import { LiquidateService } from "../services/liquidate.service"
import { validateSolanaAddress } from "../utils/validators"

export class LiquidateController {
  private liquidateService: LiquidateService

  constructor() {
    this.liquidateService = new LiquidateService()
  }

  /**
   * Create a liquidation transaction
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  createLiquidateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, options } = req.body

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      // Validate options
      if (!options || !options.targetToken) {
        res.status(400).json({ error: "Target token is required" })
        return
      }

      const transaction = await this.liquidateService.createLiquidateTransaction(walletAddress, options)
      res.status(200).json({ transaction })
    } catch (error) {
      console.error("Error in createLiquidateTransaction:", error)
      res.status(500).json({ error: "Failed to create liquidation transaction" })
    }
  }

  /**
   * Simulate a liquidation transaction
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  simulateLiquidation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, options } = req.body

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      // Validate options
      if (!options || !options.targetToken) {
        res.status(400).json({ error: "Target token is required" })
        return
      }

      const simulation = await this.liquidateService.simulateLiquidation(walletAddress, options)
      res.status(200).json(simulation)
    } catch (error) {
      console.error("Error in simulateLiquidation:", error)
      res.status(500).json({ error: "Failed to simulate liquidation" })
    }
  }

  /**
   * Create a liquidation transaction with bridging
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  createLiquidateWithBridgeTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, options, bridgeOptions } = req.body

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      // Validate options
      if (!options || !options.targetToken) {
        res.status(400).json({ error: "Target token is required" })
        return
      }

      // Validate bridge options
      if (!bridgeOptions || !bridgeOptions.targetChain || !bridgeOptions.recipientAddress) {
        res.status(400).json({ error: "Target chain and recipient address are required for bridging" })
        return
      }

      const transaction = await this.liquidateService.createLiquidateWithBridgeTransaction(
        walletAddress,
        options,
        bridgeOptions,
      )

      res.status(200).json({ transaction })
    } catch (error) {
      console.error("Error in createLiquidateWithBridgeTransaction:", error)
      res.status(500).json({ error: "Failed to create liquidation with bridge transaction" })
    }
  }
}
