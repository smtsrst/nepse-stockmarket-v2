"""
Historical data service - serves data from cache/database with fallback
"""

import os
import sqlite3
import warnings
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from functools import lru_cache

warnings.filterwarnings("ignore")


class HistoricalDataService:
    """Service for historical stock data with local caching"""

    def __init__(self, db_path: str = "data/historical.db"):
        self.db_path = db_path
        self._ensure_db_path()

    def _ensure_db_path(self):
        """Ensure database directory exists"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def get_db_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)

    def get_historical_prices(
        self,
        symbol: str,
        days: int = 30,
        source: str = "auto",  # "cache", "db", "api", "auto"
    ) -> List[Dict]:
        """
        Get historical prices with automatic fallback

        Priority:
        1. Local database (fastest)
        2. Cache (if available)
        3. API (live)
        4. Mock data (last resort)
        """
        if source == "auto":
            # Try each source in order
            for src in ["db", "cache", "api"]:
                try:
                    result = self.get_historical_prices(symbol, days, src)
                    if result:
                        return result
                except Exception:
                    continue

            # Fallback to mock
            return self._get_mock_data(symbol, days)

        elif source == "db":
            return self._get_from_db(symbol, days)

        elif source == "cache":
            return self._get_from_cache(symbol, days)

        elif source == "api":
            return self._get_from_api(symbol, days)

        return []

    def _get_from_db(self, symbol: str, days: int) -> List[Dict]:
        """Get from local database"""
        if not os.path.exists(self.db_path):
            return []

        conn = self.get_db_connection()
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

    def _get_from_cache(self, symbol: str, days: int) -> List[Dict]:
        """Get fresh from nepse-scraper API"""
        try:
            from nepse_scraper import NepseScraper

            client = NepseScraper(verify_ssl=False)

            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

            result = client.get_ticker_price_history(
                ticker=symbol, start_date=start_date, end_date=end_date
            )

            if isinstance(result, dict):
                content = result.get("content", [])
            else:
                content = result or []

            prices = []
            for p in content:
                prices.append(
                    {
                        "date": p.get("businessDate", ""),
                        "open": p.get("openPrice", 0),
                        "high": p.get("highPrice", 0),
                        "low": p.get("lowPrice", 0),
                        "close": p.get("closePrice", 0),
                        "volume": p.get("totalTradedQuantity", 0),
                    }
                )

            return prices

        except Exception as e:
            print(f"Cache fetch error: {e}")
            return []

    def _get_from_api(self, symbol: str, days: int) -> List[Dict]:
        """Get fresh from API"""
        return self._get_from_cache(symbol, days)  # Same for now

    def _get_mock_data(self, symbol: str, days: int) -> List[Dict]:
        """Generate mock data as last resort"""
        import random

        base_prices = {
            "NABIL": 520,
            "NMB": 285,
            "NIC": 420,
            "SCB": 380,
            "GBL": 310,
            "HBL": 450,
            "LBL": 235,
            "MBL": 275,
            "KBL": 320,
            "ACL": 145,
            "SHL": 85,
            "NCCB": 380,
        }

        base_price = base_prices.get(symbol, 300)
        data = []

        for i in range(days, 0, -1):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            change = random.uniform(-0.05, 0.05)
            close = base_price * (1 + change)
            open_price = base_price * (1 + random.uniform(-0.02, 0.02))
            high = max(open_price, close) * random.uniform(1.0, 1.03)
            low = min(open_price, close) * random.uniform(0.97, 1.0)
            volume = random.randint(50000, 500000)

            data.append(
                {
                    "date": date,
                    "open": round(open_price, 2),
                    "high": round(high, 2),
                    "low": round(low, 2),
                    "close": round(close, 2),
                    "volume": volume,
                }
            )

            base_price = close

        return data

    def save_to_db(self, symbol: str, prices: List[Dict]) -> bool:
        """Save prices to local database"""
        if not prices:
            return False

        self._ensure_db_path()

        conn = self.get_db_connection()
        cursor = conn.cursor()

        # Create table if not exists
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

        for price in prices:
            try:
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO stock_prices 
                    (symbol, date, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        symbol.upper(),
                        price.get("date"),
                        price.get("open"),
                        price.get("high"),
                        price.get("low"),
                        price.get("close"),
                        price.get("volume"),
                    ),
                )
            except Exception as e:
                print(f"Error saving: {e}")

        conn.commit()
        conn.close()
        return True


# Singleton instance
@lru_cache(maxsize=1)
def get_historical_service() -> HistoricalDataService:
    """Get historical data service instance"""
    return HistoricalDataService()
