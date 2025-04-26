"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Transaction, Connection } from "@solana/web3.js"
import type { LiquidateOptions, BridgeOptions } from "../types/liquidate"

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function useLiquidate() {
  const { publicKey, signTransaction } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const liquidate = async (options: LiquidateOptions, bridgeOptions?: BridgeOptions) => {
    if (!publicKey || !signTransaction) {
      setError("Wallet not connected")
      return null
    }

    setIsLoading(true)
    setError(null)
    setTxSignature(null)

    try {
      // Create liquidate transaction
      const endpoint = bridgeOptions ? "/api/liquidate/with-bridge" : "/api/liquidate"
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          options,
          ...(bridgeOptions && { bridgeOptions }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create liquidate transaction")
      }

      const { transaction: serializedTransaction } = await response.json()

      // Deserialize transaction
      const transaction = Transaction.from(Buffer.from(serializedTransaction, "base64"))

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Send transaction
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com")

      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // Wait for confirmation
      await connection.confirmTransaction(signature)

      setTxSignature(signature)
      return signature
    } catch (err) {
      console.error("Error liquidating:", err)
      setError(err instanceof Error ? err.message : "Failed to liquidate")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { liquidate, isLoading, error, txSignature }
}
