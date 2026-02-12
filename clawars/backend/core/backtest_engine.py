"""
CLAWARS Backtesting Engine
Simulates trading strategies against historical data
"""

import re
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import random
import statistics

class SignalType(Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    CLOSE = "CLOSE"
    HOLD = "HOLD"

@dataclass
class Trade:
    entry_price: float
    exit_price: Optional[float]
    entry_time: datetime
    exit_time: Optional[datetime]
    direction: str  # "LONG" or "SHORT"
    size: float
    pnl: Optional[float]
    pnl_pct: Optional[float]
    exit_reason: Optional[str]

@dataclass  
class BacktestResult:
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    avg_trade_pnl: float
    total_return: float
    equity_curve: List[Dict]
    trades: List[Trade]
    composite_score: float

class PineScriptEngine:
    """
    Simplified Pine Script interpreter for backtesting.
    In production, this would interface with TradingView's engine or a full parser.
    """
    
    def __init__(self, code: str):
        self.code = code
        self.parsed = self._parse_code()
        
    def _parse_code(self) -> Dict:
        """Extract key parameters from Pine Script"""
        params = {
            "lookback": 20,
            "entry_threshold": 1.5,
            "exit_threshold": 0.5,
            "kelly_fraction": 0.25,
            "trading_hours_start": 0,
            "trading_hours_end": 23,
        }
        
        # Extract lookback
        lookback_match = re.search(r'lookback\s*=\s*input\.int\((\d+)', self.code)
        if lookback_match:
            params["lookback"] = int(lookback_match.group(1))
            
        # Extract entry threshold
        entry_match = re.search(r'entryThreshold\s*=\s*input\.float\(([\d.]+)', self.code)
        if entry_match:
            params["entry_threshold"] = float(entry_match.group(1))
            
        # Extract exit threshold
        exit_match = re.search(r'exitThreshold\s*=\s*input\.float\(([\d.]+)', self.code)
        if exit_match:
            params["exit_threshold"] = float(exit_match.group(1))
            
        # Extract Kelly fraction
        kelly_match = re.search(r'kellyFraction\s*=\s*input\.float\(([\d.]+)', self.code)
        if kelly_match:
            params["kelly_fraction"] = float(kelly_match.group(1))
            
        return params
    
    def generate_signals(self, prices: List[float]) -> List[SignalType]:
        """
        Generate trading signals based on Residual Momentum strategy.
        Simplified implementation for simulation.
        """
        lookback = self.parsed["lookback"]
        entry_threshold = self.parsed["entry_threshold"]
        exit_threshold = self.parsed["exit_threshold"]
        
        signals = []
        position = None  # None, "LONG", "SHORT"
        
        for i in range(len(prices)):
            if i < lookback + 2:
                signals.append(SignalType.HOLD)
                continue
                
            # Calculate residual momentum
            price_change = prices[i] - prices[i-1]
            changes = [prices[j] - prices[j-1] for j in range(i-lookback+1, i+1)]
            trend = sum(changes) / len(changes)
            residual = price_change - trend
            
            # Volatility adjusted
            vol = statistics.stdev(changes) if len(changes) > 1 else 0.02
            score = residual / (vol * prices[i]) if vol > 0 else 0
            
            # Generate signal
            signal = SignalType.HOLD
            
            # Entry logic
            if position is None:
                if score > entry_threshold:
                    signal = SignalType.LONG
                    position = "LONG"
                elif score < -entry_threshold:
                    signal = SignalType.SHORT
                    position = "SHORT"
                    
            # Exit logic
            elif position == "LONG":
                if score < exit_threshold:
                    signal = SignalType.CLOSE
                    position = None
            elif position == "SHORT":
                if score > -exit_threshold:
                    signal = SignalType.CLOSE
                    position = None
                    
            signals.append(signal)
            
        return signals

class BacktestEngine:
    """
    Core backtesting engine for CLAWARS.
    Simulates strategy execution against historical price data.
    """
    
    def __init__(self, initial_capital: float = 10000.0):
        self.initial_capital = initial_capital
        self.slippage = 0.001  # 10 bps slippage
        self.commission = 0.0006  # 6 bps commission (0.06%)
        
    async def run_backtest(
        self,
        strategy_code: str,
        strategy_type: str,
        start_date: datetime,
        end_date: datetime,
        progress_callback=None
    ) -> BacktestResult:
        """
        Run a complete backtest.
        
        In production, this would:
        1. Fetch real historical data from Binance/Bitfinex
        2. Execute actual Pine Script via TV API
        3. Use proper risk management
        """
        
        # Generate synthetic price data (in production: fetch from exchange API)
        prices = self._generate_price_data(start_date, end_date)
        
        # Initialize engine based on strategy type
        if strategy_type == "pine_script":
            engine = PineScriptEngine(strategy_code)
        else:
            raise NotImplementedError("Python strategies not yet implemented")
            
        # Generate signals
        signals = engine.generate_signals(prices)
        
        # Simulate trading
        trades, equity_curve = self._simulate_trades(
            prices, signals, engine.parsed["kelly_fraction"]
        )
        
        # Calculate metrics
        return self._calculate_metrics(trades, equity_curve)
        
    def _generate_price_data(
        self, 
        start_date: datetime, 
        end_date: datetime,
        volatility: float = 0.02,
        drift: float = 0.0001
    ) -> List[float]:
        """Generate synthetic OHLCV data for testing"""
        # In production: fetch from Binance API
        days = (end_date - start_date).days
        periods = days * 6  # 4H candles = 6 per day
        
        price = 45000.0  # Start price
        prices = [price]
        
        for _ in range(periods):
            # Random walk with drift
            change = random.gauss(drift, volatility) * price
            price += change
            prices.append(max(price, 100))
            
        return prices
        
    def _simulate_trades(
        self,
        prices: List[float],
        signals: List[SignalType],
        kelly_fraction: float
    ) -> Tuple[List[Trade], List[Dict]]:
        """Simulate trade execution"""
        trades = []
        equity = self.initial_capital
        equity_curve = [{"timestamp": i, "equity": equity} for i in range(min(10, len(prices)))]
        
        position = None
        entry_price = 0
        entry_time = None
        position_size = 0
        
        for i, (price, signal) in enumerate(zip(prices, signals)):
            timestamp = datetime.now() - timedelta(hours=len(prices)-i)
            
            # Entry
            if signal == SignalType.LONG and position is None:
                entry_price = price * (1 + self.slippage)
                position_size = self._calculate_position_size(equity, kelly_fraction)
                position = "LONG"
                entry_time = timestamp
                
            elif signal == SignalType.SHORT and position is None:
                entry_price = price * (1 - self.slippage)
                position_size = self._calculate_position_size(equity, kelly_fraction)
                position = "SHORT"
                entry_time = timestamp
                
            # Exit
            elif signal == SignalType.CLOSE and position is not None:
                if position == "LONG":
                    exit_price = price * (1 - self.slippage)
                    pnl = (exit_price - entry_price) * position_size
                    pnl_pct = (exit_price - entry_price) / entry_price * 100
                else:  # SHORT
                    exit_price = price * (1 + self.slippage)
                    pnl = (entry_price - exit_price) * position_size
                    pnl_pct = (entry_price - exit_price) / entry_price * 100
                    
                # Apply commission
                commission = (entry_price + exit_price) * position_size * self.commission
                pnl -= commission
                
                trade = Trade(
                    entry_price=entry_price,
                    exit_price=exit_price,
                    entry_time=entry_time,
                    exit_time=timestamp,
                    direction=position,
                    size=position_size,
                    pnl=pnl,
                    pnl_pct=pnl_pct,
                    exit_reason="Signal"
                )
                trades.append(trade)
                
                equity += pnl
                position = None
                
            # Record equity (every 10 periods)
            if i % 10 == 0:
                equity_curve.append({"timestamp": i, "equity": equity})
                
        return trades, equity_curve
        
    def _calculate_position_size(self, equity: float, kelly_fraction: float) -> float:
        """Calculate position size using Kelly Criterion"""
        # Simplified Kelly: use 25% of equity
        return equity * kelly_fraction * 0.5  # Half-Kelly for safety
        
    def _calculate_metrics(
        self,
        trades: List[Trade],
        equity_curve: List[Dict]
    ) -> BacktestResult:
        """Calculate all performance metrics"""
        
        if not trades:
            return BacktestResult(
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0,
                profit_factor=0,
                sharpe_ratio=0,
                sortino_ratio=0,
                max_drawdown=0,
                avg_trade_pnl=0,
                total_return=0,
                equity_curve=equity_curve,
                trades=trades,
                composite_score=0
            )
            
        # Basic counts
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.pnl and t.pnl > 0)
        losing_trades = total_trades - winning_trades
        win_rate = winning_trades / total_trades * 100
        
        # P&L metrics
        gross_profit = sum(t.pnl for t in trades if t.pnl and t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in trades if t.pnl and t.pnl <= 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        avg_trade_pnl = sum(t.pnl for t in trades if t.pnl) / total_trades
        
        # Returns
        final_equity = equity_curve[-1]["equity"]
        total_return = (final_equity - self.initial_capital) / self.initial_capital * 100
        
        # Sharpe ratio
        returns = [t.pnl_pct for t in trades if t.pnl_pct]
        if len(returns) > 1:
            avg_return = statistics.mean(returns)
            std_return = statistics.stdev(returns)
            sharpe = avg_return / std_return * (252 ** 0.5) if std_return > 0 else 0
            
            # Sortino (downside deviation only)
            downside_returns = [r for r in returns if r < 0]
            downside_std = statistics.stdev(downside_returns) if len(downside_returns) > 1 else 1
            sortino = avg_return / downside_std * (252 ** 0.5) if downside_std > 0 else 0
        else:
            sharpe = 0
            sortino = 0
            
        # Max drawdown
        peak = self.initial_capital
        max_dd = 0
        for point in equity_curve:
            equity = point["equity"]
            if equity > peak:
                peak = equity
            dd = (equity - peak) / peak * 100
            max_dd = min(max_dd, dd)
            
        # Composite score (Clawars ranking)
        # Score = (Sharpe × 0.4) + (Profit Factor × 0.3) + (Win Rate × 0.2) - (Max Drawdown × 0.1)
        score = (
            min(sharpe, 5) * 0.4 +
            min(profit_factor, 3) * 0.3 +
            win_rate * 0.2 -
            abs(max_dd) * 0.1
        )
        score = max(0, min(100, score))  # Clamp to 0-100
        
        return BacktestResult(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            profit_factor=profit_factor,
            sharpe_ratio=sharpe,
            sortino_ratio=sortino,
            max_drawdown=max_dd,
            avg_trade_pnl=avg_trade_pnl,
            total_return=total_return,
            equity_curve=equity_curve,
            trades=trades,
            composite_score=round(score, 2)
        )
