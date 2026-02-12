#!/usr/bin/env python3
"""
R.Jim Simons Live Strategy Dashboard API
Real-time trading strategy backend with TradingView integration
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timedelta
import asyncio
import json
import sqlite3
import subprocess
from pathlib import Path
import random
import numpy as np

app = FastAPI(title="R.Jim Simons Live Dashboard", version="2.0.0")

# Database path
DB_PATH = Path(__file__).parent.parent / "r-jim-simons.db"

# In-memory state (for live demo)
portfolio_state = {
    "value": 10000.0,
    "initial": 10000.0,
    "cash": 10000.0,
    "positions": [],
    "equity_curve": [],
    "trades": [],
    "daily_pnl": 0.0,
    "last_update": datetime.now().isoformat()
}

# Asset universe (strictly enforced)
ASSET_UNIVERSE = {
    "BTCUSDT": {"min_cap": 500e9, "tier": 1},
    "ETHUSDT": {"min_cap": 200e9, "tier": 1},
    "SOLUSDT": {"min_cap": 50e9, "tier": 2},
    "AVAXUSDT": {"min_cap": 10e9, "tier": 2},
    "NEARUSDT": {"min_cap": 5e9, "tier": 2},
    "BNBUSDT": {"min_cap": 80e9, "tier": 2},
    "ARBUSDT": {"min_cap": 5e9, "tier": 3},
    "OPUSDT": {"min_cap": 3e9, "tier": 3},
}

# Active WebSocket connections
connected_clients: List[WebSocket] = []

class TradingViewSignal(BaseModel):
    strategy: str
    action: Literal["BUY", "SELL"]
    ticker: str
    price: float
    timestamp: str
    vwap: Optional[float] = None
    deviation: Optional[float] = None
    confidence: Optional[float] = 0.0

class StrategyStatus(BaseModel):
    name: str
    active: bool
    last_signal: Optional[str]
    win_rate: float
    total_trades: int
    profit_factor: float

class Position(BaseModel):
    symbol: str
    entry_price: float
    current_price: float
    size: float
    pnl: float
    pnl_pct: float
    stop_loss: float
    take_profit: float
    opened_at: str

class PortfolioMetrics(BaseModel):
    total_value: float
    total_pnl: float
    total_pnl_pct: float
    daily_pnl: float
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    open_positions: int
    portfolio_heat: float

# =====================
# GLM-5 MATH INTEGRATION
# =====================

def glm5_calculate_kelly(win_rate: float, avg_win: float, avg_loss: float) -> dict:
    """Calculate Kelly Criterion using GLM-5"""
    try:
        prompt = f"""Calculate Kelly Criterion for position sizing:
        Win rate: {win_rate}
        Average win: {avg_win*100:.2f}%
        Average loss: {avg_loss*100:.2f}%
        
        Return JSON with:
        - kelly_fraction (0-1)
        - fractional_kelly_025 (0.25x Kelly)
        - position_pct (recommended % of portfolio)
        - edge (expected value)
        
        Be mathematically precise."""
        
        result = subprocess.run(
            ['ollama', 'run', 'glm-5:cloud', prompt],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Parse JSON from response
        output = result.stdout.strip()
        # Find JSON block
        import re
        json_match = re.search(r'\{[^}]+\}', output)
        if json_match:
            return json.loads(json_match.group())
        
        # Fallback
        return calculate_kelly_fallback(win_rate, avg_win, avg_loss)
        
    except Exception as e:
        return calculate_kelly_fallback(win_rate, avg_win, avg_loss)

def calculate_kelly_fallback(win_rate: float, avg_win: float, avg_loss: float) -> dict:
    """Fallback Kelly calculation"""
    if avg_loss == 0:
        return {"kelly_fraction": 0, "fractional_kelly_025": 0, "position_pct": 0}
    
    b = avg_win / avg_loss
    kelly = win_rate * (b + 1) - 1
    kelly = kelly / b if b != 0 else 0
    kelly = max(0, min(kelly, 0.5))
    
    fractional = kelly * 0.25
    
    return {
        "kelly_fraction": round(kelly, 4),
        "fractional_kelly_025": round(fractional, 4),
        "position_pct": round(fractional * 100, 2),
        "edge": round(win_rate * avg_win - (1 - win_rate) * avg_loss, 4),
        "method": "fallback"
    }

def calculate_metrics(trades: List[dict]) -> dict:
    """Calculate strategy metrics from trades"""
    if not trades:
        return {"win_rate": 0, "sharpe": 0, "expectancy": 0}
    
    pnls = [t.get("pnl", 0) for t in trades]
    wins = sum(1 for p in pnls if p > 0)
    losses = sum(1 for p in pnls if p <= 0)
    
    win_rate = wins / len(pnls) if pnls else 0
    
    if len(pnls) > 1:
        avg_return = np.mean(pnls)
        std_return = np.std(pnls) if np.std(pnls) > 0 else 1
        sharpe = avg_return / std_return * np.sqrt(365) if std_return > 0 else 0
    else:
        sharpe = 0
    
    avg_win = np.mean([p for p in pnls if p > 0]) if wins > 0 else 0
    avg_loss = abs(np.mean([p for p in pnls if p <= 0])) if losses > 0 else 0
    expectancy = (win_rate * avg_win) - ((1 - win_rate) * avg_loss)
    
    return {
        "win_rate": round(win_rate * 100, 1),
        "sharpe": round(sharpe, 2),
        "expectancy": round(expectancy * 100, 2),
        "total_trades": len(pnls),
        "wins": wins,
        "losses": losses
    }

# =====================
# WEBSOCKET MANAGER
# =====================

async def broadcast(data: dict):
    """Broadcast data to all connected clients"""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(data)
        except:
            disconnected.append(client)
    
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)

async def market_data_simulator():
    """Simulate live market data updates"""
    while True:
        await asyncio.sleep(1)
        
        # Update portfolio value
        change = random.gauss(0, 0.001)
        portfolio_state["value"] *= (1 + change)
        
        # Calculate metrics
        total_pnl = portfolio_state["value"] - portfolio_state["initial"]
        total_pnl_pct = (total_pnl / portfolio_state["initial"]) * 100
        
        metrics = calculate_metrics(portfolio_state["trades"])
        
        data = {
            "type": "market_update",
            "timestamp": datetime.now().isoformat(),
            "portfolio": {
                "value": round(portfolio_state["value"], 2),
                "total_pnl": round(total_pnl, 2),
                "total_pnl_pct": round(total_pnl_pct, 2),
                "daily_pnl": 0.0,
                "win_rate": metrics["win_rate"],
                "sharpe": metrics["sharpe"],
                "open_positions": len(portfolio_state["positions"])
            }
        }
        
        await broadcast(data)

# =====================
# API ENDPOINTS
# =====================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    # Start market data simulator
    asyncio.create_task(market_data_simulator())
    print("✅ R.Jim Simons Dashboard API started")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the dashboard HTML"""
    dashboard_path = Path(__file__).parent / "index.html"
    return HTMLResponse(content=dashboard_path.read_text())

