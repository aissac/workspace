#!/usr/bin/env python3
"""
R.Jim Simons Signal Processor
Phase 1 MVP: Process whale signals from Dune/n8n and filter/save
"""

import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhaleSignalProcessor:
    """Process raw whale transaction data and generate trading signals."""
    
    def __init__(self, db_path: str = "r-jim-simons.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        
    def get_config(self, key: str):
        """Get configuration value from database."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT value, value_type FROM config WHERE key = ?", (key,))
        row = cursor.fetchone()
        if not row:
            return None
        val, vtype = row
        if vtype == 'int':
            return int(val)
        elif vtype == 'float':
            return float(val)
        return val
    
    def calculate_confidence(self, wallet_metrics: Dict) -> float:
        """
        Calculate confidence score (0-1) for a whale based on performance.
        Higher confidence = stronger track record.
        """
        win_rate = wallet_metrics.get('win_rate', 0)
        roi_30d = wallet_metrics.get('avg_roi_30d', 0)
        total_trades = wallet_metrics.get('total_trades', 0)
        
        # Normalize components
        win_score = min(win_rate / 0.75, 1.0)  # Target 75% win rate
        roi_score = min(roi_30d / 0.50, 1.0)  # Target 50% monthly ROI
        activity_score = min(total_trades / 30, 1.0)  # Target 30+ trades/month
        
        # Weighted confidence
        confidence = (
            win_score * 0.4 +
            roi_score * 0.4 +
            activity_score * 0.2
        )
        
        return round(confidence, 2)
    
    def calculate_kelly_position(
        self,
        portfolio_value: float,
        confidence: float,
        win_rate: float,
        avg_win: float = 0.02,  # 2% avg win
        avg_loss: float = 0.01  # 1% avg loss
    ) -> Tuple[float, float]:
        """
        Calculate position size using 0.25x Kelly Criterion.
        Returns: (position_usd, kelly_fraction)
        """
        # Kelly formula: f = (p*b - q) / b
        # Where p = win probability, q = loss probability, b = avg win / avg loss
        
        p = win_rate
        q = 1 - win_rate
        
        # Calculate b first, then check
        b = avg_win / avg_loss if avg_loss > 0 else 0
        
        if avg_loss == 0 or b == 0:
            return 0, 0
            
        kelly = (p * (b + 1) - 1) / b
        
        # Fractional Kelly (0.25x) for crypto fat tails
        kelly_fraction = kelly * 0.25
        
        # Apply confidence adjustment
        kelly_fraction *= confidence
        
        # Hard caps
        max_position_pct = self.get_config('MAX_POSITION_PCT') or 0.05  # 5%
        kelly_fraction = min(kelly_fraction, max_position_pct)
        kelly_fraction = max(0, kelly_fraction)  # No negative positions
        
        position_usd = portfolio_value * kelly_fraction
        
        # Minimum position threshold (too small = gas eats profit)
        min_size = self.get_config('MIN_POSITION_USD') or 100
        if position_usd < min_size:
            return 0, 0
            
        return round(position_usd, 2), round(kelly_fraction, 4)
    
    def should_filter_signal(self, signal: Dict) -> Tuple[bool, str]:
        """
        Check if signal should be filtered out.
        Returns: (should_filter, reason)
        """
        # Load thresholds from config
        min_trades = self.get_config('MIN_WALLET_TRADES_30D') or 10
        min_roi = self.get_config('MIN_WALLET_ROI_30D') or 0.15
        min_winrate = self.get_config('MIN_WALLET_WINRATE') or 0.55
        min_trade_size = self.get_config('MIN_TRADE_SIZE_USD') or 10000
        min_confidence = self.get_config('MIN_CONFIDENCE_SCORE') or 0.7
        
        whale = signal.get('whale_metrics', {})
        
        # Check minimum trade size
        if signal.get('amount_usd', 0) < min_trade_size:
            return True, f"Trade size ${signal.get('amount_usd')} < ${min_trade_size}"
        
        # Check whale performance
        if whale.get('total_trades', 0) < min_trades:
            return True, f"Whale trades ({whale.get('total_trades')}) < {min_trades}"
        
        if whale.get('win_rate', 0) < min_winrate:
            return True, f"Win rate ({whale.get('win_rate')}) < {min_winrate}"
        
        if whale.get('avg_roi_30d', 0) < min_roi:
            return True, f"ROI 30d ({whale.get('avg_roi_30d')}) < {min_roi}"
        
        # Check confidence
        confidence = signal.get('confidence_score', 0)
        if confidence < min_confidence:
            return True, f"Confidence ({confidence}) < {min_confidence}"
        
        return False, "PASSED"
    
    def check_circuit_breakers(self, portfolio_value: float) -> Tuple[bool, str]:
        """
        Check if any circuit breakers should halt trading.
        Returns: (halted, reason)
        """
        cursor = self.conn.cursor()
        
        # Check daily drawdown
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT start_balance_usd, end_balance_usd, daily_pnl_pct
            FROM daily_metrics
            WHERE date = ?
        ''', (today,))
        row = cursor.fetchone()
        
        if row:
            pnl_pct = row['daily_pnl_pct'] or 0
            max_drawdown = self.get_config('MAX_DAILY_DRAWDOWN_PCT') or -0.05
            
            if pnl_pct < max_drawdown:
                return True, f"Daily drawdown {pnl_pct:.2%} exceeds limit {max_drawdown:.2%}"
        
        # Check consecutive failures
        cursor.execute('''
            SELECT COUNT(*) as failures
            FROM whale_signals
            WHERE date(timestamp) = ?
            AND status = 'failed'
        ''', (today,))
        failures = cursor.fetchone()['failures']
        
        if failures >= 3:
            return True, f"Circuit breaker: {failures} failed executions today"
        
        return False, ""
    
    def process_signal(self, raw_signal: Dict, portfolio_value: float = 10000):
        """
        Process a raw whale transaction into a trading signal.
        
        Returns: {
            'signal': Dict or None,
            'action': 'sent' | 'filtered' | 'halted',
            'reason': str
        }
        """
        # Pre-calculate
        confidence = self.calculate_confidence(raw_signal.get('whale_metrics', {}))
        raw_signal['confidence_score'] = confidence
        
        # Check circuit breakers first
        halted, reason = self.check_circuit_breakers(portfolio_value)
        if halted:
            # Log circuit breaker
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO circuit_breaker_log (reason, actual_value)
                VALUES (?, ?)
            ''', (reason, reason.split(':')[1] if ':' in reason else '0'))
            self.conn.commit()
            logger.warning(f"🛑 CIRCUIT BREAKER: {reason}")
            return {'signal': None, 'action': 'halted', 'reason': reason}
        
        # Filter check
        should_filter, filter_reason = self.should_filter_signal(raw_signal)
        
        # Calculate position
        position_usd, kelly_frac = 0, 0
        if not should_filter:
            win_rate = raw_signal.get('whale_metrics', {}).get('win_rate', 0.6)
            position_usd, kelly_frac = self.calculate_kelly_position(
                portfolio_value, confidence, win_rate
            )
            
            if position_usd == 0:
                should_filter = True
                filter_reason = "Kelly position too small (gas risk)"
        
        # Build signal record
        signal = {
            'whale_wallet': raw_signal.get('whale_wallet'),
            'whale_label': raw_signal.get('whale_label'),
            'token_address': raw_signal.get('token_address'),
            'token_symbol': raw_signal.get('token_symbol'),
            'chain': raw_signal.get('chain', 'ethereum'),
            'action': raw_signal.get('action', 'BUY'),
            'amount_usd': raw_signal.get('amount_usd', 0),
            'token_price_usd': raw_signal.get('token_price_usd'),
            'whale_total_trades': raw_signal.get('whale_metrics', {}).get('total_trades'),
            'whale_win_rate': raw_signal.get('whale_metrics', {}).get('win_rate'),
            'whale_avg_roi_30d': raw_signal.get('whale_metrics', {}).get('avg_roi_30d'),
            'whale_avg_roi_7d': raw_signal.get('whale_metrics', {}).get('avg_roi_7d'),
            'confidence_score': confidence,
            'suggested_position_usd': position_usd,
            'kelly_fraction': kelly_frac,
            'notes': filter_reason if should_filter else '',
            'raw_data': json.dumps(raw_signal),
            'status': 'filtered' if should_filter else 'sent',
        }
        
        # Save to database
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO whale_signals (
                whale_wallet, whale_label, token_address, token_symbol, chain,
                action, amount_usd, token_price_usd,
                whale_total_trades, whale_win_rate, whale_avg_roi_30d, whale_avg_roi_7d,
                confidence_score, suggested_position_usd, kelly_fraction,
                status, notes, raw_data
            ) VALUES (
                :whale_wallet, :whale_label, :token_address, :token_symbol, :chain,
                :action, :amount_usd, :token_price_usd,
                :whale_total_trades, :whale_win_rate, :whale_avg_roi_30d, :whale_avg_roi_7d,
                :confidence_score, :suggested_position_usd, :kelly_fraction,
                :status, :notes, :raw_data
            )
        ''', signal)
        signal_id = cursor.lastrowid
        self.conn.commit()
        
        # Add ID back to signal
        signal['id'] = signal_id
        
        action = 'filtered' if should_filter else 'sent'
        return {
            'signal': signal if not should_filter else None,
            'action': action,
            'reason': filter_reason if should_filter else "PASSED"
        }
    
    def format_telegram_alert(self, signal: Dict) -> str:
        """Format signal for Telegram alert."""
        emoji = "🟢" if signal['action'] == 'BUY' else "🔴"
        confidence_emoji = "🔥" if signal['confidence_score'] >= 0.9 else "📈"
        
        return f"""{confidence_emoji} {emoji} **WHALE CLONE SIGNAL #{signal['id']}**

**Action:** {signal['action']} {signal['token_symbol']}
**Whale:** `{signal['whale_wallet'][:20]}...` ({signal.get('whale_label', 'Unknown')})

**Trade Details:**
━━━━━━━━━━━━━━━━━━━━━
💰 Amount: ${signal['amount_usd']:,.0f}
💵 Price: ${signal['token_price_usd']:.8f}
📊 Confidence: {signal['confidence_score']:.0%}

**Recommended Position:**
━━━━━━━━━━━━━━━━━━━━━
💵 Size: ${signal['suggested_position_usd']:,.2f}
📈 Kelly: {signal['kelly_fraction']:.1%} of portfolio
🎯 Strategy: {signal.get('strategy', 'whale_clone')}

**Execute via:** 1inch / Matcha
**Protect:** Flashbots Protect RPC

*Dr. Simons says: Follow the data. Calculate the downside.*
"""
    
    def get_signal_stats(self) -> Dict:
        """Get current signal statistics."""
        cursor = self.conn.cursor()
        stats = {}
        
        # Overall counts
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END) as executed,
                SUM(CASE WHEN status = 'filtered' THEN 1 ELSE 0 END) as filtered,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM whale_signals
        ''')
        row = cursor.fetchone()
        stats['total_signals'] = row['total']
        stats['sent'] = row['sent']
        stats['executed'] = row['executed']
        stats['filtered'] = row['filtered']
        stats['failed'] = row['failed']
        
        # Today's signals
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT COUNT(*) FROM whale_signals
            WHERE date(timestamp) = ?
        ''', (today,))
        stats['today_signals'] = cursor.fetchone()[0]
        
        # Active positions
        cursor.execute('''
            SELECT COUNT(*), SUM(suggested_position_usd) 
            FROM whale_signals
            WHERE status = 'executed' AND current_pnl_pct IS NULL
        ''')
        row = cursor.fetchone()
        stats['active_positions'] = row[0]
        stats['exposure_usd'] = row[1] or 0
        
        return stats


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Process whale trading signals')
    parser.add_argument('--db', default='r-jim-simons.db', help='Database path')
    parser.add_argument('--test', action='store_true', help='Run with test data')
    parser.add_argument('--portfolio', type=float, default=10000, help='Portfolio value USD')
    parser.add_argument('--stats', action='store_true', help='Show statistics')
    args = parser.parse_args()
    
    processor = WhaleSignalProcessor(args.db)
    
    if args.stats:
        stats = processor.get_signal_stats()
        print("\n📊 R.Jim Simons Signal Statistics:")
        print("━" * 40)
        for k, v in stats.items():
            print(f"  {k}: {v:,.2f}" if isinstance(v, float) else f"  {k}: {v}")
    
    elif args.test:
        # Test with sample signal
        test_signal = {
            'whale_wallet': '0x1234...abcd',
            'whale_label': 'SmartMoney_Whale',
            'token_address': '0xA0b86a33E6b7dA3df3C8c0c5Ba8E8B1aB1a2F32',
            'token_symbol': 'EXAMPLE',
            'action': 'BUY',
            'amount_usd': 50000,
            'token_price_usd': 0.045,
            'whale_metrics': {
                'total_trades': 45,
                'win_rate': 0.73,
                'avg_roi_30d': 0.38,
                'avg_roi_7d': 0.12,
            }
        }
        
        result = processor.process_signal(test_signal, args.portfolio)
        print("\n🧪 Test Signal Result:")
        print(json.dumps(result, indent=2))
        
        if result['signal']:
            print("\n📨 Telegram Alert:")
            print(processor.format_telegram_alert(result['signal']))
    
    else:
        print("R.Jim Simons Signal Processor")
        print("Use --test to process a sample signal")
        print("Use --stats to view current statistics")
