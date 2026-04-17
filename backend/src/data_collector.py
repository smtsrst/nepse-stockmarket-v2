"""
NEPSE Data Collector Module
Handles fetching data from NEPSE API and storing in Neon PostgreSQL
Supports multiple data sources: nepse-data-api (primary), nepse-scraper (fallback), YONEPSE (live)
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import psycopg2
from psycopg2.extras import execute_values
import requests
import time

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_database_url():
    return os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")


DATABASE_URL = get_database_url()

YONEPSE_BASE = "https://shubhamnpk.github.io/yonepse/data"
REQUEST_TIMEOUT = 30
REQUEST_DELAY = 0.5

# Initialize NEPSE APIs
USE_NEPSE_DATA_API = False
USE_NEPSE_SCRAPER = False
USE_YONEPSE = True

nepse_data_api = None
nepse_scraper = None

try:
    from nepse_data_api import Nepse

    nepse_data_api = Nepse(cache_ttl=300, enable_cache=True)
    USE_NEPSE_DATA_API = True
    logger.info("nepse-data-api loaded successfully")
except ImportError as e:
    logger.warning(f"nepse-data-api not available: {e}")

try:
    from nepse_scraper import NepseScraper

    nepse_scraper = NepseScraper(verify_ssl=False)
    USE_NEPSE_SCRAPER = True
    logger.info("nepse-scraper loaded successfully")
except ImportError as e:
    logger.warning(f"nepse-scraper not available: {e}")

_security_map_cache = None


def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(get_database_url())


def get_db_stats() -> Dict:
    """Get current database statistics"""
    db_url = get_database_url()
    if not db_url:
        return {"error": "Database not configured"}

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get stock count
        cur.execute("SELECT COUNT(*) FROM stocks")
        stock_count = cur.fetchone()[0]

        # Get price record count
        cur.execute("SELECT COUNT(*) FROM stock_prices")
        price_count = cur.fetchone()[0]

        # Get date range
        cur.execute("SELECT MIN(date), MAX(date) FROM stock_prices")
        date_range = cur.fetchone()

        # Get last collection time
        cur.execute("""
            SELECT created_at, records_collected, status 
            FROM collection_log 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        last_collection = cur.fetchone()

        cur.close()
        conn.close()

        return {
            "stock_count": stock_count,
            "price_count": price_count,
            "date_range": f"{date_range[0]} to {date_range[1]}"
            if date_range[0]
            else "No data",
            "last_collection": last_collection[0].isoformat()
            if last_collection
            else None,
            "last_records": last_collection[1] if last_collection else 0,
            "last_status": last_collection[2] if last_collection else None,
        }
    except Exception as e:
        logger.error(f"Error getting DB stats: {e}")
        return {"error": str(e)}


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


