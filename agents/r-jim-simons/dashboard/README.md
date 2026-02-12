# R.Jim Simons Live Dashboard

## Overview

A professional web application for real-time trading strategy visualization with:
- ⚡ Live TradingView Lightweight Charts
- 📊 Real-time equity curve tracking
- 🎯 Live signal feed with Kelly position sizing
- 📈 Portfolio metrics (Sharpe, win rate, drawdown)
- 💚 VWAP Mean Reversion strategy visualization

## Quick Start

```bash
# 1. Navigate to dashboard
cd /home/issac-asimov/.openclaw/workspace/agents/r-jim-simons/dashboard

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
python api.py

# 4. Open browser to http://localhost:8080
```

## Features

### 📈 Live Chart
- VWAP with Bollinger Bands (±2σ)
- Candlestick data in real-time
- Signal markers (BUY/SELL)
- Support for BTC, ETH, SOL, AVAX on 1H/4H/1D timeframes

### 💼 Portfolio Dashboard
- **Total P&L:** Real-time profit/loss tracking
- **Daily P&L:** Today's performance
- **Win Rate:** Live calculation from trades
- **Sharpe Ratio:** Risk-adjusted returns

### 🔔 Signal Feed
Each signal shows:
- Action (BUY/SELL)
- Asset & Price
- Confidence Score
- Kelly Position Size (%)
- Timestamp

### 🛡️ Risk Dashboard
- Daily drawdown tracking with visual bars
- Portfolio heat (exposure %)
- Kelly efficiency indicator
- Circuit breaker status

## TradingView Integration

### Pine Script Webhook
```javascript
// Add to your Pine Script strategy
alertcondition(longCondition, "VWAP Long", 
    '{"action":"BUY","ticker":"{{ticker}}","price":{{close}}}')

// Webhook URL
// POST http://your-server:8080/api/signal
```

### Webhook Payload Format
```json
{
  "action": "BUY",
  "ticker": "BTCUSDT", 
  "price": 45000.50,
  "timestamp": "2026-02-11T17:00:00Z",
  "vwap": 44800.00,
  "deviation": 2.0,
  "confidence": 0.85
}
```

## Kelly Criterion Integration

All position sizing calculations route through GLM-5:

```python
# Example: Calculate position size
kelly = glm5_calculate_kelly(
    win_rate=0.58,      # From backtest
    avg_win=0.03,       # Historical avg win
    avg_loss=0.015      # Historical avg loss
)

# Returns:
# {
#   "kelly_fraction": 0.40,
#   "fractional_kelly_025": 0.10,  # Use this
#   "position_pct": 10.0,
#   "edge": 0.015
# }
```

## Asset Universe

✅ **Approved (Tier 1-3):**
- BTC, ETH
- SOL, AVAX, NEAR, BNB
- ARB, OP, BASE, MATIC

🚫 **Rejected:**
- Market cap <$1B
- Meme coins
- Trending garbage

## Configuration

### Environment Variables

Create `.env` file:
```bash
OLLAMA_API_KEY=your_key
OLLAMA_BASE_URL=http://localhost:11434

# Optional
PORT=8080
DB_PATH=../r-jim-simons.db
```

### Risk Controls

Edit in `api.py`:
```python
DAILY_DRAWDOWN_LIMIT = 0.05      # -5% halt
MAX_POSITION_PCT = 0.10         # 10% per asset
PORTFOLIO_HEAT_LIMIT = 0.30    # 30% max exposure
MIN_RR_RATIO = 1.5              # Min risk/reward
```

## Real-Time Updates

The dashboard uses WebSocket for live updates:
- Portfolio value (every 1s)
- New signals (instant)
- Position P&L (every 5s)
- Market data (tick-by-tick)

## Metrics Explained

| Metric | Description | Target |
|--------|-------------|--------|
| **Sharpe** | Risk-adjusted return | >1.0 |
| **Win Rate** | % profitable trades | >55% |
| **Kelly** | Optimal bet sizing | 0.25x full Kelly |
| **Heat** | Portfolio at risk | <30% |
| **Drawdown** | Peak-to-trough decline | <15% |

## Dr. Simons' Principles in UI

1. **Green = Good:** All metrics green when targets met
2. **Red = Stop:** Red alerts for circuit breakers
3. **Kelly %:** Shown on every signal
4. **At-a-glance:** Portfolio status visible in header
5. **No clutter:** Only actionable information

## Development

```bash
# Run with auto-reload
uvicorn api:app --reload --port 8080

# Debug mode
LOG_LEVEL=debug python api.py
```

## Production Deployment

```bash
# Using systemd
sudo systemctl enable rjim-dashboard
sudo systemctl start rjim-dashboard

# Using Docker
docker-compose up -d
```

---

*"The best interface shows you exactly what you need to make the trade. Nothing more."* — R.Jim Simons
