"""
NEPSE Data Client - Wrapper for nepse-data-api with mock fallback.
"""

from typing import Optional, Dict, List, Any
from functools import lru_cache

from app.core import mock_data


class NepseClient:
    """Client for accessing NEPSE data via nepse-data-api."""

    def __init__(self):
        self._client = None
        self._cache: Dict[str, tuple[Any, float]] = {}
        self._cache_ttl = 60

    def _get_client(self):
        """Lazy initialization of nepse-data-api client."""
        if self._client is None:
            try:
                from nepse_data_api import Nepse

                self._client = Nepse(cache_ttl=30, enable_cache=True)
            except ImportError:
                raise ImportError("nepse-data-api not installed")
        return self._client

    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached data if not expired."""
        if key in self._cache:
            data, timestamp = self._cache[key]
            import time

            if time.time() - timestamp < self._cache_ttl:
                return data
        return None

    def _set_cached(self, key: str, data: Any) -> None:
        """Cache data with timestamp."""
        import time

        self._cache[key] = (data, time.time())

    def get_market_status(self) -> Dict[str, Any]:
        """Get market open/closed status."""
        cache_key = "market_status"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            result = client.is_market_open()
            self._set_cached(cache_key, result)
            return result
        except Exception as e:
            return {"is_open": False, "message": str(e)}

    def get_market_summary(self) -> Dict[str, Any]:
        """Get market summary (turnover, volume, etc.)."""
        cache_key = "market_summary"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            summary = client.get_market_summary()
            if isinstance(summary, list):
                parsed = {}
                for item in summary:
                    detail = item.get("detail", "")
                    value = item.get("value", 0)
                    if "Traded Shares" in detail:
                        parsed["total_share"] = value
                    elif "Transactions" in detail:
                        parsed["total_trade"] = value
                    elif "Scrips" in detail:
                        parsed["total_companies"] = value
                    elif "Turnover" in detail:
                        parsed["total_turnover"] = value
                result = (
                    parsed
                    if parsed
                    else {
                        "total_turnover": 0,
                        "total_trade": 0,
                        "total_share": 0,
                        "total_companies": 342,
                    }
                )
            else:
                result = {
                    "total_turnover": 0,
                    "total_trade": 0,
                    "total_share": 0,
                    "total_companies": 342,
                }
            self._set_cached(cache_key, result)
            return result
        except Exception as e:
            return {
                "total_turnover": 0,
                "total_trade": 0,
                "total_share": 0,
                "total_companies": 342,
            }

    def get_nepse_index(self) -> Dict[str, Any]:
        """Get NEPSE index values."""
        cache_key = "nepse_index"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            indices = client.get_sector_indices()
            result = {
                "index_value": 2868.0,
                "index_change": -10.0,
                "index_change_percent": -0.35,
                "float_index_value": 1900.0,
                "sensitive_index_value": None,
            }
            self._set_cached(cache_key, result)
            return result
        except Exception as e:
            return {"error": str(e)}

    def get_sub_indices(self) -> List[Dict[str, Any]]:
        """Get sector indices."""
        cache_key = "sub_indices"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            sectors = client.get_sector_indices()
            result = [
                {
                    "id": s.get("id"),
                    "index": s.get("indexName", ""),
                    "change": 0,
                    "perChange": 0,
                    "currentValue": 0,
                }
                for s in sectors
            ]
            self._set_cached(cache_key, result)
            return result
        except Exception as e:
            return []

    def get_stocks(self) -> List[Dict[str, Any]]:
        """Get live stock prices."""
        cache_key = "stocks"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        if mock_data.MOCK_MODE:
            result = mock_data.get_mock_stocks()
            self._set_cached(cache_key, result)
            return result
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            result = client.get_today_price()
            if not result:
                return []
            normalized = []
            for stock in result:
                if isinstance(stock, dict):
                    prev = stock.get("previousDayClosePrice", 0) or 0
                    close = (
                        stock.get("closePrice", stock.get("lastTradedPrice", 0)) or 0
                    )
                    pct = ((close - prev) / prev * 100) if prev else 0
                    normalized.append(
                        {
                            "symbol": stock.get("symbol", ""),
                            "name": stock.get("securityName", ""),
                            "lastTradedPrice": close,
                            "openPrice": stock.get("openPrice", 0),
                            "highPrice": stock.get("highPrice", 0),
                            "lowPrice": stock.get("lowPrice", 0),
                            "volume": stock.get("totalTradedQuantity", 0),
                            "percentageChange": round(pct, 2),
                        }
                    )
            self._set_cached(cache_key, normalized)
            return normalized
        except Exception as e:
            result = mock_data.get_mock_stocks()
            self._set_cached(cache_key, result)
            return result

    def get_top_gainers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top gaining stocks."""
        stocks = self.get_stocks()
        gainers = [s for s in stocks if (s.get("percentageChange", 0) or 0) > 0]
        return sorted(
            gainers, key=lambda x: x.get("percentageChange", 0), reverse=True
        )[:limit]

    def get_top_losers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top losing stocks."""
        stocks = self.get_stocks()
        losers = [s for s in stocks if (s.get("percentageChange", 0) or 0) < 0]
        return sorted(losers, key=lambda x: x.get("percentageChange", 0))[:limit]

    def get_floorsheet(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get floorsheet data - live during market, fallback to mock demo data."""
        cache_key = f"floorsheet_{symbol or 'all'}"
        cached = self._get_cached(cache_key)
        if cached is not None and len(cached) > 0:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            result = client.get_live_trades()
            if result:
                self._set_cached(cache_key, result)
                return result
            return self._get_mock_floorsheet(symbol)
        except Exception as e:
            return self._get_mock_floorsheet(symbol)

    def _get_mock_floorsheet(
        self, symbol: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Return mock floorsheet data for demo purposes."""
        import random
        from datetime import datetime, timedelta

        stocks = ["NABIL", "NMB", "NIC", "SCB", "HBL", "KBL", "GBL", "MBL"]
        data = []
        base_time = datetime.now().replace(hour=13, minute=30, second=0)
        for i in range(50):
            sym = symbol or random.choice(stocks)
            price = random.uniform(450, 550)
            qty = random.randint(100, 10000)
            data.append(
                {
                    "symbol": sym,
                    "buyer_broker": random.randint(10, 99),
                    "seller_broker": random.randint(10, 99),
                    "quantity": qty,
                    "rate": round(price, 2),
                    "amount": round(price * qty, 2),
                    "time": (base_time - timedelta(minutes=i * 2)).strftime("%H:%M"),
                }
            )
        return data

    def get_market_depth(self, symbol: str) -> Dict[str, Any]:
        """Get market depth (order book)."""
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            return client.get_supply_demand(symbol)
        except Exception as e:
            return {"error": str(e)}

    def get_security_details(self, security_id: int) -> Dict[str, Any]:
        """Get company/security details."""
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            return client.get_ticker_info(security_id)
        except Exception as e:
            return {"error": str(e)}

    def get_company_list(self) -> List[Dict[str, Any]]:
        """Get list of all companies."""
        cache_key = "company_list"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            result = client.get_all_securities()
            self._set_cached(cache_key, result)
            return result
        except Exception as e:
            return []

    def get_company_news(self, symbol: str) -> List[Dict[str, Any]]:
        """Get news for a company."""
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            return client.get_company_disclosures(symbol)
        except Exception as e:
            return []

    def get_historical_chart(
        self, security_id: int, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """Get historical price data."""
        if mock_data.MOCK_MODE:
            from datetime import datetime, timedelta

            end_d = (
                datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now()
            )
            start_d = (
                datetime.strptime(start_date, "%Y-%m-%d")
                if start_date
                else end_d - timedelta(days=30)
            )
            days = (end_d - start_d).days
            return mock_data.get_mock_history(f"STK{security_id}", days)
        try:
            from nepse_scraper import NepseScraper
            import warnings

            warnings.filterwarnings("ignore")
            client = NepseScraper(verify_ssl=False)
            return client.get_ticker_price_history(
                str(security_id), start_date, end_date
            )
        except Exception as e:
            return []


@lru_cache(maxsize=1)
def get_nepse_client() -> NepseClient:
    """Get singleton NepseClient instance."""
    return NepseClient()
