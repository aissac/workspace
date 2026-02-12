# Phase 1 MVP: Quantitative Crypto Trading System
## R.Jim Simons - TradingView Edition

---

## Executive Summary

This document outlines a production-grade, mathematically rigorous cryptocurrency trading system leveraging TradingView's Pine Script infrastructure with institutional-grade risk management.

**Core Philosophy:** *"We're not predicting the future. We're extracting small, persistent edges from market inefficiencies through rigorous statistical methods."*

---

## Asset Universe (STRICTLY ENFORCED)

### Tier 1: Core Holdings
- BTC, ETH

### Tier 2: Established L1s  
- SOL, AVAX, NEAR, BNB

### Tier 3: Major L2s
- ARB, OP, BASE, MATIC

**Excluded:** Market cap <$1B, meme coins, trending garbage

---

## System Architecture

```
TradingView Pine Script
       ↓
Webhook Alert (JSON)
       ↓
n8n Receiver → Python FastAPI
       ↓
GLM-5 Math Engine (Kelly, VaR)
       ↓
Telegram → 1inch/Flashbots
```

---

## Pine Script Strategy: Mean Reversion

```pinescript
//@version=6
strategy("VWAP Mean Reversion", overlay=true)

// Parameters
vwapLength = input.int(50, "VWAP Lookback")
deviationThreshold = input.float(2.0, "Std Dev Threshold")
trendFilterPeriod = input.int(50, "Trend EMA")

// Calculations
vwap = ta.vwap(hlc3)
vwapStdDev = ta.stdev(hlc3, vwapLength)
upperBand = vwap + (vwapStdDev * deviationThreshold)
lowerBand = vwap - (vwapStdDev * deviationThreshold)
trendEMA = ta.ema(close, trendFilterPeriod)
trendBull = close > trendEMA

// Signal Logic  
longCondition = close < lowerBand and trendBull and close > close[1]

// Execution
if longCondition and strategy.position_size == 0
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", limit=vwap, stop=close * 0.97)

// Webhook Alert
alertcondition(longCondition, "VWAP Long", 
    '{"action":"BUY","ticker":"{{ticker}}","price":{{close}}}')
```

**Backtest Requirements:**
- 500+ trades, 2+ years
- Win rate ≥55%
- Profit factor ≥1.4
- Max drawdown <15%
- Sharpe >1.0

---

## GLM-5 Math Engine

All calculations route through GLM-5 for precision:

```python
# Kelly Criterion sizing
def calculate_kelly(win_rate, avg_win, avg_loss):
    prompt = f"""Calculate Kelly Criterion:
    - Win rate: {win_rate}
    - Average win: {avg_win}
    - Average loss: {avg_loss}
    Return fractional Kelly (0.25x) position size."""
    
    return ollama.run("glm-5:cloud", prompt)

# Result: {"kelly_fraction": 0.10, "position_pct": 10%}
```

---

## Risk Framework

| Limit | Value | Action |
|-------|-------|--------|
| Daily Drawdown | -5% | Halt trading 24h |
| Position/Asset | 10% | Kelly-based |
| Portfolio Heat | 30% | Max exposure |
| R/R Minimum | 1.5:1 | Required |
| Time Stop | 48h | Close if no target |

---

## Execution Flow

1. **Pine Script** detects mean reversion signal
2. **Webhook** fires to n8n
3. **Python** validates symbol in whitelist
4. **GLM-5** calculates Kelly position size
5. **Telegram** sends alert with: asset, entry, stop, target, size
6. **User** executes via 1inch with Flashbots RPC
7. **Database** logs trade for performance tracking

---

## Phase 1 Timeline

- **Week 1-2:** Deploy GLM-5, webhook receiver
- **Week 3-4:** Pine Script, TradingView backtest
- **Week 5-6:** Paper trading, GLM-5 integration
- **Week 7-8:** Live trading with small allocation

---

**Dr. Simons' Final Word:** *"Backtest everything. No meme coins. Let the math decide."*
