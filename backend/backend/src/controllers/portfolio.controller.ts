/**
 * Portfolio Controller
 *
 * This controller handles portfolio-related API requests.
 */

import type { Request, Response } from "express"
import { PortfolioService } from "../services/portfolio.service"
import { validateSolanaAddress } from "../utils/validators"

export class PortfolioController {
  private portfolioService: PortfolioService

  constructor() {
    this.portfolioService = new PortfolioService()
  }

  /**
   * Get portfolio for a wallet address
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      const portfolio = await this.portfolioService.getPortfolio(walletAddress)
      res.status(200).json(portfolio)
    } catch (error) {
      console.error("Error in getPortfolio:", error)
      res.status(500).json({ error: "Failed to fetch portfolio" })
    }
  }

  /**
   * Get dust tokens for a wallet address
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getDustTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params
      const minValueUsd = req.query.minValueUsd ? Number.parseFloat(req.query.minValueUsd as string) : 1.0

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      const dustTokens = await this.portfolioService.getDustTokens(walletAddress, minValueUsd)
      res.status(200).json(dustTokens)
    } catch (error) {
      console.error("Error in getDustTokens:", error)
      res.status(500).json({ error: "Failed to fetch dust tokens" })
    }
  }

  /**
   * Get specific token details for a wallet address
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getTokenDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, tokenMint } = req.params

      // Validate wallet address and token mint
      if (!validateSolanaAddress(walletAddress) || !validateSolanaAddress(tokenMint)) {
        res.status(400).json({ error: "Invalid Solana address" })
        return
      }

      const tokenDetails = await this.portfolioService.getTokenDetails(walletAddress, tokenMint)

      if (!tokenDetails) {
        res.status(404).json({ error: "Token not found in wallet" })
        return
      }

      res.status(200).json(tokenDetails)
    } catch (error) {
      console.error("Error in getTokenDetails:", error)
      res.status(500).json({ error: "Failed to fetch token details" })
    }
  }
}
