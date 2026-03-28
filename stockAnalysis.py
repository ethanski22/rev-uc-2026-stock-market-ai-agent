import os
import numpy as np
import yfinance as yf
from openai import OpenAI
from dotenv import load_dotenv

from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator

load_dotenv()

featherless_api_key = os.getenv("FEATHERLESS_API_KEY")

# -----------------------
# DATA FETCHING
# -----------------------
def get_stock_data(ticker):
    stock = yf.Ticker(ticker)
    df = stock.history(period="5d", interval="5m")
    df = df.dropna()
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

    # -----------------------------
    # Handle missing data
    # -----------------------------
    if np.isnan(rsi) or np.isnan(sma_20) or np.isnan(sma_50):
        return {
            "signal": "HOLD",
            "buy_pct": 33.3,
            "hold_pct": 33.4,
            "sell_pct": 33.3,
            "indicators": {
                "rsi": float(rsi) if not np.isnan(rsi) else 0,
                "sma_20": float(sma_20) if not np.isnan(sma_20) else 0,
                "sma_50": float(sma_50) if not np.isnan(sma_50) else 0,
            },
            "reasons": ["Insufficient data"],
        }

    # -----------------------------
    # FEATURE ENGINEERING (THIS is the model part)
    # -----------------------------

    # RSI normalized to [-1, 1]
    rsi_score = (50 - rsi) / 50
    rsi_score = np.clip(rsi_score, -1, 1)

    if rsi < 30:
        reasons.append("RSI strongly bullish (oversold)")
    elif rsi > 70:
        reasons.append("RSI strongly bearish (overbought)")
    else:
        reasons.append("RSI neutral")

    # SMA trend strength (not just direction)
    sma_score = np.tanh((sma_20 - sma_50) / sma_50)
    sma_score = np.clip(sma_score * 5, -1, 1)  # amplify small differences

    if sma_20 > sma_50:
        reasons.append("Uptrend detected (SMA20 > SMA50)")
    else:
        reasons.append("Downtrend detected (SMA20 < SMA50)")

    # Volume feature (if available)
    vol_score = 0
    if "Volume" in df.columns:
        avg_volume = df["Volume"].rolling(window=20).mean().iloc[-1]
        current_volume = latest["Volume"]

        if not np.isnan(avg_volume) and avg_volume > 0:
            vol_score = (current_volume - avg_volume) / avg_volume
            vol_score = np.clip(vol_score, -1, 1)

            if vol_score > 0.5:
                reasons.append("High volume spike (uncertainty)")
            else:
                reasons.append("Normal volume")

    # -----------------------------
    # LINEAR MODEL (this replaces your scoring system)
    # -----------------------------

    signal_strength = (
        0.45 * rsi_score +
        0.45 * sma_score +
        0.10 * vol_score
    )

    # -----------------------------
    # Convert to probabilities
    # -----------------------------
    buy_prob = sigmoid(signal_strength)
    sell_prob = sigmoid(-signal_strength)
    hold_prob = 1 - abs(signal_strength)

    # normalize
    total = buy_prob + sell_prob + hold_prob

    buy_pct = round((buy_prob / total) * 100, 2)
    sell_pct = round((sell_prob / total) * 100, 2)
    hold_pct = round((hold_prob / total) * 100, 2)

    signal = max(
        [("BUY", buy_pct), ("SELL", sell_pct), ("HOLD", hold_pct)],
        key=lambda x: x[1]
    )[0]

    return {
        "signal": signal,
        "buy_pct": buy_pct,
        "hold_pct": hold_pct,
        "sell_pct": sell_pct,
        "signal_strength": float(signal_strength),
        "indicators": {
            "rsi": float(rsi),
            "sma_20": float(sma_20),
            "sma_50": float(sma_50),
        },
        "reasons": reasons,
    }


# -----------------------
# HUMAN EXPLANATION (NO LLM)
# -----------------------
def generate_explanation(ticker, signal_data):
    return f"""
Stock: {ticker}

Final Signal: {signal_data['signal']}

Probabilities:
- Buy: {signal_data['buy_pct']}%
- Hold: {signal_data['hold_pct']}%
- Sell: {signal_data['sell_pct']}%

Key Indicators:
- RSI: {round(signal_data['indicators']['rsi'], 2)}
- SMA20: {round(signal_data['indicators']['sma_20'], 2)}
- SMA50: {round(signal_data['indicators']['sma_50'], 2)}

Decision Factors:
- {"; ".join(signal_data['reasons'])}

Summary:
This model uses technical indicators (RSI, SMA trends, and volume)
to estimate market momentum and trend direction. It does not use news or sentiment.
"""


# -----------------------
# LLM EXPLANATION (OPTIONAL)
# -----------------------
client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=featherless_api_key,
)

def generate_explanation_ai(ticker, signal_data):
    prompt = f"""
You are a quantitative finance assistant.

Explain the trading signal clearly and concisely.

Do NOT give financial advice.

Stock: {ticker}

Signal: {signal_data['signal']}

Probabilities:
- Buy: {signal_data['buy_pct']}%
- Hold: {signal_data['hold_pct']}%
- Sell: {signal_data['sell_pct']}%

Indicators:
- RSI: {round(signal_data['indicators']['rsi'], 2)}
- SMA20: {round(signal_data['indicators']['sma_20'], 2)}
- SMA50: {round(signal_data['indicators']['sma_50'], 2)}

Reasons:
{", ".join(signal_data['reasons'])}

Task:
Explain why this signal was generated using only technical indicators.
"""

    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-8B-Instruct",
        messages=[
            {"role": "system", "content": "You are a helpful quantitative finance assistant."},
            {"role": "user", "content": prompt},
        ],
    )

    return response.model_dump()["choices"][0]["message"]["content"]


# -----------------------
# MAIN PIPELINE
# -----------------------
def run_analysis(ticker):
    df = get_stock_data(ticker)
    df = compute_indicators(df)

    signal_data = generate_signal(df)

    explanation = generate_explanation(ticker, signal_data)
    explanation_ai = generate_explanation_ai(ticker, signal_data)

    print(explanation)
    print("\n--- AI EXPLANATION ---\n")
    print(explanation_ai)


# -----------------------
# RUN
# -----------------------
stock_to_check = input("Enter stock ticker to analyze: ").upper()
run_analysis(stock_to_check)