/**
 * Wormhole Routes
 *
 * This file defines the API routes for Wormhole-related operations.
 */

import { Router } from "express"
import { WormholeController } from "../controllers/wormhole.controller"

const router = Router()
const wormholeController = new WormholeController()

/**
 * @route POST /api/wormhole/bridge
 * @desc Create a bridge transaction
 * @access Public
 */
router.post("/bridge", wormholeController.createBridgeTransaction)

/**
 * @route GET /api/wormhole/chains
 * @desc Get supported chains
 * @access Public
 */
router.get("/chains", wormholeController.getSupportedChains)

/**
 * @route GET /api/wormhole/fees
 * @desc Get bridge fees
 * @access Public
 */
router.get("/fees", wormholeController.getBridgeFees)

export { router as wormholeRoutes }
