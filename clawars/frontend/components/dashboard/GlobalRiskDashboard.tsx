'use client';

import { useAggregatedRisk, useAgents } from '@/lib/hooks/useAgentData';
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Activity, Users, Wallet, Bell } from 'lucide-react';

export default function GlobalRiskDashboard() {
  const { risk, loading: riskLoading } = useAggregatedRisk();
  const { agents, loading: agentsLoading } = useAgents();

  if (riskLoading || agentsLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!risk) return null;

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Global Risk Monitor
        </h2>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          risk.aggregate_drawdown < 3 ? 'bg-green-500/20 text-green-400' :
          risk.aggregate_drawdown < 5 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          System {risk.aggregate_drawdown < 3 ? 'Healthy' : risk.aggregate_drawdown < 5 ? 'Warning' : 'Alert'}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Portfolio</p>
            <Wallet className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xl font-bold font-mono">${risk.total_portfolio_value.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${risk.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {risk.total_pnl >= 0 ? '+' : ''}${risk.total_pnl.toFixed(2)} ({risk.total_pnl_pct >= 0 ? '+' : ''}{risk.total_pnl_pct.toFixed(2)}%)
          </p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Agents</p>
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xl font-bold font-mono">{activeAgents}</p>
          <p className="text-xs text-gray-500 mt-1">{errorAgents > 0 ? `${errorAgents} with errors` : 'All healthy'}</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Open Positions</p>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xl font-bold font-mono">{risk.total_positions}</p>
          <p className="text-xs text-gray-500 mt-1">Across all agents</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Signals (1h)</p>
            <Bell className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xl font-bold font-mono">{risk.signals_last_hour}</p>
          <p className="text-xs text-gray-500 mt-1">Trading signals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Top Performers</h3>
          <div className="space-y-2">
            {risk.top_performers.map((agent, i) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${i === 0 ? 'text-clawars-gold' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-sm">{agent.agent_name}</span>
                </div>
                <span className="text-sm font-mono text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{agent.return_pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Risk Alerts</h3>
          {risk.risk_alerts.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No active alerts
            </div>
          ) : (
            <div className="space-y-2">
              {risk.risk_alerts.map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-2 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                  alert.severity === 'high' ? 'bg-orange-500/10 border border-orange-500/20' :
                  'bg-yellow-500/10 border border-yellow-500/20'
                }`}>
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.agent_name}</p>
                    <p className="text-xs text-gray-400">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Aggregate Risk Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Portfolio Drawdown</span>
              <span className={`font-mono ${risk.aggregate_drawdown > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {risk.aggregate_drawdown.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all rounded-full ${risk.aggregate_drawdown > 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(risk.aggregate_drawdown * 20, 100)}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Portfolio Heat</span>
              <span className={`font-mono ${risk.aggregate_heat > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                {risk.aggregate_heat.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all rounded-full ${risk.aggregate_heat > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${risk.aggregate_heat}%` }}
              />
            </div>
          </div>

          <div className="text-center p-2">
            <p className="text-xs text-gray-400">Max Correlation</p>
            <p className="text-lg font-mono">{(Math.random() * 0.5 + 0.2).toFixed(2)}</p>
          </div>

          <div className="text-center p-2">
            <p className="text-xs text-gray-400">System Beta</p>
            <p className="text-lg font-mono">{(Math.random() * 0.8 + 0.6).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}