import { cookieStorage, createStorage } from "wagmi"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { mainnet, arbitrum, solana } from "@reown/appkit/networks"

export const projectId = process.env.VITE_PUBLIC_ID as string

if (!projectId) {
  throw new Error("Project is not defined in .env file.")
}

export const networks = [mainnet, arbitrum, solana]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  networks,
  projectId,
})

export const config = wagmiAdapter.wagmiConfig
