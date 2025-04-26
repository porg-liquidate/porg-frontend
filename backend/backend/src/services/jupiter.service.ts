/**
 * Jupiter Service
 *
 * This service handles Jupiter-related business logic.
 */

import axios from "axios"
import { type Connection, PublicKey, TransactionInstruction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import type {
  JupiterQuoteParams,
  JupiterQuoteResponse,
  JupiterSwapParams,
  JupiterSwapResponse,
  JupiterBatchSwapParams,
} from "../models/jupiter.model"
import { getSolanaConnection } from "../utils/connection"

// Jupiter API URL
const JUPITER_API_URL = "https://quote-api.jup.ag/v6"

export class JupiterService {
  private connection: Connection

  constructor() {
    this.connection = getSolanaConnection()
  }

  /**
   * Get a quote from Jupiter
   *
   * @param params - The quote parameters
   * @returns The quote response
   */
  async getQuote(params: JupiterQuoteParams): Promise<JupiterQuoteResponse> {
    try {
      const response = await axios.get(`${JUPITER_API_URL}/quote`, {
        params: {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          slippageBps: params.slippageBps || 50,
          onlyDirectRoutes: params.onlyDirectRoutes || false,
          asLegacyTransaction: params.asLegacyTransaction || false,
          maxAccounts: params.maxAccounts || 64,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting Jupiter quote:", error)
      throw new Error("Failed to get Jupiter quote")
    }
  }

  /**
   * Create a swap transaction
   *
   * @param params - The swap parameters
   * @returns The swap response
   */
  async createSwapTransaction(params: JupiterSwapParams): Promise<JupiterSwapResponse> {
    try {
      // Get quote first
      const quote = await this.getQuote({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
      })

      // Get swap transaction from Jupiter
      const response = await axios.post(`${JUPITER_API_URL}/swap`, {
        quoteResponse: quote,
        userPublicKey: params.walletAddress,
        wrapAndUnwrapSol: true,
      })

      // Parse the transaction
      const { swapTransaction } = response.data
      const decodedTransaction = Buffer.from(swapTransaction, "base64")

      // Extract instructions
      const instructions = []
      const route = quote

      // In a real implementation, you would parse the transaction to extract instructions
      // For simplicity, we're returning a dummy instruction
      instructions.push(
        new TransactionInstruction({
          programId: new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"),
          keys: [],
          data: Buffer.from([]),
        }),
      )

      return {
        route,
        instructions,
      }
    } catch (error) {
      console.error("Error creating Jupiter swap transaction:", error)
      throw new Error("Failed to create Jupiter swap transaction")
    }
  }

  /**
   * Create a batch swap transaction
   *
   * @param params - The batch swap parameters
   * @returns The swap response
   */
  async createBatchSwapTransaction(params: JupiterBatchSwapParams): Promise<JupiterSwapResponse> {
    try {
      // Get token accounts
      const tokenAccounts = await this.getTokenAccounts(params.walletAddress)

      // Filter token accounts by mints we want to swap
      const accountsToSwap = tokenAccounts.filter(
        (account) => params.tokenMints.includes(account.mint) && account.amount > 0,
      )

      // Get quotes for each token
      const quotes = await Promise.all(
        accountsToSwap.map((account) =>
          this.getQuote({
            inputMint: account.mint,
            outputMint: params.targetMint,
            amount: (account.amount * Math.pow(10, account.decimals)).toString(),
            slippageBps: params.slippageBps,
          }),
        ),
      )

      // Create swap transactions for each quote
      const swapTransactions = await Promise.all(
        quotes.map((quote, index) =>
          this.createSwapTransaction({
            walletAddress: params.walletAddress,
            inputMint: accountsToSwap[index].mint,
            outputMint: params.targetMint,
            amount: (accountsToSwap[index].amount * Math.pow(10, accountsToSwap[index].decimals)).toString(),
            slippageBps: params.slippageBps,
          }),
        ),
      )

      // Combine all instructions
      const allInstructions = swapTransactions.flatMap((tx) => tx.instructions)

      // Calculate total output amount
      const totalOutputAmount = quotes.reduce((sum, quote) => sum + BigInt(quote.outAmount), BigInt(0)).toString()

      return {
        route: quotes[0], // Just use the first quote for simplicity
        instructions: allInstructions,
        totalOutputAmount,
      }
    } catch (error) {
      console.error("Error creating batch swap transaction:", error)
      throw new Error("Failed to create batch swap transaction")
    }
  }

  /**
   * Get token accounts for a wallet
   *
   * @param walletAddress - The wallet address to get token accounts for
   * @returns The token accounts
   */
  async getTokenAccounts(walletAddress: string) {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
        programId: TOKEN_PROGRAM_ID,
      })

      return tokenAccounts.value.map((item) => {
        const tokenAccount = item.account.data.parsed.info
        return {
          mint: tokenAccount.mint,
          address: item.pubkey.toString(),
          amount: tokenAccount.tokenAmount.uiAmount,
          decimals: tokenAccount.tokenAmount.decimals,
        }
      })
    } catch (error) {
      console.error("Error getting token accounts:", error)
      throw new Error("Failed to get token accounts")
    }
  }

  /**
   * Find token account for a specific mint
   *
   * @param owner - The owner public key
   * @param mint - The mint public key
   * @returns The token account public key
   */
  async findTokenAccount(owner: PublicKey, mint: PublicKey): Promise<PublicKey> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(owner, { mint })

      if (tokenAccounts.value.length === 0) {
        throw new Error("Token account not found")
      }

      return tokenAccounts.value[0].pubkey
    } catch (error) {
      console.error("Error finding token account:", error)
      throw new Error("Failed to find token account")
    }
  }

  /**
   * Get fee account for a token
   *
   * @param tokenMint - The token mint
   * @returns The fee account public key
   */
  async getFeeAccount(tokenMint: string): Promise<PublicKey> {
    // In a real implementation, you would get this from your program state
    return new PublicKey("FeeAccount111111111111111111111111111111111")
  }
}
