#!/usr/bin/env python3
"""
NEPSE Data Collection Script
Uses nepse-data-api to fetch live and historical data
Stores data in Neon PostgreSQL database
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
import pandas as pd
from psycopg2.extras import execute_values

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")

# Data collection settings
BATCH_SIZE = 100  # Stocks per batch
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5  # seconds


def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL)


def log_collection(
    collection_type: str,
    collected: int,
    failed: int,
    duration: float,
    status: str,
    error: str = None,
):
    """Log collection to database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO collection_log (collection_type, records_collected, records_failed, duration_seconds, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
            (collection_type, collected, failed, duration, status, error),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log collection: {e}")


def fetch_live_data():
    """Fetch live market data using nepse-data-api"""
    try:
        from nepse_data_api import Nepse

        nepse = Nepse()

        # Get all stocks with current prices
        logger.info("Fetching live stock data...")
        stocks = nepse.get_stocks()

        stock_data = []
        for stock in stocks:
            stock_data.append(
                {
                    "symbol": stock.get("symbol", stock.get("id", "")),
                    "name": stock.get("companyName", stock.get("name", "")),
                    "sector": stock.get("sector", ""),
                    "close": stock.get("closePrice", stock.get("close", 0)),
                    "open": stock.get("openPrice", stock.get("open", 0)),
                    "high": stock.get("highPrice", stock.get("high", 0)),
                    "low": stock.get("lowPrice", stock.get("low", 0)),
                    "volume": stock.get("totalTradeQuantity", stock.get("volume", 0)),
                    "amount": stock.get("totalTradeValue", stock.get("amount", 0)),
                }
            )

        logger.info(f"Fetched {len(stock_data)} stocks")
        return stock_data

    except ImportError:
        logger.warning("nepse-data-api not installed, trying YONEPSE fallback...")
        return fetch_yonepse_fallback()
    except Exception as e:
        logger.error(f"Error fetching live data: {e}")
        return fetch_yonepse_fallback()


def fetch_yonepse_fallback():
    """Fallback to YONEPSE JSON API"""
    import requests

    try:
        url = "https://shubhamnpk.github.io/yonepse/data/nepse_data.json"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        stock_data = []
        for item in data:
            stock_data.append(
                {
                    "symbol": item.get("symbol", ""),
                    "name": item.get("companyName", item.get("name", "")),
                    "sector": item.get("sector", ""),
                    "close": float(item.get("closePrice", item.get("close", 0)) or 0),
                    "open": float(item.get("openPrice", item.get("open", 0)) or 0),
                    "high": float(item.get("highPrice", item.get("high", 0)) or 0),
                    "low": float(item.get("lowPrice", item.get("low", 0)) or 0),
                    "volume": int(
                        item.get("totalTradeQuantity", item.get("volume", 0)) or 0
                    ),
                    "amount": float(
                        item.get("totalTradeValue", item.get("amount", 0)) or 0
                    ),
                }
            )

        logger.info(f"Fetched {len(stock_data)} stocks from YONEPSE")
        return stock_data

    except Exception as e:
        logger.error(f"YONEPSE fallback failed: {e}")
        return []


def save_stocks_to_db(stocks: list):
    """Save stock metadata to database"""
    if not stocks:
        return 0, 0

    conn = get_db_connection()
    cur = conn.cursor()

    collected = 0
    failed = 0

    for stock in stocks:
        try:
            cur.execute(
                """
                INSERT INTO stocks (symbol, name, sector, last_updated)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (symbol) DO UPDATE SET
                    name = EXCLUDED.name,
                    sector = EXCLUDED.sector,
                    last_updated = NOW()
            """,
                (stock["symbol"], stock["name"], stock.get("sector", "")),
            )
            collected += 1
        except Exception as e:
            logger.error(f"Failed to save {stock['symbol']}: {e}")
            failed += 1

    conn.commit()
    cur.close()
    conn.close()

    return collected, failed


def save_price_to_db(
    symbol: str,
    date: str,
    open_price: float,
    high: float,
    low: float,
    close: float,
    volume: int,
    amount: float = None,
):
    """Save a single price record to database"""
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
            (symbol, date, open_price, high, low, close, volume, amount),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to save price for {symbol}: {e}")
        return False
    finally:
        cur.close()
        conn.close()


def get_all_symbols() -> list:
    """Get all stock symbols from database"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT symbol FROM stocks ORDER BY symbol")
        symbols = [row[0] for row in cur.fetchall()]
        return symbols
    except Exception as e:
        logger.error(f"Failed to get symbols: {e}")
        return []
    finally:
        cur.close()
        conn.close()


def collect_live_prices():
    """Collect today's live prices for all stocks"""
    start_time = time.time()

    logger.info("Starting live data collection...")

    try:
        from nepse_data_api import Nepse

        nepse = Nepse()

        # Get today's market summary
        summary = nepse.get_market_summary()
        logger.info(f"Market Summary: {summary}")

        # Get top gainers
        gainers = nepse.get_top_gainers()
        logger.info(f"Top Gainers: {len(gainers)}")

        # Get top losers
        losers = nepse.get_top_losers()
        logger.info(f"Top Losers: {len(losers)}")

        # Get today's price data
        today = datetime.now().strftime("%Y-%m-%d")

        # Fetch all stocks
        stocks = nepse.get_stocks()

        collected = 0
        failed = 0

        for stock in stocks:
            try:
                symbol = stock.get("symbol", stock.get("id", ""))
                if not symbol:
                    continue

                save_price_to_db(
                    symbol=symbol,
                    date=today,
                    open_price=stock.get("openPrice", 0),
                    high=stock.get("highPrice", 0),
                    low=stock.get("lowPrice", 0),
                    close=stock.get("closePrice", 0),
                    volume=stock.get("totalTradeQuantity", 0),
                    amount=stock.get("totalTradeValue", 0),
                )
                collected += 1

                if collected % 50 == 0:
                    logger.info(f"Progress: {collected}/{len(stocks)}")

            except Exception as e:
                logger.error(f"Failed to process {stock.get('symbol')}: {e}")
                failed += 1

        duration = time.time() - start_time
        log_collection("live_prices", collected, failed, duration, "success")

        logger.info(
            f"✅ Live collection complete: {collected} collected, {failed} failed in {duration:.1f}s"
        )
        return collected, failed

    except Exception as e:
        duration = time.time() - start_time
        log_collection("live_prices", 0, 0, duration, "failed", str(e))
        logger.error(f"Live collection failed: {e}")
        return 0, 0


def collect_historical_data(symbol: str, start_date: str, end_date: str):
    """Collect historical data for a single symbol"""
    try:
        from nepse_data_api import Nepse

        nepse = Nepse()

        # Get security ID from symbol
        securities = nepse.get_security_list()
        security_id = None

        for sec in securities:
            if sec.get("symbol") == symbol or sec.get("id") == symbol:
                security_id = sec.get("securityId", sec.get("id"))
                break

        if not security_id:
            logger.warning(f"Security ID not found for {symbol}")
            return 0

        # Get historical chart data
        chart_data = nepse.get_historical_chart(security_id, start_date, end_date)

        if not chart_data:
            logger.warning(f"No historical data for {symbol}")
            return 0

        collected = 0
        for bar in chart_data:
            try:
                date = bar.get("date", bar.get("dateString", ""))
                if not date:
                    continue

                save_price_to_db(
                    symbol=symbol,
                    date=date,
                    open_price=bar.get("open", 0),
                    high=bar.get("high", 0),
                    low=bar.get("low", 0),
                    close=bar.get("close", bar.get("price", 0)),
                    volume=bar.get("volume", 0),
                )
                collected += 1
            except Exception as e:
                logger.error(f"Failed to save {symbol} bar: {e}")

        logger.info(f"Collected {collected} bars for {symbol}")
        return collected

    except Exception as e:
        logger.error(f"Historical collection failed for {symbol}: {e}")
        return 0


def backfill_historical(days: int = 365):
    """Backfill historical data for all symbols"""
    start_time = time.time()

    symbols = get_all_symbols()
    if not symbols:
        logger.error("No symbols found in database. Run live collection first.")
        return

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    logger.info(f"Backfilling {len(symbols)} symbols from {start_date} to {end_date}")

    total_collected = 0
    total_failed = 0

    for i, symbol in enumerate(symbols):
        logger.info(f"[{i + 1}/{len(symbols)}] Processing {symbol}...")

        collected = collect_historical_data(symbol, start_date, end_date)
        total_collected += collected

        if (i + 1) % 10 == 0:
            logger.info(f"Progress: {i + 1}/{len(symbols)} symbols processed")

        # Rate limiting
        time.sleep(0.5)

    duration = time.time() - start_time
    log_collection(
        "historical_backfill", total_collected, total_failed, duration, "success"
    )

    logger.info(f"✅ Backfill complete: {total_collected} records in {duration:.1f}s")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="NEPSE Data Collection")
    parser.add_argument(
        "--mode",
        choices=["live", "historical", "backfill", "setup"],
        default="live",
        help="Collection mode",
    )
    parser.add_argument("--symbol", help="Specific symbol for historical")
    parser.add_argument("--days", type=int, default=365, help="Days for backfill")

    args = parser.parse_args()

    if args.mode == "setup":
        from setup_database import create_tables

        create_tables()
    elif args.mode == "live":
        collect_live_prices()
    elif args.mode == "historical":
        if args.symbol:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=args.days)).strftime(
                "%Y-%m-%d"
            )
            collect_historical_data(args.symbol, start_date, end_date)
        else:
            print("Error: --symbol required for historical mode")
    elif args.mode == "backfill":
        backfill_historical(args.days)


if __name__ == "__main__":
    main()
