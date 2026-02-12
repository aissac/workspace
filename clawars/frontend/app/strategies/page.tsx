'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart2, Clock, TrendingUp } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  asset: string;
  timeframe: string;
  strategy_type: string;
  status: string;
  created_at: string;
  latest_backtest?: {
    id: string;
    status: string;
    composite_score: number;
    sharpe_ratio: number;
    total_return: number;
  };
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setStrategies([
        {
          id: '1',
          name: 'Residual Momentum v3',
          asset: 'BTCUSDT',
          timeframe: '4H',
          strategy_type: 'pine_script',
          status: 'active',
          created_at: '2024-02-10T15:00:00Z',
          latest_backtest: {
            id: 'bt1',
            status: 'completed',
            composite_score: 87.5,
            sharpe_ratio: 2.3,
            total_return: 45.2,
          },
        },
        {
          id: '2',
          name: 'Mean Reversion Elite',
          asset: 'ETHUSDT',
          timeframe: '1H',
          strategy_type: 'pine_script',
          status: 'active',
          created_at: '2024-02-09T10:00:00Z',
          latest_backtest: {
            id: 'bt2',
            status: 'completed',
            composite_score: 72.1,
            sharpe_ratio: 1.8,
            total_return: 28.7,
          },
        },
        {
          id: '3',
          name: 'Trend Following Alpha',
          asset: 'SOLUSDT',
          timeframe: '1D',
          strategy_type: 'pine_script',
          status: 'pending',
          created_at: '2024-02-11T08:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/50 text-green-400 border-green-700';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      case 'disabled':
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
      case 'error':
        return 'bg-red-900/50 text-red-400 border-red-700';
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Strategies</h1>
          <p className="text-gray-400">Manage your deployed strategies</p>
        </div>
        <Link
          href="/submit"
          className="btn-primary flex items-center gap-2"
        >
          Deploy New <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {strategies.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart2 className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No strategies yet</h3>
          <p className="text-gray-500 mb-4">
            Deploy your first strategy to start competing on the leaderboard
          </p>
          <Link href="/submit" className="btn-primary">
            Deploy Strategy
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Strategy Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{strategy.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(strategy.status)}`}>
                      {strategy.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-gray-400">{strategy.asset}</span>
                    </span>
                    <span>•</span>
                    <span>{strategy.timeframe}</span>
                    <span>•</span>
                    <span>{strategy.strategy_type === 'pine_script' ? 'Pine Script' : 'Python'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(strategy.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Backtest Results */}
                {strategy.latest_backtest && (
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Score</div>
                      <div className="text-xl font-bold text-clawars-accent">
                        {strategy.latest_backtest.composite_score}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Sharpe</div>
                      <div className="text-xl font-bold text-blue-400">
                        {strategy.latest_backtest.sharpe_ratio}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Return</div>
                      <div className={`text-xl font-bold ${
                        strategy.latest_backtest.total_return >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {strategy.latest_backtest.total_return >= 0 ? '+' : ''}
                        {strategy.latest_backtest.total_return}%
                      </div>
                    </div>
                    <Link
                      href={`/backtests/${strategy.latest_backtest.id}`}
                      className="flex items-center text-sm text-gray-400 hover:text-white"
                    >
                      Details <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}

                {/* No Backtest */}
                {!strategy.latest_backtest && (
                  <div className="text-gray-500 text-sm">
                    No backtest run yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}