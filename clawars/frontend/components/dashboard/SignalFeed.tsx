'use client';

import { Bell, TrendingUp, TrendingDown, XCircle, RotateCcw } from 'lucide-react';
import type { Signal } from '@/lib/types';

interface SignalFeedProps {
  signals: Signal[];
  maxItems?: number;
  showAgent?: boolean;
  compact?: boolean;
}

const actionConfig = {
  buy: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20', label: 'BUY' },
  sell: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', label: 'SELL' },
  close_long: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'CLOSE LONG' },
  close_short: { icon: RotateCcw, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'COVER SHORT' },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export default function SignalFeed({ signals, maxItems = 10, showAgent = true, compact = false }: SignalFeedProps) {
  const displaySignals = signals.slice(0, maxItems);

  if (displaySignals.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Recent Signals
        </h3>
        <div className="text-sm text-gray-500 text-center py-4">No recent signals</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Recent Signals
        <span className="ml-auto text-xs text-gray-500 font-normal">
          {signals.length} total
        </span>
      </h3>
      <div className={`space-y-2 ${!compact ? 'max-h-80 overflow-y-auto' : ''}`}>
        {displaySignals.map((signal) => {
          const config = actionConfig[signal.action];
          const ActionIcon = config.icon;
          
          return (
            <div 
              key={signal.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${signal.executed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`${config.bg} px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-sm font-medium">{signal.symbol}</span>
                  </div>
                  {showAgent && (
                    <p className="text-xs text-gray-500 mt-0.5">{signal.agent_name}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono">${signal.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className={`text-xs ${signal.confidence >= 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {(signal.confidence * 100).toFixed(0)}% conf
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(signal.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}