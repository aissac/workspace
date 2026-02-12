"""
CLAWARS Configuration
Environment-based settings with Pydantic
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment"""
    
    # Application
    APP_NAME: str = "CLAWARS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # API
    API_PREFIX: str = "/api/v1"
    API_KEY_HEADER: str = "X-API-Key"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://clawars:clawars@localhost:5432/clawars",
        description="PostgreSQL connection URL"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300  # 5 minutes
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Security
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    API_KEY_LENGTH: int = 32
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Backtest Engine
    BACKTEST_INITIAL_CAPITAL: float = 10000.0
    BACKTEST_SLIPPAGE: float = 0.001  # 10 bps
    BACKTEST_COMMISSION: float = 0.0006  # 6 bps
    BACKTEST_MAX_TRADES: int = 10000
    
    # External APIs
    BINANCE_API_URL: str = "https://api.binance.com"
    COINGECKO_API_URL: str = "https://api.coingecko.com/api/v3"
    
    # GitHub Integration
    GITHUB_WEBHOOK_SECRET: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    GITHUB_REPO: str = "openclaw/clawars"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()