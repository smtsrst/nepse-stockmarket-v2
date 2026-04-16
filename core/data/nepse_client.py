"""
NEPSE Data Client
Wrapper for nepse-data-api with caching and fallback
"""

from typing import Optional, Dict, List, Any
import pandas as pd


class NepseClient:
    """Client for accessing NEPSE data via nepse-data-api"""

    def __init__(self):
        self._client = None
        self._cache = {}
        self._cache_ttl = 60  # seconds

    def _get_client(self):
        """Lazy initialization of nepse-data-api client"""
        if self._client is None:
            try:
                from nepse_data_api import Nepse

                self._client = Nepse(cache_ttl=30, enable_cache=True)
            except ImportError:
                raise ImportError(
                    "nepse-data-api not installed. Run: pip install nepse-data-api"
                )
        return self._client

    def get_market_status(self) -> Dict[str, Any]:
        """Get market open/closed status"""
        client = self._get_client()
        try:
            return client.get_market_status()
        except Exception as e:
            return {"isOpen": False, "error": str(e)}

    def get_market_summary(self) -> Dict[str, Any]:
        """Get market summary (turnover, volume, etc.)"""
        client = self._get_client()
        try:
            return client.get_market_summary()
        except Exception as e:
            return {"error": str(e)}

    def get_nepse_index(self) -> Dict[str, Any]:
        """Get NEPSE index values"""
        client = self._get_client()
        try:
            return client.get_nepse_index()
        except Exception as e:
            return {"error": str(e)}

    def get_sub_indices(self) -> List[Dict[str, Any]]:
        """Get sector indices"""
        client = self._get_client()
        try:
            return client.get_sub_indices()
        except Exception as e:
            return []

    def get_stocks(self) -> List[Dict[str, Any]]:
        """Get live stock prices"""
        client = self._get_client()
        try:
            return client.get_stocks()
        except Exception as e:
            return []

    def get_top_gainers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top gaining stocks"""
        client = self._get_client()
        try:
            return client.get_top_gainers(limit=limit)
        except Exception as e:
            return []

    def get_top_losers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top losing stocks"""
        client = self._get_client()
        try:
            return client.get_top_losers(limit=limit)
        except Exception as e:
            return []

    def get_floorsheet(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get floorsheet data"""
        client = self._get_client()
        try:
            return client.get_floorsheet(symbol=symbol)
        except Exception as e:
            return []

    def get_market_depth(self, symbol: str) -> Dict[str, Any]:
        """Get market depth (order book)"""
        client = self._get_client()
        try:
            return client.get_market_depth(symbol=symbol)
        except Exception as e:
            return {"error": str(e)}

    def get_security_details(self, security_id: int) -> Dict[str, Any]:
        """Get company/security details"""
        client = self._get_client()
        try:
            return client.get_security_details(security_id=security_id)
        except Exception as e:
            return {"error": str(e)}

    def get_company_list(self) -> List[Dict[str, Any]]:
        """Get list of all companies"""
        client = self._get_client()
        try:
            return client.get_company_list()
        except Exception as e:
            return []

    def get_company_news(self, symbol: str) -> List[Dict[str, Any]]:
        """Get news for a company"""
        client = self._get_client()
        try:
            return client.get_company_news(symbol=symbol)
        except Exception as e:
            return []

    def get_dividends(self, symbol: str) -> List[Dict[str, Any]]:
        """Get dividend history"""
        client = self._get_client()
        try:
            return client.get_dividends(symbol=symbol)
        except Exception as e:
            return []

    def get_historical_chart(
        self, security_id: int, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """Get historical price data"""
        client = self._get_client()
        try:
            return client.get_historical_chart(
                security_id=security_id, start_date=start_date, end_date=end_date
            )
        except Exception as e:
            return []
