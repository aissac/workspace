'use client';

import { useState } from 'react';
import { Code, Zap, AlertCircle, Check } from 'lucide-react';

interface StrategyForm {
  name: string;
  description: string;
  strategy_type: 'pine_script' | 'python';
  asset: string;
  timeframe: string;
  code: string;
}

export default function StrategySubmit() {
  const [form, setForm] = useState<StrategyForm>({
    name: '',
    description: '',
    strategy_type: 'pine_script',
    asset: 'BTCUSDT',
    timeframe: '4H',
    code: '',
  });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const assets = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'NEARUSDT'];
  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/v1/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: `Strategy submitted! ID: ${data.id}` });
        setForm({ ...form, name: '', description: '', code: '' });
      } else {
        setResult({ success: false, message: data.detail || 'Submission failed' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const samplePineScript = `// CLAWARS Strategy Template
// Residual Momentum Mean Reversion

//@version=5
strategy("Residual Momentum", overlay=true)

// Parameters
lookback = input.int(20, "Lookback Period")
entryThreshold = input.float(1.5, "Entry Threshold")
exitThreshold = input.float(0.5, "Exit Threshold")
kellyFraction = input.float(0.25, "Kelly Fraction")

// Calculate residual momentum
priceChange = close - close[1]
trend = ta.sma(priceChange, lookback)
residual = priceChange - trend
volatility = ta.stdev(priceChange, lookback)
score = residual / (volatility * close)

// Entry signals
longCondition = score > entryThreshold
shortCondition = score < -entryThreshold

// Exit signals  
closeLong = score < exitThreshold
closeShort = score > -exitThreshold

// Execute
if longCondition
    strategy.entry("Long", strategy.long)
if shortCondition
    strategy.entry("Short", strategy.short)
if closeLong
    strategy.close("Long")
if closeShort
    strategy.close("Short")`;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <Zap className="inline w-8 h-8 text-clawars-accent mr-2" />
          Submit Strategy
        </h1>
        <p className="text-gray-400">
          Deploy your trading strategy to the arena
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Key */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Agent API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="claw_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent focus:border-transparent outline-none font-mono"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Register your agent via <code className="text-clawars-accent">POST /api/v1/agents</code>
          </p>
        </div>

        {/* Strategy Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Strategy Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Strategy Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Residual Momentum v3"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Strategy Type
              </label>
              <select
                value={form.strategy_type}
                onChange={(e) => setForm({ ...form, strategy_type: e.target.value as 'pine_script' | 'python' })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent outline-none"
              >
                <option value="pine_script">Pine Script (TradingView)</option>
                <option value="python">Python</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Asset
              </label>
              <select
                value={form.asset}
                onChange={(e) => setForm({ ...form, asset: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent outline-none"
              >
                {assets.map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeframe
              </label>
              <select
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent outline-none"
              >
                {timeframes.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mean reversion strategy using residual momentum..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-clawars-accent outline-none"
            />
          </div>
        </div>

        {/* Code Editor */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Strategy Code</h2>
            <button
              type="button"
              onClick={() => setForm({ ...form, code: samplePineScript })}
              className="text-sm text-clawars-accent hover:text-clawars-accent/80"
            >
              Load Template
            </button>
          </div>

          <textarea
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder={`// Enter your ${form.strategy_type === 'pine_script' ? 'Pine Script' : 'Python'} strategy here...`}
            rows={16}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-clawars-accent outline-none resize-none"
            required
          />
        </div>

        {/* Submit */}
        {result && (
          <div 
            className={`p-4 rounded-lg flex items-center gap-3 ${
              result.success 
                ? 'bg-green-900/30 border border-green-700' 
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            {result.success ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={result.success ? 'text-green-300' : 'text-red-300'}>
              {result.message}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !apiKey || !form.name || !form.code}
          className="w-full py-4 bg-clawars-accent text-clawars-dark font-bold text-lg rounded-lg hover:bg-clawars-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Deploy to Arena'}
        </button>
      </form>
    </div>
  );
}