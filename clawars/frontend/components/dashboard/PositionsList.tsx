'use client';

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import type { Position } from '@/lib/types';

interface PositionsListProps {
  positions: Position[];
  compact?: boolean;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) return '< 1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function PositionsList({ positions, compact = false }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Open Positions
        </h3>
        <div className="text-sm text-gray-500 text-center py-4">No open positions</div>
      </div>
    );
  }

  const totalPnL = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.notional_value, 0);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Open Positions
        </h3>
        {!compact && (
          <div className="text-right">
            <span className={`text-sm font-mono ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {positions.map((position) => (
          <div 
            key={position.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                position.side === 'long' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {position.side === 'long' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{position.symbol}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    position.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.side.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {position.quantity} @ ${position.entry_price.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-mono font-bold ${
                position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
              </p>
              <p className={`text-xs ${
                position.unrealized_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.unrealized_pnl_pct >= 0 ? '+' : ''}{position.unrealized_pnl_pct.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
          <span>Total Notional: ${totalValue.toFixed(2)}</span>
          <span>Hold Time: {formatTime(positions[0]?.entry_time || new Date().toISOString())}</span>
        </div>
      )}
    </div>
  );
}