def fetch_all_stocks() -> List[Dict]:
    """Fetch all stocks from NEPSE API, nepse-scraper, or YONEPSE fallback"""
    logger.info("Fetching stock list...")

    # Try nepse-data-api first (fastest)
    if USE_NEPSE_DATA_API and nepse_data_api:
        try:
            stocks_data = nepse_data_api.get_stocks()
            securities = nepse_data_api.get_security_list()

            symbol_to_name = {}
            for sec in securities:
                sym = sec.get("symbol", "")
                name = sec.get("companyName", sec.get("name", ""))
                if sym:
                    symbol_to_name[sym] = name

            stocks = []
            for item in stocks_data:
                symbol = item.get("symbol", "")
                if not symbol:
                    continue
                stocks.append(
                    {
                        "symbol": symbol,
                        "name": symbol_to_name.get(
                            symbol, item.get("companyName", item.get("name", ""))
                        ),
                        "sector": item.get("sector", ""),
                        "close": float(
                            item.get("closePrice", item.get("close", 0) or 0)
                        ),
                        "open": float(item.get("openPrice", item.get("open", 0) or 0)),
                        "high": float(item.get("highPrice", item.get("high", 0) or 0)),
                        "low": float(item.get("lowPrice", item.get("low", 0) or 0)),
                        "volume": int(
                            item.get("totalTradeQuantity", item.get("volume", 0) or 0)
                        ),
                        "amount": float(
                            item.get("totalTradeValue", item.get("amount", 0) or 0)
                        ),
                        "previous_close": float(
                            item.get(
                                "previousClosing", item.get("previousClose", 0) or 0
                            )
                        ),
                    }
                )

            logger.info(f"Fetched {len(stocks)} stocks from nepse-data-api")
            return stocks
        except Exception as e:
            logger.warning(f"nepse-data-api failed: {e}")

    # Try nepse-scraper fallback
    if USE_NEPSE_SCRAPER and nepse_scraper:
        try:
            securities = nepse_scraper.get_securities_list()

            symbol_to_info = {}
            for sec in securities:
                sym = sec.get("securitySymbol")
                if sym:
                    symbol_to_info[sym.upper()] = {
                        "name": sec.get("securityName", ""),
                        "id": sec.get("securityId"),
                    }

            today_price = nepse_scraper.get_today_price()
            stocks = []
            for price in today_price:
                sym = price.get("symbol", "")
                if not sym:
                    continue

                sym_upper = sym.upper()
                info = symbol_to_info.get(sym_upper, {})

                stocks.append(
                    {
                        "symbol": sym,
                        "name": info.get(
                            "name", price.get("companyName", price.get("name", ""))
                        ),
                        "sector": "",
                        "close": float(
                            price.get("closePrice", price.get("close", 0) or 0)
                        ),
                        "open": float(
                            price.get("openPrice", price.get("open", 0) or 0)
                        ),
                        "high": float(
                            price.get("highPrice", price.get("high", 0) or 0)
                        ),
                        "low": float(price.get("lowPrice", price.get("low", 0) or 0)),
                        "volume": int(
                            price.get("totalTradeQuantity", price.get("volume", 0) or 0)
                        ),
                        "amount": float(
                            price.get("totalTradeValue", price.get("amount", 0) or 0)
                        ),
                        "previous_close": float(
                            price.get(
                                "previousDayClosePrice",
                                price.get("previousClose", 0) or 0,
                            )
                        ),
                    }
                )

            logger.info(f"Fetched {len(stocks)} stocks from NEPSE")
            return stocks

        except Exception as e:
            logger.warning(f"Failed to fetch from NEPSE: {e}, using fallback")

    try:
        response = requests.get(
            f"{YONEPSE_BASE}/nepse_data.json", timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()

        stocks = []
        for item in data:
            close_val = item.get("closePrice") or item.get("close", 0) or 0
            open_val = item.get("openPrice") or item.get("open", 0) or 0
            high_val = item.get("highPrice") or item.get("high", 0) or 0
            low_val = item.get("lowPrice") or item.get("low", 0) or 0
            volume_val = item.get("totalTradeQuantity") or item.get("volume", 0) or 0
            amount_val = item.get("totalTradeValue") or item.get("amount", 0) or 0
            prev_close_val = (
                item.get("previousClosing") or item.get("previousClose", 0) or 0
            )

            stocks.append(
                {
                    "symbol": item.get("symbol", ""),
                    "name": item.get("companyName", item.get("name", "")),
                    "sector": item.get("sector", ""),
                    "close": float(close_val),
                    "open": float(open_val),
                    "high": float(high_val),
                    "low": float(low_val),
                    "volume": int(volume_val),
                    "amount": float(amount_val),
                    "previous_close": float(prev_close_val),
                }
            )

        logger.info(f"Fetched {len(stocks)} stocks from YONEPSE")
        return stocks

    except requests.RequestException as e:
        logger.error(f"Failed to fetch stocks: {e}")
        return []


def save_stocks_to_db(stocks: List[Dict]) -> Tuple[int, int]:
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
) -> bool:
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


def get_all_symbols() -> List[str]:
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


