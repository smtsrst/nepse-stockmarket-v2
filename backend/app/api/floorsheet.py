"""
Floorsheet API endpoints.
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.core.client import get_nepse_client

router = APIRouter(prefix="/floorsheet", tags=["Floorsheet"])


@router.get("")
def get_floorsheet(
    limit: int = Query(100, ge=1, le=500),
):
    """Get latest floorsheet data."""
    client = get_nepse_client()
    data = client.get_floorsheet()
    return data[:limit]


@router.get("/{symbol}")
def get_floorsheet_by_symbol(
    symbol: str,
    limit: int = Query(100, ge=1, le=500),
):
    """Get floorsheet data for a specific symbol."""
    client = get_nepse_client()
    data = client.get_floorsheet(symbol=symbol.upper())
    return data[:limit]
