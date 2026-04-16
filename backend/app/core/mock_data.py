"""
Mock data for development and when NEPSE API is unavailable.
"""

from typing import List, Dict, Any


def get_mock_stocks() -> List[Dict[str, Any]]:
    """Return mock stock data for development."""
    return [
        {
            "symbol": "NABIL",
            "name": "NABIL Bank Limited",
            "lastTradedPrice": 520,
            "openPrice": 515,
            "highPrice": 525,
            "lowPrice": 510,
            "volume": 250000,
            "percentageChange": 0.97,
        },
        {
            "symbol": "NMB",
            "name": "NMB Bank Limited",
            "lastTradedPrice": 285,
            "openPrice": 280,
            "highPrice": 290,
            "lowPrice": 278,
            "volume": 180000,
            "percentageChange": 1.78,
        },
        {
            "symbol": "NIC",
            "name": "NIC Asia Bank Limited",
            "lastTradedPrice": 420,
            "openPrice": 418,
            "highPrice": 425,
            "lowPrice": 415,
            "volume": 120000,
            "percentageChange": 0.48,
        },
        {
            "symbol": "SCB",
            "name": "Standard Chartered Bank",
            "lastTradedPrice": 380,
            "openPrice": 375,
            "highPrice": 385,
            "lowPrice": 372,
            "volume": 95000,
            "percentageChange": 1.33,
        },
        {
            "symbol": "GBL",
            "name": "Global IME Bank Limited",
            "lastTradedPrice": 310,
            "openPrice": 305,
            "highPrice": 315,
            "lowPrice": 302,
            "volume": 150000,
            "percentageChange": 1.64,
        },
        {
            "symbol": "HBL",
            "name": "Himalayan Bank Limited",
            "lastTradedPrice": 450,
            "openPrice": 445,
            "highPrice": 455,
            "lowPrice": 440,
            "volume": 85000,
            "percentageChange": 1.12,
        },
        {
            "symbol": "LBL",
            "name": "Laxmi Bank Limited",
            "lastTradedPrice": 235,
            "openPrice": 230,
            "highPrice": 238,
            "lowPrice": 228,
            "volume": 110000,
            "percentageChange": 2.17,
        },
        {
            "symbol": "MBL",
            "name": "Machhapuchhre Bank Limited",
            "lastTradedPrice": 275,
            "openPrice": 270,
            "highPrice": 278,
            "lowPrice": 268,
            "volume": 130000,
            "percentageChange": 1.85,
        },
        {
            "symbol": "SBI",
            "name": "NMB Bank Limited (previously SBI)",
            "lastTradedPrice": 395,
            "openPrice": 390,
            "highPrice": 400,
            "lowPrice": 388,
            "volume": 75000,
            "percentageChange": 1.28,
        },
        {
            "symbol": "KBL",
            "name": "Kumari Bank Limited",
            "lastTradedPrice": 320,
            "openPrice": 315,
            "highPrice": 322,
            "lowPrice": 312,
            "volume": 140000,
            "percentageChange": 1.59,
        },
        {
            "symbol": "ACL",
            "name": "Asian Century Capital",
            "lastTradedPrice": 145,
            "openPrice": 142,
            "highPrice": 148,
            "lowPrice": 140,
            "volume": 220000,
            "percentageChange": 2.11,
        },
        {
            "symbol": "SHL",
            "name": "Society Development Bank",
            "lastTradedPrice": 85,
            "openPrice": 82,
            "highPrice": 88,
            "lowPrice": 80,
            "volume": 95000,
            "percentageChange": 3.66,
        },
        {
            "symbol": "NLG",
            "name": "NMB Laboratory and General Hospital",
            "lastTradedPrice": 520,
            "openPrice": 510,
            "highPrice": 525,
            "lowPrice": 505,
            "volume": 45000,
            "percentageChange": 1.96,
        },
        {
            "symbol": "OHL",
            "name": "Om Healthcare Hospital",
            "lastTradedPrice": 180,
            "openPrice": 175,
            "highPrice": 182,
            "lowPrice": 172,
            "volume": 65000,
            "percentageChange": 2.86,
        },
        {
            "symbol": "BPC",
            "name": "Butwal Power Company",
            "lastTradedPrice": 380,
            "openPrice": 375,
            "highPrice": 382,
            "lowPrice": 370,
            "volume": 55000,
            "percentageChange": 1.33,
        },
    ]


def get_mock_market_summary() -> Dict[str, Any]:
    """Return mock market summary."""
    return {
        "totalTurnover": 1250000000,
        "totalTrade": 8500,
        "totalShare": 3200000,
        "totalCompanies": 224,
    }


def get_mock_index() -> Dict[str, Any]:
    """Return mock index data."""
    return {
        "indexValue": 2150.50,
        "indexChange": 25.75,
        "indexChangePercent": 1.21,
        "floatIndexValue": 1420.30,
        "sensitiveIndexValue": 325.80,
    }


def get_mock_company_list() -> List[Dict[str, Any]]:
    """Return mock company list."""
    return [
        {
            "symbol": "NABIL",
            "securityId": 1,
            "companyName": "NABIL Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "NMB",
            "securityId": 2,
            "companyName": "NMB Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "NIC",
            "securityId": 3,
            "companyName": "NIC Asia Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "SCB",
            "securityId": 4,
            "companyName": "Standard Chartered Bank",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "GBL",
            "securityId": 5,
            "companyName": "Global IME Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "HBL",
            "securityId": 6,
            "companyName": "Himalayan Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "LBL",
            "securityId": 7,
            "companyName": "Laxmi Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "MBL",
            "securityId": 8,
            "companyName": "Machhapuchhre Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "KBL",
            "securityId": 9,
            "companyName": "Kumari Bank Limited",
            "sector": "Commercial Banks",
        },
        {
            "symbol": "ACL",
            "securityId": 10,
            "companyName": "Asian Century Capital",
            "sector": "Investment",
        },
    ]


def get_mock_history(symbol: str, days: int = 30) -> List[Dict[str, Any]]:
    """Generate mock price history."""
    import random

    base_price = 500
    history = []
    for i in range(days, 0, -1):
        date = f"2026-04-{i:02d}"
        open_p = base_price + random.randint(-20, 20)
        close_p = base_price + random.randint(-15, 25)
        high_p = max(open_p, close_p) + random.randint(0, 10)
        low_p = min(open_p, close_p) - random.randint(0, 10)
        volume = random.randint(50000, 300000)
        history.append(
            {
                "date": date,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": volume,
            }
        )
        base_price = close_p
    return history


MOCK_MODE = False  # Set to True for development, False for production
