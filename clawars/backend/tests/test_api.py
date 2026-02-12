import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
from httpx import AsyncClient
from main import app
from core.config import settings


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Async test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoints:
    """Test health and status endpoints"""

    @pytest.mark.anyio
    async def test_health_check(self, client: AsyncClient):
        """Test health endpoint returns healthy status"""
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    @pytest.mark.anyio
    async def test_status_endpoint(self, client: AsyncClient):
        """Test status endpoint returns system info"""
        response = await client.get("/api/v1/status")
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "strategies" in data


class TestAgentEndpoints:
    """Test agent registration and management"""

    @pytest.mark.anyio
    async def test_register_agent(self, client: AsyncClient):
        """Test agent registration"""
        response = await client.post(
            "/api/v1/agents",
            json={
                "name": "Test Agent",
                "email": "test@example.com"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "api_key" in data
        assert data["name"] == "Test Agent"

    @pytest.mark.anyio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test duplicate email rejection"""
        # First registration
        await client.post(
            "/api/v1/agents",
            json={"name": "Agent 1", "email": "dup@example.com"}
        )
        
        # Duplicate registration
        response = await client.post(
            "/api/v1/agents",
            json={"name": "Agent 2", "email": "dup@example.com"}
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_get_current_agent(self, client: AsyncClient):
        """Test getting current agent info"""
        # Register agent
        reg_response = await client.post(
            "/api/v1/agents",
            json={"name": "Info Agent", "email": "info@example.com"}
        )
        api_key = reg_response.json()["api_key"]
        
        # Get info
        response = await client.get(
            "/api/v1/agents/me",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Info Agent"


class TestStrategyEndpoints:
    """Test strategy submission and management"""

    @pytest.mark.anyio
    async def test_submit_strategy(self, client: AsyncClient):
        """Test strategy submission"""
        # Register agent
        reg_response = await client.post(
            "/api/v1/agents",
            json={"name": "Strat Agent", "email": "strat@example.com"}
        )
        api_key = reg_response.json()["api_key"]
        
        # Submit strategy
        response = await client.post(
            "/api/v1/strategies",
            headers={"X-API-Key": api_key},
            json={
                "name": "Test Strategy",
                "strategy_type": "pine_script",
                "asset": "BTCUSDT",
                "timeframe": "4H",
                "code": "// Test code"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Strategy"

    @pytest.mark.anyio
    async def test_list_strategies(self, client: AsyncClient):
        """Test listing strategies"""
        # Register and submit
        reg_response = await client.post(
            "/api/v1/agents",
            json={"name": "List Agent", "email": "list@example.com"}
        )
        api_key = reg_response.json()["api_key"]
        
        await client.post(
            "/api/v1/strategies",
            headers={"X-API-Key": api_key},
            json={
                "name": "Strategy 1",
                "strategy_type": "pine_script",
                "asset": "BTCUSDT",
                "timeframe": "4H",
                "code": "// Code"
            }
        )
        
        # List
        response = await client.get(
            "/api/v1/strategies",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        assert len(response.json()) > 0


class TestBacktestEndpoints:
    """Test backtest execution"""

    @pytest.mark.anyio
    async def test_run_backtest(self, client: AsyncClient):
        """Test backtest creation"""
        # Setup
        reg_response = await client.post(
            "/api/v1/agents",
            json={"name": "BT Agent", "email": "bt@example.com"}
        )
        api_key = reg_response.json()["api_key"]
        
        strat_response = await client.post(
            "/api/v1/strategies",
            headers={"X-API-Key": api_key},
            json={
                "name": "BT Strategy",
                "strategy_type": "pine_script",
                "asset": "BTCUSDT",
                "timeframe": "4H",
                "code": "// Code"
            }
        )
        strategy_id = strat_response.json()["id"]
        
        # Create backtest
        response = await client.post(
            "/api/v1/backtests",
            headers={"X-API-Key": api_key},
            json={
                "strategy_id": strategy_id,
                "start_date": "2023-01-01",
                "end_date": "2023-12-31"
            }
        )
        assert response.status_code == 202
        assert response.json()["status"] == "queued"


class TestLeaderboardEndpoints:
    """Test leaderboard queries"""

    @pytest.mark.anyio
    async def test_get_leaderboard(self, client: AsyncClient):
        """Test leaderboard retrieval"""
        response = await client.get("/api/v1/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "timeframe" in data
        assert "total_entries" in data

    @pytest.mark.anyio
    async def test_leaderboard_timeframe_filter(self, client: AsyncClient):
        """Test timeframe filter"""
        for tf in ["24h", "7d", "30d", "all_time"]:
            response = await client.get(f"/api/v1/leaderboard?timeframe={tf}")
            assert response.status_code == 200
            assert response.json()["timeframe"] == tf