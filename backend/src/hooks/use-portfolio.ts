"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import type { Portfolio } from "../types/portfolio"

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function usePortfolio() {
  const { publicKey } = useWallet()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!publicKey) {
        setPortfolio(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_URL}/api/portfolio/${publicKey.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio")
        }

        const data = await response.json()
        setPortfolio(data)
      } catch (err) {
        console.error("Error fetching portfolio:", err)
        setError("Failed to load portfolio data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolio()
  }, [publicKey])

  return { portfolio, isLoading, error }
}
