#!/usr/bin/env python3
"""
Database schema setup for NEPSE Stock Dashboard
Creates all required tables in Neon PostgreSQL
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

DATABASE_URL = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")

SCHEMA_SQL = """
-- Drop existing tables (optional - for clean setup)
-- DROP TABLE IF EXISTS predictions CASCADE;
-- DROP TABLE IF EXISTS stock_prices CASCADE;
-- DROP TABLE IF EXISTS market_metadata CASCADE;
-- DROP TABLE IF EXISTS stocks CASCADE;

-- Stocks metadata table
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT,
    sector TEXT,
    total_units BIGINT,
    paid_up_capital REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock prices historical data
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume BIGINT,
    amount REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Indexes for stock_prices
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);

-- ML predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    prediction TEXT,
    confidence REAL,
    current_price REAL,
    predicted_price REAL,
    change_percent REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Indexes for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(date);

-- Market metadata (indices, summary, etc.)
CREATE TABLE IF NOT EXISTS market_metadata (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Floorsheet data
CREATE TABLE IF NOT EXISTS floorsheet (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    buyer_broker_code TEXT,
    seller_broker_code TEXT,
    quantity BIGINT,
    rate REAL,
    amount REAL,
    contract_no TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for floorsheet
CREATE INDEX IF NOT EXISTS idx_floorsheet_symbol ON floorsheet(symbol);
CREATE INDEX IF NOT EXISTS idx_floorsheet_date ON floorsheet(date);

-- Company fundamentals
CREATE TABLE IF NOT EXISTS company_info (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT,
    sector TEXT,
    market_cap REAL,
    shares_outstanding BIGINT,
    total_paid_up_capital REAL,
    book_close_date TEXT,
    isin TEXT,
    registered_address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for company_info
CREATE INDEX IF NOT EXISTS idx_company_symbol ON company_info(symbol);

-- Data collection log
CREATE TABLE IF NOT EXISTS collection_log (
    id SERIAL PRIMARY KEY,
    collection_type TEXT NOT NULL,
    records_collected INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    duration_seconds REAL,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def create_tables():
    """Create all database tables"""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set!")
        print("Please set NEON_DATABASE_URL or DATABASE_URL in .env")
        return False

    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        print("Creating schema...")
        cur.execute(SCHEMA_SQL)

        print("Verifying tables...")
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cur.fetchall()

        print("\n✅ Tables created successfully:")
        for table in tables:
            print(f"  - {table[0]}")

        cur.close()
        conn.close()
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("NEPSE Database Schema Setup")
    print("=" * 50)

    success = create_tables()

    if success:
        print("\n✅ Schema setup complete!")
    else:
        print("\n❌ Schema setup failed!")
        exit(1)
