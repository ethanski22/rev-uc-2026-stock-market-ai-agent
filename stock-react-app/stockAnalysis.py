import os
import sys
import json
import numpy as np
import yfinance as yf
from dotenv import load_dotenv
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator

load_dotenv()

# -----------------------
# DATA FETCHING
# -----------------------
def get_stock_data(ticker):
    stock = yf.Ticker(ticker)
    df = stock.history(period="90d", interval="1d")
    df = df.dropna()
    if df.empty:
        raise ValueError(f"No price data found for {ticker}")
    return df


# -----------------------
# TECHNICAL INDICATORS
# -----------------------
def compute_indicators(df):
    df["rsi"] = RSIIndicator(close=df["Close"], window=14).rsi()
    df["sma_20"] = SMAIndicator(close=df["Close"], window=20).sma_indicator()
    df["sma_50"] = SMAIndicator(close=df["Close"], window=50).sma_indicator()
    return df


# -----------------------
# SIGNAL ENGINE
# -----------------------
def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate_signal(df):
    latest = df.iloc[-1]
    reasons = []

    rsi = latest["rsi"]
    sma_20 = latest["sma_20"]
    sma_50 = latest["sma_50"]

    if np.isnan(rsi) or np.isnan(sma_20) or np.isnan(sma_50):
        return {
            "signal": "HOLD",
            "buy_pct": 33.3,
            "hold_pct": 33.4,
            "sell_pct": 33.3,
            "indicators": {"rsi": float(rsi) if not np.isnan(rsi) else 0, "sma_20": float(sma_20) if not np.isnan(sma_20) else 0, "sma_50": float(sma_50) if not np.isnan(sma_50) else 0},
            "reasons": ["Insufficient data"],
        }

    rsi_score = np.clip((50 - rsi) / 50, -1, 1)

    if rsi < 30:
        reasons.append("RSI strongly bullish (oversold)")
    elif rsi > 70:
        reasons.append("RSI strongly bearish (overbought)")
    else:
        reasons.append("RSI neutral")

    sma_score = np.clip(np.tanh((sma_20 - sma_50) / sma_50) * 5, -1, 1)
    reasons.append("Uptrend detected (SMA20 > SMA50)" if sma_20 > sma_50 else "Downtrend detected (SMA20 < SMA50)")

    vol_score = 0
    if "Volume" in df.columns:
        avg_volume = df["Volume"].rolling(window=20).mean().iloc[-1]
        current_volume = latest["Volume"]
        if not np.isnan(avg_volume) and avg_volume > 0:
            vol_score = np.clip((current_volume - avg_volume) / avg_volume, -1, 1)
            if vol_score > 0.5:
                reasons.append("High volume spike (uncertainty)")
            else:
                reasons.append("Normal volume")

    signal_strength = 0.45 * rsi_score + 0.45 * sma_score + 0.10 * vol_score
    buy_prob = sigmoid(signal_strength)
    sell_prob = sigmoid(-signal_strength)
    hold_prob = 1 - abs(signal_strength)

    total = buy_prob + sell_prob + hold_prob
    buy_pct = round((buy_prob / total) * 100, 2)
    sell_pct = round((sell_prob / total) * 100, 2)
    hold_pct = round((hold_prob / total) * 100, 2)

    signal = max([("BUY", buy_pct), ("SELL", sell_pct), ("HOLD", hold_pct)], key=lambda x: x[1])[0]

    return {
        "signal": signal,
        "buy_pct": buy_pct,
        "hold_pct": hold_pct,
        "sell_pct": sell_pct,
        "signal_strength": float(signal_strength),
        "indicators": {"rsi": float(rsi), "sma_20": float(sma_20), "sma_50": float(sma_50)},
        "reasons": reasons,
    }


def generate_explanation(ticker, signal_data):
    return f"Signal for {ticker}: {signal_data['signal']} (RSI={signal_data['indicators']['rsi']:.2f}, SMA20={signal_data['indicators']['sma_20']:.2f}, SMA50={signal_data['indicators']['sma_50']:.2f})"


def run_analysis(ticker):
    df = get_stock_data(ticker)
    df = compute_indicators(df)
    signal_data = generate_signal(df)
    return {
        "ticker": ticker,
        "probabilities": {"buy": signal_data["buy_pct"], "hold": signal_data["hold_pct"], "sell": signal_data["sell_pct"]},
        "signal": signal_data["signal"],
        "indicators": signal_data["indicators"],
        "reasons": signal_data["reasons"],
        "explanation": generate_explanation(ticker, signal_data),
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        stock_symbol = sys.argv[1].upper()
    else:
        stock_symbol = input("Enter stock ticker to analyze: ").strip().upper()

    try:
        result = run_analysis(stock_symbol)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
