'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentDashboard, Agent, Signal, AggregatedRiskDashboard, CandleData, LeaderboardData } from '../types';
import { 
  generateMockAgentDashboard, 
  generateMockSignals, 
  generateMockAggregatedRisk,
  generateMockCandleData,
  getAllAgents,
  generateMockLeaderboard
} from '../mockData';

const API_BASE = '/api/v1';

async function fetchWithFallback<T>(
  url: string,
  mockGenerator: () => T
): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.log(`Using mock data for ${url}`);
    return mockGenerator();
  }
}

export function useAgentDashboardData(agentId: string | null) {
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!agentId) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithFallback(
        `${API_BASE}/agents/${agentId}/dashboard`,
        () => generateMockAgentDashboard(agentId)
      );
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchDashboard();
    
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_BASE}/agents`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setAgents(data.agents || data);
      } catch {
        setAgents(getAllAgents());
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return { agents, loading };
}

export function useLiveSignals(initialCount = 20) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch(`${API_BASE}/signals?limit=${initialCount}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setSignals(data.signals || []);
      } catch {
        const agents = getAllAgents();
        const allSignals = agents.flatMap(a => generateMockSignals(a.id, a.name, 5));
        setSignals(allSignals.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, initialCount));
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    
    const interval = setInterval(() => {
      const agents = getAllAgents();
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const [newSignal] = generateMockSignals(randomAgent.id, randomAgent.name, 1);
      
      setSignals(prev => [newSignal, ...prev.slice(0, initialCount - 1)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [initialCount]);

  return { signals, loading };
}

export function useAggregatedRisk() {
  const [risk, setRisk] = useState<AggregatedRiskDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await fetch(`${API_BASE}/risk/aggregated`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setRisk(data);
      } catch {
        setRisk(generateMockAggregatedRisk());
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
    
    const interval = setInterval(fetchRisk, 15000);
    return () => clearInterval(interval);
  }, []);

  return { risk, loading };
}

export function useLeaderboard(timeframe = 'all_time') {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/leaderboard?timeframe=${timeframe}&limit=50`);
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        setData(json);
      } catch {
        setData(generateMockLeaderboard(timeframe));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  return { data, loading };
}

export function useCandleData(symbol: string, timeframe: string = '4h') {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/candles/${symbol}?timeframe=${timeframe}&limit=200`);
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        setData(json.candles || json);
      } catch {
        setData(generateMockCandleData(symbol, 200));
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
    
    const interval = setInterval(fetchCandles, 60000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  return { data, loading };
}