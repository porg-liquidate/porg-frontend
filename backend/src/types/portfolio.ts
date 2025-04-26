import type { TokenInfo } from "./token"

export interface Portfolio {
  totalValue: number
  tokens: TokenInfo[]
}
