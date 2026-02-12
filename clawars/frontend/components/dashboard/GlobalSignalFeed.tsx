'use client';

import { useLiveSignals } from '@/lib/hooks/useAgentData';
import SignalFeed from '@/components/dashboard/SignalFeed';

export default function GlobalSignalFeed() {
  const { signals, loading } = useLiveSignals(30);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Signal Feed</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>
      <SignalFeed signals={signals} maxItems={30} showAgent={true} />
    </div>
  );
}