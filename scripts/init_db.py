#!/usr/bin/env python3
"""
Initialize Neon database with tables and sample data.
Run this after creating your Neon project.

Usage:
    export DATABASE_URL="postgresql://..."
    python scripts/init_db.py
"""

import os
import psycopg2
from datetime import datetime, timedelta
import random


def init_database():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        print("Please run: export DATABASE_URL='postgresql://...'")
        return False

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        # Create tables
        print("Creating tables...")

        cursor.execute("""
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
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_prices(symbol)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_prices(date)
        """)

        cursor.execute("""
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
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS market_metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        print("✓ Tables created successfully")

        # Insert sample data for a few stocks
        print("Inserting sample data...")

        sample_stocks = ["NABIL", "NMB", "NIC", "SCB", "GBL"]
        base_prices = {"NABIL": 500, "NMB": 280, "NIC": 400, "SCB": 370, "GBL": 300}

        today = datetime.now()

        for symbol in sample_stocks:
            base_price = base_prices.get(symbol, 300)

            # Generate 90 days of historical data
            for i in range(90):
                date = today - timedelta(days=90 - i)
                date_str = date.strftime("%Y-%m-%d")

                # Random price variation
                variation = random.uniform(-0.03, 0.03)
                close = base_price * (1 + variation)
                base_price = close  # Next day starts from this close

                open_price = close * random.uniform(0.98, 1.02)
                high = max(open_price, close) * random.uniform(1.0, 1.03)
                low = min(open_price, close) * random.uniform(0.97, 1.0)
                volume = random.randint(50000, 500000)

                cursor.execute(
                    """
                    INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (symbol, date) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume
                """,
                    (symbol, date_str, open_price, high, low, close, volume),
                )

                conn.commit()

            print(f"  ✓ {symbol}: 90 days of data")

        # Update metadata
        cursor.execute(
            """
            INSERT INTO market_metadata (key, value)
            VALUES ('last_collection', %s)
            ON CONFLICT (key) DO UPDATE SET value = %s
        """,
            (today.isoformat(), today.isoformat()),
        )

        conn.commit()
        print("✓ Sample data inserted")

        cursor.close()
        conn.close()

        print("\n✅ Database initialization complete!")
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return False


if __name__ == "__main__":
    init_database()
