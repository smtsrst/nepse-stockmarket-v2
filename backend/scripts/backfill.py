#!/usr/bin/env python3
"""
NEPSE Historical Data Backfill Script
Backfills historical price data for all stocks from YONEPSE

Usage:
    python scripts/backfill.py                    # 3 years (default)
    python scripts/backfill.py --days 365         # 1 year
    python scripts/backfill.py --days 730         # 2 years

This script is designed to be run once for initial data population.
"""

import os
import sys
import time
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from src.data_collector import backfill_historical, get_db_stats, log_collection

load_dotenv(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="NEPSE Historical Data Backfill")
    parser.add_argument(
        "--days",
        type=int,
        default=1095,
        help="Number of days to backfill (default: 1095 = 3 years)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("NEPSE Historical Data Backfill")
    print(f"Started at: {datetime.now().isoformat()}")
    print(f"Backfilling: {args.days} days")
    print("=" * 60)

    # Check database connection
    stats = get_db_stats()
    if "error" in stats:
        print(f"❌ Database Error: {stats['error']}")
        log_collection("historical_backfill", 0, 0, 0, "failed", stats["error"])
        sys.exit(1)

    print(
        f"Current DB Stats: {stats['stock_count']} stocks, {stats['price_count']} prices"
    )

    # Estimate time
    estimated_records = stats["stock_count"] * args.days / 2  # rough estimate
    print(f"Estimated records to collect: ~{estimated_records:.0f}")
    print(f"Estimated time: ~{estimated_records / 100:.0f} seconds")
    print()

    # Run backfill
    result = backfill_historical(args.days)

    if "error" in result:
        print(f"❌ Backfill failed: {result['error']}")
        sys.exit(1)

    print(f"\n✅ Backfill Complete!")
    print(f"   Symbols processed: {result.get('symbols_processed', 0)}")
    print(f"   Records collected: {result.get('records_collected', 0)}")
    print(f"   Duration: {result.get('duration', 0):.1f}s")

    # Print updated stats
    updated_stats = get_db_stats()
    print(f"\n📊 Updated Stats:")
    print(f"   Total stocks: {updated_stats.get('stock_count', 'N/A')}")
    print(f"   Total prices: {updated_stats.get('price_count', 'N/A')}")
    print(f"   Date range: {updated_stats.get('date_range', 'N/A')}")


if __name__ == "__main__":
    main()