def collect_live_prices() -> Dict:
    """Collect today's live prices for all stocks using fast nepse-scraper method"""
    start_time = time.time()
    logger.info("Starting fast live data collection...")

    today = datetime.now().strftime("%Y-%m-%d")

    try:
        if USE_NEPSE_SCRAPER and nepse_scraper:
            try:
                today_prices = nepse_scraper.get_today_price()
                logger.info(f"Fetched {len(today_prices)} prices from NEPSE")

                if not today_prices:
                    return {"error": "No prices returned", "collected": 0, "failed": 0}

                securities = nepse_scraper.get_securities_list()
                symbol_to_name = {}
                for sec in securities:
                    sym = sec.get("securitySymbol")
                    if sym:
                        symbol_to_name[sym.upper()] = sec.get("securityName", "")

                conn = get_db_connection()
                cur = conn.cursor()

                collected = 0
                failed = 0

                for price in today_prices:
                    try:
                        sym = price.get("symbol", "")
                        if not sym:
                            continue

                        cur.execute(
                            """
                            INSERT INTO stocks (symbol, name, last_updated)
                            VALUES (%s, %s, NOW())
                            ON CONFLICT (symbol) DO UPDATE SET
                                name = EXCLUDED.name,
                                last_updated = NOW()
                        """,
                            (
                                sym,
                                symbol_to_name.get(
                                    sym.upper(), price.get("companyName", "")
                                ),
                            ),
                        )

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
                                sym,
                                today,
                                float(price.get("openPrice", 0) or 0),
                                float(price.get("highPrice", 0) or 0),
                                float(price.get("lowPrice", 0) or 0),
                                float(price.get("closePrice", 0) or 0),
                                int(price.get("totalTradeQuantity", 0) or 0),
                                price.get("totalTradeValue"),
                            ),
                        )
                        collected += 1
                    except Exception as e:
                        logger.debug(f"Failed to save {price.get('symbol')}: {e}")
                        failed += 1

                conn.commit()
                cur.close()
                conn.close()

                duration = time.time() - start_time
                log_collection("live_prices", collected, failed, duration, "success")

                logger.info(
                    f"Fast live collection complete: {collected} collected, {failed} failed in {duration:.1f}s"
                )
                return {
                    "prices_collected": collected,
                    "failed": failed,
                    "duration": duration,
                }

            except Exception as e:
                logger.error(f"Fast collection failed: {e}")

        logger.info("Falling back to standard collection...")
        stocks = fetch_all_stocks()

        if not stocks:
            return {"error": "Failed to fetch stocks", "collected": 0, "failed": 0}

        saved_stocks, failed_stocks = save_stocks_to_db(stocks)
        logger.info(f"Saved {saved_stocks} stocks, {failed_stocks} failed")

        collected = 0
        failed = 0

        for stock in stocks:
            try:
                success = save_price_to_db(
                    symbol=stock["symbol"],
                    date=today,
                    open_price=stock["open"],
                    high=stock["high"],
                    low=stock["low"],
                    close=stock["close"],
                    volume=stock["volume"],
                    amount=stock.get("amount"),
                )
                if success:
                    collected += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed to process {stock['symbol']}: {e}")
                failed += 1

            time.sleep(REQUEST_DELAY)

        duration = time.time() - start_time
        log_collection("live_prices", collected, failed, duration, "success")

        logger.info(
            f"Live collection complete: {collected} collected, {failed} failed in {duration:.1f}s"
        )
        return {"prices_collected": collected, "failed": failed, "duration": duration}

    except Exception as e:
        duration = time.time() - start_time
        log_collection("live_prices", 0, 0, duration, "failed", str(e))
        logger.error(f"Live collection failed: {e}")
        return {"error": str(e), "collected": 0, "failed": 0}

        # Fallback to slower method
        logger.info("Falling back to standard collection...")
        stocks = fetch_all_stocks()

        if not stocks:
            return {"error": "Failed to fetch stocks", "collected": 0, "failed": 0}

        # Save stock metadata
        saved_stocks, failed_stocks = save_stocks_to_db(stocks)
        logger.info(f"Saved {saved_stocks} stocks, {failed_stocks} failed")

        # Save price data
        collected = 0
        failed = 0

        for stock in stocks:
            try:
                success = save_price_to_db(
                    symbol=stock["symbol"],
                    date=today,
                    open_price=stock["open"],
                    high=stock["high"],
                    low=stock["low"],
                    close=stock["close"],
                    volume=stock["volume"],
                    amount=stock.get("amount"),
                )
                if success:
                    collected += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed to process {stock['symbol']}: {e}")
                failed += 1

            time.sleep(REQUEST_DELAY)

        duration = time.time() - start_time
        log_collection("live_prices", collected, failed, duration, "success")

        logger.info(
            f"✅ Live collection complete: {collected} collected, {failed} failed in {duration:.1f}s"
        )

        return {
            "stocks_saved": saved_stocks,
            "prices_collected": collected,
            "failed": failed,
            "duration": duration,
        }

    except Exception as e:
        duration = time.time() - start_time
        log_collection("live_prices", 0, 0, duration, "failed", str(e))
        logger.error(f"Live collection failed: {e}")
        return {"error": str(e), "collected": 0, "failed": 0}


