-- Create schema for Porg application
CREATE SCHEMA IF NOT EXISTS porg;

-- Set the search path to use our schema
SET search_path TO porg, public;

-- Token metadata table
CREATE TABLE IF NOT EXISTS token_metadata (
    mint TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    decimals INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Token prices table
CREATE TABLE IF NOT EXISTS token_prices (
    id SERIAL PRIMARY KEY,
    mint TEXT NOT NULL,
    price NUMERIC(20, 8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(mint, updated_at)
);

-- Create index on mint for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_prices_mint ON token_prices(mint);

-- Portfolio cache table
CREATE TABLE IF NOT EXISTS portfolio_cache (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    total_value NUMERIC(20, 8) NOT NULL,
    tokens JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_cache_wallet ON portfolio_cache(wallet_address);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    signature TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    fee NUMERIC(20, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    input_tokens JSONB,
    output_token JSONB,
    bridge_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);

-- Create function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
    -- Delete portfolio cache entries older than 1 day
    DELETE FROM portfolio_cache
    WHERE created_at < NOW() - INTERVAL '1 day';
    
    -- Keep only the most recent 10 price entries per token
    DELETE FROM token_prices
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY mint ORDER BY updated_at DESC) as row_num
            FROM token_prices
        ) t
        WHERE t.row_num > 10
    );
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the cleanup function daily
-- Note: This requires the pg_cron extension to be enabled
-- If you can't use pg_cron, you can run this manually or via an external scheduler
-- COMMENT OUT THIS SECTION IF pg_cron IS NOT AVAILABLE
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_old_cache()');
*/

-- Create RLS policies for security
-- Enable RLS on all tables
ALTER TABLE token_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for token_metadata (public read)
CREATE POLICY token_metadata_select ON token_metadata FOR SELECT USING (true);

-- Create policies for token_prices (public read)
CREATE POLICY token_prices_select ON token_prices FOR SELECT USING (true);

-- Create policies for portfolio_cache (only owner can read their data)
CREATE POLICY portfolio_cache_select ON portfolio_cache 
    FOR SELECT USING (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

-- Create policies for transactions (only owner can read their data)
CREATE POLICY transactions_select ON transactions 
    FOR SELECT USING (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

-- Create policies for service role to insert/update data
CREATE POLICY service_role_all ON token_metadata 
    USING (auth.role() = 'service_role');
    
CREATE POLICY service_role_all ON token_prices 
    USING (auth.role() = 'service_role');
    
CREATE POLICY service_role_all ON portfolio_cache 
    USING (auth.role() = 'service_role');
    
CREATE POLICY service_role_all ON transactions 
    USING (auth.role() = 'service_role');
