import type {
  Agent,
  AgentDashboard,
  AgentMetrics,
  Position,
  Signal,
  StrategyConfig,
  RiskMetrics,
  EquityPoint,
  LeaderboardEntry,
  LeaderboardData,
  AggregatedRiskDashboard,
  CandleData,
} from './types';

const AGENTS: Agent[] = [
  { id: 'agent-1', name: 'R.Jim Simons', status: 'active', strategy_name: 'Residual Momentum v3', strategy_version: '1.2.0', created_at: '2026-01-15', updated_at: '2026-02-12' },
  { id: 'agent-2', name: 'AlphaQuant', status: 'active', strategy_name: 'Statistical Arbitrage', strategy_version: '2.1.0', created_at: '2026-01-18', updated_at: '2026-02-12' },
  { id: 'agent-3', name: 'TrendHunter', status: 'active', strategy_name: 'Trend Following Pro', strategy_version: '3.0.0', created_at: '2026-01-20', updated_at: '2026-02-11' },
  { id: 'agent-4', name: 'MeanRevBot', status: 'paused', strategy_name: 'Mean Reversion Elite', strategy_version: '1.5.0', created_at: '2026-01-22', updated_at: '2026-02-10' },
  { id: 'agent-5', name: 'MomentumAI', status: 'active', strategy_name: 'Momentum Breakout', strategy_version: '2.3.0', created_at: '2026-01-25', updated_at: '2026-02-12' },
  { id: 'agent-6', name: 'StatArbPro', status: 'error', strategy_name: 'Pairs Trading Alpha', strategy_version: '1.0.0', created_at: '2026-01-28', updated_at: '2026-02-09' },
  { id: 'agent-7', name: 'GridMaster', status: 'active', strategy_name: 'Grid Strategy X', strategy_version: '4.0.0', created_at: '2026-01-30', updated_at: '2026-02-12' },
  { id: 'agent-8', name: 'VolTrader', status: 'active', strategy_name: 'Volatility Harvest', strategy_version: '2.0.0', created_at: '2026-02-01', updated_at: '2026-02-12' },
];

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'NEARUSDT'];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateMockMetrics(agentId: string): AgentMetrics {
  const baseCapital = 10000;
  const totalReturn = randomInRange(-0.1, 0.5);
  const portfolioValue = baseCapital * (1 + totalReturn);
  const winRate = randomInRange(0.45, 0.65);
  const totalTrades = Math.floor(randomInRange(100, 500));
  
  return {
    agent_id: agentId,
    portfolio_value: Math.round(portfolioValue * 100) / 100,
    initial_capital: baseCapital,
    total_pnl: Math.round((portfolioValue - baseCapital) * 100) / 100,
    total_pnl_pct: Math.round(totalReturn * 10000) / 100,
    daily_pnl: Math.round(randomInRange(-500, 1000) * 100) / 100,
    daily_pnl_pct: Math.round(randomInRange(-2, 5) * 100) / 100,
    sharpe_ratio: Math.round(randomInRange(0.8, 2.5) * 100) / 100,
    sortino_ratio: Math.round(randomInRange(1.0, 3.0) * 100) / 100,
    win_rate: Math.round(winRate * 10000) / 100,
    total_trades: totalTrades,
    winning_trades: Math.floor(totalTrades * winRate),
    profit_factor: Math.round(randomInRange(1.2, 2.5) * 100) / 100,
    max_drawdown: Math.round(randomInRange(0.05, 0.15) * portfolioValue * 100) / 100,
    max_drawdown_pct: Math.round(randomInRange(5, 15) * 100) / 100,
    current_drawdown: Math.round(randomInRange(0, 0.05) * portfolioValue * 100) / 100,
    current_drawdown_pct: Math.round(randomInRange(0, 5) * 100) / 100,
    kelly_fraction: Math.round(randomInRange(0.15, 0.4) * 100) / 100,
    var_95: Math.round(randomInRange(0.02, 0.05) * portfolioValue * 100) / 100,
    expected_shortfall: Math.round(randomInRange(0.03, 0.07) * portfolioValue * 100) / 100,
    calculated_at: new Date().toISOString(),
  };
}

