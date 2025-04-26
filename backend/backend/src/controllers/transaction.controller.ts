/**
 * Transaction Controller
 *
 * This controller handles transaction-related API requests.
 */

import type { Request, Response } from "express"
import { TransactionService } from "../services/transaction.service"
import { validateSolanaAddress, validateTransactionSignature } from "../utils/validators"

export class TransactionController {
  private transactionService: TransactionService

  constructor() {
    this.transactionService = new TransactionService()
  }

  /**
   * Get transaction history for a wallet address
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 10
      const before = req.query.before as string

      // Validate wallet address
      if (!validateSolanaAddress(walletAddress)) {
        res.status(400).json({ error: "Invalid Solana wallet address" })
        return
      }

      // Validate before signature if provided
      if (before && !validateTransactionSignature(before)) {
        res.status(400).json({ error: "Invalid transaction signature" })
        return
      }

      const transactions = await this.transactionService.getTransactionHistory(walletAddress, limit, before)
      res.status(200).json(transactions)
    } catch (error) {
      console.error("Error in getTransactionHistory:", error)
      res.status(500).json({ error: "Failed to fetch transaction history" })
    }
  }

  /**
   * Get transaction details
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  getTransactionDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params

      // Validate transaction signature
      if (!validateTransactionSignature(transactionId)) {
        res.status(400).json({ error: "Invalid transaction signature" })
        return
      }

      const transactionDetails = await this.transactionService.getTransactionDetails(transactionId)

      if (!transactionDetails) {
        res.status(404).json({ error: "Transaction not found" })
        return
      }

      res.status(200).json(transactionDetails)
    } catch (error) {
      console.error("Error in getTransactionDetails:", error)
      res.status(500).json({ error: "Failed to fetch transaction details" })
    }
  }
}
