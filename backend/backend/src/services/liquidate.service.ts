/**
 * Liquidate Service
 *
 * This service handles liquidation-related business logic.
 */

import { type Connection, PublicKey, Transaction } from "@solana/web3.js"
import { JupiterService } from "./jupiter.service"
import { WormholeService } from "./wormhole.service"
import { PortfolioService } from "./portfolio.service"
import type { LiquidateOptions, BridgeOptions, SimulationResult } from "../models/liquidate.model"
import { getSolanaConnection } from "../utils/connection"
import { createPorgBatchLiquidateInstruction } from "../utils/program-instructions"

export class LiquidateService {
  private connection: Connection
  private jupiterService: JupiterService
  private wormholeService: WormholeService
  private portfolioService: PortfolioService

  constructor() {
    this.connection = getSolanaConnection()
    this.jupiterService = new JupiterService()
    this.wormholeService = new WormholeService()
    this.portfolioService = new PortfolioService()
  }

  /**
   * Create a liquidation transaction
   *
   * @param walletAddress - The wallet address to create the transaction for
   * @param options - The liquidation options
   * @returns The serialized transaction
   */
  async createLiquidateTransaction(walletAddress: string, options: LiquidateOptions): Promise<string> {
    try {
      const publicKey = new PublicKey(walletAddress)

      // Get portfolio to find tokens to liquidate
      const portfolio = await this.portfolioService.getPortfolio(walletAddress)

      // Filter tokens based on options
      const tokensToLiquidate = portfolio.tokens.filter((token) => {
        // Skip the target token
        if (token.mint === options.targetToken) return false

        // Skip dust tokens if not including dust
        if (!options.includeDust && token.value < (options.minTokenValueUsd || 1.0)) return false

        return true
      })

      if (tokensToLiquidate.length === 0) {
        throw new Error("No tokens to liquidate")
      }

      // Create a new transaction
      const transaction = new Transaction()

      // Get Jupiter swap routes for each token
      const jupiterRoutes = []
      const jupiterInstructions = []

      for (const token of tokensToLiquidate) {
        const swapTransaction = await this.jupiterService.createSwapTransaction({
          walletAddress,
          inputMint: token.mint,
          outputMint: options.targetToken,
          amount: (token.balance * Math.pow(10, token.decimals)).toString(),
          slippageBps: options.slippageBps || 50,
        })

        jupiterRoutes.push(swapTransaction.route)
        jupiterInstructions.push(...swapTransaction.instructions)
      }

      // Add Jupiter swap instructions to transaction
      for (const instruction of jupiterInstructions) {
        transaction.add(instruction)
      }

      // Find target token account
      const targetTokenAccount = await this.jupiterService.findTokenAccount(
        publicKey,
        new PublicKey(options.targetToken),
      )

      // Get fee account
      const feeAccount = await this.jupiterService.getFeeAccount(options.targetToken)

      // Create batch liquidate instruction
      const batchLiquidateInstruction = await createPorgBatchLiquidateInstruction(
        publicKey,
        targetTokenAccount,
        feeAccount,
        new PublicKey(options.targetToken),
        options.includeDust,
        options.minTokenValueUsd || 1.0,
        jupiterRoutes,
      )

      // Add batch liquidate instruction to transaction
      transaction.add(batchLiquidateInstruction)

      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
      transaction.feePayer = publicKey

      // Serialize transaction
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString("base64")

      return serializedTransaction
    } catch (error) {
      console.error("Error in createLiquidateTransaction:", error)
      throw new Error("Failed to create liquidation transaction")
    }
  }

  /**
   * Simulate a liquidation transaction
   *
   * @param walletAddress - The wallet address to simulate the transaction for
   * @param options - The liquidation options
   * @returns The simulation result
   */
  async simulateLiquidation(walletAddress: string, options: LiquidateOptions): Promise<SimulationResult> {
    try {
      const portfolio = await this.portfolioService.getPortfolio(walletAddress)

      // Filter tokens based on options
      const tokensToLiquidate = portfolio.tokens.filter((token) => {
        // Skip the target token
        if (token.mint === options.targetToken) return false

        // Skip dust tokens if not including dust
        if (!options.includeDust && token.value < (options.minTokenValueUsd || 1.0)) return false

        return true
      })

      // Calculate total input value
      const totalInputValue = tokensToLiquidate.reduce((sum, token) => sum + token.value, 0)

      // Get quotes for each token
      const quotes = []
      let totalOutputAmount = 0
      let totalFees = 0

      for (const token of tokensToLiquidate) {
        const quote = await this.jupiterService.getQuote({
          inputMint: token.mint,
          outputMint: options.targetToken,
          amount: (token.balance * Math.pow(10, token.decimals)).toString(),
          slippageBps: options.slippageBps || 50,
        })

        quotes.push(quote)
        totalOutputAmount += Number.parseFloat(quote.outAmount) / Math.pow(10, quote.outputDecimals)
        totalFees += Number.parseFloat(quote.feeAmount) / Math.pow(10, quote.outputDecimals)
      }

      // Calculate Porg fee (1%)
      const porgFee = totalOutputAmount * 0.01

      // Calculate final output amount
      const finalOutputAmount = totalOutputAmount - porgFee

      return {
        inputTokens: tokensToLiquidate,
        totalInputValue,
        targetToken: options.targetToken,
        totalOutputAmount,
        jupiterFees: totalFees,
        porgFee,
        finalOutputAmount,
        quotes,
      }
    } catch (error) {
      console.error("Error in simulateLiquidation:", error)
      throw new Error("Failed to simulate liquidation")
    }
  }

  /**
   * Create a liquidation transaction with bridging
   *
   * @param walletAddress - The wallet address to create the transaction for
   * @param options - The liquidation options
   * @param bridgeOptions - The bridge options
   * @returns The serialized transaction
   */
  async createLiquidateWithBridgeTransaction(
    walletAddress: string,
    options: LiquidateOptions,
    bridgeOptions: BridgeOptions,
  ): Promise<string> {
    try {
      // First create the liquidation transaction
      const liquidateTransaction = await this.createLiquidateTransaction(walletAddress, options)

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(liquidateTransaction, "base64"))

      // Create bridge transaction
      const bridgeTransaction = await this.wormholeService.createBridgeTransaction({
        walletAddress,
        tokenMint: options.targetToken,
        amount: "0", // This will be updated after liquidation
        targetChain: bridgeOptions.targetChain,
        recipientAddress: bridgeOptions.recipientAddress,
      })

      // Add bridge instructions to transaction
      for (const instruction of bridgeTransaction.instructions) {
        transaction.add(instruction)
      }

      // Serialize the combined transaction
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString("base64")

      return serializedTransaction
    } catch (error) {
      console.error("Error in createLiquidateWithBridgeTransaction:", error)
      throw new Error("Failed to create liquidation with bridge transaction")
    }
  }
}