def get_security_map(force_refresh: bool = False) -> Dict[str, Dict]:
    """Get symbol to security info mapping from NEPSE (cached)"""
    global _security_map_cache

    if _security_map_cache and not force_refresh:
        return _security_map_cache

    if not USE_NEPSE_SCRAPER or not nepse_scraper:
        return {}

    try:
        securities = nepse_scraper.get_securities_list()
        symbol_map = {}
        for sec in securities:
            sym = sec.get("securitySymbol")
            if sym:
                symbol_map[sym.upper()] = {
                    "id": sec.get("securityId"),
                    "name": sec.get("securityName"),
                }
        logger.info(f"Loaded {len(symbol_map)} securities from NEPSE")
        _security_map_cache = symbol_map
        return symbol_map
    except Exception as e:
        logger.error(f"Failed to get securities list: {e}")
        return _security_map_cache or {}


def get_security_id_from_nepse_data_api(symbol: str) -> Optional[int]:
    """Get NEPSE security ID from nepse-data-api"""
    if not USE_NEPSE_DATA_API or not nepse_data_api:
        return None

    try:
        securities = nepse_data_api.get_security_list()
        for sec in securities:
            if sec.get("symbol", "").upper() == symbol.upper():
                return sec.get("id") or sec.get("securityId")
        return None
    except Exception as e:
        logger.debug(f"Failed to get security ID for {symbol}: {e}")
        return None


