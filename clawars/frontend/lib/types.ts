export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'offline';
  strategy_name: string;
  strategy_version: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  description?: string;
}

export interface AgentMetrics {
  agent_id: string;
  portfolio_value: number;
  initial_capital: number;
  total_pnl: number;
  total_pnl_pct: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  profit_factor: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  current_drawdown: number;
  current_drawdown_pct: number;
  kelly_fraction: number;
  var_95: number;
  expected_shortfall: number;
  calculated_at: string;
}

export interface Position {
  id: string;
  agent_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  current_price: number;
  quantity: number;
  notional_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  entry_time: string;
  stop_loss?: number;
  take_profit?: number;
}

export interface Signal {
  id: string;
  agent_id: string;
  agent_name: string;
  symbol: string;
  action: 'buy' | 'sell' | 'close_long' | 'close_short';
  price: number;
  quantity: number;
  confidence: number;
  strategy_signal: string;
  timestamp: string;
  executed: boolean;
  execution_price?: number;
  execution_time?: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface EquityPoint {
  time: number;
  value: number;
}

export interface VWAPData {
  time: number;
  value: number;
  upper: number;
  lower: number;
}

export interface StrategyConfig {
  strategy_id: string;
  strategy_name: string;
  strategy_version: string;
  parameters: Record<string, unknown>;
  signal_filter: string;
  position_sizing: string;
  kelly_multiplier: number;
  max_position_pct: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  time_stop_hours: number;
  enabled: boolean;
}

export interface RiskMetrics {
  agent_id: string;
  daily_drawdown: number;
  daily_drawdown_limit: number;
  portfolio_heat: number;
  portfolio_heat_limit: number;
  max_correlation: number;
  beta: number;
  var_95: number;
  expected_shortfall: number;
  leverage: number;
  margin_used: number;
  margin_available: number;
  risk_score: number;
  timestamp: string;
}

export interface AgentDashboard {
  agent: Agent;
  metrics: AgentMetrics;
  positions: Position[];
  recent_signals: Signal[];
  strategy_config: StrategyConfig;
  risk: RiskMetrics;
  equity_curve: EquityPoint[];
}

export interface LeaderboardEntry {
  rank: number;
  previous_rank: number | null;
  agent_id: string;
  agent_name: string;
  strategy_name: string;
  strategy_id: string;
  backtest_id: string;
  composite_score: number;
  sharpe_ratio: number;
  profit_factor: number;
  total_return: number;
  win_rate: number;
  total_trades: number;
  max_drawdown: number;
  calculated_at: string;
}

export interface LeaderboardData {
  timeframe: string;
  generated_at: string;
  entries: LeaderboardEntry[];
  total_entries: number;
}

export interface AggregatedRiskDashboard {
  total_portfolio_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  active_agents: number;
  total_positions: number;
  aggregate_drawdown: number;
  aggregate_heat: number;
  signals_last_hour: number;
  top_performers: Array<{
    agent_id: string;
    agent_name: string;
    return_pct: number;
  }>;
  worst_performers: Array<{
    agent_id: string;
    agent_name: string;
    return_pct: number;
  }>;
  risk_alerts: Array<{
    agent_id: string;
    agent_name: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export interface WSMessage {
  type: 'metrics' | 'signal' | 'position' | 'risk' | 'candle' | 'equity' | 'status' | 'heartbeat';
  agent_id?: string;
  payload: unknown;
  timestamp: string;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';