'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AgentDashboard, CandleData, VWAPData } from '@/lib/types';
import PriceChart from '@/components/charts/PriceChart';
import EquityChart from '@/components/charts/EquityChart';
import MetricCard from './MetricCard';
import SignalFeed from './SignalFeed';
import PositionsList from './PositionsList';
import RiskDashboard from './RiskDashboard';
import StrategyStatus from './StrategyStatus';
import { generateMockCandleData } from '@/lib/mockData';

interface AgentDashboardProps {
  dashboard: AgentDashboard;
  onSymbolChange?: (symbol: string) => void;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'NEARUSDT'];
const TIMEFRAMES = ['1h', '4h', '1d'] as const;

export default function AgentDashboardView({ dashboard, onSymbolChange }: AgentDashboardProps) {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<typeof TIMEFRAMES[number]>('4h');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [vwapData, setVwapData] = useState<VWAPData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const { agent, metrics, positions, recent_signals, strategy_config, risk, equity_curve } = dashboard;

  useEffect(() => {
    setIsLoadingChart(true);
    const data = generateMockCandleData(symbol, 200);
    setCandleData(data);
    
    const vwap: VWAPData[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    
    data.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      const volume = candle.volume || 100;
      cumulativeTPV += typicalPrice * volume;
      cumulativeVolume += volume;
      const vwapValue = cumulativeTPV / cumulativeVolume;
      const stdDev = typicalPrice * 0.02;
      
      vwap.push({
        time: candle.time,
        value: vwapValue,
        upper: vwapValue + 2 * stdDev,
        lower: vwapValue - 2 * stdDev,
      });
    });
    
    setVwapData(vwap);
    setIsLoadingChart(false);
  }, [symbol, timeframe]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  const pnlTrend = metrics.total_pnl >= 0 ? 'up' : 'down';
  const dailyTrend = metrics.daily_pnl >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total P&L"
          value={`${metrics.total_pnl >= 0 ? '+' : ''}$${metrics.total_pnl.toFixed(2)}`}
          subtext={`${metrics.total_pnl_pct >= 0 ? '+' : ''}${metrics.total_pnl_pct.toFixed(2)}%`}
          trend={pnlTrend}
          icon="activity"
        />
        <MetricCard
          label="Today's P&L"
          value={`${metrics.daily_pnl >= 0 ? '+' : ''}$${metrics.daily_pnl.toFixed(2)}`}
          subtext={`${metrics.daily_pnl_pct >= 0 ? '+' : ''}${metrics.daily_pnl_pct.toFixed(2)}%`}
          trend={dailyTrend}
          icon="calendar"
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics.win_rate.toFixed(1)}%`}
          subtext={`${metrics.winning_trades}/${metrics.total_trades} trades`}
          trend={metrics.win_rate >= 50 ? 'up' : 'down'}
          icon="target"
        />
        <MetricCard
          label="Sharpe Ratio"
          value={metrics.sharpe_ratio.toFixed(2)}
          subtext="Risk-adjusted return"
          trend={metrics.sharpe_ratio >= 1 ? 'up' : metrics.sharpe_ratio >= 0.5 ? 'neutral' : 'down'}
          icon="zap"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <select
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-clawars-accent"
                >
                  {SYMBOLS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeframe === tf
                          ? 'bg-clawars-accent text-clawars-dark'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                  agent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            {isLoadingChart ? (
              <div className="h-96 flex items-center justify-center bg-gray-800 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clawars-accent"></div>
              </div>
            ) : (
              <PriceChart data={candleData} vwapData={vwapData} symbol={symbol} height={400} />
            )}
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Equity Curve
            </h3>
            <EquityChart data={equity_curve} height={200} />
          </div>
        </div>

        <div className="space-y-6">
          <StrategyStatus 
            agent={agent} 
            config={strategy_config}
            kellyFraction={metrics.kelly_fraction}
            lastCalc={metrics.calculated_at}
          />
          
          <PositionsList positions={positions} />
          
          <SignalFeed signals={recent_signals} showAgent={false} />
          
          <RiskDashboard risk={risk} />
        </div>
      </div>
    </div>
  );
}