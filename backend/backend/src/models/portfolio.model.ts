/**
 * Portfolio Model
 *
 * This file defines the portfolio-related data models.
 */

import type { TokenInfo } from "./token.model"

/**
 * Portfolio interface
 */
export interface Portfolio {
  /** The total value of the portfolio in USD */
  totalValue: number

  /** The tokens in the portfolio */
  tokens: TokenInfo[]
}
