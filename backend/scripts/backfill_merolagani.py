#!/usr/bin/env python3
"""
NEPSE Historical Backfill Script
Backfills 2 years of historical price data using nepse-scraper
"""

import os
import sys
import time
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from nepse_scraper import NepseScraper
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv("NEON_DATABASE_URL")


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def get_all_symbols():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT symbol FROM stocks ORDER BY symbol")
    symbols = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return symbols


def save_price_record(symbol, bar):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO stock_prices (symbol, date, open, high, low, close, volume, amount)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol, date) DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                volume = EXCLUDED.volume,
                amount = EXCLUDED.amount
        """,
            (
                symbol,
                bar.get("businessDate"),
                bar.get("openPrice", 0),
                bar.get("highPrice", 0),
                bar.get("lowPrice", 0),
                bar.get("closePrice", 0),
                bar.get("totalTradedQuantity", 0),
                bar.get("totalTradedValue"),
            ),
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()


def main():
    years = int(sys.argv[1]) if len(sys.argv) > 1 else 2

    print("=" * 60)
    print("NEPSE Historical Backfill")
    print(f"Fetching {years} years of historical data...")
    print("=" * 60)

    # Initialize scraper
    print("\nInitializing NEPSE scraper...")
    scraper = NepseScraper(verify_ssl=False)

    # Calculate date range
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365 * years)).strftime("%Y-%m-%d")

    print(f"Date range: {start_date} to {end_date}")

    # Get all symbols
    symbols = get_all_symbols()
    print(f"Found {len(symbols)} symbols in database")

    # Backfill
    total_collected = 0
    failed = 0
    start_time = time.time()

    for i, symbol in enumerate(symbols):
        print(f"[{i + 1}/{len(symbols)}] {symbol}...", end=" ", flush=True)

        try:
            result = scraper.get_ticker_price_history(
                ticker=symbol, start_date=start_date, end_date=end_date
            )
            content = result.get("content", [])

            if content:
                saved = 0
                for bar in content:
                    if save_price_record(symbol, bar):
                        saved += 1
                total_collected += saved
                print(f"{saved} records")
            else:
                print("no data")

        except Exception as e:
            print(f"error: {e}")
            failed += 1

        time.sleep(0.3)  # Small delay to be nice to the API

    duration = time.time() - start_time

    print("\n" + "=" * 60)
    print("BACKFILL COMPLETE!")
    print("=" * 60)
    print(f"Symbols processed: {len(symbols)}")
    print(f"Records collected: {total_collected}")
    print(f"Failed: {failed}")
    print(f"Duration: {duration:.1f} seconds ({duration / 60:.1f} minutes)")

    # Show final stats
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM stock_prices")
    total = cur.fetchone()[0]
    cur.execute("SELECT MIN(date), MAX(date) FROM stock_prices")
    date_range = cur.fetchone()
    print(f"\nDatabase now has {total} price records")
    print(f"Date range: {date_range[0]} to {date_range[1]}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
