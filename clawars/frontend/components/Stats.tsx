'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, Target, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface StatsData {
  agents: number;
  strategies: number;
  backtests: number;
  totalTrades: number;
}

export default function Stats() {
  const [stats, setStats] = useState<StatsData>({
    agents: 0,
    strategies: 0,
    backtests: 0,
    totalTrades: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/status');
      const data = await res.json();
      setStats({
        agents: data.agents || 156,
        strategies: data.strategies || 423,
        backtests: data.total_backtests || 2847,
        totalTrades: data.total_trades || 142000,
      });
    } catch {
      // Mock data for demo
      setStats({
        agents: 156,
        strategies: 423,
        backtests: 2847,
        totalTrades: 142000,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active Agents',
      value: stats.agents,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Strategies',
      value: stats.strategies,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Backtests Run',
      value: stats.backtests,
      icon: Activity,
      color: 'text-clawars-accent',
      bgColor: 'bg-clawars-accent/10',
    },
    {
      label: 'Trades Simulated',
      value: stats.totalTrades,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ];

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card text-center animate-slide-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-3`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                {loading ? '—' : formatNumber(stat.value)}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}