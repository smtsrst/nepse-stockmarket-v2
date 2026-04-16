"""
Data management API endpoints for collection control.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/data", tags=["Data Management"])


@router.get("/status")
def get_data_status():
    """Get current data collection status"""
    from app.core.scheduler import get_scheduler

    scheduler = get_scheduler()
    return scheduler.get_status()


@router.post("/collect")
def trigger_collection(
    symbols: Optional[List[str]] = None,
    full: bool = False,
):
    """Trigger data collection manually

    - symbols: Specific symbols to collect (optional)
    - full: Collect all stocks (optional, default False)
    """
    from app.core.scheduler import get_scheduler

    scheduler = get_scheduler()
    result = scheduler.trigger_collection(symbols=symbols, full=full)

    return result


@router.get("/stats")
def get_database_stats():
    """Get database statistics"""
    from app.core.data_collector import DataCollector

    collector = DataCollector()
    return collector.get_db_stats()


@router.get("/symbols")
def get_stored_symbols(limit: int = 100):
    """Get list of symbols in database"""
    import os
    import sqlite3

    db_path = "data/historical.db"

    if not os.path.exists(db_path):
        return {"symbols": [], "count": 0}

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT symbol, COUNT(*) as records, MIN(date) as first_date, MAX(date) as last_date
        FROM stock_prices
        GROUP BY symbol
        ORDER BY records DESC
        LIMIT ?
    """,
        (limit,),
    )

    results = [
        {"symbol": row[0], "records": row[1], "from": row[2], "to": row[3]}
        for row in cursor.fetchall()
    ]

    conn.close()

    return {"symbols": results, "count": len(results)}


@router.delete("/cache")
def clear_cache():
    """Clear cached data (for development)"""
    import os

    db_path = "data/historical.db"

    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            return {"status": "cleared", "message": "Database cleared successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to clear: {e}")

    return {"status": "empty", "message": "No database found"}
