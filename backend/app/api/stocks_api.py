"""
Stock data API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any

from app.core.client import get_nepse_client

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("")
def get_stocks(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    limit: int = Query(100, ge=1, le=500),
):
    """Get all stock prices."""
    client = get_nepse_client()
    stocks = client.get_stocks()

    if not stocks:
        return []

    # Filter by sector if provided
    if sector:
        stocks = [s for s in stocks if s.get("sector", "").lower() == sector.lower()]

    # Return limited results
    return stocks[:limit]


@router.get("/gainers")
def get_top_gainers(limit: int = Query(10, ge=1, le=50)):
    """Get top gaining stocks."""
    client = get_nepse_client()
    return client.get_top_gainers(limit=limit)


@router.get("/losers")
def get_top_losers(limit: int = Query(10, ge=1, le=50)):
    """Get top losing stocks."""
    client = get_nepse_client()
    return client.get_top_losers(limit=limit)


@router.get("/{symbol}")
def get_stock(symbol: str):
    """Get single stock details."""
    client = get_nepse_client()
    stocks = client.get_stocks()

    # Find the stock
    for stock in stocks:
        if stock.get("symbol", "").upper() == symbol.upper():
            return stock

    raise HTTPException(
        status_code=404,
        detail=f"Stock {symbol} not found",
    )


@router.get("/{symbol}/history")
def get_stock_history(
    symbol: str,
    days: int = Query(30, ge=1, le=365),
    source: str = Query("auto", description="Data source: auto, db, cache, api"),
):
    """Get historical price data for a stock.

    Source priority:
    - auto: Try local DB → cache → API → mock
    - db: Local database only
    - cache: API with caching
    - api: Fresh API data
    """
    from app.core.historical_data import get_historical_service
    from app.core.mock_data import get_mock_history

    # Validate symbol exists
    client = get_nepse_client()
    companies = client.get_company_list()
    exists = any(c.get("symbol", "").upper() == symbol.upper() for c in companies)

    if not exists:
        # Try mock data anyway for demo
        pass

    # Get historical data with fallback
    service = get_historical_service()
    history = service.get_historical_prices(symbol, days, source)

    # Save to DB for future use
    if history and source != "db":
        service.save_to_db(symbol, history)

    return {
        "symbol": symbol.upper(),
        "days": days,
        "source": source,
        "record_count": len(history),
        "history": history,
    }


@router.get("/{symbol}/analysis")
def get_stock_analysis(symbol: str):
    """Get technical analysis for a stock."""
    client = get_nepse_client()

    # Get stock data
    stocks = client.get_stocks()
    stock_data = None

    for stock in stocks:
        if stock.get("symbol", "").upper() == symbol.upper():
            stock_data = stock
            break

    if not stock_data:
        raise HTTPException(
            status_code=404,
            detail=f"Stock {symbol} not found",
        )

    # Get price history for analysis
    current_price = stock_data.get("lastTradedPrice", 0)

    if current_price == 0:
        raise HTTPException(
            status_code=400,
            detail=f"No price data for {symbol}",
        )

    # Use local historical data service
    from app.core.historical_data import get_historical_service

    service = get_historical_service()
    history = service.get_historical_prices(symbol, days=200, source="db")

    if not history:
        # Try API if DB has no data
        history = service.get_historical_prices(symbol, days=200, source="api")

    if not history:
        return {
            "symbol": symbol,
            "error": "No historical data available",
        }

    # Extract closing prices
    prices = [h.get("close", 0) for h in history if h.get("close")]

    if len(prices) < 50:
        return {
            "symbol": symbol,
            "error": f"Insufficient historical data (need 50, got {len(prices)})",
        }

    # Run analysis
    from app.core.analysis import analyze_stock

    result = analyze_stock(symbol, current_price, prices)
    return result

    result = analyze_stock(symbol, current_price, prices)
    return result
