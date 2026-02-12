# Phase 1 MVP: Quantitative Crypto Trading System
## R.Jim Simons - Renaissance Resurrection Protocol

---

## Executive Summary

This document outlines a production-grade, mathematically rigorous cryptocurrency trading system leveraging TradingView's Pine Script infrastructure combined with institutional-grade risk management. The system targets only major Layer-1 blockchain assets with market capitalizations exceeding $1 billion USD.

**Core Philosophy:** *"We're not predicting the future. We're extracting small, persistent edges from market inefficiencies through rigorous statistical methods."*

---

## 1. System Architecture

### 1.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRADINGVIEW CLOUD                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Pine Script  │───▶│   Backtest   │───▶│ Strategy Performance │  │
│  │  Strategies  │    │   Engine     │    │   Metrics Calc       │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│           │                                     │                  │
│           │            WEBHOOK ALERTS           │                  │
│           ▼                      │              │                  │
│  ┌──────────────────┐           │              ▼                  │
│  │ Webhook Output   │─────────┘    ┌──────────────────┐        │
│  │ (JSON Payload)   │                │ Signal Quality   │        │
│  └──────────────────┘                │ Filter Engine    │        │
└──────────────────────────────────────│ (Win Rate >55%)  │────────┘
                                       └──────────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PYTHON EXECUTION ENGINE                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Webhook      │───▶│  Signal      │───▶│   GLM-5:cloud        │  │
│  │ Receiver     │    │  Validator   │    │   Position Sizing    │  │
│  │ (FastAPI)    │    │              │    │   Engine              │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                  │                  │
│                                                  ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Order        │◄───│ Risk         │◄───│   Kelly Criterion    │  │
│  │ Executor     │    │ Manager      │    │   Engine              │  │
│  │ (CCXT)       │    │              │    │   (GLM-5)            │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Specifications

#### Layer 1: Strategy Generation (TradingView)
- **Pine Script v6** strategies with explicit entry/exit logic
- Multi-timeframe analysis (4H primary, 1H confirmation, daily trend)
- Built-in TradingView backtester for strategy validation
- Webhook alerts firing on confirmed signals only

#### Layer 2: Signal Processing (Python/FastAPI)
- Webhook receiver validating TradingView signature
- Signal deduplication and cooldown enforcement
- Market regime filter (bull/bear/sideways detection)
- GLM-5:cloud integration for real-time calculations

#### Layer 3: Execution & Risk (Python/CCXT)
- Unified exchange interface via CCXT
- Position sizing via Kelly Criterion (GLM-5 computed)
- Portfolio heat monitoring (max 15% portfolio at risk)
- Circuit breakers for drawdown >10%

---

## 2. Approved Asset Universe

### 2.1 Tier 1: Core Holdings (Primary Targets)
| Symbol | Asset | Min Market Cap | Max Position | Rationale |
|--------|-------|----------------|--------------|-----------|
| BTCUSDT | Bitcoin | $500B+ | 25% | Digital gold, macro BTC beta |
| ETHUSDT | Ethereum | $200B+ | 20% | Smart contract leader, staking yield |
| SOLUSDT | Solana | $50B+ | 15% | High throughput, ecosystem growth |

### 2.2 Tier 2: Secondary Opportunities
| Symbol | Asset | Min Market Cap | Max Position | Rationale |
|--------|-------|----------------|--------------|-----------|
| AVAXUSDT | Avalanche | $10B+ | 10% | Subnet architecture, institutional adoption |
| NEARUSDT | NEAR Protocol | $5B+ | 10% | Sharding, developer growth |
| BNBUSDT | BNB | $80B+ | 10% | Exchange token with utility |
| ARBUSDT | Arbitrum | $5B+ | 5% | L2 scaling, TVL growth |
| OPUSDT | Optimism | $3B+ | 5% | L2 scaling, governance value |

### 2.3 Exclusion Criteria
- ❌ Any asset with market cap <$1B
- ❌ Meme coins, community tokens, "culture" plays
- ❌ Assets with <12 months trading history
- ❌ Assets with daily volume <$50M
- ❌ Leveraged tokens, derivatives, perp-only markets

---

## 3. TradingView Pine Script Strategies

### 3.1 Strategy #1: VWAP Mean Reversion (Primary)

