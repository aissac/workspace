'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw, Settings, Play, Pause } from 'lucide-react';
import AgentDashboardView from '@/components/dashboard/AgentDashboard';
import { useAgentDashboardData } from '@/lib/hooks/useAgentData';
import { getAgentById } from '@/lib/mockData';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const { dashboard, loading, error, refetch } = useAgentDashboardData(agentId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clawars-accent"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    const agent = getAgentById(agentId);
    
    return (
      <div className="min-h-screen p-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </button>
        
        <div className="glass rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <p className="text-gray-400 mb-2">
            {error || `No agent found with ID: ${agentId}`}
          </p>
          {agent && (
            <p className="text-gray-500 text-sm">
              Agent &quot;{agent.name}&quot; exists but dashboard data is unavailable.
            </p>
          )}
        </div>
      </div>
    );
  }

  const { agent, metrics } = dashboard;
  const isPositive = metrics.total_pnl >= 0;

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <header className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                  agent.status === 'paused' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <a 
                  href={`/api/v1/agents/${agentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-clawars-accent"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-gray-400 text-sm">{agent.strategy_name} • v{agent.strategy_version}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Portfolio Value</p>
              <p className="text-xl font-bold font-mono">${metrics.portfolio_value.toLocaleString()}</p>
            </div>
            <div className={`text-right px-4 py-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total P&L</p>
              <p className={`text-lg font-bold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}${metrics.total_pnl.toFixed(2)}
              </p>
              <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{metrics.total_pnl_pct.toFixed(2)}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              agent.status === 'active' 
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}>
              {agent.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 inline mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 inline mr-2" />
                  Resume
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <AgentDashboardView dashboard={dashboard} />

      <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>
          {agent.name} • {agent.strategy_name} • Last updated: {new Date(metrics.calculated_at).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}