def collect_historical_for_symbol(symbol: str, start_date: str, end_date: str) -> int:
    """Collect historical data for a single symbol using nepse-data-api (primary) or nepse-scraper (fallback)"""
    collected = 0

    # Try nepse-data-api first (faster due to caching)
    if USE_NEPSE_DATA_API and nepse_data_api:
        try:
            security_id = get_security_id_from_nepse_data_api(symbol)
            if not security_id:
                logger.debug(f"No security ID for {symbol} in nepse-data-api")
            else:
                logger.info(
                    f"Fetching historical chart for {symbol} (ID: {security_id})..."
                )
                chart_data = nepse_data_api.get_historical_chart(
                    security_id, start_date=start_date, end_date=end_date
                )

                if chart_data and len(chart_data) > 0:
                    for bar in chart_data:
                        try:
                            bar_date = bar.get("date") or bar.get("businessDate", "")
                            if not bar_date:
                                continue
                            if isinstance(bar_date, str) and (
                                bar_date < start_date or bar_date > end_date
                            ):
                                continue

                            save_price_to_db(
                                symbol=symbol,
                                date=str(bar_date),
                                open_price=float(
                                    bar.get("open", bar.get("openPrice", 0) or 0)
                                ),
                                high=float(
                                    bar.get("high", bar.get("highPrice", 0) or 0)
                                ),
                                low=float(bar.get("low", bar.get("lowPrice", 0) or 0)),
                                close=float(
                                    bar.get(
                                        "close",
                                        bar.get("closePrice", bar.get("price", 0) or 0),
                                    )
                                ),
                                volume=int(
                                    bar.get(
                                        "volume",
                                        bar.get(
                                            "totalTradedQuantity",
                                            bar.get("totalTradeQuantity", 0) or 0,
                                        ),
                                    )
                                ),
                                amount=bar.get("amount")
                                or bar.get(
                                    "totalTradedValue", bar.get("totalTradeValue")
                                ),
                            )
                            collected += 1
                        except Exception as e:
                            logger.debug(f"Failed to save bar for {symbol}: {e}")

                    if collected > 0:
                        logger.info(
                            f"Collected {collected} records for {symbol} via nepse-data-api"
                        )
                        return collected

        except Exception as e:
            logger.warning(f"nepse-data-api failed for {symbol}: {e}")

    # Fallback to nepse-scraper
    if USE_NEPSE_SCRAPER and nepse_scraper:
        try:
            logger.info(f"Fetching price history for {symbol} (scraper fallback)...")
            result = nepse_scraper.get_ticker_price_history(
                ticker=symbol, start_date=start_date, end_date=end_date
            )

            if not result or not isinstance(result, dict):
                logger.debug(f"No data for {symbol}")
                return collected

            content = result.get("content", [])
            if not content:
                logger.debug(f"Empty content for {symbol}")
                return collected

            for bar in content:
                try:
                    bar_date = bar.get("businessDate", "")
                    if not bar_date or bar_date < start_date or bar_date > end_date:
                        continue

                    save_price_to_db(
                        symbol=symbol,
                        date=bar_date,
                        open_price=float(bar.get("openPrice", 0) or 0),
                        high=float(bar.get("highPrice", 0) or 0),
                        low=float(bar.get("lowPrice", 0) or 0),
                        close=float(bar.get("closePrice", 0) or 0),
                        volume=int(bar.get("totalTradedQuantity", 0) or 0),
                        amount=bar.get("totalTradedValue"),
                    )
                    collected += 1
                except Exception as e:
                    logger.debug(f"Failed to save bar for {symbol}: {e}")

            if collected > 0:
                logger.info(
                    f"Collected {collected} records for {symbol} via nepse-scraper"
                )
            return collected

        except Exception as e:
            logger.error(f"nepse-scraper failed for {symbol}: {e}")

    return collected

    return collected


def backfill_historical(days: int = 1095) -> Dict:
    """Backfill historical data for all symbols"""
    start_time = time.time()

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    # Ensure stocks are loaded
    stocks = fetch_all_stocks()
    if not stocks:
        return {"error": "Failed to fetch stock list", "collected": 0}

    save_stocks_to_db(stocks)

    symbols = get_all_symbols()
    if not symbols:
        return {"error": "No symbols in database", "collected": 0}

    logger.info(
        f"Backfilling {len(symbols)} symbols from {start_date} to {end_date} ({days} days)"
    )

    total_collected = 0
    total_failed = 0

    for i, symbol in enumerate(symbols):
        logger.info(f"[{i + 1}/{len(symbols)}] Processing {symbol}...")

        collected = collect_historical_for_symbol(symbol, start_date, end_date)
        total_collected += collected

        if (i + 1) % 20 == 0:
            logger.info(
                f"Progress: {i + 1}/{len(symbols)} symbols processed, {total_collected} records collected"
            )

        time.sleep(REQUEST_DELAY)

    duration = time.time() - start_time
    log_collection(
        "historical_backfill", total_collected, total_failed, duration, "success"
    )

    logger.info(f"✅ Backfill complete: {total_collected} records in {duration:.1f}s")

    return {
        "symbols_processed": len(symbols),
        "records_collected": total_collected,
        "duration": duration,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="NEPSE Data Collection")
    parser.add_argument(
        "--mode",
        choices=["live", "backfill", "stats"],
        default="stats",
        help="Collection mode",
    )
    parser.add_argument("--days", type=int, default=1095, help="Days for backfill")
    args = parser.parse_args()

    if args.mode == "stats":
        print(get_db_stats())
    elif args.mode == "live":
        print(collect_live_prices())
    elif args.mode == "backfill":
        print(backfill_historical(args.days))
