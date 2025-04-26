/**
 * Transaction Service
 *
 * This service handles transaction-related business logic.
 */

import { type Connection, PublicKey } from "@solana/web3.js"
import { type TransactionHistory, type TransactionDetails, TransactionType } from "../models/transaction.model"
import { getSolanaConnection } from "../utils/connection"
import { isPorgTransaction, parsePorgTransaction } from "../utils/transaction-parser"
import { supabase } from "../index"

export class TransactionService {
  private connection: Connection

  constructor() {
    this.connection = getSolanaConnection()
  }

  /**
   * Get transaction history for a wallet address
   *
   * @param walletAddress - The wallet address to get transaction history for
   * @param limit - The maximum number of transactions to return
   * @param before - The signature to start from (for pagination)
   * @returns The transaction history
   */
  async getTransactionHistory(walletAddress: string, limit = 10, before?: string): Promise<TransactionHistory> {
    try {
      // First check if we have the transaction in our database
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (before) {
        // Get the timestamp of the 'before' transaction
        const { data: beforeTx } = await supabase
          .from("transactions")
          .select("created_at")
          .eq("signature", before)
          .single()

        if (beforeTx) {
          query = query.lt("created_at", beforeTx.created_at)
        }
      }

      const { data: dbTransactions, error } = await query

      if (error) {
        console.error("Error fetching transactions from database:", error)
        throw new Error("Failed to fetch transaction history from database")
      }

      // If we have enough transactions in the database, return them
      if (dbTransactions && dbTransactions.length >= limit) {
        const transactions = dbTransactions.map((tx) => this.mapDbTransactionToTransactionDetails(tx))
        return {
          transactions,
          hasMore: transactions.length === limit,
        }
      }

      // Otherwise, fetch from Solana
      const publicKey = new PublicKey(walletAddress)

      // Get signatures for the wallet
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit,
        before: before ? new PublicKey(before) : undefined,
      })

      // Get transaction details for each signature
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const txDetails = await this.getTransactionDetails(sig.signature)

          // Save transaction to database if it's a Porg transaction
          if (txDetails && txDetails.type !== TransactionType.UNKNOWN) {
            await this.saveTransactionToDb(txDetails, walletAddress)
          }

          return txDetails
        }),
      )

      // Filter out null transactions and only include Porg transactions
      const porgTransactions = transactions.filter(
        (tx) => tx !== null && tx.type !== TransactionType.UNKNOWN,
      ) as TransactionDetails[]

      return {
        transactions: porgTransactions,
        hasMore: signatures.length === limit,
      }
    } catch (error) {
      console.error("Error in getTransactionHistory:", error)
      throw new Error("Failed to get transaction history")
    }
  }

  /**
   * Get transaction details
   *
   * @param transactionId - The transaction ID (signature)
   * @returns The transaction details or null if not found
   */
  async getTransactionDetails(transactionId: string): Promise<TransactionDetails | null> {
    try {
      // First check if we have the transaction in our database
      const { data: dbTransaction, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("signature", transactionId)
        .single()

      if (dbTransaction && !error) {
        return this.mapDbTransactionToTransactionDetails(dbTransaction)
      }

      // If not in database, fetch from Solana
      const transaction = await this.connection.getTransaction(transactionId, {
        maxSupportedTransactionVersion: 0,
      })

      if (!transaction) {
        return null
      }

      // Check if it's a Porg transaction
      if (!isPorgTransaction(transaction)) {
        return {
          id: transactionId,
          type: TransactionType.UNKNOWN,
          timestamp: new Date(transaction.blockTime! * 1000).toISOString(),
          status: transaction.meta?.err ? "failed" : "confirmed",
          fee: transaction.meta?.fee || 0,
        }
      }

      // Parse Porg transaction
      const parsedTransaction = parsePorgTransaction(transaction)

      const txDetails = {
        id: transactionId,
        ...parsedTransaction,
        timestamp: new Date(transaction.blockTime! * 1000).toISOString(),
        status: transaction.meta?.err ? "failed" : "confirmed",
        fee: transaction.meta?.fee || 0,
      }

      // Save transaction to database
      const walletAddress = transaction.transaction.message.accountKeys[0].toString()
      await this.saveTransactionToDb(txDetails, walletAddress)

      return txDetails
    } catch (error) {
      console.error("Error in getTransactionDetails:", error)
      throw new Error("Failed to get transaction details")
    }
  }

  /**
   * Save transaction to database
   *
   * @param transaction - The transaction details
   * @param walletAddress - The wallet address
   */
  private async saveTransactionToDb(transaction: TransactionDetails, walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase.from("transactions").upsert({
        signature: transaction.id,
        wallet_address: walletAddress,
        type: transaction.type,
        status: transaction.status,
        fee: transaction.fee,
        timestamp: transaction.timestamp,
        input_tokens: transaction.inputTokens || null,
        output_token: transaction.outputToken || null,
        bridge_details: transaction.bridgeDetails || null,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving transaction to database:", error)
      }
    } catch (error) {
      console.error("Error in saveTransactionToDb:", error)
    }
  }

  /**
   * Map database transaction to TransactionDetails
   *
   * @param dbTransaction - The database transaction
   * @returns The transaction details
   */
  private mapDbTransactionToTransactionDetails(dbTransaction: any): TransactionDetails {
    return {
      id: dbTransaction.signature,
      type: dbTransaction.type,
      timestamp: dbTransaction.timestamp,
      status: dbTransaction.status,
      fee: dbTransaction.fee,
      inputTokens: dbTransaction.input_tokens,
      outputToken: dbTransaction.output_token,
      bridgeDetails: dbTransaction.bridge_details,
    }
  }
}
