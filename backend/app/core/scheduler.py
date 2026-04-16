"""
Background scheduler for automated data collection.
"""

import os
import sys
import time
import threading
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataScheduler:
    """Scheduler for automated NEPSE data collection"""

    def __init__(
        self, db_path: str = "data/historical.db", check_interval_minutes: int = 30
    ):
        self.db_path = db_path
        self.check_interval = check_interval_minutes * 60
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self.last_collection: Optional[str] = None
        self.collection_stats: Dict[str, Any] = {}

        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def start(self):
        """Start the scheduler in background thread"""
        if self._thread and self._thread.is_alive():
            logger.warning("Scheduler already running")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._thread.start()
        logger.info(
            f"Scheduler started, checking every {self.check_interval // 60} minutes"
        )

    def stop(self):
        """Stop the scheduler"""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("Scheduler stopped")

    def _run_scheduler(self):
        """Main scheduler loop"""
        while not self._stop_event.is_set():
            try:
                self._check_and_collect()
            except Exception as e:
                logger.error(f"Scheduler error: {e}")

            self._stop_event.wait(self.check_interval)

    def _check_and_collect(self):
        """Check if collection is needed and run it"""
        should_collect = self._should_collect_data()

        if should_collect:
            logger.info("Starting scheduled data collection...")
            self._run_collection()
        else:
            logger.debug("No collection needed at this time")

    def _should_collect_data(self) -> bool:
        """Check if we should collect data now"""
        # Check if market is open (10 AM - 4 PM Nepal time)
        now = datetime.now()

        # Nepal is UTC+5:45
        nepse_hour = (now.hour + 5 + 45 // 60) % 24
        nepse_minute = (now.minute + 45) % 60

        # Market hours: 11:00 - 15:00 (11 AM - 3 PM)
        market_open = 11 <= nepse_hour < 15

        # Check last collection time
        last = self._get_last_collection_time()

        if not last:
            return True  # Never collected

        last_date = datetime.fromisoformat(last)
        hours_since = (now - last_date).total_seconds() / 3600

        # Collect if more than 4 hours since last or market just opened
        return hours_since > 4 or (market_open and hours_since > 1)

    def _get_last_collection_time(self) -> Optional[str]:
        """Get timestamp of last successful collection"""
        if not os.path.exists(self.db_path):
            return None

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT MAX(created_at) FROM stock_prices WHERE created_at IS NOT NULL"
            )
            result = cursor.fetchone()
            conn.close()
            return result[0] if result and result[0] else None
        except Exception:
            return None

    def _run_collection(self):
        """Run the data collection process"""
        start_time = datetime.now()

        try:
            # Import here to avoid circular imports
            from app.core.data_collector import DataCollector

            collector = DataCollector(self.db_path)

            # Get today's price to find active stocks
            client = collector._get_client()
            if not client:
                logger.error("No NEPSE client available")
                return

            today = client.get_today_price()
            if not today:
                logger.warning("No market data available today")
                return

            # Get all unique symbols from DB + today
            existing_symbols = self._get_existing_symbols()
            new_symbols = {s.get("symbol") for s in today if s.get("symbol")}
            symbols_to_update = list(existing_symbols | new_symbols)

            # Prioritize today's active stocks
            active_symbols = [s.get("symbol") for s in today if s.get("symbol")]
            symbols_to_update = active_symbols + [
                s for s in symbols_to_update if s not in active_symbols
            ]

            # Collect all available stocks (no limit)
            # symbols_to_update = symbols_to_update[:100]

            collected = 0
            failed = 0

            for symbol in symbols_to_update:
                try:
                    result = collector.collect_stock_prices(symbol, days=30)
                    if result:
                        collected += 1
                    else:
                        failed += 1

                    time.sleep(0.3)  # Rate limiting

                except Exception as e:
                    logger.warning(f"Failed {symbol}: {e}")
                    failed += 1

            self.last_collection = datetime.now().isoformat()
            self.collection_stats = {
                "collected": collected,
                "failed": failed,
                "duration_seconds": (datetime.now() - start_time).total_seconds(),
            }

            logger.info(f"Collection complete: {collected} success, {failed} failed")

        except Exception as e:
            logger.error(f"Collection failed: {e}")

    def _get_existing_symbols(self) -> set:
        """Get set of symbols already in database"""
        if not os.path.exists(self.db_path):
            return set()

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT symbol FROM stock_prices")
            symbols = {row[0] for row in cursor.fetchall()}
            conn.close()
            return symbols
        except Exception:
            return set()

    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status"""
        return {
            "running": self._thread is not None and self._thread.is_alive(),
            "last_collection": self.last_collection,
            "stats": self.collection_stats,
            "db_records": self._get_record_count(),
            "db_symbols": len(self._get_existing_symbols()),
        }

    def _get_record_count(self) -> int:
        """Get total records in database"""
        if not os.path.exists(self.db_path):
            return 0

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM stock_prices")
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except Exception:
            return 0

    def trigger_collection(
        self, symbols: list = None, full: bool = False
    ) -> Dict[str, Any]:
        """Manually trigger data collection"""
        logger.info(f"Manual collection triggered (full={full}, symbols={symbols})")

        try:
            from app.core.data_collector import DataCollector

            collector = DataCollector(self.db_path)

            if symbols:
                collected = 0
                for symbol in symbols:
                    result = collector.collect_stock_prices(symbol, days=90)
                    if result:
                        collected += 1
                    time.sleep(0.3)

                return {
                    "status": "complete",
                    "collected": collected,
                    "total": len(symbols),
                }

            elif full:
                collector.collect_all_stocks(limit=500)
                return {"status": "complete", "mode": "full"}

            else:
                self._run_collection()
                return {"status": "complete", "stats": self.collection_stats}

        except Exception as e:
            logger.error(f"Manual collection failed: {e}")
            return {"status": "error", "message": str(e)}


def trigger_ml_retrain(self) -> Dict[str, Any]:
    """Manually trigger ML model retraining"""
    logger.info("Manual ML retrain triggered")

    try:
        from app.core.ml_model import train_model

        result = train_model()
        return {
            "status": "complete",
            "message": "ML model retrained successfully",
            "result": result,
        }
    except Exception as e:
        logger.error(f"ML retrain failed: {e}")
        return {"status": "error", "message": str(e)}


class MLScheduler:
    """Scheduler for weekly ML model retraining"""

    def __init__(
        self,
        db_path: str = "data/historical.db",
        model_path: str = "data/price_model.pkl",
    ):
        self.db_path = db_path
        self.model_path = model_path
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self.check_interval_seconds = 7 * 24 * 60 * 60  # 7 days
        self.last_retrain: Optional[str] = None
        self.retrain_stats: Dict[str, Any] = {}

    def start(self):
        """Start the ML scheduler in background thread"""
        if self._thread and self._thread.is_alive():
            logger.warning("ML Scheduler already running")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._thread.start()
        logger.info("ML Scheduler started (weekly retraining)")

    def stop(self):
        """Stop the ML scheduler"""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("ML Scheduler stopped")

    def _run_scheduler(self):
        """Main scheduler loop"""
        while not self._stop_event.is_set():
            try:
                self._check_and_retrain()
            except Exception as e:
                logger.error(f"ML Scheduler error: {e}")

            self._stop_event.wait(self.check_interval_seconds)

    def _check_and_retrain(self):
        """Check if retraining is needed"""
        if self._should_retrain():
            logger.info("Starting scheduled ML model retraining...")
            self._run_retrain()
        else:
            logger.debug("No ML retraining needed at this time")

    def _should_retrain(self) -> bool:
        """Check if model should be retrained (weekly)"""
        # Check if model file exists
        if not os.path.exists(self.model_path):
            return True

        # Check last retrain time
        last = self._get_last_retrain_time()
        if not last:
            return True  # Never trained

        last_date = datetime.fromisoformat(last)
        days_since = (datetime.now() - last_date).days

        # Retrain if more than 7 days since last training
        return days_since >= 7

    def _get_last_retrain_time(self) -> Optional[str]:
        """Get timestamp of last successful retrain"""
        if not os.path.exists(self.model_path):
            return None

        try:
            # Get file modification time
            mtime = os.path.getmtime(self.model_path)
            return datetime.fromtimestamp(mtime).isoformat()
        except Exception:
            return None

    def _run_retrain(self):
        """Run the ML model retraining"""
        start_time = datetime.now()

        try:
            from app.core.ml_model import train_model

            logger.info("Training ML model...")
            result = train_model()

            self.last_retrain = datetime.now().isoformat()
            self.retrain_stats = {
                "duration_seconds": (datetime.now() - start_time).total_seconds(),
                "result": result,
            }

            logger.info(f"ML retraining complete: {result}")

        except Exception as e:
            logger.error(f"ML retraining failed: {e}")

    def trigger_retrain(self) -> Dict[str, Any]:
        """Manually trigger retraining"""
        return self._run_retrain()

    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status"""
        return {
            "running": self._thread is not None and self._thread.is_alive(),
            "last_retrain": self.last_retrain,
            "stats": self.retrain_stats,
            "next_retrain_in_days": self._get_days_until_next_retrain(),
        }

    def _get_days_until_next_retrain(self) -> int:
        """Get days until next scheduled retrain"""
        last = self._get_last_retrain_time()
        if not last:
            return 0

        last_date = datetime.fromisoformat(last)
        days_since = (datetime.now() - last_date).days
        return max(0, 7 - days_since)


# Global scheduler instances
_scheduler: Optional[DataScheduler] = None
_ml_scheduler: Optional[MLScheduler] = None


def get_scheduler() -> DataScheduler:
    """Get or create scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = DataScheduler()
    return _scheduler


def get_ml_scheduler() -> MLScheduler:
    """Get or create ML scheduler instance"""
    global _ml_scheduler
    if _ml_scheduler is None:
        _ml_scheduler = MLScheduler()
    return _ml_scheduler


def start_scheduler():
    """Start the background data and ML schedulers"""
    scheduler = get_scheduler()
    scheduler.start()

    ml_scheduler = get_ml_scheduler()
    ml_scheduler.start()


def stop_scheduler():
    """Stop the background schedulers"""
    global _scheduler, _ml_scheduler
    if _scheduler:
        _scheduler.stop()
    if _ml_scheduler:
        _ml_scheduler.stop()
