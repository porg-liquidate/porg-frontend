/**
 * Token Metadata Utility
 *
 * This file provides utilities for fetching token metadata.
 */

import axios from "axios"
import type { TokenMetadata } from "../models/token.model"
import { supabase } from "../index"

// Cache for token metadata
const tokenMetadataCache: Record<string, TokenMetadata> = {}

/**
 * Get token metadata
 *
 * @param mint - The token mint
 * @returns The token metadata
 */
export async function getTokenMetadata(mint: string): Promise<TokenMetadata> {
  // Check in-memory cache first
  if (tokenMetadataCache[mint]) {
    return tokenMetadataCache[mint]
  }

  try {
    // Check database cache
    const { data: cachedToken, error } = await supabase.from("token_metadata").select("*").eq("mint", mint).single()

    if (cachedToken && !error) {
      const metadata: TokenMetadata = {
        symbol: cachedToken.symbol,
        name: cachedToken.name,
        icon: cachedToken.icon,
        decimals: cachedToken.decimals,
      }

      // Update in-memory cache
      tokenMetadataCache[mint] = metadata
      return metadata
    }

    // Fetch from token registry if not in cache
    const response = await axios.get(`https://token-list-api.solana.com/v1/tokens/${mint}`)

    const metadata: TokenMetadata = {
      symbol: response.data.symbol,
      name: response.data.name,
      icon: response.data.logoURI,
      decimals: response.data.decimals,
    }

    // Cache in database
    await supabase.from("token_metadata").insert({
      mint,
      symbol: metadata.symbol,
      name: metadata.name,
      icon: metadata.icon,
      decimals: metadata.decimals,
      updated_at: new Date().toISOString(),
    })

    // Update in-memory cache
    tokenMetadataCache[mint] = metadata

    return metadata
  } catch (error) {
    // Return default metadata if not found
    const defaultMetadata: TokenMetadata = {
      symbol: "UNKNOWN",
      name: "Unknown Token",
      decimals: 9,
    }

    return defaultMetadata
  }
}