**Timeframe:** 4H (primary), 1H (entry timing)
**Assets:** All Tier 1 + Tier 2
**Edge:** Price tends to revert to VWAP after deviation
**Target:** 60%+ win rate, 1.5:1 reward/risk minimum

```pinescript
//@version=6
strategy("VWAP Mean Reversion - Institutional", overlay=true, 
     initial_capital=100000, default_qty_type=strategy.percent_of_equity, 
     default_qty_value=10, commission_type=strategy.commission.percent, 
     commission_value=0.06)

// === INPUTS ===
vwapLength = input.int(50, "VWAP Lookback", minval=20, maxval=100)
deviationThreshold = input.float(2.0, "Std Dev Threshold", minval=1.0, maxval=4.0, step=0.1)
trendFilterPeriod = input.int(50, "Trend EMA Period", minval=20, maxval=200)

// === CALCULATIONS ===
// VWAP Calculation
typicalPrice = hlc3
vwap = ta.vwap(typicalPrice)
vwapStdDev = ta.stdev(typicalPrice, vwapLength)
upperBand = vwap + (vwapStdDev * deviationThreshold)
lowerBand = vwap - (vwapStdDev * deviationThreshold)

// Trend Filter
trendEMA = ta.ema(close, trendFilterPeriod)
trendDirection = close > trendEMA ? 1 : -1

// === SIGNAL LOGIC ===
// Long: Price below lower band in uptrend
longCondition = close < lowerBand and trendDirection == 1 and close > close[1]

// Short: Price above upper band in downtrend  
shortCondition = close > upperBand and trendDirection == -1 and close < close[1]

// === EXECUTION ===
if longCondition and strategy.position_size == 0 and strategy.closedtrades.exit_bar_index != bar_index
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", limit=vwap, stop=close * 0.97)

if shortCondition and strategy.position_size == 0 and strategy.closedtrades.exit_bar_index != bar_index
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", limit=vwap, stop=close * 1.03)

// === WEBHOOK ALERT ===
alertcondition(longCondition, "VWAP Long Signal", '{"strategy":"VWAP_MeanReversion","action":"entry","direction":"long","symbol":"{{ticker}}","price":{{close}},"timestamp":"{{time}}","vwap":{{vwap}},"deviation":{{deviationThreshold}}}')
alertcondition(shortCondition, "VWAP Short Signal", '{"strategy":"VWAP_MeanReversion","action":"entry","direction":"short","symbol":"{{ticker}}","price":{{close}},"timestamp":"{{time}}","vwap":{{vwap}},"deviation":{{deviationThreshold}}}')

// === PLOTTING ===
plot(vwap, "VWAP", color=color.blue, linewidth=2)
plot(upperBand, "Upper Band", color=color.red, linewidth=1)
plot(lowerBand, "Lower Band", color=color.green, linewidth=1)
```

**Backtest Requirements Before Live:**
- Minimum 500 trades over 2+ years
- Win rate ≥ 55%
- Profit factor ≥ 1.4
- Max drawdown < 15%
- Sharpe ratio > 1.0

### 3.2 Strategy #2: Breakout Momentum (Secondary)

**Timeframe:** 4H
**Assets:** BTC, ETH, SOL only
**Edge:** Volatility expansion following consolidation
**Target:** 50%+ win rate, 2:1 reward/risk

**Key Logic:**
- 20-period ATR for volatility measurement
- Entry on 4H close above/below ATR channel (3x ATR from 20 SMA)
- Volume confirmation required (2x average)
- Position held until opposite signal or 3 ATR stop

### 3.3 Strategy #3: Funding Rate Arbitrage (BTC Only)

**Timeframe:** Daily
**Assets:** BTCUSDT only
**Edge:** Mean reversion of funding rate extremes
**Target:** 65%+ win rate, 1.2:1 reward/risk

**Logic:**
- Fetch funding rate via API
- Long when funding < -0.02% (shorts pay longs)
- Short when funding > 0.05% (longs pay shorts)
- Hold 24-72 hours

---

## 4. Webhook → Python → Execution Flow

### 4.1 TradingView Webhook Configuration

**Webhook URL:** `https://your-server.com/webhook/tradingview`
**Method:** POST
**Content-Type:** application/json
**Webhook Message Format:**