export function generateMockPositions(agentId: string): Position[] {
  const positions: Position[] = [];
  const count = Math.floor(randomInRange(0, 3));
  
  for (let i = 0; i < count; i++) {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const entryPrice = symbol.includes('BTC') ? randomInRange(42000, 48000) :
                       symbol.includes('ETH') ? randomInRange(2500, 3200) :
                       symbol.includes('SOL') ? randomInRange(100, 130) :
                       symbol.includes('AVAX') ? randomInRange(30, 45) :
                       randomInRange(3, 10);
    const currentPrice = entryPrice * (1 + randomInRange(-0.05, 0.05));
    const quantity = randomInRange(0.1, 2);
    
    positions.push({
      id: `pos-${agentId}-${i}`,
      agent_id: agentId,
      symbol,
      side: Math.random() > 0.3 ? 'long' : 'short',
      entry_price: Math.round(entryPrice * 100) / 100,
      current_price: Math.round(currentPrice * 100) / 100,
      quantity: Math.round(quantity * 1000) / 1000,
      notional_value: Math.round(currentPrice * quantity * 100) / 100,
      unrealized_pnl: Math.round((currentPrice - entryPrice) * quantity * 100) / 100,
      unrealized_pnl_pct: Math.round(((currentPrice - entryPrice) / entryPrice) * 10000) / 100,
      entry_time: new Date(Date.now() - randomInRange(1, 48) * 3600000).toISOString(),
      stop_loss: Math.round(entryPrice * 0.95 * 100) / 100,
      take_profit: Math.round(entryPrice * 1.08 * 100) / 100,
    });
  }
  
  return positions;
}

export function generateMockSignals(agentId: string, agentName: string, count = 10): Signal[] {
  const signals: Signal[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const actions: Signal['action'][] = ['buy', 'sell', 'close_long', 'close_short'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const basePrice = symbol.includes('BTC') ? 45000 :
                      symbol.includes('ETH') ? 2800 :
                      symbol.includes('SOL') ? 110 :
                      symbol.includes('AVAX') ? 35 : 5;
    
    signals.push({
      id: `sig-${agentId}-${i}`,
      agent_id: agentId,
      agent_name: agentName,
      symbol,
      action,
      price: Math.round(basePrice * (1 + randomInRange(-0.02, 0.02)) * 100) / 100,
      quantity: Math.round(randomInRange(0.01, 1) * 1000) / 1000,
      confidence: Math.round(randomInRange(0.6, 0.95) * 100) / 100,
      strategy_signal: ['RSI_OVERSOLD', 'VWAP_REVERSION', 'BB_BREAK', 'TREND_CONFIRM'][Math.floor(Math.random() * 4)],
      timestamp: new Date(now - i * randomInRange(5, 60) * 60000).toISOString(),
      executed: Math.random() > 0.3,
      execution_price: Math.random() > 0.3 ? Math.round(basePrice * (1 + randomInRange(-0.005, 0.005)) * 100) / 100 : undefined,
      execution_time: Math.random() > 0.3 ? new Date(now - i * randomInRange(5, 60) * 60000 + 1000).toISOString() : undefined,
    });
  }
  
  return signals;
}

export function generateMockStrategyConfig(agentId: string): StrategyConfig {
  return {
    strategy_id: `strat-${agentId}`,
    strategy_name: 'VWAP Mean Reversion',
    strategy_version: '1.2.0',
    parameters: {
      vwap_period: 20,
      bb_period: 20,
      bb_std: 2,
      rsi_period: 14,
      rsi_oversold: 30,
      rsi_overbought: 70,
    },
    signal_filter: 'Trend Confirmed',
    position_sizing: 'Kelly Criterion',
    kelly_multiplier: 0.25,
    max_position_pct: 10,
    stop_loss_pct: 5,
    take_profit_pct: 8,
    time_stop_hours: 48,
    enabled: true,
  };
}

export function generateMockRiskMetrics(agentId: string): RiskMetrics {
  return {
    agent_id: agentId,
    daily_drawdown: Math.round(randomInRange(0, 3) * 100) / 100,
    daily_drawdown_limit: 5,
    portfolio_heat: Math.round(randomInRange(0, 80) * 100) / 100,
    portfolio_heat_limit: 100,
    max_correlation: Math.round(randomInRange(0.2, 0.7) * 100) / 100,
    beta: Math.round(randomInRange(0.5, 1.5) * 100) / 100,
    var_95: Math.round(randomInRange(200, 800) * 100) / 100,
    expected_shortfall: Math.round(randomInRange(300, 1200) * 100) / 100,
    leverage: Math.round(randomInRange(0.5, 2) * 100) / 100,
    margin_used: Math.round(randomInRange(1000, 5000) * 100) / 100,
    margin_available: Math.round(randomInRange(5000, 20000) * 100) / 100,
    risk_score: Math.round(randomInRange(1, 10) * 10) / 10,
    timestamp: new Date().toISOString(),
  };
}

export function generateMockEquityCurve(agentId: string, days = 30): EquityPoint[] {
  const data: EquityPoint[] = [];
  const now = new Date();
  let value = 10000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    value = value * (1 + randomInRange(-0.02, 0.03));
    data.push({
      time: Math.floor(date.getTime() / 1000),
      value: Math.round(value * 100) / 100,
    });
  }
  
  return data;
}

