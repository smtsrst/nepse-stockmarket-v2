"""
ML Prediction Model - Train and predict stock price movements.
Uses technical indicators to predict next-day direction.
"""

import os
import sqlite3
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import pickle
import logging

logger = logging.getLogger(__name__)

# Use absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "data/historical.db")
MODEL_PATH = os.path.join(BASE_DIR, "data/price_model.pkl")


def get_stock_history(symbol: str, days: int = 200) -> List[Dict]:
    """Get historical price data from database."""
    if not os.path.exists(DB_PATH):
        return []

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT date, open, high, low, close, volume
        FROM stock_prices
        WHERE symbol = ?
        ORDER BY date ASC
        LIMIT ?
    """,
        (symbol, days),
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "date": r[0],
            "open": r[1],
            "high": r[2],
            "low": r[3],
            "close": r[4],
            "volume": r[5],
        }
        for r in rows
    ]


def calculate_indicators_for_day(
    prices: List[float], volumes: List[float], lookback: int = 20
) -> Dict:
    """Calculate technical indicators based on past data (no look-ahead)."""
    if len(prices) < lookback + 1:
        return {}

    # Use only past data (exclude last day)
    past_prices = prices[:-1]
    past_volumes = volumes[:-1] if volumes else [0] * (len(prices) - 1)

    try:
        # RSI (14-day)
        deltas = np.diff(past_prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains[-14:]) if len(gains) >= 14 else 0
        avg_loss = np.mean(losses[-14:]) if len(losses) >= 14 else 0
        rs = avg_gain / (avg_loss + 1e-10)
        rsi = 100 - (100 / (1 + rs))

        # SMA ratios
        sma_5 = np.mean(past_prices[-5:]) if len(past_prices) >= 5 else past_prices[-1]
        sma_10 = (
            np.mean(past_prices[-10:]) if len(past_prices) >= 10 else past_prices[-1]
        )
        sma_20 = (
            np.mean(past_prices[-20:]) if len(past_prices) >= 20 else past_prices[-1]
        )

        # Current price vs SMAs
        current_price = past_prices[-1]
        price_vs_sma5 = (current_price - sma_5) / (sma_5 + 1e-10)
        price_vs_sma20 = (current_price - sma_20) / (sma_20 + 1e-10)
        sma5_vs_sma20 = (sma_5 - sma_20) / (sma_20 + 1e-10)

        # Momentum (price change over past 5 days)
        momentum_5 = (
            (past_prices[-1] - past_prices[-6]) / (past_prices[-6] + 1e-10)
            if len(past_prices) >= 6
            else 0
        )

        # Volatility
        volatility = (
            np.std(past_prices[-10:]) / (np.mean(past_prices[-10:]) + 1e-10)
            if len(past_prices) >= 10
            else 0
        )

        # Volume ratio (avg last 5 days vs prior 10 days)
        avg_vol_5 = np.mean(past_volumes[-5:]) if len(past_volumes) >= 5 else 1
        avg_vol_10 = np.mean(past_volumes[-15:-5]) if len(past_volumes) >= 15 else 1
        volume_ratio = avg_vol_5 / (avg_vol_10 + 1e-10)

        # Bollinger Band position
        bb_upper = sma_20 + 2 * np.std(past_prices[-20:])
        bb_lower = sma_20 - 2 * np.std(past_prices[-20:])
        bb_position = (
            (current_price - bb_lower) / (bb_upper - bb_lower + 1e-10)
            if bb_upper > bb_lower
            else 0.5
        )

        return {
            "rsi": rsi,
            "price_vs_sma5": price_vs_sma5,
            "price_vs_sma20": price_vs_sma20,
            "sma5_vs_sma20": sma5_vs_sma20,
            "momentum_5": momentum_5,
            "volatility": volatility,
            "volume_ratio": volume_ratio,
            "bb_position": bb_position,
        }
    except Exception as e:
        return {}


def create_training_data(symbol: str) -> Tuple[np.ndarray, np.ndarray]:
    """Create training data for a single stock - paper trading style.

    For each day, we calculate indicators based on PAST data,
    then label is whether price went UP or DOWN the NEXT day.
    """
    history = get_stock_history(symbol, days=500)
    if len(history) < 50:
        return np.array([]), np.array([])

    prices = [h["close"] for h in history]
    volumes = [h.get("volume", 0) for h in history]

    X_list = []
    y_list = []

    # For each day, create features from past data and label from next day
    for i in range(20, len(prices) - 1):
        past_prices = prices[: i + 1]
        past_volumes = volumes[: i + 1]

        indicators = calculate_indicators_for_day(past_prices, past_volumes)
        if not indicators:
            continue

        # Feature vector
        features = [
            indicators.get("rsi", 50) / 100,  # Normalize RSI
            indicators.get("price_vs_sma5", 0),
            indicators.get("price_vs_sma20", 0),
            indicators.get("sma5_vs_sma20", 0),
            indicators.get("momentum_5", 0),
            indicators.get("volatility", 0),
            indicators.get("volume_ratio", 1),
            indicators.get("bb_position", 0.5),
        ]

        # Label: 1 if price went UP next day, 0 if down
        if prices[i] == 0 or prices[i + 1] == 0:
            continue
        next_day_return = (prices[i + 1] - prices[i]) / prices[i]
        label = 1 if next_day_return > 0 else 0

        X_list.append(features)
        y_list.append(label)

    return np.array(X_list), np.array(y_list)


def train_model():
    """Train the model on all available stocks."""
    if not os.path.exists(DB_PATH):
        logger.error("Database not found")
        return None

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all symbols with enough data
    cursor.execute("""
        SELECT symbol, COUNT(*) as cnt
        FROM stock_prices
        GROUP BY symbol
        HAVING cnt > 100
    """)
    symbols = [row[0] for row in cursor.fetchall()]
    conn.close()

    logger.info(f"Training on {len(symbols)} stocks...")

    all_X = []
    all_y = []

    for i, symbol in enumerate(symbols):
        X, y = create_training_data(symbol)
        if len(X) > 0:
            all_X.append(X)
            all_y.append(y)

        if (i + 1) % 50 == 0:
            logger.info(f"Processed {i + 1}/{len(symbols)} stocks")

    if not all_X:
        logger.error("No training data available")
        return None

    # Combine all data
    X_train = np.vstack(all_X)
    y_train = np.concatenate(all_y)

    logger.info(f"Total training samples: {len(X_train)}")
    logger.info(
        f"Class distribution: UP={sum(y_train)}, DOWN={len(y_train) - sum(y_train)}"
    )

    # Train Random Forest (simple and robust)
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split

        # Split for validation
        X_tr, X_val, y_tr, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42
        )

        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=10,
            random_state=42,
            n_jobs=-1,
        )

        model.fit(X_tr, y_tr)

        # Evaluate
        train_acc = model.score(X_tr, y_tr)
        val_acc = model.score(X_val, y_val)

        logger.info(f"Training accuracy: {train_acc:.2%}")
        logger.info(f"Validation accuracy: {val_acc:.2%}")

        # Retrain on all data for predictions
        model.fit(X_train, y_train)

        # Save model
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)

        logger.info(f"Model saved to {MODEL_PATH}")
        return model

    except ImportError:
        logger.error("sklearn not installed. Run: pip install scikit-learn")
        return None


def load_model():
    """Load trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        return None

    try:
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    except Exception:
        return None