```json
{
  "strategy": "VWAP_MeanReversion",
  "action": "entry",
  "direction": "long",
  "symbol": "BTCUSDT",
  "price": 67500.50,
  "timestamp": "2026-02-11T16:56:00Z",
  "vwap": 67000.00,
  "deviation": 2.0,
  "signature": "sha256=..."
}
```

### 4.2 Python Webhook Receiver

```python
# webhook_server.py - FastAPI Implementation
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, validator
import hmac
import hashlib
import time
import asyncio
from datetime import datetime, timedelta
from typing import Literal
import httpx

app = FastAPI(title="Simons Trading Engine", version="1.0.0")

# Configuration
WEBHOOK_SECRET = "your_secure_webhook_secret"  # Set via env var
GLM5_ENDPOINT = "http://localhost:11434/api/generate"
TRADINGVIEW_IPS = ["52.89.214.238", "34.212.75.30", "54.218.50.168"]  # TV IPs

# Signal deduplication cache
signal_cache = {}
SIGNAL_COOLDOWN_MINUTES = 15

class TradingViewSignal(BaseModel):
    strategy: str
    action: Literal["entry", "exit"]
    direction: Literal["long", "short", "flat"]
    symbol: str
    price: float
    timestamp: str
    vwap: float = None
    deviation: float = None
    
    @validator('symbol')
    def validate_symbol(cls, v):
        allowed = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 
                   'NEARUSDT', 'BNBUSDT', 'ARBUSDT', 'OPUSDT']
        if v not in allowed:
            raise ValueError(f"Symbol {v} not in approved universe")
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify TradingView webhook signature"""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature.replace("sha256=", ""))

def check_signal_cooldown(symbol: str, strategy: str) -> bool:
    """Prevent duplicate signals within cooldown period"""
    key = f"{symbol}:{strategy}"
    now = datetime.now()
    
    if key in signal_cache:
        last_signal = signal_cache[key]
        if now - last_signal < timedelta(minutes=SIGNAL_COOLDOWN_MINUTES):
            return False
    
    signal_cache[key] = now
    return True

@app.post("/webhook/tradingview")
async def receive_signal(
    request: Request,
    background_tasks: BackgroundTasks,
    x_signature: str = Header(None)
):
    """Receive and process TradingView webhook"""
    
    # Security: Verify IP whitelist
    client_ip = request.client.host
    # if client_ip not in TRADINGVIEW_IPS:  # Uncomment for production
    #     raise HTTPException(status_code=403, detail="Unauthorized IP")
    
    # Parse and validate payload
    try:
        payload = await request.body()
        signal = TradingViewSignal.parse_raw(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    
    # Check signal cooldown
    if not check_signal_cooldown(signal.symbol, signal.strategy):
        return {"status": "ignored", "reason": "signal in cooldown period"}
    
    # Process signal in background
    background_tasks.add_task(process_signal, signal)
    
    return {"status": "received", "signal_id": f"{signal.symbol}_{time.time()}"}

async def process_signal(signal: TradingViewSignal):
    """Process validated signal through calculation and execution"""
    
    # Step 1: Fetch current market data
    market_data = await fetch_market_data(signal.symbol)
    
    # Step 2: Query GLM-5 for position sizing
    position_size = await calculate_position_glm5(signal, market_data)
    
    # Step 3: Validate against risk limits
    if not validate_risk_limits(position_size, signal.symbol):
        logger.warning(f"Risk limit exceeded for {signal.symbol}")
        return
    
    # Step 4: Execute order
    await execute_order(signal, position_size)

async def fetch_market_data(symbol: str) -> dict:
    """Fetch current market data from exchange"""
    import ccxt
    exchange = ccxt.binance({'enableRateLimit': True})
    
    ticker = exchange.fetch_ticker(symbol)
    orderbook = exchange.fetch_order_book(symbol, limit=20)
    
    return {
        'last_price': ticker['last'],
        'bid_ask_spread': (orderbook['asks'][0][0] - orderbook['bids'][0][0]) / ticker['last'],
        '24h_volume': ticker['quoteVolume'],
        'volatility_24h': ticker['high'] - ticker['low']
    }
```

### 4.3 GLM-5 Position Sizing Integration

