'use client';

import { TrendingUp, TrendingDown, Minus, Zap, Target, Calendar, Activity } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'activity' | 'calendar' | 'target' | 'zap';
  className?: string;
}

const icons = {
  activity: Activity,
  calendar: Calendar,
  target: Target,
  zap: Zap,
};

export default function MetricCard({ 
  label, 
  value, 
  subtext, 
  trend = 'neutral',
  icon = 'activity',
  className = '' 
}: MetricCardProps) {
  const Icon = icons[icon];
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className={`glass rounded-xl p-4 ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <p className={`text-2xl font-bold font-mono ${trendColor}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

interface LargeMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function LargeMetricCard({ 
  label, 
  value, 
  subValue, 
  trend = 'neutral',
  trendValue,
  className = '' 
}: LargeMetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className={`glass rounded-xl p-6 ${className}`}>
      <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
        <p className={`text-3xl font-bold font-mono ${trendColor}`}>{value}</p>
        {trendValue && (
          <span className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {trendValue}
          </span>
        )}
      </div>
      {subValue && <p className="text-sm text-gray-500 mt-1 font-mono">{subValue}</p>}
    </div>
  );
}