export function generateMockCandleData(symbol: string, count = 100): CandleData[] {
  const data: CandleData[] = [];
  const now = new Date();
  let price = symbol.includes('BTC') ? 45000 :
              symbol.includes('ETH') ? 2800 :
              symbol.includes('SOL') ? 110 :
              symbol.includes('AVAX') ? 35 : 5;
  
  for (let i = count; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const volatility = price * 0.02;
    const open = price + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      time: Math.floor(date.getTime() / 1000),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(randomInRange(100, 500)),
    });
    
    price = close;
  }
  
  return data;
}

export function generateMockAgentDashboard(agentId: string): AgentDashboard | null {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return null;
  
  return {
    agent,
    metrics: generateMockMetrics(agentId),
    positions: generateMockPositions(agentId),
    recent_signals: generateMockSignals(agentId, agent.name),
    strategy_config: generateMockStrategyConfig(agentId),
    risk: generateMockRiskMetrics(agentId),
    equity_curve: generateMockEquityCurve(agentId),
  };
}

export function generateMockLeaderboard(timeframe = 'all_time'): LeaderboardData {
  const entries: LeaderboardEntry[] = AGENTS.map((agent, i) => ({
    rank: i + 1,
    previous_rank: i < 3 ? i + 2 : Math.max(1, i - 1 + Math.floor(Math.random() * 3)),
    agent_id: agent.id,
    agent_name: agent.name,
    strategy_name: agent.strategy_name,
    strategy_id: `strat-${agent.id}`,
    backtest_id: `bt-${agent.id}`,
    composite_score: Math.round((95 - i * 4.5 + Math.random() * 2) * 100) / 100,
    sharpe_ratio: Math.round((2.8 - i * 0.2 + Math.random() * 0.3) * 100) / 100,
    profit_factor: Math.round((2.5 - i * 0.1 + Math.random() * 0.2) * 100) / 100,
    total_return: Math.round((65 - i * 6 + Math.random() * 10) * 100) / 100,
    win_rate: Math.round((58 + Math.random() * 10 - i) * 100) / 100,
    total_trades: Math.floor(100 + Math.random() * 200),
    max_drawdown: Math.round((5 + i * 0.5 + Math.random() * 3) * 100) / 100,
    calculated_at: new Date().toISOString(),
  })).sort((a, b) => b.composite_score - a.composite_score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return {
    timeframe,
    generated_at: new Date().toISOString(),
    entries,
    total_entries: 157,
  };
}

export function generateMockAggregatedRisk(): AggregatedRiskDashboard {
  const activeAgents = AGENTS.filter(a => a.status === 'active');
  
  return {
    total_portfolio_value: Math.round(randomInRange(50000, 150000) * 100) / 100,
    total_pnl: Math.round(randomInRange(5000, 25000) * 100) / 100,
    total_pnl_pct: Math.round(randomInRange(5, 20) * 100) / 100,
    active_agents: activeAgents.length,
    total_positions: Math.floor(randomInRange(5, 15)),
    aggregate_drawdown: Math.round(randomInRange(1, 4) * 100) / 100,
    aggregate_heat: Math.round(randomInRange(30, 70) * 100) / 100,
    signals_last_hour: Math.floor(randomInRange(5, 25)),
    top_performers: AGENTS.slice(0, 3).map(a => ({
      agent_id: a.id,
      agent_name: a.name,
      return_pct: Math.round(randomInRange(10, 30) * 100) / 100,
    })),
    worst_performers: AGENTS.slice(-2).map(a => ({
      agent_id: a.id,
      agent_name: a.name,
      return_pct: Math.round(randomInRange(-10, -2) * 100) / 100,
    })),
    risk_alerts: [
      { agent_id: 'agent-6', agent_name: 'StatArbPro', alert_type: 'CONSECUTIVE_LOSSES', severity: 'high', message: '5 consecutive losing trades', timestamp: new Date().toISOString() },
      { agent_id: 'agent-4', agent_name: 'MeanRevBot', alert_type: 'DRAWDOWN_WARNING', severity: 'medium', message: 'Approaching daily drawdown limit', timestamp: new Date().toISOString() },
    ],
  };
}

export function getAllAgents(): Agent[] {
  return AGENTS;
}

export function getAgentById(agentId: string): Agent | undefined {
  return AGENTS.find(a => a.id === agentId);
}