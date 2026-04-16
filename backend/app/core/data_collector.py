"""
NEPSE Data Collector - Uses nepse-scraper for reliable historical data
"""

import os
import sys
import time
import sqlite3
import warnings
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

warnings.filterwarnings("ignore")


class DataCollector:
    def __init__(self, db_path: str = "data/historical.db"):
        self.db_path = db_path
        self._init_database()
        self.client = None

    def _get_client(self):
        if self.client is None:
            try:
                from nepse_scraper import NepseScraper

                self.client = NepseScraper(verify_ssl=False)
            except ImportError:
                logger.warning("nepse-scraper not installed")
        return self.client

    def _init_database(self):
        """Initialize SQLite database for historical data"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                date TEXT NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, date)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_summary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                turnover REAL,
                trade_count INTEGER,
                volume INTEGER,
                companies INTEGER,
                nepse_index REAL,
                index_change REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_prices(symbol)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_prices(date)"
        )

        conn.commit()
        conn.close()
        logger.info(f"Database initialized: {self.db_path}")

    def collect_stock_prices(self, symbol: str, days: int = 365) -> List[Dict]:
        """Collect historical prices for a symbol"""
        client = self._get_client()
        if not client:
            logger.error("No client available")
            return []

        try:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

            result = client.get_ticker_price_history(
                ticker=symbol, start_date=start_date, end_date=end_date
            )

            if isinstance(result, dict):
                prices = result.get("content", [])
            else:
                prices = result or []

            if prices:
                formatted = self._format_prices(symbol, prices)
                self._save_stock_prices(symbol, formatted)
                logger.info(f"Collected {len(formatted)} records for {symbol}")
                return formatted
            else:
                logger.warning(f"No historical data for {symbol}")
                return []

        except Exception as e:
            logger.error(f"Error collecting {symbol}: {e}")
            return []

    def _format_prices(self, symbol: str, prices: List[Dict]) -> List[Dict]:
        """Format price data for storage"""
        formatted = []
        for p in prices:
            formatted.append(
                {
                    "symbol": symbol.upper(),
                    "date": p.get("businessDate", ""),
                    "open": p.get("openPrice", 0),
                    "high": p.get("highPrice", 0),
                    "low": p.get("lowPrice", 0),
                    "close": p.get("closePrice", 0),
                    "volume": p.get("totalTradedQuantity", 0),
                }
            )
        return formatted

    def _save_stock_prices(self, symbol: str, prices: List[Dict]):
        """Save stock prices to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for price in prices:
            try:
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO stock_prices 
                    (symbol, date, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        price.get("symbol"),
                        price.get("date"),
                        price.get("open"),
                        price.get("high"),
                        price.get("low"),
                        price.get("close"),
                        price.get("volume"),
                    ),
                )
            except Exception as e:
                logger.error(f"Error saving price: {e}")

        conn.commit()
        conn.close()

    def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict]:
        """Get historical data from local database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        cursor.execute(
            """
            SELECT * FROM stock_prices 
            WHERE symbol = ? AND date >= ?
            ORDER BY date ASC
        """,
            (symbol.upper(), start_date),
        )

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return results

    def collect_all_stocks(self, limit: int = 50):
        """Collect historical data for top stocks"""
        client = self._get_client()
        if not client:
            logger.error("No client available")
            return

        try:
            today = client.get_today_price()
        except Exception as e:
            logger.error(f"Error getting today's price: {e}")
            return

        if not today:
            logger.error("No stock data available")
            return

        today_sorted = sorted(
            today, key=lambda x: x.get("totalTradedQuantity", 0), reverse=True
        )[:limit]

        logger.info(f"Collecting historical data for {len(today_sorted)} stocks...")

        for i, stock in enumerate(today_sorted):
            symbol = stock.get("symbol")
            if not symbol:
                continue
            logger.info(f"[{i + 1}/{len(today_sorted)}] Collecting {symbol}...")

            self.collect_stock_prices(symbol, days=90)
            time.sleep(0.5)

        logger.info("Data collection complete!")

    def get_db_stats(self) -> Dict:
        """Get database statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM stock_prices")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_prices")
        symbols = cursor.fetchone()[0]

        cursor.execute("SELECT MIN(date), MAX(date) FROM stock_prices")
        date_range = cursor.fetchone()

        conn.close()

        return {
            "total_records": total,
            "unique_symbols": symbols,
            "date_range": f"{date_range[0]} to {date_range[1]}"
            if date_range[0]
            else "No data",
        }


def main():
    """Main function to run data collection"""
    import argparse

    parser = argparse.ArgumentParser(description="NEPSE Data Collector")
    parser.add_argument("--symbol", type=str, help="Single symbol to collect")
    parser.add_argument("--all", action="store_true", help="Collect all stocks")
    parser.add_argument("--days", type=int, default=365, help="Days of history")
    parser.add_argument("--stats", action="store_true", help="Show database stats")

    args = parser.parse_args()

    collector = DataCollector()

    if args.stats:
        stats = collector.get_db_stats()
        for k, v in stats.items():
            print(f"{k}: {v}")
    elif args.symbol:
        collector.collect_stock_prices(args.symbol, args.days)
    elif args.all:
        collector.collect_all_stocks()
    else:
        print("Usage: python data_collector.py --symbol NABIL")
        print("       python data_collector.py --all")
        print("       python data_collector.py --stats")


if __name__ == "__main__":
    main()
