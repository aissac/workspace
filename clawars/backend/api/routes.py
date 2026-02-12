"""
CLAWARS API Routes
FastAPI router for all endpoints
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Depends, Header, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import sys
sys.path.append('/home/issac-asimov/.openclaw/workspace/clawars/backend')

from schemas.schemas import (
    AgentCreate, AgentResponse, AgentUpdate,
    StrategyCreate, StrategyResponse, StrategyUpdate, StrategySummary,
    BacktestCreate, BacktestResponse, BacktestMetrics,
    LeaderboardQuery, LeaderboardResponse, LeaderboardEntry,
    APIResponse
)

router = APIRouter(prefix="/api/v1")

# ═════════════════════════════════════════════════════════════════════════════
# MOCK DATABASE (Replace with real SQLAlchemy in production)
# ═════════════════════════════════════════════════════════════════════════════

class MockDB:
    """In-memory database for development"""
    
    def __init__(self):
        self.agents = {}
        self.strategies = {}
        self.backtests = {}
        self.api_keys = {}
        
    def create_agent(self, data: dict) -> dict:
        agent_id = str(uuid4())
        api_key = f"claw_{uuid4().hex[:24]}"
        agent = {
            "id": agent_id,
            "name": data["name"],
            "email": data["email"],
            "api_key": api_key,
            "created_at": datetime.utcnow().isoformat(),
            "reputation_score": 0.0,
            "is_active": True
        }
        self.agents[agent_id] = agent
        self.api_keys[api_key] = agent_id
        return agent
        
    def get_agent_by_api_key(self, api_key: str) -> Optional[dict]:
        agent_id = self.api_keys.get(api_key)
        return self.agents.get(agent_id) if agent_id else None
        
    def create_strategy(self, agent_id: str, data: dict) -> dict:
        strategy_id = str(uuid4())
        strategy = {
            "id": strategy_id,
            "agent_id": agent_id,
            "name": data["name"],
            "strategy_type": data["strategy_type"],
            "asset": data["asset"],
            "timeframe": data["timeframe"],
            "code": data["code"],
            "code_hash": f"hash_{uuid4().hex[:16]}",
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        self.strategies[strategy_id] = strategy
        return strategy
        
    def create_backtest(self, agent_id: str, data: dict) -> dict:
        backtest_id = str(uuid4())
        backtest = {
            "id": backtest_id,
            "agent_id": agent_id,
            "strategy_id": data["strategy_id"],
            "status": "queued",
            "start_date": data["start_date"],
            "end_date": data["end_date"],
            "created_at": datetime.utcnow().isoformat()
        }
        self.backtests[backtest_id] = backtest
        return backtest

db = MockDB()

# ═════════════════════════════════════════════════════════════════════════════
# DEPENDENCIES
# ═════════════════════════════════════════════════════════════════════════════

async def get_current_agent(x_api_key: str = Header(None, alias="X-API-Key")):
    """Validate API key and return agent"""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    agent = db.get_agent_by_api_key(x_api_key)
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return agent

# ═════════════════════════════════════════════════════════════════════════════
# AGENT ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/agents", response_model=AgentResponse, status_code=201)
async def register_agent(agent: AgentCreate):
    """Register a new OpenClaw agent"""
    # Check if email exists
    for existing in db.agents.values():
        if existing["email"] == agent.email:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    new_agent = db.create_agent(agent.dict())
    return new_agent

@router.get("/agents/me", response_model=AgentResponse)
async def get_current_agent_info(agent: dict = Depends(get_current_agent)):
    """Get current agent's profile"""
    return agent

@router.patch("/agents/me", response_model=AgentResponse)
async def update_agent(
    update: AgentUpdate,
    agent: dict = Depends(get_current_agent)
):
    """Update agent profile"""
    if update.name:
        agent["name"] = update.name
    if update.email:
        agent["email"] = update.email
    if update.is_active is not None:
        agent["is_active"] = update.is_active
    agent["updated_at"] = datetime.utcnow().isoformat()
    return agent

# ═════════════════════════════════════════════════════════════════════════════
# STRATEGY ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/strategies", response_model=StrategyResponse, status_code=201)
async def submit_strategy(
    strategy: StrategyCreate,
    agent: dict = Depends(get_current_agent)
):
    """Submit a new trading strategy"""
    new_strategy = db.create_strategy(agent["id"], strategy.dict())
    return new_strategy

@router.get("/strategies", response_model=List[StrategyResponse])
async def list_strategies(
    agent: dict = Depends(get_current_agent),
    status: Optional[str] = Query(None),
    asset: Optional[str] = Query(None)
):
    """List all agent strategies"""
    strategies = [
        s for s in db.strategies.values()
        if s["agent_id"] == agent["id"]
    ]
    
    if status:
        strategies = [s for s in strategies if s["status"] == status]
    if asset:
        strategies = [s for s in strategies if s["asset"] == asset]
        
    return strategies

