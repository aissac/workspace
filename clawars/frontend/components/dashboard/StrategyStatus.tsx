'use client';

import { Cpu, Pause, AlertTriangle, CheckCircle } from 'lucide-react';
import type { StrategyConfig, Agent } from '@/lib/types';

interface StrategyStatusProps {
  agent: Agent;
  config: StrategyConfig | null;
  kellyFraction?: number;
  lastCalc?: string;
}

export default function StrategyStatus({ agent, config, kellyFraction, lastCalc }: StrategyStatusProps) {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'ACTIVE' },
    paused: { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'PAUSED' },
    error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'ERROR' },
    offline: { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'OFFLINE' },
  };

  const status = statusConfig[agent.status];
  const StatusIcon = status.icon;

  return (
    <div className={`glass rounded-xl p-4 ${
      agent.status === 'active' ? 'border-green-500/30' : 
      agent.status === 'error' ? 'border-red-500/30' : 'border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Strategy Status
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Strategy</span>
          <span className="text-xs font-medium">{config?.strategy_name || agent.strategy_name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Version</span>
          <span className="text-xs font-mono text-gray-500">v{config?.strategy_version || agent.strategy_version}</span>
        </div>
        {config && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Signal Filter</span>
              <span className="text-xs font-medium">{config.signal_filter}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Position Sizing</span>
              <span className="text-xs font-medium text-cyan-400">{config.position_sizing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Kelly Fraction</span>
              <span className="text-xs font-mono text-green-400">
                {kellyFraction?.toFixed(2) || config.kelly_multiplier}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Max Position</span>
              <span className="text-xs font-mono">{config.max_position_pct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Stop Loss / TP</span>
              <span className="text-xs font-mono">
                {config.stop_loss_pct}% / {config.take_profit_pct}%
              </span>
            </div>
          </>
        )}
        {lastCalc && (
          <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
            <span className="text-xs text-gray-400">Last Calculation</span>
            <span className="text-xs font-mono text-cyan-400">{lastCalc}</span>
          </div>
        )}
      </div>
    </div>
  );
}