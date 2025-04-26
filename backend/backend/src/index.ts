/**
 * Porg Backend Server
 *
 * This is the main entry point for the Porg backend server.
 * It initializes the Express app, connects to Supabase,
 * and sets up the API routes.
 */

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { portfolioRoutes } from "./routes/portfolio.routes"
import { liquidateRoutes } from "./routes/liquidate.routes"
import { jupiterRoutes } from "./routes/jupiter.routes"
import { wormholeRoutes } from "./routes/wormhole.routes"
import { transactionRoutes } from "./routes/transaction.routes"

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "https://porg.app"],
    credentials: true,
  }),
)
app.use(express.json())

// Initialize Supabase client
export const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_KEY || "")

// Routes
app.use("/api/portfolio", portfolioRoutes)
app.use("/api/liquidate", liquidateRoutes)
app.use("/api/jupiter", jupiterRoutes)
app.use("/api/wormhole", wormholeRoutes)
app.use("/api/transactions", transactionRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Porg backend server running on port ${PORT}`)
})

export default app
