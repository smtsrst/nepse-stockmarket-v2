#!/usr/bin/env python3
"""
NEPSE Daily Data Collection Script
Collects live stock prices from YONEPSE and stores in Neon PostgreSQL

Usage:
    python scripts/collect_live.py

This script is designed to be run via GitHub Actions or cron job.
"""

import os
import sys
import time
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from src.data_collector import collect_live_prices, get_db_stats, log_collection

load_dotenv()


def main():
    print("=" * 60)
    print("NEPSE Live Data Collection")
    print(f"Started at: {datetime.now().isoformat()}")
    print("=" * 60)

    # Check database connection
    stats = get_db_stats()
    if "error" in stats:
        print(f"❌ Database Error: {stats['error']}")
        log_collection("live_prices", 0, 0, 0, "failed", stats["error"])
        sys.exit(1)

    print(
        f"Current DB Stats: {stats['stock_count']} stocks, {stats['price_count']} prices"
    )

    # Run collection
    result = collect_live_prices()

    if "error" in result:
        print(f"❌ Collection failed: {result['error']}")
        sys.exit(1)

    print(f"\n✅ Collection Complete!")
    print(f"   Stocks saved: {result.get('stocks_saved', 0)}")
    print(f"   Prices collected: {result.get('prices_collected', 0)}")
    print(f"   Failed: {result.get('failed', 0)}")
    print(f"   Duration: {result.get('duration', 0):.1f}s")

    # Print updated stats
    updated_stats = get_db_stats()
    print(f"\n📊 Updated Stats:")
    print(f"   Total stocks: {updated_stats.get('stock_count', 'N/A')}")
    print(f"   Total prices: {updated_stats.get('price_count', 'N/A')}")
    print(f"   Date range: {updated_stats.get('date_range', 'N/A')}")


if __name__ == "__main__":
    main()