@router.get("/strategies/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: UUID,
    agent: dict = Depends(get_current_agent)
):
    """Get strategy details"""
    strategy = db.strategies.get(str(strategy_id))
    if not strategy or strategy["agent_id"] != agent["id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy

@router.delete("/strategies/{strategy_id}")
async def delete_strategy(
    strategy_id: UUID,
    agent: dict = Depends(get_current_agent)
):
    """Delete a strategy"""
    strategy = db.strategies.get(str(strategy_id))
    if not strategy or strategy["agent_id"] != agent["id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    del db.strategies[str(strategy_id)]
    return {"success": True, "message": "Strategy deleted"}

# ═════════════════════════════════════════════════════════════════════════════
# BACKTEST ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/backtests", response_model=BacktestResponse, status_code=202)
async def run_backtest(
    backtest: BacktestCreate,
    background_tasks: BackgroundTasks,
    agent: dict = Depends(get_current_agent)
):
    """Queue a backtest for execution"""
    # Validate strategy exists
    strategy = db.strategies.get(backtest.strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    if strategy["agent_id"] != agent["id"]:
        raise HTTPException(status_code=403, detail="Not your strategy")
        
    new_backtest = db.create_backtest(agent["id"], backtest.dict())
    
    # In production: queue to Celery worker
    # background_tasks.add_task(run_backtest_async, new_backtest["id"])
    
    return new_backtest

@router.get("/backtests", response_model=List[BacktestResponse])
async def list_backtests(
    agent: dict = Depends(get_current_agent),
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100)
):
    """List agent's backtests"""
    backtests = [
        b for b in db.backtests.values()
        if b["agent_id"] == agent["id"]
    ]
    
    if status:
        backtests = [b for b in backtests if b["status"] == status]
        
    return backtests[:limit]

@router.get("/backtests/{backtest_id}", response_model=BacktestResponse)
async def get_backtest(
    backtest_id: UUID,
    agent: dict = Depends(get_current_agent)
):
    """Get backtest results"""
    backtest = db.backtests.get(str(backtest_id))
    if not backtest or backtest["agent_id"] != agent["id"]:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest

@router.get("/backtests/{backtest_id}/results")
async def get_backtest_results(
    backtest_id: UUID,
    agent: dict = Depends(get_current_agent)
):
    """Get detailed backtest results including trades"""
    backtest = db.backtests.get(str(backtest_id))
    if not backtest or backtest["agent_id"] != agent["id"]:
        raise HTTPException(status_code=404, detail="Backtest not found")
        
    if backtest["status"] != "completed":
        raise HTTPException(status_code=400, detail="Backtest not completed")
        
    return {
        "backtest_id": backtest_id,
        "metrics": backtest.get("metrics", {}),
        "trades": backtest.get("trades", []),
        "equity_curve": backtest.get("equity_curve", [])
    }

# ═════════════════════════════════════════════════════════════════════════════
# LEADERBOARD ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    timeframe: str = Query("all_time", pattern=r"^(24h|7d|30d|90d|all_time)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get leaderboard rankings"""
    # Mock data for demonstration
    entries = []
    for i in range(min(limit, 10)):
        entries.append({
            "rank": i + 1,
            "previous_rank": i + 2 if i < 5 else i,
            "agent_name": f"Agent {i+1}",
            "strategy_name": f"Strategy Alpha {i+1}",
            "strategy_id": str(uuid4()),
            "backtest_id": str(uuid4()),
            "composite_score": round(95 - i * 3.5, 2),
            "sharpe_ratio": round(2.5 - i * 0.2, 2),
            "profit_factor": round(2.0 - i * 0.15, 2),
            "total_return": round(45 - i * 5, 2),
            "total_trades": 100 + i * 20,
            "calculated_at": datetime.utcnow().isoformat()
        })
        
    return {
        "timeframe": timeframe,
        "generated_at": datetime.utcnow().isoformat(),
        "entries": entries,
        "total_entries": 1000
    }

@router.get("/leaderboard/me")
async def get_my_leaderboard_position(
    agent: dict = Depends(get_current_agent),
    timeframe: str = Query("all_time")
):
    """Get current agent's position on leaderboard"""
    return {
        "agent_id": agent["id"],
        "rank": 42,
        "timeframe": timeframe,
        "score": 78.5
    }

# ═════════════════════════════════════════════════════════════════════════════
# WEBSOCKET ENDPOINTS (For real-time updates)
# ═════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws/backtest/{backtest_id}")
async def backtest_websocket(websocket):
    """Stream real-time backtest progress"""
    # Implementation for WebSocket streaming
    pass

# ═════════════════════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status")
async def system_status():
    """Get system status and queue information"""
    return {
        "agents": len(db.agents),
        "strategies": len(db.strategies),
        "backtests_queued": sum(1 for b in db.backtests.values() if b["status"] == "queued"),
        "backtests_running": sum(1 for b in db.backtests.values() if b["status"] == "running"),
        "timestamp": datetime.utcnow().isoformat()
    }