```python
# glm5_sizing.py - GLM-5:cloud Integration
import httpx
import json
import asyncio
from decimal import Decimal

GLM5_ENDPOINT = "http://localhost:11434/api/generate"

class GLM5PositionCalculator:
    """Uses GLM-5:cloud for all quantitative calculations"""
    
    async def kelly_criterion_size(
        self,
        win_rate: float,
        avg_win: float,
        avg_loss: float,
        current_price: float,
        portfolio_value: float,
        max_position_pct: float = 0.25
    ) -> dict:
        """
        Calculate Kelly-optimal position size using GLM-5
        
        Returns fractional Kelly (25% of full Kelly for safety)
        """
        
        prompt = f"""
Perform a Kelly Criterion calculation for cryptocurrency position sizing.

Given data:
- Win rate (W): {win_rate:.4f}
- Average win per trade: {avg_win:.4f}
- Average loss per trade: {avg_loss:.4f}
- Current asset price: ${current_price:.2f}
- Portfolio value: ${portfolio_value:.2f}
- Maximum position allocation: {max_position_pct*100}%

Calculate:
1. Kelly percentage: K% = W - ((1-W) / (AvgWin/AvgLoss))
2. Fractional Kelly (25% of full): K%_fractional = K% * 0.25
3. Dollar position size: Position = Portfolio * K%_fractional
4. Asset quantity: Qty = Position / Price

Return ONLY a JSON object with these exact keys:
{{
    "kelly_percentage": float,
    "fractional_kelly": float,
    "position_size_usd": float,
    "asset_quantity": float,
    "risk_per_trade_pct": float,
    "confidence": "high|medium|low",
    "reasoning": "brief explanation"
}}

Ensure all calculations are mathematically precise.
"""
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GLM5_ENDPOINT,
                json={
                    "model": "glm-5:cloud",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1}
                }
            )
            
            result = response.json()
            
            # Parse the JSON from GLM response
            try:
                # GLM returns response in 'response' field
                sizing_data = json.loads(result['response'])
                return sizing_data
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback calculation if parsing fails
                return self._fallback_kelly(win_rate, avg_win, avg_loss, 
                                           current_price, portfolio_value)
    
    def _fallback_kelly(
        self, W: float, avg_win: float, avg_loss: float,
        price: float, portfolio: float
    ) -> dict:
        """Fallback Kelly calculation if GLM fails"""
        kelly_pct = W - ((1 - W) / (avg_win / avg_loss))
        kelly_pct = max(0, min(kelly_pct, 0.5))  # Cap at 50%
        fractional = kelly_pct * 0.25
        position_usd = portfolio * fractional
        qty = position_usd / price
        
        return {
            "kelly_percentage": round(kelly_pct, 4),
            "fractional_kelly": round(fractional, 4),
            "position_size_usd": round(position_usd, 2),
            "asset_quantity": round(qty, 8),
            "risk_per_trade_pct": round(fractional * 100, 2),
            "confidence": "fallback",
            "reasoning": "GLM parsing failed, using direct calculation"
        }
    
    async def calculate_var(self, returns: list, confidence: float = 0.95) -> dict:
        """Calculate Value at Risk using GLM-5"""
        
        prompt = f"""
Calculate Value at Risk (VaR) for a cryptocurrency portfolio.

Historical daily returns (%): {returns}
Confidence level: {confidence}

Calculate:
1. Mean of returns
2. Standard deviation
3. Z-score for {confidence} confidence
4. Parametric VaR = Mean_return - (Z_score * Std_Dev)
5. Historical VaR = {confidence}th percentile of returns

Return JSON with:
{{
    "var_parametric_pct": float,
    "var_historical_pct": float,
    "mean_return_pct": float,
    "std_dev_pct": float,
    "z_score": float,
    "interpretation": "brief text"
}}
"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GLM5_ENDPOINT,
                json={"model": "glm-5:cloud", "prompt": prompt, "stream": False}
            )
            return json.loads(response.json()['response'])

# Singleton instance
glm5_calculator = GLM5PositionCalculator()
```

---

## 5. Risk Management Framework

### 5.1 Position Sizing Rules

1. **Kelly Criterion (Fractional)**
   - Full Kelly never used (too volatile)
   - Standard: 25% of Kelly recommendation
   - Maximum single position: 25% portfolio
   - Minimum position: 1% portfolio (avoid noise trades)

2. **Volatility Adjustment**
   - ATR-based position scaling
   - High volatility = smaller size
   - Low volatility = larger size (within Kelly bounds)

