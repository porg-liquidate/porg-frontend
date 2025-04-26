/**
 * Portfolio Service
 *
 * This service handles portfolio-related business logic.
 */

import { type Connection, PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import type { TokenInfo } from "../models/token.model"
import type { Portfolio } from "../models/portfolio.model"
import { getTokenMetadata } from "../utils/token-metadata"
import { getTokenPrice } from "../utils/price-oracle"
import { getSolanaConnection } from "../utils/connection"
import { supabase } from "../index"

export class PortfolioService {
  private connection: Connection

  constructor() {
    this.connection = getSolanaConnection()
  }

  /**
   * Get portfolio for a wallet address
   *
   * @param walletAddress - The wallet address to get portfolio for
   * @returns The portfolio data
   */
  async getPortfolio(walletAddress: string): Promise<Portfolio> {
    try {
      // Check if we have a recent portfolio in the cache
      const { data: cachedPortfolio, error } = await supabase
        .from("portfolio_cache")
        .select("*")
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // If we have a recent cache (less than 5 minutes old), return it
      if (cachedPortfolio && !error) {
        const cacheTime = new Date(cachedPortfolio.created_at).getTime()
        const now = new Date().getTime()
        const fiveMinutes = 5 * 60 * 1000

        if (now - cacheTime < fiveMinutes) {
          return {
            totalValue: cachedPortfolio.total_value,
            tokens: cachedPortfolio.tokens,
          }
        }
      }

      const publicKey = new PublicKey(walletAddress)

      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })

      // Process token accounts to get balances
      const tokens: TokenInfo[] = []
      let totalValue = 0

      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info
        const mint = parsedInfo.mint
        const balance = parsedInfo.tokenAmount.uiAmount

        if (balance > 0) {
          // Get token metadata and price
          const tokenMetadata = await getTokenMetadata(mint)
          const price = await getTokenPrice(mint)
          const value = price * balance

          tokens.push({
            symbol: tokenMetadata.symbol,
            name: tokenMetadata.name,
            mint,
            decimals: parsedInfo.tokenAmount.decimals,
            balance,
            value,
            percentage: 0, // Will calculate after getting total
            icon: tokenMetadata.icon || "",
          })

          totalValue += value
        }
      }

      // Calculate percentages
      tokens.forEach((token) => {
        token.percentage = totalValue > 0 ? (token.value / totalValue) * 100 : 0
      })

      // Sort by value (highest first)
      tokens.sort((a, b) => b.value - a.value)

      const portfolio = {
        totalValue,
        tokens,
      }

      // Cache the portfolio
      await supabase.from("portfolio_cache").insert({
        wallet_address: walletAddress,
        total_value: totalValue,
        tokens,
        created_at: new Date().toISOString(),
      })

      return portfolio
    } catch (error) {
      console.error("Error in getPortfolio:", error)
      throw new Error("Failed to get portfolio")
    }
  }

  /**
   * Get dust tokens for a wallet address
   *
   * @param walletAddress - The wallet address to get dust tokens for
   * @param minValueUsd - The minimum value in USD to consider a token as dust
   * @returns The dust tokens
   */
  async getDustTokens(walletAddress: string, minValueUsd = 1.0): Promise<TokenInfo[]> {
    try {
      const portfolio = await this.getPortfolio(walletAddress)

      // Filter tokens with value less than minValueUsd
      const dustTokens = portfolio.tokens.filter((token) => token.value < minValueUsd)

      return dustTokens
    } catch (error) {
      console.error("Error in getDustTokens:", error)
      throw new Error("Failed to get dust tokens")
    }
  }

  /**
   * Get specific token details for a wallet address
   *
   * @param walletAddress - The wallet address to get token details for
   * @param tokenMint - The token mint to get details for
   * @returns The token details or null if not found
   */
  async getTokenDetails(walletAddress: string, tokenMint: string): Promise<TokenInfo | null> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const mintPublicKey = new PublicKey(tokenMint)

      // Get token accounts for the specific mint
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, { mint: mintPublicKey })

      if (tokenAccounts.value.length === 0) {
        return null
      }

      const account = tokenAccounts.value[0].account
      const parsedInfo = account.data.parsed.info
      const balance = parsedInfo.tokenAmount.uiAmount

      // Get token metadata and price
      const tokenMetadata = await getTokenMetadata(tokenMint)
      const price = await getTokenPrice(tokenMint)
      const value = price * balance

      return {
        symbol: tokenMetadata.symbol,
        name: tokenMetadata.name,
        mint: tokenMint,
        decimals: parsedInfo.tokenAmount.decimals,
        balance,
        value,
        percentage: 0, // Not relevant for a single token
        icon: tokenMetadata.icon || "",
      }
    } catch (error) {
      console.error("Error in getTokenDetails:", error)
      throw new Error("Failed to get token details")
    }
  }
}
