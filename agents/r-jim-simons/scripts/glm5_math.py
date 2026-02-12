#!/usr/bin/env python3
"""
GLM-5 Mathematical Calculator for R.Jim Simons
Routes all financial math through GLM-5 for rigor
"""

import subprocess
import json
import re

def glm5_calculate(prompt: str) -> dict:
    """
    Send calculation to GLM-5 via Ollama CLI.
    Returns parsed result.
    """
    full_prompt = f"""You are a quantitative finance calculator. Be precise.

Calculate the following and return ONLY a JSON object:
{prompt}

Your response must be valid JSON with numeric values. No explanation.
"""
    
    try:
        result = subprocess.run(
            ['ollama', 'run', 'glm-5:cloud', full_prompt],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Extract JSON from response
        response = result.stdout.strip()
        # Find JSON block
        json_match = re.search(r'\{[^}]+\}', response)
        if json_match:
            return json.loads(json_match.group())
        
        # Fallback: try parsing entire response
        return json.loads(response)
        
    except Exception as e:
        return {"error": str(e), "result": None}

def calculate_kelly(win_rate: float, avg_win_pct: float, avg_loss_pct: float) -> dict:
    """
    Calculate Kelly Criterion sizing using GLM-5.
    
    Args:
        win_rate: Probability of win (0-1)
        avg_win_pct: Average win percentage (e.g. 0.03 for 3%)
        avg_loss_pct: Average loss percentage (e.g. 0.015 for 1.5%)
    
    Returns:
        {
            "kelly_fraction": float,  # Full Kelly (0-1)
            "fractional_kelly_025": float,  # 0.25x Kelly
            "position_pct": float,  # Recommended % of portfolio
            "edge": float,  # Mathematical edge
            "formula": str  # Explanation
        }
    """
    prompt = f"""Calculate Kelly Criterion with:
- Win probability (p): {win_rate}
- Average win: {avg_win_pct}%
- Average loss: {avg_loss_pct}%

Return JSON: {{
    "kelly_fraction": [full Kelly 0-1],
    "fractional_kelly_025": [0.25 * Kelly],
    "position_pct": [fractional_kelly_025 * 100],
    "edge": [p * win - (1-p) * loss],
    "formula": "Kelly = (p*b - q) / b"
}}"""
    
    return glm5_calculate(prompt)

def calculate_position_size(
    portfolio_value: float,
    entry_price: float,
    stop_loss: float,
    risk_per_trade_pct: float = 0.01,  # 1% risk default
    confidence: float = 0.7
) -> dict:
    """
    Calculate position size using GLM-5.
    
    Returns:
        {
            "position_usd": float,
            "token_quantity": float,
            "risk_amount": float,
            "risk_reward_ratio": float
        }
    """
    prompt = f"""Calculate position size for trade:
- Portfolio: ${portfolio_value}
- Entry: ${entry_price}
- Stop: ${stop_loss}
- Risk per trade: {risk_per_trade_pct * 100}%
- Confidence: {confidence}

Formulas:
- Risk amount = Portfolio * Risk%
- Position size = Risk amount / (|Entry - Stop| / Entry)
- Position adjusted for confidence

Return JSON: {{
    "position_usd": [dollar amount],
    "token_quantity": [tokens to buy],
    "risk_amount": [dollar risk],
    "risk_reward": [ratio],
    "adjusted_for_confidence": "yes/no"
}}"""
    
    return glm5_calculate(prompt)

def calculate_var(portfolio_value: float, volatility: float, positions: list) -> dict:
    """
    Calculate Value at Risk using GLM-5.
    
    Returns:
        {
            "var_95": float,  # 95% VaR
            "var_99": float,  # 99% VaR
            "max_drawdown_estimate": float
        }
    """
    prompt = f"""Calculate Value at Risk:
- Portfolio: ${portfolio_value}
- Daily volatility: {volatility}%
- Positions: {len(positions)} correlated assets

Use parametric VaR: VaR = Portfolio * Z * σ
Z(95%) = 1.645, Z(99%) = 2.33

Return JSON: {{
    "var_95_usd": [dollar amount],
    "var_95_pct": [percentage],
    "var_99_usd": [dollar amount],  
    "var_99_pct": [percentage],
    "daily_vol": "{volatility}%"
}}"""
    
    return glm5_calculate(prompt)

def backtest_metrics(trades: list) -> dict:
    """
    Calculate trading performance metrics using GLM-5.
    
    Args:
        trades: List of {entry, exit, size, pnl}
    
    Returns:
        {
            "sharpe_ratio": float,
            "win_rate": float,
            "expectancy": float,
            "max_drawdown": float
        }
    """
    pnls = [t.get('pnl', 0) for t in trades]
    prompt = f"""Calculate trading metrics from PnL series: {pnls}

Formulas:
- Win rate = wins / total
- Expectancy = (win_rate * avg_win) - (loss_rate * avg_loss)
- Sharpe = (mean_return - risk_free) / std_dev
- Drawdown = peak_trough / peak

Return JSON: {{
    "sharpe_ratio": [calculated],
    "win_rate": [wins/total],
    "expectancy": [per trade expected value],
    "max_drawdown": [max peak-to-trough],
    "profitable": "yes/no"
}}"""
    
    return glm5_calculate(prompt)

if __name__ == '__main__':
    # Test
    print("Testing GLM-5 Kelly Calculator...")
    result = calculate_kelly(0.6, 0.03, 0.015)
    print(json.dumps(result, indent=2))
    
    print("\nTesting Position Sizing...")
    result = calculate_position_size(10000, 45000, 43500, 0.01, 0.8)
    print(json.dumps(result, indent=2))
