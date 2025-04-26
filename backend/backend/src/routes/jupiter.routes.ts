/**
 * Jupiter Routes
 *
 * This file defines the API routes for Jupiter-related operations.
 */

import { Router } from "express"
import { JupiterController } from "../controllers/jupiter.controller"

const router = Router()
const jupiterController = new JupiterController()

/**
 * @route GET /api/jupiter/quote
 * @desc Get a quote from Jupiter
 * @access Public
 */
router.get("/quote", jupiterController.getQuote)

/**
 * @route POST /api/jupiter/swap
 * @desc Create a swap transaction
 * @access Public
 */
router.post("/swap", jupiterController.createSwapTransaction)

/**
 * @route POST /api/jupiter/batch-swap
 * @desc Create a batch swap transaction
 * @access Public
 */
router.post("/batch-swap", jupiterController.createBatchSwapTransaction)

export { router as jupiterRoutes }