def predict_next_day(symbol: str) -> Dict:
    """Predict next day's price movement for a stock."""
    model = load_model()
    if model is None:
        return {"error": "Model not trained", "prediction": None}

    history = get_stock_history(symbol, days=100)
    if len(history) < 25:
        return {"error": "Insufficient data", "prediction": None}

    prices = [h["close"] for h in history]
    volumes = [h.get("volume", 0) for h in history]

    # Calculate features for current state
    indicators = calculate_indicators_for_day(prices, volumes)
    if not indicators:
        return {"error": "Cannot calculate indicators", "prediction": None}

    features = np.array(
        [
            [
                indicators.get("rsi", 50) / 100,
                indicators.get("price_vs_sma5", 0),
                indicators.get("price_vs_sma20", 0),
                indicators.get("sma5_vs_sma20", 0),
                indicators.get("momentum_5", 0),
                indicators.get("volatility", 0),
                indicators.get("volume_ratio", 1),
                indicators.get("bb_position", 0.5),
            ]
        ]
    )

    # Predict
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]

    # Get current price
    current_price = prices[-1]

    return {
        "symbol": symbol,
        "current_price": float(current_price),
        "prediction": "UP" if prediction == 1 else "DOWN",
        "confidence": float(max(probability)),
        "prob_up": float(probability[1]),
        "prob_down": float(probability[0]),
        "indicators": {k: float(v) for k, v in indicators.items()},
    }


def train_if_needed():
    """Train model if not exists or outdated."""
    if not os.path.exists(MODEL_PATH):
        logger.info("Training new model...")
        return train_model()

    # Check if model is old (> 1 day)
    model_time = os.path.getmtime(MODEL_PATH)
    age_days = (datetime.now().timestamp() - model_time) / 86400

    if age_days > 1:
        logger.info(f"Model is {age_days:.1f} days old, retraining...")
        return train_model()

    logger.info("Using existing model")
    return load_model()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Train model
    model = train_if_needed()

    if model:
        # Test predictions
        test_stocks = ["NABIL", "ADBL", "NICBF"]
        for symbol in test_stocks:
            result = predict_next_day(symbol)
            print(f"\n{symbol}:")
            print(f"  Current: Rs. {result.get('current_price', 'N/A')}")
            print(
                f"  Prediction: {result.get('prediction', 'N/A')} (confidence: {result.get('confidence', 0):.1%})"
            )
    else:
        print("Failed to train model")
