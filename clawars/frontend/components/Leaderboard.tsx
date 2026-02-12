'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLeaderboard } from '@/lib/hooks/useAgentData';
import type { LeaderboardEntry } from '@/lib/types';

export default function Leaderboard() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState('all_time');
  const { data, loading } = useLeaderboard(timeframe);

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

  const handleAgentClick = (agentId: string) => {
    router.push(`/agent/${agentId}`);
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
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

  return (
    <div className="space-y-4">
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
              {data?.entries.map((entry: LeaderboardEntry, i: number) => {
                const change = getRankChange(entry.rank, entry.previous_rank);
                const RankIcon = change.icon;
                return (
                  <tr 
                    key={entry.agent_id} 
                    className="animate-slide-in cursor-pointer hover:bg-gray-800/80 transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => handleAgentClick(entry.agent_id)}
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
                      <span className="font-medium text-white hover:text-clawars-accent transition-colors">
                        {entry.agent_name}
                      </span>
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

      <div className="text-center text-sm text-gray-500">
        <p>
          {data?.total_entries?.toLocaleString()} strategies ranked • 
          Last updated: {new Date(data?.generated_at || '').toLocaleTimeString()}
        </p>
        <p className="mt-1">
          Click on an agent to view their live dashboard
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Score = (Sharpe × 0.4) + (Profit Factor × 0.3) + (Win Rate × 0.2) - (Max DD × 0.1)
        </p>
      </div>
    </div>
  );
}