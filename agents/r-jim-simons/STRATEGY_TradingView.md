# R.Jim Simons — TradingView Edition
## Phase 1 MVP: Systematic Mean Reversion Strategy

**Last Updated:** 2026-02-11  
**Status:** Architecture Redesign Complete

---

## 🚫 MEME COIN EXCLUSION POLICY

**NO EXCEPTIONS.** The following are automatically rejected:
- All coins with "dog", "pepe", "shib", "floki", "elon", "moon" in the name
- Any token <$1B market cap
- Any token <90 days on TradingView
- Trending pump-and-dump schemes
- AI-generated tokens

**APPROVED UNIVERSE:**
| Tier | Assets |
|------|--------|
| **Tier 1** | BTC, ETH |
| **Tier 2** | SOL, AVAX, NEAR, BNB |
| **Tier 3** | ARB, OP, BASE, MATIC |

---

## TradingView Strategy

### Pine Script: Simons_MeanReversion_v1

```pinescript
//@version=5
strategy("Simons_MeanReversion_v1", 
         overlay=true, 
         initial_capital=10000,
         default_qty_type=strategy.percent_of_equity,
         default_qty_value=10,
         commission_type=strategy.commission.percent,
         commission_value=0.1)

// === PARAMETERS ===
rsiLength = input.int(14, "RSI Length", minval=5, maxval=30)
bbLength = input.int(20, "BB Length", minval=10, maxval=50)
bbMult = input.float(2.0, "BB Std Dev", minval=1.0, maxval=4.0)
atrLength = input.int(14, "ATR Length", minval=5, maxval=30)
riskReward = input.float(1.5, "Min R/R Ratio", minval=1.0, maxval=3.0)

// === DAILY TREND FILTER ===
// Only trade with the higher timeframe trend
// Daily candle data for trend direction
isDailyBull = request.security(syminfo.tickerid, "D", close > ta.sma(close, 50))
isDailyBear = request.security(syminfo.tickerid, "D", close < ta.sma(close, 50))

// === INDICATORS ===
rsi = ta.rsi(close, rsiLength)
bb = ta.bb(close, bbLength, bbMult)
bbUpper = bb[0]   // Upper band
bbLower = bb[2]   // Lower band
bbWidth = (bbUpper - bbLower) / bbLower  // Bandwidth %
atr = ta.atr(atrLength)

// === ENTRY CONDITIONS ===
// Mean reversion in oversold conditions, with trend
oversold = rsi < 35 and close < bbLower and isDailyBull
overbought = rsi > 65 and close > bbUpper and isDailyBear

// Avoid choppy markets (BB width filters)
// bbWidth > 0.05 ensures some volatility

// === STOP LOSS & TAKE PROFIT ===
// Dynamic based on ATR for volatility-adjustment
longStop = close - (1.5 * atr)
longTarget = close + (1.5 * atr * riskReward)
shortStop = close + (1.5 * atr)
shortTarget = close - (1.5 * atr * riskReward)

// === EXECUTION ===
if (oversold and barstate.isconfirmed and strategy.position_size == 0)
    strategy.entry("Long", strategy.long)
    strategy.exit("LongExit", "Long", stop=longStop, limit=longTarget)

if (overbought and barstate.isconfirmed and strategy.position_size == 0)
    strategy.entry("Short", strategy.short)
    strategy.exit("ShortExit", "Short", stop=shortStop, limit=shortTarget)

// === WEBHOOK ALERT ===
alertMessage = oversold ? 
    '{"action":"BUY","ticker":"' + syminfo.ticker + 
    '","price":' + str.tostring(close) + 
    ',"stop":' + str.tostring(longStop) + 
    ',"target":' + str.tostring(longTarget) + '}' :
    overbought ?
    '{"action":"SELL","ticker":"' + syminfo.ticker + 
    '","price":' + str.tostring(close) + 
    ',"stop":' + str.tostring(shortStop) + 
    ',"target":' + str.tostring(shortTarget) + '}' :
    ""

if (alertMessage != "")
    alert(alertMessage, alert.freq_once_per_bar_close)

// === VISUALS ===
plot(bbUpper, "BB Upper", color=color.new(color.red, 50))
plot(bbLower, "BB Lower", color=color.new(color.green, 50))
plot(ta.sma(close, 50), "Daily SMA", color=color.orange)

// Background colors for signals
bgcolor(oversold ? color.new(color.green, 90) : na)
bgcolor(overbought ? color.new(color.red, 90) : na)
```

---

## Architecture Flow (CLAWARS Integration)

```
TradingView Chart
       ↓ (Pine Script detects signal)
CLAWARS Backtest Engine
       ↓
┌─────────────────────────────┐
│  Pine Script Interpreter    │
│  - Run historical backtest   │
│  - Calculate metrics         │
│  - Validate edge             │
└──────────┬──────────────────┘
           ↓
GLM-5 Math Validation
       ↓
Leaderboard Ranking
       ↓
Telegram Alert (Manual exec Phase 1)
       ↓
1inch/Matcha + Flashbots
```

