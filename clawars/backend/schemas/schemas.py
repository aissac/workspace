"""
CLAWARS Pydantic Schemas
Request/Response models for API validation
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from models.models import StrategyType, StrategyStatus, BacktestStatus

# ═════════════════════════════════════════════════════════════════════════════
# AGENT SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class AgentBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, 
                       description="Agent display name")
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$',
                       description="Contact email")

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: UUID
    api_key: str = Field(..., description="API key for authentication")
    created_at: datetime
    reputation_score: float = Field(default=0.0, ge=0, le=100)
    is_active: bool
    
    class Config:
        from_attributes = True

class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    is_active: Optional[bool] = None

# ═════════════════════════════════════════════════════════════════════════════
# STRATEGY SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class StrategyBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    strategy_type: StrategyType
    asset: str = Field(..., pattern=r'^[A-Z]{3,10}(USDT|USD|BTC|ETH)$')
    timeframe: str = Field(..., pattern=r'^(1|5|15|30)m|(1|4)H|1D|1W$')

class StrategyCreate(StrategyBase):
    code: str = Field(..., min_length=50, 
                      description="Pine Script or Python code")

class StrategyResponse(StrategyBase):
    id: UUID
    agent_id: UUID
    code_hash: str
    status: StrategyStatus
    validation_errors: Optional[dict]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StrategyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[StrategyStatus] = None

class StrategySummary(BaseModel):
    """Lightweight strategy info for lists"""
    id: UUID
    name: str
    strategy_type: StrategyType
    asset: str
    timeframe: str
    status: StrategyStatus
    created_at: datetime

# ═════════════════════════════════════════════════════════════════════════════
# BACKTEST SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class BacktestCreate(BaseModel):
    strategy_id: UUID
    start_date: datetime
    end_date: datetime = Field(..., description="Must be after start_date")
    
    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if info.data.get('start_date') and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class BacktestMetrics(BaseModel):
    """Performance metrics from a completed backtest"""
    total_trades: int = Field(..., ge=0)
    win_rate: Optional[float] = Field(None, ge=0, le=100)
    profit_factor: Optional[float] = Field(None, ge=0)
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = Field(None, le=0)  # Negative percentage
    avg_trade_pnl: Optional[float] = None
    total_return: Optional[float] = None

class BacktestResponse(BaseModel):
    id: UUID
    agent_id: UUID
    strategy_id: UUID
    status: BacktestStatus
    start_date: datetime
    end_date: datetime
    metrics: Optional[BacktestMetrics]
    composite_score: Optional[float] = Field(None, ge=0, le=100)
    leaderboard_rank: Optional[int] = Field(None, ge=1)
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True

class BacktestDetail(BacktestResponse):
    trades: Optional[List[dict]]
    equity_curve: Optional[List[dict]]

# ═════════════════════════════════════════════════════════════════════════════
# LEADERBOARD SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class LeaderboardEntry(BaseModel):
    rank: int
    previous_rank: Optional[int]
    agent_name: str
    strategy_name: str
    strategy_id: UUID
    backtest_id: UUID
    composite_score: float
    sharpe_ratio: float
    profit_factor: float
    total_return: float
    total_trades: int
    calculated_at: datetime

class LeaderboardResponse(BaseModel):
    timeframe: str
    generated_at: datetime
    entries: List[LeaderboardEntry]
    total_entries: int

class LeaderboardQuery(BaseModel):
    timeframe: str = Field("all_time", pattern=r'^(24h|7d|30d|90d|all_time)$')
    limit: int = Field(100, ge=1, le=500)
    offset: int = Field(0, ge=0)

# ═════════════════════════════════════════════════════════════════════════════
# API RESPONSE SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None

class PaginatedResponse(BaseModel):
    """Paginated list response"""
    items: List[dict]
    total: int
    page: int
    per_page: int
    pages: int

# ═════════════════════════════════════════════════════════════════════════════
# WEBSOCKET SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class BacktestProgress(BaseModel):
    """Real-time backtest progress updates"""
    backtest_id: UUID
    status: BacktestStatus
    progress_percent: int = Field(..., ge=0, le=100)
    current_trade: Optional[int]
    total_trades_expected: Optional[int]
    message: Optional[str]

class LeaderboardUpdate(BaseModel):
    """Realtime leaderboard update"""
    timeframe: str
    entries_changed: List[LeaderboardEntry]
