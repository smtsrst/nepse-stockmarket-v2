"""
NEPSE Historical Data Scraper
Scrapes historical price data from Merolagani and stores in Neon PostgreSQL
"""

import os
import logging
import time
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")

MEROLAGANI_BASE = "https://merolagani.com"
REQUEST_DELAY = 1.5  # Be respectful to the server
REQUEST_TIMEOUT = 30


def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL)


def get_all_symbols() -> List[str]:
    """Get all stock symbols from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT symbol FROM stocks ORDER BY symbol")
        return [row[0] for row in cur.fetchall()]
    except Exception as e:
        logger.error(f"Failed to get symbols: {e}")
        return []
    finally:
        cur.close()
        conn.close()


def scrape_price_history(symbol: str, years: int = 2) -> List[Dict]:
    """Scrape price history for a symbol from Merolagani"""
    url = f"{MEROLAGANI_BASE}/Pricehistory.aspx?symbol={symbol}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    }

    records = []

    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        table = soup.find("table", {"id": "tbl_history"})
        if not table:
            logger.debug(f"No history table found for {symbol}")
            return records

        rows = table.find_all("tr")[1:]

        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * years)

        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 7:
                continue

            try:
                date_str = cols[0].text.strip()
                price_date = datetime.strptime(date_str, "%Y-%m-%d")

                if price_date < start_date:
                    continue
                if price_date > end_date:
                    continue

                record = {
                    "date": date_str,
                    "open": float(cols[1].text.strip().replace(",", ""))
                    if cols[1].text.strip()
                    else 0,
                    "high": float(cols[2].text.strip().replace(",", ""))
                    if cols[2].text.strip()
                    else 0,
                    "low": float(cols[3].text.strip().replace(",", ""))
                    if cols[3].text.strip()
                    else 0,
                    "close": float(cols[4].text.strip().replace(",", ""))
                    if cols[4].text.strip()
                    else 0,
                    "volume": int(cols[5].text.strip().replace(",", ""))
                    if cols[5].text.strip()
                    else 0,
                    "amount": float(cols[6].text.strip().replace(",", ""))
                    if cols[6].text.strip()
                    else 0,
                }
                records.append(record)

            except (ValueError, IndexError) as e:
                continue

        return records

    except requests.RequestException as e:
        logger.error(f"Failed to fetch {symbol}: {e}")
        return records
    except Exception as e:
        logger.error(f"Error parsing {symbol}: {e}")
        return records


def save_prices_to_db(symbol: str, records: List[Dict]) -> int:
    """Save price records to database"""
    if not records:
        return 0

    conn = get_db_connection()
    cur = conn.cursor()
    saved = 0

    try:
        for record in records:
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
                        record["date"],
                        record["open"],
                        record["high"],
                        record["low"],
                        record["close"],
                        record["volume"],
                        record.get("amount"),
                    ),
                )
                saved += 1
            except Exception as e:
                logger.debug(f"Failed to save {symbol} {record['date']}: {e}")

        conn.commit()
    except Exception as e:
        logger.error(f"Database error for {symbol}: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

    return saved


def backfill_historical(symbols: List[str], years: int = 2) -> Dict:
    """Backfill historical data for all symbols"""
    total_saved = 0
    failed = 0
    start_time = time.time()

    logger.info(f"Starting backfill for {len(symbols)} symbols, {years} years back")

    for i, symbol in enumerate(symbols):
        logger.info(f"[{i + 1}/{len(symbols)}] Scraping {symbol}...")

        records = scrape_price_history(symbol, years)
        saved = save_prices_to_db(symbol, records)

        total_saved += saved
        logger.info(f"  Saved {saved} records for {symbol}")

        time.sleep(REQUEST_DELAY)

    duration = time.time() - start_time

    return {
        "symbols_processed": len(symbols),
        "records_collected": total_saved,
        "failed": failed,
        "duration": duration,
    }


def get_db_stats() -> Dict:
    """Get current database statistics"""
    if not DATABASE_URL:
        return {"error": "Database not configured"}

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM stock_prices")
        price_count = cur.fetchone()[0]

        cur.execute("SELECT MIN(date), MAX(date) FROM stock_prices")
        date_range = cur.fetchone()

        cur.close()
        conn.close()

        return {
            "price_count": price_count,
            "date_range": f"{date_range[0]} to {date_range[1]}"
            if date_range[0]
            else "No data",
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import sys

    years = int(sys.argv[1]) if len(sys.argv) > 1 else 2

    logger.info("=" * 60)
    logger.info("NEPSE Historical Backfill from Merolagani")
    logger.info(f"Fetching {years} years of data")
    logger.info("=" * 60)

    logger.info(f"Current DB stats: {get_db_stats()}")

    symbols = get_all_symbols()
    logger.info(f"Found {len(symbols)} symbols in database")

    result = backfill_historical(symbols, years)

    logger.info("=" * 60)
    logger.info(f"Backfill complete!")
    logger.info(f"Symbols processed: {result['symbols_processed']}")
    logger.info(f"Records collected: {result['records_collected']}")
    logger.info(f"Duration: {result['duration']:.1f}s")
    logger.info("=" * 60)

    logger.info(f"Updated DB stats: {get_db_stats()}")
