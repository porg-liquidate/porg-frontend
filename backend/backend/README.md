# Porg Backend

This is the backend implementation for the Porg application, a one-click liquidation tool for DeFi on Solana.

## Overview

The Porg backend consists of:

1. **Solana Smart Contract (Rust/Anchor)**: Handles batch transactions and token swaps
2. **API Server (Node.js/Express)**: Provides endpoints for the frontend to interact with
3. **Integration with Jupiter**: For optimal token swaps
4. **Integration with Wormhole**: For cross-chain bridging
5. **Supabase PostgreSQL**: For data storage and caching

## Features

- Portfolio scanning: Fetch token balances and metadata
- Liquidation engine: Determine optimal swap routes and batch swaps
- Dust token recovery: Make dust recovery profitable by leveraging Solana's ultra-low fees
- Batch swaps: Convert multiple tokens in a single transaction
- Cross-chain bridging: Bridge consolidated funds to other chains

## Setup Guide

### Prerequisites

- Node.js (v16+)
- Rust and Solana CLI (for smart contract development)
- Supabase account
- PostgreSQL (for local development)

### Smart Contract Setup

1. Install Rust and Solana CLI:
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
   \`\`\`

2. Install Anchor:
   \`\`\`bash
   npm install -g @coral-xyz/anchor-cli
   \`\`\`

3. Build the smart contract:
   \`\`\`bash
   cd backend/program
   anchor build
   \`\`\`

4. Deploy the smart contract:
   \`\`\`bash
   anchor deploy
   \`\`\`

5. Update the `PORG_PROGRAM_ID` in your `.env` file with the deployed program ID.

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).

2. Run the initialization SQL script:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `backend/db/init.sql`
   - Run the script to create all tables and functions

3. Get your Supabase URL and service key from the API settings in your Supabase dashboard.

### Backend Server Setup

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/porg.git
   cd porg/backend
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env` file based on `.env.example`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update the `.env` file with your configuration:
   \`\`\`
   # Server
   PORT=3001
   FRONTEND_URL=http://localhost:3000

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key

   # Solana
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   PORG_PROGRAM_ID=Porg111111111111111111111111111111111111111

   # Fee
   FEE_BASIS_POINTS=100 # 1%
   FEE_ACCOUNT=FeeAccount111111111111111111111111111111111

   # Jupiter
   JUPITER_API_URL=https://quote-api.jup.ag/v6

   # Wormhole
   WORMHOLE_API_URL=https://wormhole-v2-mainnet-api.certus.one
   \`\`\`

5. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

6. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

   For development with hot reloading:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Portfolio

- `GET /api/portfolio/:walletAddress`: Get portfolio for a wallet address
- `GET /api/portfolio/:walletAddress/dust`: Get dust tokens for a wallet address
- `GET /api/portfolio/:walletAddress/token/:tokenMint`: Get specific token details for a wallet address

### Liquidation

- `POST /api/liquidate`: Create a liquidation transaction
- `POST /api/liquidate/simulate`: Simulate a liquidation transaction
- `POST /api/liquidate/with-bridge`: Create a liquidation transaction with bridging

### Jupiter

- `GET /api/jupiter/quote`: Get a quote from Jupiter
- `POST /api/jupiter/swap`: Create a swap transaction
- `POST /api/jupiter/batch-swap`: Create a batch swap transaction

### Wormhole

- `POST /api/wormhole/bridge`: Create a bridge transaction
- `GET /api/wormhole/chains`: Get supported chains
- `GET /api/wormhole/fees`: Get bridge fees

### Transactions

- `GET /api/transactions/:walletAddress`: Get transaction history for a wallet address
- `GET /api/transactions/details/:transactionId`: Get transaction details

## Architecture

The backend follows a modular architecture with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Define data structures
- **Utils**: Provide utility functions

## Database Schema

The database schema consists of the following tables:

- **token_metadata**: Stores information about tokens (symbol, name, icon, decimals)
- **token_prices**: Caches token prices with timestamps
- **portfolio_cache**: Caches user portfolio data to reduce RPC calls
- **transactions**: Stores transaction history for quick retrieval

## Deployment

### Backend Server

1. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

2. Deploy to your preferred hosting provider (e.g., Vercel, Heroku, AWS):
   \`\`\`bash
   # Example for Vercel
   vercel --prod
   \`\`\`

### Smart Contract

1. Deploy to Solana mainnet:
   \`\`\`bash
   anchor deploy --provider.cluster mainnet
   \`\`\`

## License

MIT
