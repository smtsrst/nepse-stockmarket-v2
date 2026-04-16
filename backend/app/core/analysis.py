"""
Technical Analysis - Indicators and signal generation.
"""

from typing import List, Dict, Optional
import pandas as pd
import numpy as np


def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Calculate RSI (Relative Strength Index)."""
    if len(prices) < period + 1:
        return None

    try:
        df = pd.DataFrame(prices, columns=["price"])
        delta = df["price"].diff()

        gain = delta.where(delta > 0, 0)
        loss = (-delta).where(delta < 0, 0)

        avg_gain = gain.ewm(span=period, adjust=False).mean()
        avg_loss = loss.ewm(span=period, adjust=False).mean()

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return round(rsi.iloc[-1], 2)
    except Exception:
        return None


def calculate_macd(
    prices: List[float],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> Dict[str, Optional[float]]:
    """Calculate MACD (Moving Average Convergence Divergence)."""
    if len(prices) < slow_period + signal_period:
        return {"macd": None, "signal": None, "histogram": None}

    try:
        df = pd.DataFrame(prices, columns=["price"])

        ema_fast = df["price"].ewm(span=fast_period, adjust=False).mean()
        ema_slow = df["price"].ewm(span=slow_period, adjust=False).mean()

        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
        histogram = macd_line - signal_line

        return {
            "macd": round(macd_line.iloc[-1], 2),
            "signal": round(signal_line.iloc[-1], 2),
            "histogram": round(histogram.iloc[-1], 2),
        }
    except Exception:
        return {"macd": None, "signal": None, "histogram": None}


def calculate_sma(prices: List[float], period: int) -> Optional[float]:
    """Calculate Simple Moving Average."""
    if len(prices) < period:
        return None

    try:
        return round(sum(prices[-period:]) / period, 2)
    except Exception:
        return None


def calculate_bollinger_bands(
    prices: List[float], period: int = 20, std_dev: float = 2.0
) -> Dict[str, Optional[float]]:
    """Calculate Bollinger Bands."""
    if len(prices) < period:
        return {"upper": None, "middle": None, "lower": None}

    try:
        df = pd.DataFrame(prices, columns=["price"])

        sma = df["price"].rolling(window=period).mean()
        std = df["price"].rolling(window=period).std()

        upper = sma + (std * std_dev)
        middle = sma
        lower = sma - (std * std_dev)

        return {
            "upper": round(upper.iloc[-1], 2),
            "middle": round(middle.iloc[-1], 2),
            "lower": round(lower.iloc[-1], 2),
        }
    except Exception:
        return {"upper": None, "middle": None, "lower": None}


def generate_recommendation(
    rsi: Optional[float],
    macd_histogram: Optional[float],
    price: float,
    sma_20: Optional[float],
    sma_50: Optional[float],
    sma_200: Optional[float],
    bb_upper: Optional[float],
    bb_lower: Optional[float],
    volume_ratio: Optional[float] = None,
) -> str:
    """Generate BUY/SELL/HOLD recommendation based on multiple indicators."""
    buy_signals = 0
    sell_signals = 0
    signal_details = []

    # RSI signals (momentum)
    if rsi is not None:
        if rsi < 30:
            buy_signals += 2  # Strong oversold
            signal_details.append(f"RSI={rsi:.1f} (oversold)")
        elif rsi < 40:
            buy_signals += 1
            signal_details.append(f"RSI={rsi:.1f} (neutral-low)")
        elif rsi > 70:
            sell_signals += 2  # Strong overbought
            signal_details.append(f"RSI={rsi:.1f} (overbought)")
        elif rsi > 60:
            sell_signals += 1
            signal_details.append(f"RSI={rsi:.1f} (neutral-high)")

    # MACD signals (trend)
    if macd_histogram is not None:
        if macd_histogram > 0:
            buy_signals += 1
            signal_details.append(f"MACD histogram +{macd_histogram:.2f} (bullish)")
        elif macd_histogram < 0:
            sell_signals += 1
            signal_details.append(f"MACD histogram {macd_histogram:.2f} (bearish)")

    # Moving average signals (trend)
    if sma_20 and sma_50:
        if price > sma_20 > sma_50:
            buy_signals += 1
            signal_details.append("Price > SMA20 > SMA50 (uptrend)")
        elif price < sma_20 < sma_50:
            sell_signals += 1
            signal_details.append("Price < SMA20 < SMA50 (downtrend)")

    # Golden/Death Cross (long-term trend)
    if sma_50 and sma_200:
        if sma_50 > sma_200:
            buy_signals += 1
            signal_details.append("SMA50 > SMA200 (golden cross)")
        elif sma_50 < sma_200:
            sell_signals += 1
            signal_details.append("SMA50 < SMA200 (death cross)")

    # Bollinger Bands (mean reversion)
    if bb_upper and bb_lower and price:
        band_width = bb_upper - bb_lower
        if price <= bb_lower:
            buy_signals += 1
            signal_details.append("Price at lower Bollinger Band")
        elif price >= bb_upper:
            sell_signals += 1
            signal_details.append("Price at upper Bollinger Band")

    # Volume confirmation
    if volume_ratio is not None:
        if volume_ratio > 1.5 and buy_signals > 0:
            buy_signals += 1  # High volume + bullish = stronger signal
            signal_details.append(f"High volume ({volume_ratio:.1f}x)")
        elif volume_ratio > 1.5 and sell_signals > 0:
            sell_signals += 1
            signal_details.append(f"High volume ({volume_ratio:.1f}x)")

    # Determine recommendation
    if buy_signals >= 3 and buy_signals > sell_signals + 1:
        return "STRONG_BUY"
    elif buy_signals > sell_signals:
        return "BUY"
    elif sell_signals >= 3 and sell_signals > buy_signals + 1:
        return "STRONG_SELL"
    elif sell_signals > buy_signals:
        return "SELL"
    else:
        return "HOLD"


def analyze_stock(
    symbol: str,
    current_price: float,
    price_history: List[float],
) -> Dict[str, any]:
    """Perform complete technical analysis on a stock."""
    if len(price_history) < 50:
        return {"symbol": symbol, "error": "Insufficient data for analysis"}

    # Calculate indicators
    rsi = calculate_rsi(price_history)
    macd = calculate_macd(price_history)
    sma_20 = calculate_sma(price_history, 20)
    sma_50 = calculate_sma(price_history, 50)
    sma_200 = calculate_sma(price_history, 200) if len(price_history) >= 200 else None
    bollinger = calculate_bollinger_bands(price_history)

    # Generate recommendation (with Bollinger Bands)
    recommendation = generate_recommendation(
        rsi=rsi,
        macd_histogram=macd.get("histogram"),
        price=current_price,
        sma_20=sma_20,
        sma_50=sma_50,
        sma_200=sma_200,
        bb_upper=bollinger.get("upper"),
        bb_lower=bollinger.get("lower"),
        volume_ratio=None,  # Can add volume data later
    )

    return {
        "symbol": symbol,
        "rsi": rsi,
        "macd": macd.get("macd"),
        "macd_signal": macd.get("signal"),
        "macd_histogram": macd.get("histogram"),
        "sma_20": sma_20,
        "sma_50": sma_50,
        "sma_200": sma_200,
        "bollinger_upper": bollinger.get("upper"),
        "bollinger_middle": bollinger.get("middle"),
        "bollinger_lower": bollinger.get("lower"),
        "recommendation": recommendation,
    }
