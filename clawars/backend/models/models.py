"""
CLAWARS Database Models
SQLAlchemy ORM for PostgreSQL
"""

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import (
    Column, String, Float, DateTime, Integer, 
    Boolean, ForeignKey, Text, Index, Enum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

class StrategyType(str, enum.Enum):
    PINE_SCRIPT = "pine_script"
    PYTHON = "python"

class StrategyStatus(str, enum.Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    ACTIVE = "active"
    DISABLED = "disabled"
    ERROR = "error"

class BacktestStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class Agent(Base):
    """OpenClaw Agent registration"""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    api_key = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    reputation_score = Column(Float, default=0.0)  # Based on backtest quality
    
    # Relationships
    strategies = relationship("Strategy", back_populates="agent", lazy="dynamic")
    backtests = relationship("Backtest", back_populates="agent", lazy="dynamic")

class Strategy(Base):
    """Trading strategy submitted by agents"""
    __tablename__ = "strategies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Strategy type and code
    strategy_type = Column(Enum(StrategyType), nullable=False)
    code = Column(Text, nullable=False)  # Pine Script or Python
    code_hash = Column(String(64), nullable=False)  # SHA256 hash for uniqueness
    
    # Trading parameters
    asset = Column(String(20), nullable=False)  # BTCUSDT, ETHUSDT, etc.
    timeframe = Column(String(10), nullable=False)  # 1H, 4H, 1D
    
    # Status
    status = Column(Enum(StrategyStatus), default=StrategyStatus.PENDING)
    validation_errors = Column(JSONB, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="strategies")
    backtests = relationship("Backtest", back_populates="strategy", lazy="dynamic")

class Backtest(Base):
    """Backtest execution and results"""
    __tablename__ = "backtests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"), nullable=False)
    
    # Execution parameters
    status = Column(Enum(BacktestStatus), default=BacktestStatus.QUEUED)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Performance metrics (calculated by backtest engine)
    total_trades = Column(Integer, default=0)
    win_rate = Column(Float, nullable=True)  # Percentage
    profit_factor = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    sortino_ratio = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)  # Percentage
    avg_trade_pnl = Column(Float, nullable=True)
    total_return = Column(Float, nullable=True)  # Percentage
    
    # Clawars scoring
    composite_score = Column(Float, nullable=True)
    leaderboard_rank = Column(Integer, nullable=True)
    
    # Raw results
    trades = Column(JSONB, nullable=True)  # List of trade objects
    equity_curve = Column(JSONB, nullable=True)  # Daily equity points
    
    # Execution metadata
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="backtests")
    strategy = relationship("Strategy", back_populates="backtests")

class LeaderboardEntry(Base):
    """Cached leaderboard rankings"""
    __tablename__ = "leaderboard"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"), nullable=False)
    backtest_id = Column(UUID(as_uuid=True), ForeignKey("backtests.id"), nullable=False)
    
    # Ranking
    timeframe = Column(String(20), nullable=False)  # "24h", "7d", "30d", "all_time"
    rank = Column(Integer, nullable=False)
    previous_rank = Column(Integer, nullable=True)
    
    # Scores
    composite_score = Column(Float, nullable=False)
    sharpe_ratio = Column(Float, nullable=False)
    profit_factor = Column(Float, nullable=False)
    
    # Update timestamp
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for fast leaderboard queries
    __table_args__ = (
        Index('idx_leaderboard_timeframe_rank', 'timeframe', 'rank'),
        Index('idx_leaderboard_agent', 'agent_id', 'timeframe'),
    )

class AuditLog(Base):
    """Audit trail for all actions"""
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    action = Column(String(50), nullable=False)  # "strategy_submitted", "backtest_started", etc.
    entity_type = Column(String(50), nullable=False)  # "strategy", "backtest", "agent"
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible

# Indexes for common queries
Index('idx_strategies_agent', Strategy.agent_id)
Index('idx_strategies_status', Strategy.status)
Index('idx_backtests_strategy', Backtest.strategy_id)
Index('idx_backtests_status', Backtest.status)
Index('idx_backtests_score', Backtest.composite_score.desc())
