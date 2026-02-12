"""
CLAWARS Celery Worker
Async task processing for backtests
"""

from celery import Celery
from datetime import datetime
from typing import Dict, Any
import structlog

from core.config import settings

logger = structlog.get_logger()

# Celery app
celery_app = Celery(
    "clawars",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["workers.tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Task settings
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3000,  # 50 min soft limit
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
    
    # Result backend
    result_expires=86400,  # 24 hours
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        "update-leaderboard": {
            "task": "workers.tasks.update_leaderboard",
            "schedule": 300.0,  # Every 5 minutes
        },
        "cleanup-old-backtests": {
            "task": "workers.tasks.cleanup_old_backtests",
            "schedule": 86400.0,  # Daily
        },
    },
)


@celery_app.task(bind=True, name="workers.tasks.run_backtest")
def run_backtest(
    self,
    backtest_id: str,
    strategy_code: str,
    strategy_type: str,
    start_date: str,
    end_date: str,
    asset: str,
    timeframe: str
) -> Dict[str, Any]:
    """
    Execute a backtest asynchronously.
    
    Steps:
    1. Update status to "running"
    2. Fetch historical price data
    3. Execute strategy
    4. Calculate metrics
    5. Save results
    6. Update leaderboard
    """
    logger.info("Starting backtest", backtest_id=backtest_id)
    
    try:
        # Progress: 0%
        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "status": "Initializing backtest..."}
        )
        
        # Import here to avoid circular imports
        import asyncio
        from core.backtest_engine import BacktestEngine
        from datetime import datetime as dt
        
        # Parse dates
        start = dt.fromisoformat(start_date)
        end = dt.fromisoformat(end_date)
        
        # Progress: 10%
        self.update_state(
            state="PROGRESS",
            meta={"current": 10, "status": "Fetching price data..."}
        )
        
        # Run backtest
        engine = BacktestEngine()
        result = asyncio.run(engine.run_backtest(
            strategy_code=strategy_code,
            strategy_type=strategy_type,
            start_date=start,
            end_date=end
        ))
        
        # Progress: 90%
        self.update_state(
            state="PROGRESS",
            meta={"current": 90, "status": "Calculating metrics..."}
        )
        
        # Save results to database (in production)
        # await save_backtest_results(backtest_id, result)
        
        # Progress: 100%
        logger.info("Backtest completed", backtest_id=backtest_id, score=result.composite_score)
        
        return {
            "backtest_id": backtest_id,
            "status": "completed",
            "metrics": {
                "total_trades": result.total_trades,
                "win_rate": result.win_rate,
                "profit_factor": result.profit_factor,
                "sharpe_ratio": result.sharpe_ratio,
                "sortino_ratio": result.sortino_ratio,
                "max_drawdown": result.max_drawdown,
                "total_return": result.total_return,
                "composite_score": result.composite_score,
            },
            "completed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Backtest failed", backtest_id=backtest_id, error=str(e))
        return {
            "backtest_id": backtest_id,
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }


@celery_app.task(name="workers.tasks.update_leaderboard")
def update_leaderboard() -> Dict[str, int]:
    """
    Recalculate leaderboard rankings.
    Runs every 5 minutes via Celery Beat.
    """
    logger.info("Updating leaderboard")
    
    # In production: query all completed backtests, rank by composite_score
    # Update leaderboard_entries table
    
    return {"updated_entries": 0}


@celery_app.task(name="workers.tasks.cleanup_old_backtests")
def cleanup_old_backtests() -> Dict[str, int]:
    """
    Remove old backtest data to save space.
    Runs daily via Celery Beat.
    """
    logger.info("Cleaning up old backtests")
    
    # In production: delete backtest trades/equity_curve older than 90 days
    # Keep summary metrics
    
    return {"deleted": 0}


@celery_app.task(name="workers.tasks.validate_strategy")
def validate_strategy(strategy_code: str, strategy_type: str) -> Dict[str, Any]:
    """
    Validate a strategy before submission.
    Checks for syntax errors, forbidden operations, etc.
    """
    logger.info("Validating strategy", type=strategy_type)
    
    errors = []
    warnings = []
    
    if strategy_type == "pine_script":
        # Check for forbidden functions
        forbidden = ["strategy.entry", "strategy.exit", "strategy.close"]
        for func in forbidden:
            if func in strategy_code:
                errors.append(f"Forbidden function: {func} - use CLAWARS functions instead")
        
        # Check for minimum requirements
        if "study(" not in strategy_code and "strategy(" not in strategy_code:
            warnings.append("No study() or strategy() declaration found")
            
    elif strategy_type == "python":
        # Validate Python syntax
        try:
            compile(strategy_code, "<string>", "exec")
        except SyntaxError as e:
            errors.append(f"Syntax error: {e}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


@celery_app.task(name="workers.tasks.calculate_kelly")
def calculate_kelly(
    win_rate: float,
    avg_win: float,
    avg_loss: float
) -> Dict[str, float]:
    """
    Calculate Kelly Criterion optimal position size.
    
    Kelly % = W - [(1 - W) / R]
    where W = win rate, R = win/loss ratio
    """
    if avg_loss == 0:
        return {"kelly_fraction": 0, "error": "Average loss cannot be zero"}
    
    win_prob = win_rate / 100
    loss_prob = 1 - win_prob
    win_loss_ratio = avg_win / abs(avg_loss)
    
    kelly = win_prob - (loss_prob / win_loss_ratio)
    kelly = max(0, min(1, kelly))  # Clamp to 0-1
    
    # Half-Kelly for safety
    half_kelly = kelly * 0.5
    quarter_kelly = kelly * 0.25
    
    return {
        "kelly_fraction": round(kelly, 4),
        "half_kelly": round(half_kelly, 4),
        "quarter_kelly": round(quarter_kelly, 4),
        "win_loss_ratio": round(win_loss_ratio, 4)
    }