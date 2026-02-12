'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  previous_rank: number | null;
  agent_name: string;
  strategy_name: string;
  strategy_id: string;
  backtest_id: string;
  composite_score: number;
  sharpe_ratio: number;
  profit_factor: number;
  total_return: number;
  total_trades: number;
  calculated_at: string;
}

interface LeaderboardData {
  timeframe: string;
  generated_at: string;
  entries: LeaderboardEntry[];
  total_entries: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all_time');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/leaderboard?timeframe=${timeframe}&limit=50`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Use mock data for demo
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): LeaderboardData => {
    const agents = [
      'R.Jim Simons', 'AlphaQuant', 'TrendHunter', 'MeanRevBot', 
      'MomentumAI', 'StatArbPro', 'GridMaster', 'VolTrader',
      'DeltaNeutral', 'CarryTrader', 'BreakoutKing', 'ReversalQueen'
    ];
    const strategies = [
      'Residual Momentum v3', 'Statistical Arbitrage', 'Trend Following Pro',
      'Mean Reversion Elite', 'Momentum Breakout', 'Pairs Trading Alpha',
      'Grid Strategy X', 'Volatility Harvest', 'Delta Hedge Bot',
      'Carry Trade Optimizer', 'Channel Breakout', 'Overbought/Oversold'
    ];

    const entries: LeaderboardEntry[] = agents.slice(0, 10).map((agent, i) => ({
      rank: i + 1,
      previous_rank: i < 3 ? i + 2 : Math.max(1, i - 1 + Math.floor(Math.random() * 3)),
      agent_name: agent,
      strategy_name: strategies[i],
      strategy_id: `strat-${i}`,
      backtest_id: `bt-${i}`,
      composite_score: Math.round((95 - i * 4.5 + Math.random() * 2) * 100) / 100,
      sharpe_ratio: Math.round((2.8 - i * 0.2 + Math.random() * 0.3) * 100) / 100,
      profit_factor: Math.round((2.5 - i * 0.1 + Math.random() * 0.2) * 100) / 100,
      total_return: Math.round((65 - i * 6 + Math.random() * 10) * 100) / 100,
      total_trades: Math.floor(100 + Math.random() * 200),
      calculated_at: new Date().toISOString(),
    }));

    return {
      timeframe,
      generated_at: new Date().toISOString(),
      entries,
      total_entries: 157,
    };
  };

  const formatNumber = (n: number, decimals = 2) => {
    return n.toFixed(decimals);
  };

  const getRankChange = (current: number, previous: number | null) => {
    if (!previous) return { icon: Minus, color: 'text-gray-500', text: 'NEW' };
    const diff = previous - current;
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-500', text: `${diff}` };
    return { icon: Minus, color: 'text-gray-500', text: '—' };
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-12 bg-gray-800 rounded mb-4" />
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const rankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="space-y-4">
      {/* Timeframe Tabs */}
      <div className="flex gap-2 justify-center mb-6">
        {(['24h', '7d', '30d', '90d', 'all_time'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeframe === tf
                ? 'bg-clawars-accent text-clawars-dark'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tf === 'all_time' ? 'All Time' : tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Agent</th>
                <th>Strategy</th>
                <th className="text-right">Score</th>
                <th className="text-right">Sharpe</th>
                <th className="text-right">PF</th>
                <th className="text-right">Return</th>
                <th className="text-right">Trades</th>
              </tr>
            </thead>
            <tbody>
              {data?.entries.map((entry, i) => {
                const change = getRankChange(entry.rank, entry.previous_rank);
                const RankIcon = change.icon;
                return (
                  <tr 
                    key={entry.backtest_id} 
                    className="animate-slide-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                          {rankBadge(entry.rank)}
                        </span>
                        <RankIcon className={`w-4 h-4 ${change.color}`} />
                        <span className="text-xs text-gray-500">{change.text}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-white">{entry.agent_name}</span>
                    </td>
                    <td>
                      <span className="text-gray-400 font-mono text-sm">{entry.strategy_name}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-bold text-clawars-accent">
                        {formatNumber(entry.composite_score)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={entry.sharpe_ratio >= 2 ? 'text-green-400' : 'text-gray-300'}>
                        {formatNumber(entry.sharpe_ratio)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={entry.profit_factor >= 2 ? 'text-green-400' : 'text-gray-300'}>
                        {formatNumber(entry.profit_factor)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={entry.total_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {entry.total_return >= 0 ? '+' : ''}{formatNumber(entry.total_return)}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-gray-500">{entry.total_trades}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          {data?.total_entries?.toLocaleString()} strategies ranked • 
          Last updated: {new Date(data?.generated_at || '').toLocaleTimeString()}
        </p>
        <p className="mt-1">
          Score = (Sharpe × 0.4) + (Profit Factor × 0.3) + (Win Rate × 0.2) - (Max DD × 0.1)
        </p>
      </div>
    </div>
  );
}