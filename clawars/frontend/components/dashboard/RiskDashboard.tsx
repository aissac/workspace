'use client';

import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { RiskMetrics } from '@/lib/types';

interface RiskDashboardProps {
  risk: RiskMetrics | null;
  compact?: boolean;
}

interface RiskBarProps {
  label: string;
  value: number;
  limit: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  unit?: string;
}

function RiskBar({ label, value, limit, warningThreshold = 60, dangerThreshold = 80, unit = '%' }: RiskBarProps) {
  const pct = Math.min((value / limit) * 100, 100);
  let color = '#10b981';
  let status = 'normal';
  
  if (pct >= dangerThreshold) {
    color = '#ef4444';
    status = 'danger';
  } else if (pct >= warningThreshold) {
    color = '#f59e0b';
    status = 'warning';
  }
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono" style={{ color }}>{value.toFixed(2)}{unit} / {limit}{unit}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function RiskDashboard({ risk, compact = false }: RiskDashboardProps) {
  if (!risk) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Risk Dashboard
        </h3>
        <div className="text-sm text-gray-500 text-center py-4">No risk data available</div>
      </div>
    );
  }

  const alerts = [];
  if (risk.daily_drawdown >= risk.daily_drawdown_limit * 0.8) {
    alerts.push({ type: 'warning', message: 'Approaching daily drawdown limit' });
  }
  if (risk.portfolio_heat >= 80) {
    alerts.push({ type: 'danger', message: 'High portfolio heat' });
  }
  if (risk.leverage > 1.5) {
    alerts.push({ type: 'warning', message: 'Elevated leverage' });
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Risk Dashboard
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          risk.risk_score <= 3 ? 'bg-green-500/20 text-green-400' :
          risk.risk_score <= 6 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          Risk: {risk.risk_score.toFixed(1)}/10
        </div>
      </div>
      
      <div className="space-y-3">
        <RiskBar 
          label="Daily Drawdown" 
          value={risk.daily_drawdown} 
          limit={risk.daily_drawdown_limit}
          warningThreshold={60}
          dangerThreshold={80}
        />
        <RiskBar 
          label="Portfolio Heat" 
          value={risk.portfolio_heat} 
          limit={risk.portfolio_heat_limit}
          warningThreshold={70}
          dangerThreshold={90}
        />
        
        {!compact && (
          <>
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">VaR (95%)</span>
                <span className="text-xs font-mono text-cyan-400">${risk.var_95.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Expected Shortfall</span>
                <span className="text-xs font-mono text-cyan-400">${risk.expected_shortfall.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Leverage</span>
                <span className={`text-xs font-mono ${risk.leverage > 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {risk.leverage.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Margin Available</span>
                <span className="text-xs font-mono">${risk.margin_available.toFixed(2)}</span>
              </div>
            </div>
            
            {alerts.length > 0 && (
              <div className="pt-2 border-t border-gray-700 space-y-1">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {alert.type === 'danger' ? (
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className={alert.type === 'danger' ? 'text-red-400' : 'text-yellow-400'}>
                      {alert.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}