@app.get("/api/portfolio", response_model=PortfolioMetrics)
async def get_portfolio():
    """Get current portfolio metrics"""
    total_pnl = portfolio_state["value"] - portfolio_state["initial"]
    metrics = calculate_metrics(portfolio_state["trades"])
    
    # Calculate drawdown
    equity_curve = portfolio_state.get("equity_curve", [])
    max_drawdown = 0
    if equity_curve:
        peak = equity_curve[0]
        for val in equity_curve:
            if val > peak:
                peak = val
            dd = (peak - val) / peak
            max_drawdown = max(max_drawdown, dd)
    
    return PortfolioMetrics(
        total_value=round(portfolio_state["value"], 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_pct=round((total_pnl / portfolio_state["initial"]) * 100, 2),
        daily_pnl=round(portfolio_state.get("daily_pnl", 0), 2),
        win_rate=metrics["win_rate"],
        sharpe_ratio=metrics["sharpe"],
        max_drawdown=round(max_drawdown * 100, 2),
        open_positions=len(portfolio_state["positions"]),
        portfolio_heat=sum(p.get("size", 0) for p in portfolio_state["positions"]) / portfolio_state["value"] * 100
    )

@app.get("/api/positions", response_model=List[Position])
async def get_positions():
    """Get open positions"""
    return [
        Position(
            symbol=p["symbol"],
            entry_price=p["entry_price"],
            current_price=p["current_price"],
            size=p["size"],
            pnl=round(p["current_price"] - p["entry_price"], 2),
            pnl_pct=round(((p["current_price"] - p["entry_price"]) / p["entry_price"]) * 100, 2),
            stop_loss=p["stop_loss"],
            take_profit=p["take_profit"],
            opened_at=p["opened_at"]
        ) for p in portfolio_state["positions"]
    ]

@app.get("/api/signals")
async def get_signals():
    """Get recent signals"""
    return portfolio_state.get("recent_signals", [])

@app.post("/api/signal")
async def receive_signal(signal: TradingViewSignal, background_tasks: BackgroundTasks):
    """Receive TradingView webhook signal"""
    
    # Validate asset
    if signal.ticker not in ASSET_UNIVERSE:
        raise HTTPException(status_code=400, detail=f"Asset {signal.ticker} not in approved universe")
    
    # Calculate Kelly sizing via GLM-5
    metrics = calculate_metrics(portfolio_state["trades"])
    win_rate = metrics["win_rate"] / 100 if metrics["win_rate"] > 0 else 0.55
    
    kelly_result = glm5_calculate_kelly(win_rate, 0.03, 0.015)  # Target 3% win, 1.5% loss
    position_pct = kelly_result.get("position_pct", 5)
    
    signal_data = {
        "type": "signal",
        "action": signal.action,
        "ticker": signal.ticker,
        "price": signal.price,
        "timestamp": signal.timestamp,
        "kelly_position_pct": position_pct,
        "kelly_edge": kelly_result.get("edge", 0),
        "confidence": signal.confidence
    }
    
    # Broadcast to all clients
    await broadcast(signal_data)
    
    # Store signal
    if "recent_signals" not in portfolio_state:
        portfolio_state["recent_signals"] = []
    portfolio_state["recent_signals"].insert(0, signal_data)
    portfolio_state["recent_signals"] = portfolio_state["recent_signals"][:50]  # Keep last 50
    
    return {"status": "received", "kelly_position_pct": position_pct}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates"""
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

@app.get("/api/strategy/status")
async def get_strategy_status():
    """Get strategy status"""
    return {
        "name": "VWAP Mean Reversion",
        "active": True,
        "filters": {
            "trend_filter": "EMA 50 daily",
            "oversold_threshold": "RSI < 35",
            "bb_deviation": "2σ",
            "timeframe": "4H"
        },
        "position_sizing": "0.25x Kelly (GLM-5)"
    }

@app.get("/api/chart-data")
async def get_chart_data(symbol: str = "BTCUSDT", timeframe: str = "4h"):
    """Get chart data for TV integration"""
    # Generate mock OHLCV data
    now = datetime.now()
    data = []
    base_price = 45000 if "BTC" in symbol else 2800 if "ETH" in symbol else 100
    
    for i in range(100):
        time = now - timedelta(hours=4 * i)
        volatility = base_price * 0.02
        close = base_price + np.sin(i * 0.1) * base_price * 0.05 + random.gauss(0, volatility * 0.3)
        open_price = close + random.gauss(0, volatility * 0.2)
        high = max(open_price, close) + random.uniform(0, volatility * 0.3)
        low = min(open_price, close) - random.uniform(0, volatility * 0.3)
        volume = random.uniform(1000, 10000)
        
        data.insert(0, {
            "time": time.timestamp(),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close, 2),
            "volume": round(volume, 2)
        })
    
    return {"symbol": symbol, "timeframe": timeframe, "data": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
