/**
 * Portfolio Routes
 *
 * This file defines the API routes for portfolio-related operations.
 */

import { Router } from "express"
import { PortfolioController } from "../controllers/portfolio.controller"

const router = Router()
const portfolioController = new PortfolioController()

/**
 * @route GET /api/portfolio/:walletAddress
 * @desc Get portfolio for a wallet address
 * @access Public
 */
router.get("/:walletAddress", portfolioController.getPortfolio)

/**
 * @route GET /api/portfolio/:walletAddress/dust
 * @desc Get dust tokens for a wallet address
 * @access Public
 */
router.get("/:walletAddress/dust", portfolioController.getDustTokens)

/**
 * @route GET /api/portfolio/:walletAddress/token/:tokenMint
 * @desc Get specific token details for a wallet address
 * @access Public
 */
router.get("/:walletAddress/token/:tokenMint", portfolioController.getTokenDetails)

export { router as portfolioRoutes }
