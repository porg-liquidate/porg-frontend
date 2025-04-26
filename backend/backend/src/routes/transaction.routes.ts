/**
 * Transaction Routes
 *
 * This file defines the API routes for transaction-related operations.
 */

import { Router } from "express"
import { TransactionController } from "../controllers/transaction.controller"

const router = Router()
const transactionController = new TransactionController()

/**
 * @route GET /api/transactions/:walletAddress
 * @desc Get transaction history for a wallet address
 * @access Public
 */
router.get("/:walletAddress", transactionController.getTransactionHistory)

/**
 * @route GET /api/transactions/details/:transactionId
 * @desc Get transaction details
 * @access Public
 */
router.get("/details/:transactionId", transactionController.getTransactionDetails)

export { router as transactionRoutes }
