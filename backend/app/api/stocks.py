"""
Market data API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.core.client import get_nepse_client
from app.core.analysis import analyze_stock

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/status")
def get_market_status():
    """Get market open/closed status."""
    client = get_nepse_client()
    data = client.get_market_status()

    is_open = (
        data
        if isinstance(data, bool)
        else data.get("is_open", data.get("isOpen", False))
    )
    return {
        "is_open": is_open,
        "message": "Market is open" if is_open else "Market is closed",
    }


@router.get("/summary")
def get_market_summary():
    """Get market summary (turnover, volume, etc.)."""
    client = get_nepse_client()
    data = client.get_market_summary()

    if not isinstance(data, dict):
        data = {}

    return {
        "total_turnover": data.get("total_turnover"),
        "total_trade": data.get("total_trade"),
        "total_share": data.get("total_share"),
        "total_companies": data.get("total_companies"),
    }


@router.get("/indices")
def get_market_indices():
    """Get NEPSE index and sector indices."""
    client = get_nepse_client()

    # NEPSE index
    index_data = client.get_nepse_index()

    # Parse NEPSE index from list format
    nepse_index = {}
    if isinstance(index_data, list):
        for idx in index_data:
            if idx.get("index") == "NEPSE Index":
                nepse_index = {
                    "index_value": idx.get("close", idx.get("currentValue")),
                    "index_change": idx.get("change"),
                    "index_change_percent": idx.get("perChange"),
                }
            elif idx.get("index") == "Float Index":
                nepse_index["float_index_value"] = idx.get(
                    "close", idx.get("currentValue")
                )
            elif idx.get("index") == "Sensitive Index":
                nepse_index["sensitive_index_value"] = idx.get(
                    "close", idx.get("currentValue")
                )
    elif isinstance(index_data, dict):
        nepse_index = {
            "index_value": index_data.get("indexValue"),
            "index_change": index_data.get("indexChange"),
            "index_change_percent": index_data.get("indexChangePercent"),
            "float_index_value": index_data.get("floatIndexValue"),
            "sensitive_index_value": index_data.get("sensitiveIndexValue"),
        }

    # Sector indices
    sub_indices = client.get_sub_indices()

    return {
        "nepse_index": nepse_index,
        "sector_indices": sub_indices,
    }
