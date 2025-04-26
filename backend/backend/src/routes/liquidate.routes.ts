/**
 * Liquidate Routes
 *
 * This file defines the API routes for liquidation-related operations.
 */

import { Router } from "express"
import { LiquidateController } from "../controllers/liquidate.controller"

const router = Router()
const liquidateController = new LiquidateController()

/**
 * @route POST /api/liquidate
 * @desc Create a liquidation transaction
 * @access Public
 */
router.post("/", liquidateController.createLiquidateTransaction)

/**
 * @route POST /api/liquidate/simulate
 * @desc Simulate a liquidation transaction
 * @access Public
 */
router.post("/simulate", liquidateController.simulateLiquidation)

/**
 * @route POST /api/liquidate/with-bridge
 * @desc Create a liquidation transaction with bridging
 * @access Public
 */
router.post("/with-bridge", liquidateController.createLiquidateWithBridgeTransaction)

export { router as liquidateRoutes }