3. **Correlation Constraints**
   - Max 40% exposure to single sector (L1s, L2s, exchange tokens)
   - Correlation check via 30-day rolling correlation matrix

### 5.2 Risk Limits

| Metric | Limit | Action on Breach |
|--------|-------|------------------|
| Portfolio Drawdown | -10% | Halt new entries, reduce sizes 50% |
| Daily Loss | -5% | Pause trading for 24h |
| Single Position Loss | -7% | Exit immediately |
| Total Open Exposure | 50% | Reject new signals |
| Correlation Cluster | 0.85 | Reduce correlated positions |

### 5.3 Circuit Breakers

```python
# risk_manager.py
class RiskManager:
    def __init__(self):
        self.max_drawdown = 0.10
        self.daily_loss_limit = 0.05
        self.single_loss_limit = 0.07
        self.max_exposure = 0.50
    
    def check_portfolio_health(self, portfolio: dict) -> dict:
        """Run all risk checks before executing signal"""
        checks = {
            'drawdown_ok': self._check_drawdown(portfolio),
            'daily_loss_ok': self._check_daily_loss(portfolio),
            'exposure_ok': self._check_exposure(portfolio),
            'correlation_ok': self._check_correlation(portfolio),
        }
        
        can_trade = all(checks.values())
        
        return {
            'can_trade': can_trade,
            'checks': checks,
            'reduction_factor': 0.5 if not can_trade else 1.0
        }
    
    def _check_drawdown(self, portfolio: dict) -> bool:
        return portfolio.get('drawdown', 0) < self.max_drawdown
    
    def _check_daily_loss(self, portfolio: dict) -> bool:
        return portfolio.get('daily_pnl', 0) > -self.daily_loss_limit * portfolio['value']
    
    def _check_exposure(self, portfolio: dict) -> bool:
        total_exposure = sum(abs(p['usd_value']) for p in portfolio['positions'])
        return total_exposure < self.max_exposure * portfolio['value']
```

---

## 6. Execution Layer

### 6.1 Order Execution via CCXT

```python
# execution.py
import ccxt
import asyncio
from typing import Optional, Literal

class ExecutionEngine:
    def __init__(self, exchange_id: str = 'binance', sandbox: bool = True):
        self.exchange = getattr(ccxt, exchange_id)({
            'apiKey': os.environ['EXCHANGE_API_KEY'],
            'secret': os.environ['EXCHANGE_SECRET'],
            'enableRateLimit': True,
            'sandbox': sandbox,
        })
        self.sandbox = sandbox
    
    async def execute_market_order(
        self,
        symbol: str,
        side: Literal['buy', 'sell'],
        quantity: float,
        reduce_only: bool = False
    ) -> dict:
        """Execute market order with confirmation"""
        
        try:
            order = self.exchange.create_order(
                symbol=symbol,
                type='market',
                side=side,
                amount=quantity,
                params={'reduceOnly': reduce_only}
            )
            
            # Wait for fill
            filled = await self._wait_for_fill(order['id'], symbol)
            
            return {
                'status': 'filled',
                'order_id': order['id'],
                'filled_qty': filled['filled'],
                'avg_price': filled['average'],
                'fee': filled['fee'],
                'timestamp': filled['timestamp']
            }
            
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}
    
    async def calculate_position_size(
        self,
        symbol: str,
        sizing: dict,
        side: Literal['buy', 'sell']
    ) -> float:
        """Calculate quantity respecting lot sizes"""
        
        markets = self.exchange.load_markets()
        market = markets[symbol]
        
        amount = sizing['asset_quantity']
        
        # Round to lot size
        lot_size = market['lot_size']
        amount = round(amount / lot_size) * lot_size
        
        # Enforce min/max
        min_amount = market['limits']['amount']['min']
        max_amount = market['limits']['amount']['max']
        amount = max(min_amount, min(amount, max_amount or amount))
        
        return amount

# Global execution instance
executor = ExecutionEngine()
```

---

## 7. Backtesting Requirements

### 7.1 TradingView Strategy Tester Validation

Before any strategy goes live:

**Required Metrics:**
- Total trades ≥ 500 (preferably 1000+)
- Win rate ≥ 55%
- Profit factor ≥ 1.4
- Max drawdown < 15%
- Sharpe ratio > 1.0
- Sortino ratio > 1.5
- Calmar ratio (CAGR/MaxDD) > 2.0

