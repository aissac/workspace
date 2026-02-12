#!/usr/bin/env python3
"""
Initialize the R.Jim Simons Trading Database
Phase 1 MVP: Smart Money Cloner
"""

import sqlite3
import os
from pathlib import Path

def init_database(db_path="r-jim-simons.db"):
    """Initialize SQLite database for signal tracking and performance metrics."""
    
    # Ensure directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Main signals table — every detected and processed signal
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS whale_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            timestamp_utc TEXT,
            
            -- Whale/Signal source
            whale_wallet VARCHAR(42) NOT NULL,
            whale_label TEXT,  -- Optional human-readable label
            
            -- Token details
            token_address VARCHAR(42) NOT NULL,
            token_symbol VARCHAR(20),
            token_name TEXT,
            chain VARCHAR(20) DEFAULT 'ethereum',  -- ethereum, arbitrum, base, etc.
            
            -- Action details
            action VARCHAR(10) CHECK(action IN ('BUY', 'SELL')) NOT NULL,
            amount_token DECIMAL(36, 18),
            amount_usd DECIMAL(18, 2),
            token_price_usd DECIMAL(18, 8),
            
            -- Whale performance metrics (for filtering)
            whale_total_trades INTEGER,
            whale_win_rate DECIMAL(5, 2),  -- e.g. 0.65 for 65%
            whale_avg_roi_30d DECIMAL(10, 4),  -- e.g. 0.25 for 25%
            whale_avg_roi_7d DECIMAL(10, 4),
            
            -- Calculated confidence
            confidence_score DECIMAL(3, 2) CHECK(confidence_score >= 0 AND confidence_score <= 1),
            
            -- Strategy metadata
            strategy VARCHAR(50) DEFAULT 'whale_clone',
            strategy_params TEXT,  -- JSON for parameters
            
            -- Risk calculations
            suggested_position_usd DECIMAL(18, 2),  -- Kelly-sized position
            kelly_fraction DECIMAL(5, 4),  -- e.g. 0.10 for 10%
            
            -- Execution tracking
            executed BOOLEAN DEFAULT FALSE,
            executed_at DATETIME,
            execution_price DECIMAL(18, 8),
            execution_amount_usd DECIMAL(18, 2),
            execution_tx_hash VARCHAR(66),  -- Transaction hash
            executed_by TEXT,  -- Who executed (manual/automated)
            
            -- PnL tracking
            current_pnl_pct DECIMAL(10, 4),  -- Running PnL
            closed_pnl_pct DECIMAL(10, 4),  -- Final PnL on exit
            exit_price DECIMAL(18, 8),
            exit_at DATETIME,
            exit_reason VARCHAR(50),  -- target_hit, stop_loss, time_stop, manual
            
            -- Status
            status VARCHAR(20) DEFAULT 'pending' 
                CHECK(status IN ('pending', 'filtered', 'sent', 'executed', 'open', 'closed', 'failed')),
            
            -- Metadata
            notes TEXT,
            source_dune_query_id TEXT,
            raw_data TEXT  -- JSON of source data for debugging
        )
    ''')
    
    # Whale performance tracking — for ongoing filter updates
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS whale_performance (
            wallet VARCHAR(42) PRIMARY KEY,
            label TEXT,
            chain VARCHAR(20) DEFAULT 'ethereum',
            
            -- Performance metrics
            total_trades INTEGER DEFAULT 0,
            winning_trades INTEGER DEFAULT 0,
            losing_trades INTEGER DEFAULT 0,
            win_rate DECIMAL(5, 2) DEFAULT 0,
            
            -- ROI by timeframe
            avg_roi_24h DECIMAL(10, 4) DEFAULT 0,
            avg_roi_7d DECIMAL(10, 4) DEFAULT 0,
            avg_roi_30d DECIMAL(10, 4) DEFAULT 0,
            avg_roi_90d DECIMAL(10, 4) DEFAULT 0,
            
            -- Additional metrics
            avg_trade_size_usd DECIMAL(18, 2) DEFAULT 0,
            total_volume_usd DECIMAL(18, 2) DEFAULT 0,
            sharpe_ratio DECIMAL(5, 2) DEFAULT 0,
            max_drawdown DECIMAL(5, 2) DEFAULT 0,
            
            -- Status
            is_active BOOLEAN DEFAULT TRUE,
            blacklist_reason TEXT,  -- If manually blacklisted
            
            -- Tracking
            first_seen_at DATETIME,
            last_trade_at DATETIME,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Daily portfolio/risk metrics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_metrics (
            date DATE PRIMARY KEY,
            
            -- Portfolio
            start_balance_usd DECIMAL(18, 2),
            end_balance_usd DECIMAL(18, 2),
            daily_pnl_usd DECIMAL(18, 2),
            daily_pnl_pct DECIMAL(10, 4),
            
            -- Risk metrics
            max_drawdown_pct DECIMAL(5, 2),
            var_95 DECIMAL(18, 2),  -- Value at Risk
            
            -- Trading metrics
            signals_generated INTEGER,
            signals_filtered INTEGER,
            signals_sent INTEGER,
            trades_executed INTEGER,
            win_rate DECIMAL(5, 2),
            avg_trade_pnl_pct DECIMAL(10, 4),
            
            -- Costs
            total_gas_fees_eth DECIMAL(18, 8),
            total_gas_fees_usd DECIMAL(18, 2),
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Circuit breaker log — track when trading halted
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS circuit_breaker_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reason VARCHAR(50),
            threshold_value DECIMAL(10, 4),
            actual_value DECIMAL(10, 4),
            duration_minutes INTEGER,
            reset_at DATETIME,
            resolved BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Configuration/settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT,
            value_type VARCHAR(20),  -- int, float, string, json
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default configuration
    default_config = [
        ('MIN_WALLET_TRADES_30D', '10', 'int', 'Minimum trades in last 30 days for whale inclusion'),
        ('MIN_WALLET_ROI_30D', '0.15', 'float', 'Minimum 30d ROI for whale inclusion (0.15=15%)'),
        ('MIN_WALLET_WINRATE', '0.55', 'float', 'Minimum win rate for whale inclusion'),
        ('MIN_TRADE_SIZE_USD', '10000', 'float', 'Minimum trade size to consider for cloning'),
        ('MIN_CONFIDENCE_SCORE', '0.7', 'float', 'Minimum confidence score to send signal'),
        ('MIN_POSITION_USD', '100', 'float', 'Minimum position size (below = gas exceeds profit)'),
        ('MAX_DAILY_DRAWDOWN_PCT', '-0.05', 'float', 'Halt trading if daily drawdown exceeds this (-5%)'),
        ('KELLY_FRACTION', '0.25', 'float', 'Fraction of Kelly Criterion to use (0.25 = 25%)'),
        ('MAX_POSITION_PCT', '0.05', 'float', 'Maximum position size as % of portfolio (5%)'),
        ('TIME_STOP_HOURS', '4', 'int', 'Close position if thesis fails within this time'),
        ('MAX_SLIPPAGE_PCT', '0.005', 'float', 'Maximum acceptable slippage (0.5%)'),
        ('DAILY_SIGNAL_LIMIT', '5', 'int', 'Maximum number of signals per day'),
        ('BLACKLIST_GAS_TOKEN_PCT', '0.15', 'float', 'Blacklist tokens where gas > 15% of trade'),
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO config (key, value, value_type, description) VALUES (?, ?, ?, ?)',
        default_config
    )
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_status ON whale_signals(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_whale ON whale_signals(whale_wallet)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_token ON whale_signals(token_address)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON whale_signals(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_perf_roi ON whale_performance(avg_roi_30d DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_perf_active ON whale_performance(is_active)')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized: {db_path}")
    print(f"   Tables created: whale_signals, whale_performance, daily_metrics, circuit_breaker_log, config")
    return db_path

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Initialize R.Jim Simons trading database')
    parser.add_argument('--db', default='r-jim-simons.db', help='Database file path')
    args = parser.parse_args()
    
    db = init_database(args.db)
    print(f"\nNext steps:")
    print(f"   1. Run: python scripts/update_whale_list.py")
    print(f"   2. Configure Telegram bot in .env")
    print(f"   3. Set up n8n workflow to poll Dune")
