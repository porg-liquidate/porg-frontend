export interface LiquidateOptions {
  targetToken: string
  includeDust: boolean
  minTokenValueUsd?: number
  slippageBps?: number
}

export interface BridgeOptions {
  targetChain: string
  recipientAddress: string
}

export interface SimulationResult {
  inputTokens: any[]
  totalInputValue: number
  targetToken: string
  totalOutputAmount: number
  jupiterFees: number
  porgFee: number
  finalOutputAmount: number
}
