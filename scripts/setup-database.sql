-- NEPSE Stock Dashboard Database Setup
-- Run this on Neon PostgreSQL to create required tables

-- Stock Prices Table (for historical data)
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Indexes for stock_prices
CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_prices(date);

-- Predictions Table (ML predictions)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    prediction TEXT,
    confidence REAL,
    current_price REAL,
    predicted_price REAL,
    change_percent REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON predictions(symbol);

-- Market Metadata (for tracking collection status)
CREATE TABLE IF NOT EXISTS market_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to market_metadata
DROP TRIGGER IF EXISTS update_market_metadata_updated_at ON market_metadata;
CREATE TRIGGER update_market_metadata_updated_at
    BEFORE UPDATE ON market_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial metadata
INSERT INTO market_metadata (key, value) 
VALUES ('last_collection', NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO market_metadata (key, value)
VALUES ('last_training', NULL)
ON CONFLICT (key) DO NOTHING;

PRINT 'Database setup completed successfully!';