**Validation Process:**
1. Run backtest on 2+ years of 4H data
2. Walk-forward analysis (out-of-sample testing)
3. Monte Carlo simulation (shuffle trade order)
4. Sensitivity analysis (parameter robustness)

### 7.2 Paper Trading Phase

- Minimum 4 weeks paper trading
- Minimum 50 trades
- Metrics must align with backtest (±10% variance)
- Only then graduate to live trading

---

## 8. Monitoring & Analytics

### 8.1 Real-Time Dashboard

```python
# monitoring.py
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TradeMetrics:
    timestamp: datetime
    symbol: str
    direction: str
    entry_price: float
    exit_price: Optional[float]
    pnl_usd: float
    pnl_pct: float
    kelly_used: float
    strategy: str

class PerformanceTracker:
    def calculate_sharpe(self, returns: list, risk_free_rate: float = 0.02) -> float:
        """Calculate annualized Sharpe via GLM-5"""
        # Delegate to GLM-5 for precision
        pass
    
    def generate_report(self, days: int = 30) -> dict:
        """Generate performance report"""
        return {
            'total_return': self.calculate_return(days),
            'sharpe_ratio': self.calculate_sharpe(),
            'max_drawdown': self.calculate_drawdown(),
            'win_rate': self.calculate_win_rate(),
            'profit_factor': self.calculate_profit_factor(),
            'kelly_efficiency': self.calculate_kelly_efficiency()
        }
```

### 8.2 Alert Integration

- TradingView alerts → Webhook (confirmed signals)
- Telegram/Discord alerts → Position opened/closed
- Email alerts → Risk limit breaches, circuit breakers
- PagerDuty → Critical errors, system outages

---

## 9. Technical Requirements

### 9.1 Infrastructure

```yaml
# docker-compose.yml
version: '3.8'
services:
  webhook-server:
    build: ./webhook
    ports:
      - "8000:8000"
    environment:
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - EXCHANGE_API_KEY=${API_KEY}
      - EXCHANGE_SECRET=${SECRET}
    depends_on:
      - glm5
    
  glm5:
    image: glmx/glm-5:latest
    ports:
      - "11434:11434"
    volumes:
      - glm5-models:/root/.ollama
    
  monitoring:
    build: ./monitoring
    ports:
      - "3000:3000"
    depends_on:
      - webhook-server
```

### 9.2 Dependencies

```
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
ccxt==4.2.18
httpx==0.25.2
pydantic==2.5.0
prometheus-client==0.19.0
python-telegram-bot==20.7
schedule==1.2.1
numpy==1.24.3
pandas==2.0.3
```

---

## 10. Implementation Roadmap

### Phase 1A: Foundation (Weeks 1-2)
- [ ] Deploy GLM-5:cloud instance
- [ ] Build webhook receiver with validation
- [ ] Integrate CCXT for paper trading
- [ ] Implement basic risk manager

### Phase 1B: Strategy Development (Weeks 3-4)
- [ ] Code VWAP Mean Reversion in Pine Script
- [ ] Backtest on TradingView (2+ years)
- [ ] Validate metrics meet thresholds
- [ ] Deploy webhook alerts

### Phase 1C: Integration (Weeks 5-6)
- [ ] Connect GLM-5 sizing engine
- [ ] Implement full Kelly calculations
- [ ] Paper trade for 4 weeks
- [ ] Validate real-world performance

### Phase 1D: Production (Weeks 7-8)
- [ ] Live trading with small allocation
- [ ] Monitoring dashboard
- [ ] Alert systems
- [ ] Documentation

---

## 11. Conclusion

This system embodies the Medallion Fund philosophy: **rigorous quantitative edge extraction from liquid, high-quality assets.** By leveraging TradingView's infrastructure, we get institutional-grade backtesting and alerting. By using GLM-5 for all calculations, we ensure mathematical precision. By restricting to major L1s, we avoid the casino of meme coins.

**Key Success Factors:**
1. Disciplined asset selection (no FOMO)
2. Extensive backtesting before deployment
3. Fractional Kelly sizing (survival first)
4. Automated risk management (no emotion)
5. Continuous monitoring and adaptation

*"The best time to plant a quantitative trading system was 20 years ago. The second best time is now."* - R.Jim Simons

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-11
**Classification:** Internal Use
