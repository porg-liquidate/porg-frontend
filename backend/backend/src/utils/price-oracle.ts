/**
 * Price Oracle Utility
 *
 * This file provides utilities for fetching token prices.
 */

import axios from "axios"
import { supabase } from "../index"

// Cache for token prices
const tokenPriceCache: Record<string, { price: number; timestamp: number }> = {}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

/**
 * Get token price
 *
 * @param mint - The token mint
 * @returns The token price in USD
 */
export async function getTokenPrice(mint: string): Promise<number> {
  // Check in-memory cache first
  const now = Date.now()
  if (tokenPriceCache[mint] && now - tokenPriceCache[mint].timestamp < CACHE_EXPIRATION) {
    return tokenPriceCache[mint].price
  }

  try {
    // Check database cache
    const { data: cachedPrice, error } = await supabase
      .from("token_prices")
      .select("*")
      .eq("mint", mint)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (cachedPrice && !error) {
      const cacheTime = new Date(cachedPrice.updated_at).getTime()

      // If cache is fresh (less than 5 minutes old), use it
      if (now - cacheTime < CACHE_EXPIRATION) {
        // Update in-memory cache
        tokenPriceCache[mint] = {
          price: cachedPrice.price,
          timestamp: now,
        }
        return cachedPrice.price
      }
    }

    // Fetch from price API if not in cache or cache is stale
    const response = await axios.get(`https://price-api.example.com/v1/price/${mint}`)
    const price = response.data.price

    // Cache in database
    await supabase.from("token_prices").upsert({
      mint,
      price,
      updated_at: new Date().toISOString(),
    })

    // Update in-memory cache
    tokenPriceCache[mint] = {
      price,
      timestamp: now,
    }

    return price
  } catch (error) {
    console.error("Error fetching token price:", error)

    // If we have a stale cache, use it rather than returning a default
    if (tokenPriceCache[mint]) {
      return tokenPriceCache[mint].price
    }

    // Return default price if not found
    return 1.0
  }
}