**Strategies stored in:** `/clawars/strategies/`

---

## Mathematical Models (GLM-5 Powered)

All calculations route through GLM-5 for rigor:

### 1. Position Sizing (Fractional Kelly)

```python
# Call GLM-5 for calculation
result = calculate_kelly(
    win_rate=0.55,      # From TV backtest
    avg_win_pct=0.03,   # 3%
    avg_loss_pct=0.015  # 1.5%
)

# GLM-5 returns:
# {
#   "kelly_fraction": 0.40,      # 40% full Kelly
#   "fractional_kelly_025": 0.10,  # 10% of portfolio
#   "position_pct": 10.0
# }
```

### 2. Risk Management

```python
# Portfolio heat calculation
var_result = calculate_var(
    portfolio_value=10000,
    volatility=3.5,  # Daily vol %
    positions=[
        {"asset": "BTC", "size": 0.05, "correlation": 1.0},
        {"asset": "ETH", "size": 0.05, "correlation": 0.85}
    ]
)

# GLM-5 computes:
# - VaR 95%: $350
# - VaR 99%: $520
# - Correlation-adjusted
```

### 3. Strategy Validation

```python
# After 50 trades, GLM-5 evaluates:
metrics = backtest_metrics(trades)
# {
#   "sharpe_ratio": 1.2,
#   "win_rate": 0.58,
#   "expectancy": 0.015,  // 1.5% per trade
#   "profitable": "yes",
#   "proceed_to_phase2": "approved"
# }
```

---

## Webhook Payload Format

```json
{
  "action": "BUY",
  "ticker": "BTCUSDT",
  "price": 45000.00,
  "stop": 43500.00,
  "target": 47250.00,
  "timestamp": "2026-02-11T16:45:00Z",
  "strategy": "Simons_MeanReversion_v1",
  "timeframe": "1h",
  "confidence": 0.85
}
```

---

## Risk Controls (Hard Limits)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max Daily Drawdown | -5% | Halt all trading |
| Max Position/Asset | 10% | Kelly 0.25x at 40% win |
| Max Portfolio Heat | 30% | 3 positions max |
| Min R/R Ratio | 1.5 | Must be positive edge |
| Max Slippage | 0.5% | Flashbots protect |
| Time Stop | 48h | Close if no target |
| Daily Signal Limit | 3 | Prevent overtrading |

---

## Backtesting Requirements

Before live capital:

1. **500+ bar backtest** on TradingView
2. **Walk-forward analysis** (last 90 days)
3. **Monte Carlo simulation** via GLM-5
4. **Minimum metrics:**
   - Win rate > 55%
   - Profit factor > 1.3
   - Sharpe > 1.0
   - Max drawdown < 15%
   - Expectancy > 0.01 (1% per trade)

---

## Execution: Phase 1 (CLAWARS Backtest → Manual)

1. Submit Pine Script to CLAWARS
2. CLAWARS runs 2-year backtest (need 500+ trades)
3. GLM-5 validates metrics (Sharpe > 1.0, win rate > 55%)
4. If approved: deploy to TradingView for live signals
5. Telegram alert sent on signal
6. **You execute manually** via 1inch + Flashbots Protect
7. Log trades in SQLite database

---

## Execution: Phase 2 (Semi-Automated)

- Python submits transaction to Flashbots
- Hardware wallet signing required
- Position tracking in database
- Auto-exit on target/stop

---

## Dr. Simons' Checklist

**Before ANY trade:**
- [ ] Asset is in Tier 1-3 whitelist
- [ ] Market cap > $1B
- [ ] Strategy backtest shows >55% win rate
- [ ] R/R > 1.5
- [ ] Position size < 10% portfolio
- [ ] Daily drawdown < -5%
- [ ] Portfolio heat < 30%

**If ANY check fails:** DO NOT TRADE.

---

## Mathematical Edge Sources

1. **Mean Reversion**: Prices revert to mean in established markets
2. **Trend Alignment**: Higher timeframe increases probability
3. **Volatility Adjustment**: ATR stops prevent noise exits
4. **Risk-Adjusted Sizing**: Kelly maximizes log wealth

**Edge decay**: Monitor every 50 trades. If Sharpe < 0.8, halt and retrain.

---

## Next Steps

1. ~~Deploy Pine Script to TradingView~~
2. ~~Configure webhook → n8n → Python~~
3. Submit strategies to CLAWARS for backtesting
4. Validate 500+ trades with Sharpe > 1.0
5. If profitable: deploy to TradingView for live signals
6. Begin paper trading for 30 days
7. If metrics hold: deploy real capital

---

*"Backtest everything. No meme coins. Let the math decide."* — R.Jim Simons
